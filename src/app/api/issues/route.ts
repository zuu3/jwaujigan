import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getRecentIssueBills } from "@/lib/assembly";
import { buildIssueFromBill } from "@/lib/issues";
import { createServiceRoleSupabaseClient } from "@/lib/supabase";
import type { HotIssue, HotIssuesResponse, IssueVoteCounts } from "@/types/issue";

const LOCK_KEY = "issues_generating";
const LOCK_TTL_MS = 60 * 1000;
const LOCK_WAIT_MS = 3_000;

const ISSUE_SELECT =
  "id, title, summary, body, progressive, conservative, scenario, source_url, bill_id, published_at, proposer, committee, bill_status, created_at" as const;

type IssueRow = {
  id: string;
  title: string;
  summary: string;
  body: string | null;
  progressive: string;
  conservative: string;
  scenario: string | null;
  source_url: string | null;
  bill_id: string | null;
  published_at: string | null;
  proposer: string | null;
  committee: string | null;
  bill_status: string | null;
  created_at: string;
};

const EMPTY_COUNTS: IssueVoteCounts = { progressive: 0, conservative: 0, neutral: 0, total: 0 };

async function enrichWithVotes(
  rows: IssueRow[],
  userId: string,
): Promise<HotIssue[]> {
  if (rows.length === 0) return [];

  const supabase = createServiceRoleSupabaseClient();
  const ids = rows.map((r) => r.id);

  const [{ data: counts }, { data: userVotes }] = await Promise.all([
    supabase.from("issue_vote_counts").select("issue_id, progressive, conservative, neutral, total").in("issue_id", ids),
    supabase.from("issue_votes").select("issue_id, stance").in("issue_id", ids).eq("user_id", userId),
  ]);

  const countMap = new Map((counts ?? []).map((c) => [c.issue_id, c]));
  const userVoteMap = new Map((userVotes ?? []).map((v) => [v.issue_id, v.stance]));

  return rows.map((row) => {
    const c = countMap.get(row.id);
    return {
      ...row,
      vote_counts: c
        ? { progressive: c.progressive, conservative: c.conservative, neutral: c.neutral, total: c.total }
        : EMPTY_COUNTS,
      user_vote: (userVoteMap.get(row.id) ?? null) as HotIssue["user_vote"],
    };
  });
}

export async function GET() {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const supabase = createServiceRoleSupabaseClient();

  const { data: cachedIssues, error: cachedIssuesError } = await supabase
    .from("issues")
    .select(ISSUE_SELECT)
    .gt("expires_at", new Date().toISOString())
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(5);

  if (cachedIssuesError) {
    console.error("Failed to fetch cached issues", cachedIssuesError);
    return NextResponse.json({ message: "Failed to fetch issues." }, { status: 500 });
  }

  if ((cachedIssues?.length ?? 0) > 0) {
    const issues = await enrichWithVotes(cachedIssues, userId);
    return NextResponse.json({ issues } satisfies HotIssuesResponse);
  }

  const { data: staleIssues, error: staleIssuesError } = await supabase
    .from("issues")
    .select(ISSUE_SELECT)
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(5);

  if (staleIssuesError) {
    console.error("Failed to fetch stale issues", staleIssuesError);
  }

  if ((staleIssues?.length ?? 0) > 0) {
    const issues = await enrichWithVotes(staleIssues ?? [], userId);
    return NextResponse.json({ issues } satisfies HotIssuesResponse);
  }

  // 만료된 스테일 락 제거 후 락 획득 시도
  await supabase
    .from("generation_locks")
    .delete()
    .eq("key", LOCK_KEY)
    .lt("expires_at", new Date().toISOString());

  const lockExpiry = new Date(Date.now() + LOCK_TTL_MS).toISOString();
  const { error: lockError } = await supabase
    .from("generation_locks")
    .insert({ key: LOCK_KEY, expires_at: lockExpiry });

  if (lockError) {
    // 다른 요청이 이미 생성 중 — 잠시 기다린 뒤 캐시 재조회
    await new Promise<void>((resolve) => setTimeout(resolve, LOCK_WAIT_MS));

    const { data: retryIssues } = await supabase
      .from("issues")
      .select(ISSUE_SELECT)
      .gt("expires_at", new Date().toISOString())
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(5);

    const issues = await enrichWithVotes(retryIssues ?? [], userId);
    return NextResponse.json({ issues } satisfies HotIssuesResponse);
  }

  try {
    const bills = await getRecentIssueBills();

    const results = await Promise.allSettled(bills.map((bill) => buildIssueFromBill(bill)));

    const issueRecords = results.flatMap((result, index) => {
      if (result.status === "fulfilled") return [result.value];
      console.error(
        `Failed to build issue from bill "${bills[index]?.title}":`,
        result.reason instanceof Error ? result.reason.message : result.reason,
      );
      return [];
    });

    if (issueRecords.length === 0) {
      return NextResponse.json({ issues: [] satisfies HotIssue[] });
    }

    const { data: insertedIssues, error: insertError } = await supabase
      .from("issues")
      .upsert(issueRecords, { onConflict: "bill_id" })
      .select(ISSUE_SELECT);

    if (insertError) {
      console.error("Failed to store generated issues", insertError);
      return NextResponse.json({ message: "Failed to create issues." }, { status: 500 });
    }

    const issues = await enrichWithVotes(insertedIssues ?? [], userId);
    return NextResponse.json({ issues } satisfies HotIssuesResponse);
  } catch (generateError) {
    console.warn("Failed to generate issues from Assembly API", generateError);

    return NextResponse.json({ issues: [] satisfies HotIssue[] });
  } finally {
    await supabase.from("generation_locks").delete().eq("key", LOCK_KEY);
  }
}

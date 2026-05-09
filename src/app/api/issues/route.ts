import { NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { getRecentIssueBills } from "@/lib/assembly";
import { buildIssueFromBill } from "@/lib/issues";
import { createServiceRoleSupabaseClient } from "@/lib/supabase";
import type { HotIssue, HotIssuesResponse } from "@/types/issue";

const LOCK_KEY = "issues_generating";
const LOCK_TTL_MS = 60 * 1000;
const LOCK_WAIT_MS = 3_000;

const ISSUE_SELECT =
  "id, title, summary, progressive, conservative, source_url, bill_id, published_at, created_at" as const;

function mapIssueRowToHotIssue(issue: {
  id: string;
  title: string;
  summary: string;
  progressive: string;
  conservative: string;
  source_url: string | null;
  bill_id: string | null;
  published_at: string | null;
  created_at: string;
}): HotIssue {
  return issue;
}

export async function GET() {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

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
    return NextResponse.json({ issues: cachedIssues.map(mapIssueRowToHotIssue) } satisfies HotIssuesResponse);
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

    return NextResponse.json({ issues: (retryIssues ?? []).map(mapIssueRowToHotIssue) } satisfies HotIssuesResponse);
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
      .upsert(issueRecords, { onConflict: "bill_id", ignoreDuplicates: true })
      .select(ISSUE_SELECT);

    if (insertError) {
      console.error("Failed to store generated issues", insertError);
      return NextResponse.json({ message: "Failed to create issues." }, { status: 500 });
    }

    return NextResponse.json({ issues: (insertedIssues ?? []).map(mapIssueRowToHotIssue) } satisfies HotIssuesResponse);
  } finally {
    await supabase.from("generation_locks").delete().eq("key", LOCK_KEY);
  }
}

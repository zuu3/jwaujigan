import { getServiceRoleSupabaseClient } from "./supabase";
import type { HotIssue, IssueVoteCounts } from "@/types/issue";

const ISSUE_SELECT =
  "id, title, summary, body, progressive, conservative, source_url, bill_id, published_at, proposer, committee, bill_status, created_at" as const;

const EMPTY_COUNTS: IssueVoteCounts = { progressive: 0, conservative: 0, neutral: 0, total: 0 };

// 서버 컴포넌트에서 초기 데이터로 사용 — 생성/락 로직 없이 DB 캐시만 조회
export async function getHotIssuesFromDb(userId: string | null): Promise<HotIssue[]> {
  const supabase = getServiceRoleSupabaseClient();

  const { data: rows } = await supabase
    .from("issues")
    .select(ISSUE_SELECT)
    .gt("expires_at", new Date().toISOString())
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(5);

  if (!rows || rows.length === 0) return [];

  if (!userId) {
    return rows.map((row) => ({ ...row, vote_counts: EMPTY_COUNTS, user_vote: null }));
  }

  const ids = rows.map((r) => r.id);

  const [{ data: counts }, { data: userVotes }] = await Promise.all([
    supabase
      .from("issue_vote_counts")
      .select("issue_id, progressive, conservative, neutral, total")
      .in("issue_id", ids),
    supabase
      .from("issue_votes")
      .select("issue_id, stance")
      .in("issue_id", ids)
      .eq("user_id", userId),
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

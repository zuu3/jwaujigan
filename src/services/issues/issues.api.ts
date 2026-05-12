import type { HotIssue, HotIssuesResponse, IssueVoteStance } from "@/types/issue";

export type { HotIssue, HotIssuesResponse, IssueVoteStance };

export async function fetchIssues(): Promise<HotIssuesResponse> {
  const res = await fetch("/api/issues");
  if (!res.ok) throw new Error("Failed to fetch issues");
  return res.json() as Promise<HotIssuesResponse>;
}

export async function voteIssue({
  issueId,
  stance,
}: {
  issueId: string;
  stance: IssueVoteStance;
}): Promise<{ vote_counts: HotIssue["vote_counts"]; user_vote: IssueVoteStance | null }> {
  const res = await fetch(`/api/issues/${issueId}/vote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ stance }),
  });
  if (!res.ok) throw new Error("투표에 실패했어요");
  return res.json() as Promise<{ vote_counts: HotIssue["vote_counts"]; user_vote: IssueVoteStance | null }>;
}

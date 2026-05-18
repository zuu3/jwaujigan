export type IssueVoteCounts = {
  progressive: number;
  conservative: number;
  neutral: number;
  total: number;
};

export type IssueVoteStance = "progressive" | "conservative" | "neutral";

export type BillStatus = "계류 중" | "통과" | "폐기";

export type HotIssue = {
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
  vote_counts: IssueVoteCounts;
  user_vote: IssueVoteStance | null;
};

export type HotIssuesResponse = {
  issues: HotIssue[];
};

export type HotIssue = {
  id: string;
  title: string;
  summary: string;
  progressive: string;
  conservative: string;
  source_url: string | null;
  bill_id: string | null;
  published_at: string | null;
  created_at: string;
};

export type HotIssuesResponse = {
  issues: HotIssue[];
};

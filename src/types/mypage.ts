export type MyPageProfile = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  district: string | null;
  points: number;
  created_at: string | null;
};

export type PoliticalProfile = {
  economic_score: number;
  social_score: number;
  security_score: number;
  political_type: string;
  completed_at: string | null;
};

export type BattleLogItem = {
  id: string;
  topic: string;
  result: string | null;
  created_at: string;
};

export type FollowedPolitician = {
  id: string;
  name: string;
  image: string | null;
  followed_at: string;
};

export type ActivityItem = {
  type: "issue_vote" | "battle_vote" | "orientation_test";
  label: string;
  created_at: string;
};

export type ActivitySummary = {
  total_issues: number;
  vote_ratio: { progressive: number; conservative: number; neutral: number };
  last_orientation: { type: string; date: string } | null;
};

export type ActivityResponse = {
  summary: ActivitySummary;
  activities: ActivityItem[];
};

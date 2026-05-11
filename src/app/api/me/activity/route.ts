import { NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { createServiceRoleSupabaseClient } from "@/lib/supabase";

type ActivityType = "issue_vote" | "battle_vote" | "orientation_test";

type Activity = {
  type: ActivityType;
  label: string;
  created_at: string;
};

const STANCE_LABEL: Record<string, string> = {
  progressive: "진보 입장",
  conservative: "보수 입장",
  neutral: "중립",
};

const VERDICT_LABEL: Record<string, string> = {
  progressive: "진보 AI 우세 판정",
  conservative: "보수 AI 우세 판정",
  draw: "무승부 판정",
};

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleSupabaseClient();
  const userId = session.user.id;

  type IssueVoteRow = { id: string; stance: string; created_at: string; issues: { title: string } | null };
  type VerdictVoteRow = { id: string; side: string; created_at: string; issues: { title: string } | null };

  const [issueVotesResult, verdictVotesResult, orientationResult] = await Promise.all([
    supabase
      .from("issue_votes")
      .select("id, stance, created_at, issues(title)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("verdict_votes")
      .select("id, side, created_at, issues(title)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("user_political_profiles")
      .select("political_type, completed_at")
      .eq("user_id", userId)
      .order("completed_at", { ascending: false })
      .limit(5),
  ]);

  const issueVotes = (issueVotesResult.data ?? []) as unknown as IssueVoteRow[];
  const verdictVotes = (verdictVotesResult.data ?? []) as unknown as VerdictVoteRow[];
  const orientations = orientationResult.data ?? [];

  // Build activities array
  const activities: Activity[] = [];

  for (const v of issueVotes) {
    const issueTitle = v.issues?.title ?? "이슈";
    activities.push({
      type: "issue_vote",
      label: `'${issueTitle}' — ${STANCE_LABEL[v.stance] ?? v.stance} 투표`,
      created_at: v.created_at,
    });
  }

  for (const v of verdictVotes) {
    const issueTitle = v.issues?.title ?? "배틀";
    activities.push({
      type: "battle_vote",
      label: `'${issueTitle}' — ${VERDICT_LABEL[v.side] ?? v.side}`,
      created_at: v.created_at,
    });
  }

  for (const o of orientations) {
    if (o.completed_at) {
      activities.push({
        type: "orientation_test",
        label: `성향 분석 완료: ${o.political_type}`,
        created_at: o.completed_at,
      });
    }
  }

  // Sort by created_at desc, take 50
  activities.sort((a, b) => b.created_at.localeCompare(a.created_at));
  const recent = activities.slice(0, 50);

  // Summary
  const totalIssues = issueVotes.length;
  const voteRatio = issueVotes.reduce(
    (acc: { progressive: number; conservative: number; neutral: number }, v) => {
      if (v.stance === "progressive") acc.progressive++;
      else if (v.stance === "conservative") acc.conservative++;
      else acc.neutral++;
      return acc;
    },
    { progressive: 0, conservative: 0, neutral: 0 },
  );

  const lastOrientation =
    orientations[0]?.completed_at
      ? { type: orientations[0].political_type, date: orientations[0].completed_at }
      : null;

  return NextResponse.json({
    summary: { total_issues: totalIssues, vote_ratio: voteRatio, last_orientation: lastOrientation },
    activities: recent,
  });
}

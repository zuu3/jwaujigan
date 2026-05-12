import { NextResponse } from "next/server";
import { auth } from "../../../../../../auth";
import { createServiceRoleSupabaseClient } from "@/lib/supabase";
import type { IssueVoteCounts, IssueVoteStance } from "@/types/issue";
import { POINTS } from "@/services/points/points";

const VALID_STANCES: IssueVoteStance[] = ["progressive", "conservative", "neutral"];

const EMPTY_COUNTS: IssueVoteCounts = { progressive: 0, conservative: 0, neutral: 0, total: 0 };

async function getVoteCounts(issueId: string): Promise<IssueVoteCounts> {
  const supabase = createServiceRoleSupabaseClient();
  const { data } = await supabase
    .from("issue_vote_counts")
    .select("progressive, conservative, neutral, total")
    .eq("issue_id", issueId)
    .single();
  return data ?? EMPTY_COUNTS;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id: issueId } = await params;
  const body = await request.json() as { stance?: string };
  const stance = body.stance as IssueVoteStance | undefined;

  if (!stance || !VALID_STANCES.includes(stance)) {
    return NextResponse.json({ message: "Invalid stance" }, { status: 400 });
  }

  const supabase = createServiceRoleSupabaseClient();
  const userId = session.user.id;

  // 유효한 이슈인지 확인
  const { data: issue } = await supabase
    .from("issues")
    .select("id")
    .eq("id", issueId)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (!issue) {
    return NextResponse.json({ message: "Issue not found or expired" }, { status: 404 });
  }

  // 기존 투표 확인
  const { data: existing } = await supabase
    .from("issue_votes")
    .select("stance")
    .eq("issue_id", issueId)
    .eq("user_id", userId)
    .single();

  let userVote: IssueVoteStance | null;

  if (existing?.stance === stance) {
    // 동일 입장 재클릭 → 취소
    await supabase
      .from("issue_votes")
      .delete()
      .eq("issue_id", issueId)
      .eq("user_id", userId);
    userVote = null;
  } else {
    // 신규 또는 변경
    await supabase
      .from("issue_votes")
      .upsert(
        { issue_id: issueId, user_id: userId, stance, updated_at: new Date().toISOString() },
        { onConflict: "issue_id,user_id" },
      );
    await supabase.rpc("increment_user_points", { p_user_id: userId, p_amount: POINTS.VOTE });
    userVote = stance;
  }

  const voteCounts = await getVoteCounts(issueId);

  return NextResponse.json({ vote_counts: voteCounts, user_vote: userVote });
}

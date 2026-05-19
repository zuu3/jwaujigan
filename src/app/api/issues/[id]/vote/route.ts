import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createServiceRoleSupabaseClient } from "@/lib/supabase";
import type { IssueVoteCounts, IssueVoteStance } from "@/types/issue";
import { DAILY_BONUS, POINTS, kstTodayStartISO } from "@/services/points/points";

const VALID_STANCES: IssueVoteStance[] = ["progressive", "conservative", "neutral"];

const EMPTY_COUNTS: IssueVoteCounts = { progressive: 0, conservative: 0, neutral: 0, total: 0 };

async function getVoteCounts(issueId: string): Promise<IssueVoteCounts> {
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from("issue_votes")
    .select("stance")
    .eq("issue_id", issueId);

  if (error) {
    console.error("[vote] failed to fetch vote counts", error);
    return EMPTY_COUNTS;
  }

  return (data ?? []).reduce<IssueVoteCounts>((counts, vote) => {
    counts[vote.stance as IssueVoteStance]++;
    counts.total++;
    return counts;
  }, { ...EMPTY_COUNTS });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.email) {
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

  const { data: userRow } = await supabase
    .from("users")
    .select("points")
    .eq("id", userId)
    .maybeSingle();

  // 유효한 이슈인지 확인
  const { data: issue, error: issueError } = await supabase
    .from("issues")
    .select("id")
    .eq("id", issueId)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (issueError) {
    console.error("[vote] issue lookup failed", issueError);
  }

  if (issueError || !issue) {
    return NextResponse.json({ message: "Issue not found or expired" }, { status: 404 });
  }

  // 기존 투표 확인
  const { data: existing, error: existingError } = await supabase
    .from("issue_votes")
    .select("id, stance")
    .eq("issue_id", issueId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existingError) {
    console.error("[vote] existing vote lookup failed", existingError);
    return NextResponse.json({ message: "투표 상태를 확인하지 못했습니다." }, { status: 500 });
  }

  let userVote: IssueVoteStance | null;
  let daily_bonus_earned = false;
  let points_earned = 0;
  const newlyEarnedBadges: string[] = [];

  if (existing?.stance === stance) {
    // 동일 입장 재클릭 → 취소
    const { error: deleteError } = await supabase
      .from("issue_votes")
      .delete()
      .eq("id", existing.id);

    if (deleteError) {
      console.error("[vote] delete failed", deleteError);
      return NextResponse.json({ message: "투표를 취소하지 못했습니다." }, { status: 500 });
    }
    userVote = null;
  } else {
    // 신규 또는 입장 변경
    const now = new Date().toISOString();
    const voteWrite = existing
      ? await supabase
          .from("issue_votes")
          .update({ stance, updated_at: now })
          .eq("id", existing.id)
      : await supabase
          .from("issue_votes")
          .insert({ issue_id: issueId, user_id: userId, stance, updated_at: now });

    if (voteWrite.error) {
      // 23505 = unique_violation: concurrent request already inserted — treat as success
      if ((voteWrite.error as { code?: string }).code === "23505") {
        userVote = stance;
      } else {
        console.error("[vote] write failed", voteWrite.error);
        return NextResponse.json({ message: "투표를 저장하지 못했습니다." }, { status: 500 });
      }
    } else {
      userVote = stance;
    }

    // 포인트는 이 이슈에 처음 투표할 때만 지급 (입장 변경 시 제외)
    if (!existing) {
      const { count: todayCount } = await supabase
        .from("issue_votes")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("updated_at", kstTodayStartISO());
      const isFirstVoteToday = (todayCount ?? 1) <= 1;

      const bonus = isFirstVoteToday ? DAILY_BONUS : 0;
      const { error: pointsError } = await supabase
        .from("users")
        .update({ points: (userRow?.points ?? 0) + POINTS.VOTE + bonus })
        .eq("id", userId);
      if (pointsError) {
        console.error("[vote] points update failed", pointsError);
      }
      daily_bonus_earned = isFirstVoteToday;
      points_earned = POINTS.VOTE + bonus;

      // 투표 뱃지 체크: 이 INSERT 전 카운트로 임계점 crossing 감지
      // 현재 insert 포함 카운트에서 -1 = 이전 카운트
      const { count: totalVotes } = await supabase
        .from("issue_votes")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId);

      const prevVotes = (totalVotes ?? 1) - 1;
      const newVotes = prevVotes + 1;
      if (prevVotes < 1 && newVotes >= 1) newlyEarnedBadges.push("first_vote");
      if (prevVotes < 10 && newVotes >= 10) newlyEarnedBadges.push("vote_10");
    }
  }

  const voteCounts = await getVoteCounts(issueId);

  return NextResponse.json({ vote_counts: voteCounts, user_vote: userVote, daily_bonus_earned, points_earned, newly_earned_badges: newlyEarnedBadges });
}

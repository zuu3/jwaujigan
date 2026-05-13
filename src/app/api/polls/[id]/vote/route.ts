import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createServiceRoleSupabaseClient } from "@/lib/supabase";
import { POINTS } from "@/services/points/points";
import type { PollOption } from "@/app/api/polls/route";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id: pollId } = await params;
  const body = await request.json() as { option_id?: string };
  const { option_id } = body;

  if (!option_id) {
    return NextResponse.json({ message: "option_id가 필요합니다." }, { status: 400 });
  }

  const supabase = createServiceRoleSupabaseClient();

  // 유저 조회
  const { data: userRow } = await supabase
    .from("users")
    .select("id, points")
    .eq("email", session.user.email)
    .maybeSingle();

  if (!userRow) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  // poll 조회
  const { data: poll } = await supabase
    .from("polls")
    .select("id, options, expires_at")
    .eq("id", pollId)
    .single();

  if (!poll) {
    return NextResponse.json({ message: "Poll not found" }, { status: 404 });
  }

  // 만료 확인
  if (new Date(poll.expires_at) < new Date()) {
    return NextResponse.json({ message: "마감된 투표입니다." }, { status: 410 });
  }

  // 유효한 option_id 확인
  const options = poll.options as PollOption[];
  const validOption = options.find((o) => o.id === option_id);
  if (!validOption) {
    return NextResponse.json({ message: "유효하지 않은 선택지입니다." }, { status: 400 });
  }

  // 중복 투표 확인
  const { data: existing } = await supabase
    .from("poll_votes")
    .select("id")
    .eq("poll_id", pollId)
    .eq("user_id", userRow.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ message: "이미 투표했습니다." }, { status: 409 });
  }

  // 투표 삽입
  const { error: insertError } = await supabase
    .from("poll_votes")
    .insert({
      poll_id: pollId,
      user_id: userRow.id,
      option_id,
    });

  if (insertError) {
    // unique constraint 충돌 처리
    if (insertError.code === "23505") {
      return NextResponse.json({ message: "이미 투표했습니다." }, { status: 409 });
    }
    return NextResponse.json({ message: "투표에 실패했습니다." }, { status: 500 });
  }

  // 포인트 지급
  await supabase
    .from("users")
    .update({ points: (userRow.points ?? 0) + POINTS.VOTE })
    .eq("id", userRow.id);

  // 결과 조회
  const { data: votes } = await supabase
    .from("poll_votes")
    .select("option_id")
    .eq("poll_id", pollId);

  const option_counts: Record<string, number> = {};
  for (const opt of options) {
    option_counts[opt.id] = 0;
  }
  for (const v of votes ?? []) {
    if (option_counts[v.option_id] !== undefined) {
      option_counts[v.option_id]++;
    } else {
      option_counts[v.option_id] = 1;
    }
  }

  const total_count = (votes ?? []).length;

  return NextResponse.json({
    option_counts,
    user_vote: option_id,
    total_count,
    points_earned: POINTS.VOTE,
  });
}

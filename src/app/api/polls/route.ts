import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createServiceRoleSupabaseClient } from "@/lib/supabase";
import { POINTS } from "@/services/points/points";

export type PollOption = { id: string; text: string };

export type PollRow = {
  id: string;
  user_id: string;
  question: string;
  options: PollOption[];
  expires_at: string;
  created_at: string;
  total_count: number;
  user_option_id: string | null;
};

export async function GET(request: Request) {
  const session = await auth();
  const supabase = createServiceRoleSupabaseClient();

  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor");

  let query = supabase
    .from("polls")
    .select("id, user_id, question, options, expires_at, created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { data: polls, error } = await query;

  if (error) {
    return NextResponse.json({ message: "Failed to fetch polls" }, { status: 500 });
  }

  if (!polls || polls.length === 0) {
    return NextResponse.json({ polls: [] });
  }

  const pollIds = polls.map((p) => p.id);

  // 각 poll의 투표 수
  const { data: voteCounts } = await supabase
    .from("poll_votes")
    .select("poll_id")
    .in("poll_id", pollIds);

  const countMap: Record<string, number> = {};
  for (const v of voteCounts ?? []) {
    countMap[v.poll_id] = (countMap[v.poll_id] ?? 0) + 1;
  }

  // 내 투표 여부
  let myVoteMap: Record<string, string> = {};
  if (session?.user?.email) {
    const { data: userRow } = await supabase
      .from("users")
      .select("id")
      .eq("email", session.user.email)
      .maybeSingle();

    if (userRow?.id) {
      const { data: myVotes } = await supabase
        .from("poll_votes")
        .select("poll_id, option_id")
        .eq("user_id", userRow.id)
        .in("poll_id", pollIds);

      for (const v of myVotes ?? []) {
        myVoteMap[v.poll_id] = v.option_id;
      }
    }
  }

  const result: PollRow[] = polls.map((p) => ({
    id: p.id,
    user_id: p.user_id,
    question: p.question,
    options: p.options as PollOption[],
    expires_at: p.expires_at,
    created_at: p.created_at,
    total_count: countMap[p.id] ?? 0,
    user_option_id: myVoteMap[p.id] ?? null,
  }));

  return NextResponse.json({ polls: result });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json() as {
    question?: string;
    options?: PollOption[];
    expires_in_days?: number;
  };

  const { question, options, expires_in_days } = body;

  if (!question || typeof question !== "string" || question.trim().length === 0) {
    return NextResponse.json({ message: "질문을 입력해주세요." }, { status: 400 });
  }

  if (!Array.isArray(options) || options.length < 2 || options.length > 4) {
    return NextResponse.json({ message: "선택지는 2~4개여야 합니다." }, { status: 400 });
  }

  for (const opt of options) {
    if (!opt.id || !opt.text || opt.text.trim().length === 0) {
      return NextResponse.json({ message: "선택지를 모두 입력해주세요." }, { status: 400 });
    }
  }

  const validDays = [1, 3, 7];
  const days = typeof expires_in_days === "number" && validDays.includes(expires_in_days)
    ? expires_in_days
    : 7;

  const supabase = createServiceRoleSupabaseClient();

  const { data: userRow } = await supabase
    .from("users")
    .select("id, points")
    .eq("email", session.user.email)
    .maybeSingle();

  if (!userRow) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  if ((userRow.points ?? 0) < POINTS.POLL_CREATE) {
    return NextResponse.json({ message: "포인트가 부족합니다." }, { status: 402 });
  }

  const expires_at = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

  const { data: poll, error: insertError } = await supabase
    .from("polls")
    .insert({
      user_id: userRow.id,
      question: question.trim(),
      options,
      expires_at,
    })
    .select()
    .single();

  if (insertError || !poll) {
    return NextResponse.json({ message: "투표 생성에 실패했습니다." }, { status: 500 });
  }

  // 포인트 차감
  await supabase
    .from("users")
    .update({ points: (userRow.points ?? 0) - POINTS.POLL_CREATE })
    .eq("id", userRow.id);

  return NextResponse.json({ poll }, { status: 201 });
}

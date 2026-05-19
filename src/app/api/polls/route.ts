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
  creator: { id: string; name: string | null; image: string | null } | null;
};

export async function GET(request: Request) {
  const session = await auth();
  const supabase = createServiceRoleSupabaseClient();

  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor");
  const sort = searchParams.get("sort") === "hot" ? "hot" : "latest";

  // hot 정렬: poll_votes 집계 후 내림차순으로 ID 목록 구성
  let hotOrderedIds: string[] | null = null;
  let precomputedVoteCountMap: Record<string, number> | null = null;

  if (sort === "hot") {
    const { data: voteSummary } = await supabase
      .from("poll_votes")
      .select("poll_id")
      .limit(10_000);

    const voteCount: Record<string, number> = {};
    for (const v of voteSummary ?? []) {
      voteCount[v.poll_id] = (voteCount[v.poll_id] ?? 0) + 1;
    }
    precomputedVoteCountMap = voteCount;

    // 투표 수 내림차순으로 정렬
    const sortedByVotes = Object.entries(voteCount)
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => id);

    // 투표가 0건인 poll도 뒤에 포함
    const { data: allPolls } = await supabase.from("polls").select("id");
    const allPollIds = (allPolls ?? []).map((p) => p.id);
    const zeroVoteIds = allPollIds.filter((id) => !voteCount[id]);

    hotOrderedIds = [...sortedByVotes, ...zeroVoteIds];
  }

  let query = supabase
    .from("polls")
    .select("id, user_id, question, options, expires_at, created_at")
    .limit(20);

  if (sort === "hot" && hotOrderedIds) {
    query = query.in("id", hotOrderedIds.slice(0, 20));
  } else {
    query = query.order("created_at", { ascending: false });
    if (cursor) {
      query = query.lt("created_at", cursor);
    }
  }

  const { data: polls, error } = await query;

  if (error) {
    return NextResponse.json({ message: "Failed to fetch polls" }, { status: 500 });
  }

  if (!polls || polls.length === 0) {
    return NextResponse.json({ polls: [] });
  }

  const fetchedPollIds = polls.map((p) => p.id);

  // 투표 수 집계 (hot 모드에서는 이미 계산된 값 재사용)
  let totalCountMap: Record<string, number>;
  if (precomputedVoteCountMap) {
    totalCountMap = precomputedVoteCountMap;
  } else {
    const { data: voteCounts } = await supabase
      .from("poll_votes")
      .select("poll_id")
      .in("poll_id", fetchedPollIds);

    totalCountMap = {};
    for (const v of voteCounts ?? []) {
      totalCountMap[v.poll_id] = (totalCountMap[v.poll_id] ?? 0) + 1;
    }
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
        .in("poll_id", fetchedPollIds);

      for (const v of myVotes ?? []) {
        myVoteMap[v.poll_id] = v.option_id;
      }
    }
  }

  // hot 모드: in()은 순서를 보장하지 않으므로 hotOrderedIds 순으로 재정렬
  const orderedPolls =
    sort === "hot" && hotOrderedIds
      ? hotOrderedIds
          .map((id) => polls.find((p) => p.id === id))
          .filter((p): p is NonNullable<typeof p> => p !== undefined)
      : polls;

  // 제작자 정보
  const creatorIds = [...new Set(orderedPolls.map((p) => p.user_id))];
  const { data: creatorRows } = await supabase
    .from("users")
    .select("id, name, image")
    .in("id", creatorIds);
  const creatorMap = new Map((creatorRows ?? []).map((u) => [u.id, u]));

  const result: PollRow[] = orderedPolls.map((p) => {
    const c = creatorMap.get(p.user_id);
    return {
      id: p.id,
      user_id: p.user_id,
      question: p.question,
      options: p.options as PollOption[],
      expires_at: p.expires_at,
      created_at: p.created_at,
      total_count: totalCountMap[p.id] ?? 0,
      user_option_id: myVoteMap[p.id] ?? null,
      creator: c ? { id: c.id, name: c.name, image: c.image } : null,
    };
  });

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

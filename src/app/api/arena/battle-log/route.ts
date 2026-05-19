import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createServiceRoleSupabaseClient } from "@/lib/supabase";
import { DAILY_BONUS, POINTS, getDailyBattleLimit, getLevel, kstTodayStartISO } from "@/services/points/points";

type DebateMessage = {
  role: "progressive" | "conservative" | "user";
  content: string;
};

type BattleLogRequestBody = {
  topic?: string;
  messages?: DebateMessage[];
  winner?: "progressive" | "conservative" | "draw";
  userStance?: "progressive" | "conservative";
};

function isValidMessages(value: unknown): value is DebateMessage[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every(
      (message) =>
        typeof message === "object" &&
        message !== null &&
        ((message as DebateMessage).role === "progressive" ||
          (message as DebateMessage).role === "conservative" ||
          (message as DebateMessage).role === "user") &&
        typeof (message as DebateMessage).content === "string",
    )
  );
}

function mapWinnerToResult(
  winner: BattleLogRequestBody["winner"],
  userStance: BattleLogRequestBody["userStance"],
) {
  if (winner === "draw") {
    return "draw";
  }

  if (winner === userStance) {
    return "win";
  }

  return "lose";
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as BattleLogRequestBody;

  if (
    !body.topic ||
    !isValidMessages(body.messages) ||
    (body.winner !== "progressive" &&
      body.winner !== "conservative" &&
      body.winner !== "draw") ||
    (body.userStance !== "progressive" && body.userStance !== "conservative")
  ) {
    return NextResponse.json({ message: "Invalid battle log request." }, { status: 400 });
  }

  const supabase = createServiceRoleSupabaseClient();
  const userId = session.user.id;

  const { data: userRow } = await supabase
    .from("users")
    .select("points")
    .eq("id", userId)
    .maybeSingle();

  // 레벨별 일일 배틀 한도 확인
  const userPoints = userRow?.points ?? 0;
  const dailyLimit = getDailyBattleLimit(userPoints);

  const todayStart = kstTodayStartISO();

  // INSERT 전에 카운트 조회 (임계점 crossing 감지용)
  const [{ count: battlesToday }, { count: prevTotalBattles }] = await Promise.all([
    supabase
      .from("battle_logs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", todayStart),
    supabase
      .from("battle_logs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
  ]);

  const todayCount = battlesToday ?? 0;
  if (dailyLimit !== Infinity && todayCount >= dailyLimit) {
    return NextResponse.json(
      { message: "daily_limit_reached", limit: dailyLimit, battles_today: todayCount, level: getLevel(userPoints).title },
      { status: 429 },
    );
  }

  const { data, error } = await supabase
    .from("battle_logs")
    .insert({
      user_id: userId,
      topic: body.topic,
      messages: body.messages,
      result: mapWinnerToResult(body.winner, body.userStance),
    })
    .select("id")
    .single();

  if (error) {
    console.error("Failed to insert battle log", error);
    return NextResponse.json({ message: "Failed to insert battle log." }, { status: 500 });
  }

  // 오늘 첫 배틀 보너스
  const isFirstBattleToday = todayCount === 0;
  const bonus = isFirstBattleToday ? DAILY_BONUS : 0;
  const earned = POINTS.BATTLE + bonus;
  const { error: pointsError } = await supabase
    .from("users")
    .update({ points: userPoints + earned })
    .eq("id", userId);
  if (pointsError) {
    console.error("[battle-log] points update failed", pointsError);
  }

  // 뱃지 체크: INSERT 전 카운트 → 후 카운트 임계점 crossing 감지
  const prevTotal = prevTotalBattles ?? 0;
  const newTotal = prevTotal + 1;
  const newlyEarnedBadges: string[] = [];
  if (prevTotal < 1 && newTotal >= 1) newlyEarnedBadges.push("first_battle");
  if (prevTotal < 10 && newTotal >= 10) newlyEarnedBadges.push("battle_10");

  return NextResponse.json({
    id: data.id,
    daily_bonus_earned: isFirstBattleToday,
    battles_today: todayCount + 1,
    limit: dailyLimit === Infinity ? null : dailyLimit,
    newly_earned_badges: newlyEarnedBadges,
  });
}

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createServiceRoleSupabaseClient } from "@/lib/supabase";

const REFERRAL_REWARD_POINTS = 50;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const referredId = session.user.id;
  const body = await req.json() as { referralCode?: string };
  const referralCode = body.referralCode?.trim().toUpperCase();

  if (!referralCode) {
    return NextResponse.json({ message: "referralCode가 필요합니다." }, { status: 400 });
  }

  const supabase = createServiceRoleSupabaseClient();

  // referral_code로 referrer 조회
  const { data: referrer } = await supabase
    .from("users")
    .select("id")
    .eq("referral_code" as "id", referralCode)
    .maybeSingle();

  if (!referrer) {
    return NextResponse.json({ message: "유효하지 않은 추천인 코드입니다." }, { status: 404 });
  }

  if (referrer.id === referredId) {
    return NextResponse.json({ message: "자신의 코드는 사용할 수 없습니다." }, { status: 400 });
  }

  // 추천인 일일 한도 확인 (하루 최대 3명)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const { count: todayCount } = await supabase
    .from("referrals" as "users")
    .select("id", { count: "exact", head: true })
    .eq("referrer_id" as "id", referrer.id)
    .gte("completed_at" as "id", todayStart.toISOString());

  if ((todayCount ?? 0) >= 3) {
    return NextResponse.json({ message: "오늘 추천 한도(3명)에 도달했습니다." }, { status: 429 });
  }

  // 이미 추천인 코드를 사용한 경우 무시
  const { data: existing } = await supabase
    .from("referrals" as "users")
    .select("id")
    .eq("referred_id" as "id", referredId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ ok: true, alreadyUsed: true });
  }

  const { error: insertError } = await supabase
    .from("referrals" as "users")
    .insert({
      referrer_id: referrer.id,
      referred_id: referredId,
    } as never);

  if (insertError) {
    if (insertError.code === "23505") {
      return NextResponse.json({ ok: true, alreadyUsed: true });
    }
    return NextResponse.json({ message: "서버 오류가 발생했어요." }, { status: 500 });
  }

  // 추천인 + 피추천인 동시 포인트 지급
  await Promise.all([
    supabase.rpc("increment_user_points", {
      p_user_id: referrer.id,
      p_amount: REFERRAL_REWARD_POINTS,
    }),
    supabase.rpc("increment_user_points", {
      p_user_id: referredId,
      p_amount: REFERRAL_REWARD_POINTS,
    }),
  ]);

  return NextResponse.json({ ok: true });
}

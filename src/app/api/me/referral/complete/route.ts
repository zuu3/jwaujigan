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

  // 이미 추천인 코드를 사용한 경우 무시
  const { data: existing } = await supabase
    .from("referrals" as "users")
    .select("id")
    .eq("referred_id" as "id", referredId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ ok: true, alreadyUsed: true });
  }

  // 한 번에 completed로 INSERT
  const { error: insertError } = await supabase
    .from("referrals" as "users")
    .insert({
      referrer_id: referrer.id,
      referred_id: referredId,
      status: "completed",
      completed_at: new Date().toISOString(),
    } as never);

  if (insertError) {
    if (insertError.code === "23505") {
      return NextResponse.json({ ok: true, alreadyUsed: true });
    }
    return NextResponse.json({ message: "서버 오류가 발생했어요." }, { status: 500 });
  }

  // 추천인에게 포인트 지급
  await supabase.rpc("increment_user_points", {
    p_user_id: referrer.id,
    p_amount: REFERRAL_REWARD_POINTS,
  });

  return NextResponse.json({ ok: true });
}

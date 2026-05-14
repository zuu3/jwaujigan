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
  const { data: referrer, error: referrerError } = await supabase
    .from("users")
    .select("id")
    .eq("referral_code" as "id", referralCode)
    .maybeSingle();

  if (referrerError) {
    console.error("Failed to look up referrer", referrerError);
    return NextResponse.json({ message: "서버 오류가 발생했어요." }, { status: 500 });
  }

  if (!referrer) {
    return NextResponse.json({ message: "유효하지 않은 초대 코드입니다." }, { status: 404 });
  }

  // 자기 자신 초대 방지
  if (referrer.id === referredId) {
    return NextResponse.json({ message: "자신의 초대 코드는 사용할 수 없습니다." }, { status: 400 });
  }

  // pending 상태인 referral 조회
  const { data: referral, error: referralError } = await supabase
    .from("referrals" as "users")
    .select("id, status")
    .eq("referred_id" as "id", referredId)
    .eq("referrer_id" as "id", referrer.id)
    .maybeSingle();

  if (referralError) {
    console.error("Failed to query referral", referralError);
    return NextResponse.json({ message: "서버 오류가 발생했어요." }, { status: 500 });
  }

  if (!referral) {
    return NextResponse.json({ message: "초대 기록을 찾을 수 없습니다." }, { status: 404 });
  }

  const referralRow = referral as unknown as { id: string; status: string };

  if (referralRow.status === "completed") {
    return NextResponse.json({ ok: true, alreadyCompleted: true });
  }

  // status → completed 업데이트
  const { error: updateError } = await supabase
    .from("referrals" as "users")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
    } as never)
    .eq("id" as "id", referralRow.id);

  if (updateError) {
    console.error("Failed to complete referral", updateError);
    return NextResponse.json({ message: "서버 오류가 발생했어요." }, { status: 500 });
  }

  // 초대자에게 포인트 지급
  const { error: pointsError } = await supabase.rpc("increment_user_points", {
    p_user_id: referrer.id,
    p_amount: REFERRAL_REWARD_POINTS,
  });

  if (pointsError) {
    console.error("Failed to grant referral points", pointsError);
    // 포인트 지급 실패는 soft error — 완료 처리는 이미 됐으므로 그대로 응답
  }

  return NextResponse.json({ ok: true });
}

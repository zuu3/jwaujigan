import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createServiceRoleSupabaseClient } from "@/lib/supabase";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const referredId = session.user.id;
  const body = await req.json() as { code?: string };
  const code = body.code?.trim().toUpperCase();

  if (!code) {
    return NextResponse.json({ message: "code가 필요합니다." }, { status: 400 });
  }

  const supabase = createServiceRoleSupabaseClient();

  // referral_code로 referrer 조회
  const { data: referrer, error: referrerError } = await supabase
    .from("users")
    .select("id")
    .eq("referral_code" as "id", code)
    .maybeSingle();

  if (referrerError) {
    console.error("Failed to look up referrer for registration", referrerError);
    return NextResponse.json({ message: "서버 오류가 발생했어요." }, { status: 500 });
  }

  if (!referrer) {
    // 잘못된 코드는 무시 (클라이언트에서 fire-and-forget으로 호출)
    return NextResponse.json({ ok: true, ignored: true });
  }

  // 자기 자신 초대 방지
  if (referrer.id === referredId) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  // 이미 referred_id가 등록된 경우 무시 (unique constraint)
  const { data: existing } = await supabase
    .from("referrals" as "users")
    .select("id")
    .eq("referred_id" as "id", referredId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  // referrals INSERT
  const { error: insertError } = await supabase
    .from("referrals" as "users")
    .insert({
      referrer_id: referrer.id,
      referred_id: referredId,
      status: "pending",
    } as never);

  if (insertError) {
    // unique constraint 위반이면 무시
    if (insertError.code === "23505") {
      return NextResponse.json({ ok: true, ignored: true });
    }
    console.error("Failed to insert referral", insertError);
    return NextResponse.json({ message: "서버 오류가 발생했어요." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

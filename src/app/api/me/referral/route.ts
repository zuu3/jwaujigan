import { NextResponse } from "next/server";
import { requestAuth } from "@/lib/request-auth";
import { createServiceRoleSupabaseClient } from "@/lib/supabase";

export async function GET(request: Request) {
  const session = await requestAuth(request);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const supabase = createServiceRoleSupabaseClient();

  // 현재 유저의 referral_code 조회
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("referral_code")
    .eq("id", userId)
    .single();

  if (userError) {
    console.error("Failed to fetch user for referral", userError);
    return NextResponse.json({ message: "서버 오류가 발생했어요." }, { status: 500 });
  }

  let code = (user as unknown as { referral_code: string | null })?.referral_code ?? null;

  // 없으면 새로 생성
  if (!code) {
    code = crypto.randomUUID().slice(0, 8).toUpperCase();

    const { error: updateError } = await supabase
      .from("users")
      .update({ referral_code: code } as never)
      .eq("id", userId);

    if (updateError) {
      console.error("Failed to save referral_code", updateError);
      return NextResponse.json({ message: "서버 오류가 발생했어요." }, { status: 500 });
    }
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [{ count }, { count: todayCount }] = await Promise.all([
    supabase
      .from("referrals" as "users")
      .select("id", { count: "exact", head: true })
      .eq("referrer_id" as "id", userId),
    supabase
      .from("referrals" as "users")
      .select("id", { count: "exact", head: true })
      .eq("referrer_id" as "id", userId)
      .gte("completed_at" as "id", todayStart.toISOString()),
  ]);

  const referralUrl = `${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/?ref=${code}`;

  return NextResponse.json({
    code,
    referralUrl,
    count: count ?? 0,
    todayCount: todayCount ?? 0,
  });
}

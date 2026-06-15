import { NextResponse } from "next/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return new NextResponse("잘못된 링크입니다.", { status: 400 });
  }

  const supabase = createServiceRoleSupabaseClient();
  const { error } = await supabase
    .from("users")
    .update({ newsletter_subscribed: false })
    .eq("newsletter_token", token);

  if (error) {
    console.error("[newsletter/unsubscribe] 실패:", error);
    return new NextResponse("구독 취소에 실패했습니다.", { status: 500 });
  }

  const appUrl = process.env.NEXTAUTH_URL ?? "https://jwaujigan.com";
  return NextResponse.redirect(`${appUrl}/?unsubscribed=1`);
}

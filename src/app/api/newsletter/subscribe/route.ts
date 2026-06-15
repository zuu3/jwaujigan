import { NextResponse } from "next/server";
import { requestAuth } from "@/lib/request-auth";
import { createServiceRoleSupabaseClient } from "@/lib/supabase";

export async function POST(req: Request) {
  const session = await requestAuth(req);
  if (!session) {
    return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const subscribed: boolean = body.subscribed ?? true;

  const supabase = createServiceRoleSupabaseClient();
  const { error } = await supabase
    .from("users")
    .update({ newsletter_subscribed: subscribed })
    .eq("email", session.user.email);

  if (error) {
    console.error("[newsletter/subscribe] 업데이트 실패:", error);
    return NextResponse.json({ message: "업데이트에 실패했습니다." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, subscribed });
}

export async function GET(req: Request) {
  const session = await requestAuth(req);
  if (!session) {
    return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  }

  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from("users")
    .select("newsletter_subscribed")
    .eq("email", session.user.email)
    .single();

  if (error) {
    return NextResponse.json({ message: "조회에 실패했습니다." }, { status: 500 });
  }

  return NextResponse.json({ subscribed: data.newsletter_subscribed });
}

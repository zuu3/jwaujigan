import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createServiceRoleSupabaseClient } from "@/lib/supabase";

const VALID_REASONS = ["욕설/혐오", "스팸/광고", "허위정보", "기타"] as const;
type Reason = (typeof VALID_REASONS)[number];

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  }

  const body = await req.json() as { targetType: string; targetId: string; reason: string; detail?: string };

  if (body.targetType !== "comment" || !body.targetId || !VALID_REASONS.includes(body.reason as Reason)) {
    return NextResponse.json({ message: "잘못된 요청입니다." }, { status: 400 });
  }

  const supabase = createServiceRoleSupabaseClient();

  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("email", session.user.email)
    .maybeSingle();

  if (!user) return NextResponse.json({ message: "사용자를 찾을 수 없습니다." }, { status: 404 });

  // 중복 신고 방지
  const { data: existing } = await supabase
    .from("reports" as "users")
    .select("id")
    .eq("reporter_id", user.id)
    .eq("target_id", body.targetId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ message: "이미 신고한 댓글입니다." }, { status: 409 });
  }

  const { error } = await supabase
    .from("reports" as "users")
    .insert({
      reporter_id: user.id,
      target_type: body.targetType,
      target_id: body.targetId,
      reason: body.reason,
      detail: body.detail?.trim() || null,
    } as never);

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

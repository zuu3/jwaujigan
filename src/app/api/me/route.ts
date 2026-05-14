import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createServiceRoleSupabaseClient } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  }

  const supabase = createServiceRoleSupabaseClient();

  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("email", session.user.email)
    .maybeSingle();

  if (!user) {
    return NextResponse.json({ message: "사용자를 찾을 수 없습니다." }, { status: 404 });
  }

  // users 테이블 삭제 (cascade로 연관 데이터 정리)
  const { error: deleteError } = await supabase
    .from("users")
    .delete()
    .eq("id", user.id);

  if (deleteError) {
    return NextResponse.json({ message: deleteError.message }, { status: 500 });
  }

  // Supabase Auth에서도 삭제
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
  await adminClient.auth.admin.deleteUser(user.id);

  return NextResponse.json({ ok: true });
}

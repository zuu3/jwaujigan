import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createServiceRoleSupabaseClient } from "@/lib/supabase";

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json() as { is_public?: boolean };
  if (typeof body.is_public !== "boolean") {
    return NextResponse.json({ message: "is_public must be boolean" }, { status: 400 });
  }

  const supabase = createServiceRoleSupabaseClient();

  const { data: userRow } = await supabase
    .from("users")
    .select("id")
    .eq("email", session.user.email)
    .maybeSingle();

  if (!userRow?.id) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  const { error } = await supabase
    .from("users")
    .update({ is_public: body.is_public })
    .eq("id", userRow.id);

  if (error) {
    console.error("[visibility] update failed", error);
    return NextResponse.json({ message: "설정 변경에 실패했어요." }, { status: 500 });
  }

  return NextResponse.json({ is_public: body.is_public });
}

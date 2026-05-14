import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin";
import { createServiceRoleSupabaseClient } from "@/lib/supabase";

export async function DELETE(req: Request) {
  const { error } = await requireAdminApi();
  if (error) return error;

  const body = await req.json() as { target: "poll" | "comment"; id: string };
  const supabase = createServiceRoleSupabaseClient();

  if (body.target === "poll") {
    await supabase.from("poll_votes").delete().eq("poll_id", body.id);
    await supabase.from("poll_comments").delete().eq("poll_id", body.id);
    const { error: dbError } = await supabase.from("polls").delete().eq("id", body.id);
    if (dbError) return NextResponse.json({ message: dbError.message }, { status: 500 });
  } else {
    await supabase.from("poll_comments").delete().eq("parent_id", body.id);
    const { error: dbError } = await supabase.from("poll_comments").delete().eq("id", body.id);
    if (dbError) return NextResponse.json({ message: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

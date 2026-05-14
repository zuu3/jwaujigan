import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin";
import { createServiceRoleSupabaseClient } from "@/lib/supabase";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError } = await requireAdminApi();
  if (authError) return authError;

  const { id } = await params;
  const body = await req.json() as { action: "dismiss" | "delete"; commentId?: string | null };

  const supabase = createServiceRoleSupabaseClient();

  if (body.action === "delete" && body.commentId) {
    const { error: deleteError } = await supabase
      .from("poll_comments")
      .delete()
      .eq("id", body.commentId);
    if (deleteError) {
      return NextResponse.json({ message: deleteError.message }, { status: 500 });
    }
  }

  const { error: dismissError } = await supabase
    .from("reports" as "users")
    .update({ status: "dismissed" } as never)
    .eq("id", id);

  if (dismissError) return NextResponse.json({ message: dismissError.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

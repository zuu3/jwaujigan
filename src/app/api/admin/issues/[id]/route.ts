import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin";
import { createServiceRoleSupabaseClient } from "@/lib/supabase";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdminApi();
  if (error) return error;

  const { id } = await params;
  const body = await req.json() as { action: "expire" | "restore" };

  const supabase = createServiceRoleSupabaseClient();
  const expiresAt = body.action === "expire"
    ? new Date(Date.now() - 1000).toISOString()
    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { error: dbError } = await supabase
    .from("issues")
    .update({ expires_at: expiresAt })
    .eq("id", id);

  if (dbError) return NextResponse.json({ message: dbError.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

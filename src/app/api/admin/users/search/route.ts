import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin";
import { createServiceRoleSupabaseClient } from "@/lib/supabase";

export async function GET(req: Request) {
  const { error } = await requireAdminApi();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ users: [] });
  }

  const supabase = createServiceRoleSupabaseClient();
  const { data } = await supabase
    .from("users")
    .select("id, email, name, points")
    .or(`email.ilike.%${q}%,name.ilike.%${q}%`)
    .order("created_at", { ascending: false })
    .limit(10);

  return NextResponse.json({ users: data ?? [] });
}

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createServiceRoleSupabaseClient } from "@/lib/supabase";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ names: [], follows: [] });
  }

  const supabase = createServiceRoleSupabaseClient();
  const { data } = await supabase
    .from("politician_follows")
    .select("politician_id, politician_name, politician_image, created_at")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false });

  const rows = data ?? [];
  const names = rows.map((row) => row.politician_name);
  const follows = rows.map((row) => ({
    id: row.politician_id,
    name: row.politician_name,
    image: row.politician_image ?? null,
    followed_at: row.created_at,
  }));

  return NextResponse.json({ names, follows });
}

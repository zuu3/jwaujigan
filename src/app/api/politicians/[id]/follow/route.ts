import { NextResponse } from "next/server";
import { requestAuth } from "@/lib/request-auth";
import { createServiceRoleSupabaseClient } from "@/lib/supabase";
import { POINTS } from "@/services/points/points";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const session = await requestAuth(request);

  if (!session?.user?.email) {
    return NextResponse.json({ following: false });
  }

  const supabase = createServiceRoleSupabaseClient();
  const { data: userRow } = await supabase
    .from("users").select("id").eq("email", session.user.email).maybeSingle();
  if (!userRow?.id) return NextResponse.json({ following: false });

  const supabase2 = createServiceRoleSupabaseClient();
  const { data } = await supabase2
    .from("politician_follows")
    .select("id")
    .eq("user_id", userRow.id)
    .eq("politician_id", id)
    .maybeSingle();

  return NextResponse.json({ following: Boolean(data) });
}

export async function POST(request: Request, { params }: RouteContext) {
  const session = await requestAuth(request);
  if (!session?.user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json()) as { name?: string; image?: string | null };

  const supabase = createServiceRoleSupabaseClient();
  const { data: userRow } = await supabase
    .from("users").select("id").eq("email", session.user.email).maybeSingle();
  if (!userRow?.id) return NextResponse.json({ message: "User not found" }, { status: 404 });
  const userId = userRow.id;

  const { data: existing } = await supabase
    .from("politician_follows")
    .select("id")
    .eq("user_id", userId)
    .eq("politician_id", id)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("politician_follows")
      .delete()
      .eq("user_id", userId)
      .eq("politician_id", id);
    return NextResponse.json({ following: false });
  }

  await supabase.from("politician_follows").insert({
    user_id: userId,
    politician_id: id,
    politician_name: body.name ?? null,
    politician_image: body.image ?? null,
  });
  await supabase.rpc("increment_user_points", { p_user_id: userId, p_amount: POINTS.FOLLOW });

  return NextResponse.json({ following: true });
}

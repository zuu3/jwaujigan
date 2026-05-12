import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createServiceRoleSupabaseClient } from "@/lib/supabase";
import { POINTS } from "@/services/points/points";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ following: false });
  }

  const supabase = createServiceRoleSupabaseClient();
  const { data } = await supabase
    .from("politician_follows")
    .select("id")
    .eq("user_id", session.user.id)
    .eq("politician_id", id)
    .maybeSingle();

  return NextResponse.json({ following: Boolean(data) });
}

export async function POST(request: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json()) as { name?: string; image?: string | null };
  if (!body.name) {
    return NextResponse.json({ message: "Missing name" }, { status: 400 });
  }

  const supabase = createServiceRoleSupabaseClient();
  const userId = session.user.id;

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
    politician_name: body.name,
    politician_image: body.image ?? null,
  });
  await supabase.rpc("increment_user_points", { p_user_id: userId, p_amount: POINTS.FOLLOW });

  return NextResponse.json({ following: true });
}

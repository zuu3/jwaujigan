import { NextResponse } from "next/server";
import { requestAuth } from "@/lib/request-auth";
import { createServiceRoleSupabaseClient } from "@/lib/supabase";
import { getUserGateState } from "@/lib/users";
import { calcStreak, kstTodayStartISO } from "@/services/points/points";

export async function GET(request: Request) {
  const session = await requestAuth(request);

  if (!session?.user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const gateState = await getUserGateState(session.user.email);
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from("users")
    .select("id, email, name, image, district, points, is_public")
    .eq("email", session.user.email)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch user profile", error);
    return NextResponse.json({ message: "Failed to fetch user profile." }, { status: 500 });
  }

  let streak = 0;
  let today_active = false;

  if (data?.id) {
    const cutoff = new Date(Date.now() - 15 * 86_400_000).toISOString();
    const todayStart = kstTodayStartISO();

    const [votesRes, verdictsRes] = await Promise.all([
      supabase.from("issue_votes").select("created_at").eq("user_id", data.id).gte("created_at", cutoff),
      supabase.from("verdict_votes").select("created_at").eq("user_id", data.id).gte("created_at", cutoff),
    ]);

    const allDates = [
      ...(votesRes.data ?? []).map((r) => r.created_at as string),
      ...(verdictsRes.data ?? []).map((r) => r.created_at as string),
    ];

    streak = calcStreak(allDates);
    today_active = allDates.some((d) => d >= todayStart);
  }

  return NextResponse.json({
    ...(data ?? {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name ?? null,
      image: session.user.image ?? null,
      district: gateState.district ?? session.user.district ?? null,
      points: 0,
      is_public: true,
    }),
    district: gateState.district ?? data?.district ?? session.user.district ?? null,
    hasPoliticalProfile: gateState.hasPoliticalProfile,
    streak,
    today_active,
  });
}

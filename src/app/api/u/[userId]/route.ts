import { NextResponse } from "next/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase";
import { BADGE_DEFS, calcStreak, computeEarnedBadgeIds, getLevel, kstTodayStartISO } from "@/services/points/points";

export type PublicProfile = {
  id: string;
  name: string | null;
  image: string | null;
  district: string | null;
  points: number;
  level: { title: string; progress: number; next: number | null };
  streak: number;
  today_active: boolean;
  active_dates: string[];
  badges: { id: string; title: string; desc: string; earned: boolean }[];
  political_type: string | null;
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params;
  const supabase = createServiceRoleSupabaseClient();

  const { data: userRow } = await supabase
    .from("users")
    .select("id, name, image, district, points, is_public")
    .eq("id", userId)
    .maybeSingle();

  if (!userRow) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  if (!userRow.is_public) {
    return NextResponse.json({ message: "비공개 프로필이에요." }, { status: 403 });
  }

  const cutoff = new Date(Date.now() - 90 * 86_400_000).toISOString();
  const todayStart = kstTodayStartISO();
  const toKSTDate = (iso: string) =>
    new Date(new Date(iso).getTime() + 9 * 3_600_000).toISOString().slice(0, 10);

  const [votesRes, verdictsRes, battlesRes, followsRes, profileRes] = await Promise.all([
    supabase.from("issue_votes").select("created_at").eq("user_id", userId).gte("created_at", cutoff),
    supabase.from("verdict_votes").select("created_at").eq("user_id", userId).gte("created_at", cutoff),
    supabase.from("battle_logs").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("politician_follows").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase
      .from("user_political_profiles")
      .select("political_type")
      .eq("user_id", userId)
      .order("completed_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const allDates = [
    ...(votesRes.data ?? []).map((r) => r.created_at),
    ...(verdictsRes.data ?? []).map((r) => r.created_at),
  ];

  const streak = calcStreak(allDates);
  const today_active = allDates.some((d) => d >= todayStart);
  const active_dates = [...new Set(allDates.map(toKSTDate))];

  const earnedIds = new Set(
    computeEarnedBadgeIds({
      issueVotes: votesRes.data?.length ?? 0,
      battles: battlesRes.count ?? 0,
      follows: followsRes.count ?? 0,
      streak,
    }),
  );
  const badges = BADGE_DEFS.map((b) => ({ ...b, earned: earnedIds.has(b.id) }));

  return NextResponse.json({
    id: userRow.id,
    name: userRow.name,
    image: userRow.image,
    district: userRow.district,
    points: userRow.points,
    level: getLevel(userRow.points),
    streak,
    today_active,
    active_dates,
    badges,
    political_type: profileRes.data?.political_type ?? null,
  } satisfies PublicProfile);
}

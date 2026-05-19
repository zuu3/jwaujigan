import { NextResponse } from "next/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase";

export type LeaderboardEntry = {
  rank: number;
  user_id: string;
  name: string | null;
  image: string | null;
  points: number;
  battle_wins: number;
  issue_votes: number;
};

export async function GET() {
  const supabase = createServiceRoleSupabaseClient();

  const { data: users, error } = await supabase
    .from("users")
    .select("id, name, image, points")
    .eq("is_public", true)
    .order("points", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  if (!users || users.length === 0) {
    return NextResponse.json({ entries: [] });
  }

  const userIds = users.map((u) => u.id);

  const [battleResult, voteResult] = await Promise.all([
    supabase
      .from("battle_logs")
      .select("user_id, result")
      .in("user_id", userIds)
      .eq("result", "win"),
    supabase
      .from("issue_votes")
      .select("user_id")
      .in("user_id", userIds),
  ]);

  const winsByUser: Record<string, number> = {};
  for (const row of battleResult.data ?? []) {
    if (!row.user_id) continue;
    winsByUser[row.user_id] = (winsByUser[row.user_id] ?? 0) + 1;
  }

  const votesByUser: Record<string, number> = {};
  for (const row of voteResult.data ?? []) {
    if (!row.user_id) continue;
    votesByUser[row.user_id] = (votesByUser[row.user_id] ?? 0) + 1;
  }

  const entries: LeaderboardEntry[] = users.map((u, i) => ({
    rank: i + 1,
    user_id: u.id,
    name: u.name,
    image: u.image,
    points: u.points,
    battle_wins: winsByUser[u.id] ?? 0,
    issue_votes: votesByUser[u.id] ?? 0,
  }));

  return NextResponse.json({ entries });
}

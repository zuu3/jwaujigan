import { createServiceRoleSupabaseClient } from "@/lib/supabase";
import { LeaderboardClient } from "./LeaderboardClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function LeaderboardPage() {
  const supabase = createServiceRoleSupabaseClient();

  const { data: users } = await supabase
    .from("users")
    .select("id, name, image, points")
    .eq("is_public", true)
    .order("points", { ascending: false })
    .limit(50);

  const userIds = (users ?? []).map((u) => u.id);

  const [battleResult, voteResult] = await Promise.all([
    userIds.length > 0
      ? supabase.from("battle_logs").select("user_id, result").in("user_id", userIds).eq("result", "win")
      : { data: [] },
    userIds.length > 0
      ? supabase.from("issue_votes").select("user_id").in("user_id", userIds)
      : { data: [] },
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

  const entries = (users ?? []).map((u, i) => ({
    rank: i + 1,
    user_id: u.id,
    name: u.name as string | null,
    image: u.image as string | null,
    points: u.points as number,
    battle_wins: winsByUser[u.id] ?? 0,
    issue_votes: votesByUser[u.id] ?? 0,
  }));

  return <LeaderboardClient entries={entries} />;
}

import { requireAdmin } from "@/lib/admin";
import { createServiceRoleSupabaseClient } from "@/lib/supabase";

function kstTodayStart() {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return new Date(Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate()) - 9 * 60 * 60 * 1000).toISOString();
}

async function getStats() {
  const supabase = createServiceRoleSupabaseClient();
  const todayISO = kstTodayStart();

  const [
    { count: totalUsers },
    { count: todayUsers },
    { count: activeIssues },
    { count: todayBattles },
    { count: todayVotes },
    { count: totalPolls },
  ] = await Promise.all([
    supabase.from("users").select("id", { count: "exact", head: true }),
    supabase.from("users").select("id", { count: "exact", head: true }).gte("created_at", todayISO),
    supabase.from("issues").select("id", { count: "exact", head: true }).gte("expires_at", new Date().toISOString()),
    supabase.from("battle_logs").select("id", { count: "exact", head: true }).gte("created_at", todayISO),
    supabase.from("issue_votes").select("id", { count: "exact", head: true }).gte("created_at", todayISO),
    supabase.from("polls").select("id", { count: "exact", head: true }),
  ]);

  return { totalUsers, todayUsers, activeIssues, todayBattles, todayVotes, totalPolls };
}

function StatCard({ label, value, sub }: { label: string; value: number | null; sub?: string }) {
  return (
    <div style={{ background: "#ffffff", border: "1px solid #e5e8eb", borderRadius: 12, padding: "20px 24px" }}>
      <div style={{ fontSize: 13, color: "#8b95a1", fontWeight: 400, marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: "#191f28", letterSpacing: "-0.02em" }}>
        {(value ?? 0).toLocaleString()}
      </div>
      {sub && <div style={{ fontSize: 12, color: "#b0b8c1", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

export default async function AdminPage() {
  await requireAdmin();
  const stats = await getStats();

  return (
    <>
      <h1 style={{ margin: "0 0 24px", fontSize: 22, fontWeight: 700, color: "#191f28", letterSpacing: "-0.02em" }}>
        개요
      </h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
        <StatCard label="전체 가입자" value={stats.totalUsers} />
        <StatCard label="오늘 신규 가입" value={stats.todayUsers} sub="KST 기준" />
        <StatCard label="활성 이슈" value={stats.activeIssues} />
        <StatCard label="오늘 배틀" value={stats.todayBattles} sub="KST 기준" />
        <StatCard label="오늘 이슈 투표" value={stats.todayVotes} sub="KST 기준" />
        <StatCard label="전체 커뮤니티 투표" value={stats.totalPolls} />
      </div>
    </>
  );
}

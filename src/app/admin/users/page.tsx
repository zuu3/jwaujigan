import { requireAdmin } from "@/lib/admin";
import { createServiceRoleSupabaseClient } from "@/lib/supabase";
import { PointsForm } from "@/components/admin/points-form";
import { UserSearch } from "@/components/admin/user-search";

async function getUsers(query?: string) {
  const supabase = createServiceRoleSupabaseClient();
  let req = supabase
    .from("users")
    .select("id, email, name, points, created_at")
    .order("created_at", { ascending: false });

  if (query) {
    req = req.or(`email.ilike.%${query}%,name.ilike.%${query}%`);
  }

  const { data } = await req.limit(50);
  return data ?? [];
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

type SearchParams = Promise<{ q?: string }>;

export default async function AdminUsersPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();
  const { q } = await searchParams;
  const users = await getUsers(q);

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#191f28", letterSpacing: "-0.02em" }}>사용자 관리</h1>
        <span style={{ fontSize: 13, color: "#8b95a1" }}>최근 50명</span>
      </div>

      <UserSearch defaultValue={q ?? ""} />

      <PointsForm users={users.map((u) => ({ id: u.id, email: u.email, name: u.name }))} />

      <div style={{ background: "#ffffff", border: "1px solid #e5e8eb", borderRadius: 12, overflow: "hidden", marginTop: 16 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e8eb" }}>
              <th style={{ padding: "12px 16px", textAlign: "left", color: "#6b7684", fontWeight: 600 }}>이름</th>
              <th style={{ padding: "12px 16px", textAlign: "left", color: "#6b7684", fontWeight: 600 }}>이메일</th>
              <th style={{ padding: "12px 16px", textAlign: "left", color: "#6b7684", fontWeight: 600, whiteSpace: "nowrap" }}>UUID</th>
              <th style={{ padding: "12px 16px", textAlign: "right", color: "#6b7684", fontWeight: 600, whiteSpace: "nowrap" }}>포인트</th>
              <th style={{ padding: "12px 16px", textAlign: "left", color: "#6b7684", fontWeight: 600, whiteSpace: "nowrap" }}>가입일</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} style={{ borderBottom: "1px solid #f2f4f6" }}>
                <td style={{ padding: "12px 16px", color: "#191f28", fontWeight: 500 }}>
                  {user.name ?? "—"}
                </td>
                <td style={{ padding: "12px 16px", color: "#6b7684" }}>
                  {user.email}
                </td>
                <td style={{ padding: "12px 16px", color: "#8b95a1", fontFamily: "monospace", fontSize: 11, whiteSpace: "nowrap" }}>
                  {user.id}
                </td>
                <td style={{ padding: "12px 16px", color: "#191f28", fontWeight: 600, textAlign: "right" }}>
                  {(user.points ?? 0).toLocaleString()}
                </td>
                <td style={{ padding: "12px 16px", color: "#8b95a1", whiteSpace: "nowrap" }}>
                  {formatDate(user.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <div style={{ padding: 40, textAlign: "center", color: "#8b95a1", fontSize: 14 }}>
            {q ? `"${q}"에 해당하는 사용자가 없습니다.` : "사용자가 없습니다."}
          </div>
        )}
      </div>
    </>
  );
}

import { requireAdmin } from "@/lib/admin";
import { createServiceRoleSupabaseClient } from "@/lib/supabase";
import { IssueActions } from "@/components/admin/issue-actions";

async function getIssues() {
  const supabase = createServiceRoleSupabaseClient();
  const { data } = await supabase
    .from("issues")
    .select("id, title, bill_id, published_at, expires_at, created_at")
    .order("created_at", { ascending: false })
    .limit(50);
  return data ?? [];
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function isExpired(expiresAt: string) {
  return new Date(expiresAt) < new Date();
}

export default async function AdminIssuesPage() {
  await requireAdmin();
  const issues = await getIssues();

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#191f28", letterSpacing: "-0.02em" }}>이슈 관리</h1>
        <IssueActions />
      </div>

      <div style={{ background: "#ffffff", border: "1px solid #e5e8eb", borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e8eb" }}>
              <th style={{ padding: "12px 16px", textAlign: "left", color: "#6b7684", fontWeight: 600 }}>제목</th>
              <th style={{ padding: "12px 16px", textAlign: "left", color: "#6b7684", fontWeight: 600, whiteSpace: "nowrap" }}>등록일</th>
              <th style={{ padding: "12px 16px", textAlign: "left", color: "#6b7684", fontWeight: 600, whiteSpace: "nowrap" }}>만료일</th>
              <th style={{ padding: "12px 16px", textAlign: "left", color: "#6b7684", fontWeight: 600, whiteSpace: "nowrap" }}>상태</th>
              <th style={{ padding: "12px 16px", textAlign: "left", color: "#6b7684", fontWeight: 600 }}>작업</th>
            </tr>
          </thead>
          <tbody>
            {issues.map((issue) => {
              const expired = isExpired(issue.expires_at);
              return (
                <tr key={issue.id} style={{ borderBottom: "1px solid #f2f4f6" }}>
                  <td style={{ padding: "12px 16px", color: "#191f28", maxWidth: 400 }}>
                    <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {issue.title}
                    </div>
                    {issue.bill_id && (
                      <div style={{ fontSize: 11, color: "#b0b8c1", marginTop: 2 }}>{issue.bill_id}</div>
                    )}
                  </td>
                  <td style={{ padding: "12px 16px", color: "#8b95a1", whiteSpace: "nowrap" }}>
                    {formatDate(issue.created_at)}
                  </td>
                  <td style={{ padding: "12px 16px", color: "#8b95a1", whiteSpace: "nowrap" }}>
                    {formatDate(issue.expires_at)}
                  </td>
                  <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                    <span style={{
                      display: "inline-block",
                      padding: "2px 8px",
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 600,
                      background: expired ? "#f2f4f6" : "#e8f3ff",
                      color: expired ? "#8b95a1" : "#3182f6",
                    }}>
                      {expired ? "만료" : "활성"}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <IssueActions issueId={issue.id} expired={expired} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {issues.length === 0 && (
          <div style={{ padding: 40, textAlign: "center", color: "#8b95a1", fontSize: 14 }}>
            이슈가 없습니다.
          </div>
        )}
      </div>
    </>
  );
}

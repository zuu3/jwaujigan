import { requireAdmin } from "@/lib/admin";
import { createServiceRoleSupabaseClient } from "@/lib/supabase";
import { ReportActions } from "@/components/admin/report-actions";
import Link from "next/link";

type Tab = "pending" | "dismissed";

async function getReports(status: Tab) {
  const supabase = createServiceRoleSupabaseClient();
  const { data } = await supabase
    .from("reports" as "users")
    .select("*")
    .eq("status", status)
    .order("created_at", { ascending: false })
    .limit(100) as unknown as { data: Report[] | null };
  return data ?? [];
}

async function getCommentContents(ids: string[]) {
  if (ids.length === 0) return {};
  const supabase = createServiceRoleSupabaseClient();
  const { data } = await supabase
    .from("poll_comments")
    .select("id, content, poll_id")
    .in("id", ids);
  const map: Record<string, { content: string; poll_id: string }> = {};
  for (const row of data ?? []) {
    map[row.id] = { content: row.content, poll_id: row.poll_id };
  }
  return map;
}

type Report = {
  id: string;
  reporter_id: string;
  target_type: string;
  target_id: string;
  reason: string;
  detail: string | null;
  status: string;
  created_at: string;
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  await requireAdmin();
  const { tab } = await searchParams;
  const activeTab: Tab = tab === "dismissed" ? "dismissed" : "pending";

  const reports = await getReports(activeTab);
  const commentMap = await getCommentContents(
    reports.filter((r) => r.target_type === "comment").map((r) => r.target_id)
  );

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#191f28", letterSpacing: "-0.02em" }}>신고 관리</h1>
      </div>

      <div style={{ display: "flex", gap: 2, marginBottom: 16, background: "#f2f4f6", borderRadius: 8, padding: 3, width: "fit-content" }}>
        {([["pending", "대기 중"], ["dismissed", "처리됨"]] as const).map(([value, label]) => (
          <Link
            key={value}
            href={`/admin/reports${value === "pending" ? "" : "?tab=dismissed"}`}
            style={{
              padding: "6px 16px",
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
              background: activeTab === value ? "#ffffff" : "transparent",
              color: activeTab === value ? "#191f28" : "#8b95a1",
              boxShadow: activeTab === value ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
              transition: "all 120ms",
            }}
          >
            {label}
          </Link>
        ))}
      </div>

      <div style={{ background: "#ffffff", border: "1px solid #e5e8eb", borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e8eb" }}>
              <th style={{ padding: "12px 16px", textAlign: "left", color: "#6b7684", fontWeight: 600 }}>신고된 댓글</th>
              <th style={{ padding: "12px 16px", textAlign: "left", color: "#6b7684", fontWeight: 600, whiteSpace: "nowrap" }}>사유</th>
              <th style={{ padding: "12px 16px", textAlign: "left", color: "#6b7684", fontWeight: 600, whiteSpace: "nowrap" }}>신고일</th>
              {activeTab === "pending" && (
                <th style={{ padding: "12px 16px", textAlign: "left", color: "#6b7684", fontWeight: 600 }}>처리</th>
              )}
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => {
              const comment = commentMap[report.target_id];
              return (
                <tr key={report.id} style={{ borderBottom: "1px solid #f2f4f6" }}>
                  <td style={{ padding: "12px 16px", maxWidth: 400 }}>
                    {comment ? (
                      <>
                        <div style={{ color: "#191f28", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {comment.content}
                        </div>
                        <div style={{ fontSize: 11, color: "#b0b8c1", marginTop: 2, fontFamily: "monospace" }}>
                          {report.target_id}
                        </div>
                      </>
                    ) : (
                      <span style={{ color: "#b0b8c1", fontStyle: "italic" }}>삭제된 댓글</span>
                    )}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{
                      padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600,
                      background: "#fef2f2", color: "#e5484d", whiteSpace: "nowrap",
                    }}>
                      {report.reason}
                    </span>
                    {report.detail && (
                      <div style={{ fontSize: 12, color: "#6b7684", marginTop: 4, maxWidth: 200 }}>
                        {report.detail}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "12px 16px", color: "#8b95a1", whiteSpace: "nowrap" }}>
                    {formatDate(report.created_at)}
                  </td>
                  {activeTab === "pending" && (
                    <td style={{ padding: "12px 16px" }}>
                      <ReportActions
                        reportId={report.id}
                        commentId={report.target_type === "comment" ? report.target_id : null}
                      />
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
        {reports.length === 0 && (
          <div style={{ padding: 40, textAlign: "center", color: "#8b95a1", fontSize: 14 }}>
            {activeTab === "pending" ? "처리 대기 중인 신고가 없습니다." : "처리된 신고 내역이 없습니다."}
          </div>
        )}
      </div>
    </>
  );
}

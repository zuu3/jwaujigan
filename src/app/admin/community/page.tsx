import { requireAdmin } from "@/lib/admin";
import { createServiceRoleSupabaseClient } from "@/lib/supabase";
import { DeleteAction } from "@/components/admin/delete-action";
import Link from "next/link";

async function getPolls() {
  const supabase = createServiceRoleSupabaseClient();
  const { data } = await supabase
    .from("polls")
    .select("id, question, user_id, expires_at, created_at")
    .order("created_at", { ascending: false })
    .limit(50);
  return data ?? [];
}

async function getCommentCounts() {
  const supabase = createServiceRoleSupabaseClient();
  const { data } = await supabase
    .from("poll_comments")
    .select("poll_id");
  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    counts[row.poll_id] = (counts[row.poll_id] ?? 0) + 1;
  }
  return counts;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function isExpired(expiresAt: string) {
  return new Date(expiresAt) < new Date();
}

export default async function AdminCommunityPage() {
  await requireAdmin();
  const [polls, commentCounts] = await Promise.all([getPolls(), getCommentCounts()]);

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#191f28", letterSpacing: "-0.02em" }}>커뮤니티 관리</h1>
        <span style={{ fontSize: 13, color: "#8b95a1" }}>최근 50개</span>
      </div>

      <div style={{ background: "#ffffff", border: "1px solid #e5e8eb", borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e8eb" }}>
              <th style={{ padding: "12px 16px", textAlign: "left", color: "#6b7684", fontWeight: 600 }}>질문</th>
              <th style={{ padding: "12px 16px", textAlign: "right", color: "#6b7684", fontWeight: 600, whiteSpace: "nowrap" }}>댓글</th>
              <th style={{ padding: "12px 16px", textAlign: "left", color: "#6b7684", fontWeight: 600, whiteSpace: "nowrap" }}>등록일</th>
              <th style={{ padding: "12px 16px", textAlign: "left", color: "#6b7684", fontWeight: 600, whiteSpace: "nowrap" }}>상태</th>
              <th style={{ padding: "12px 16px", textAlign: "left", color: "#6b7684", fontWeight: 600 }}>작업</th>
            </tr>
          </thead>
          <tbody>
            {polls.map((poll) => (
              <tr key={poll.id} style={{ borderBottom: "1px solid #f2f4f6" }}>
                <td style={{ padding: "12px 16px", maxWidth: 400 }}>
                  <Link
                    href={`/admin/community/${poll.id}`}
                    style={{ color: "#191f28", textDecoration: "none", fontWeight: 500 }}
                  >
                    <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {poll.question}
                    </div>
                    <div style={{ fontSize: 11, color: "#b0b8c1", marginTop: 2, fontFamily: "monospace" }}>
                      {poll.id}
                    </div>
                  </Link>
                </td>
                <td style={{ padding: "12px 16px", color: "#6b7684", textAlign: "right", fontWeight: 600 }}>
                  {commentCounts[poll.id] ?? 0}
                </td>
                <td style={{ padding: "12px 16px", color: "#8b95a1", whiteSpace: "nowrap" }}>{formatDate(poll.created_at)}</td>
                <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                  <span style={{
                    display: "inline-block", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600,
                    background: isExpired(poll.expires_at) ? "#f2f4f6" : "#e8f3ff",
                    color: isExpired(poll.expires_at) ? "#8b95a1" : "#3182f6",
                  }}>
                    {isExpired(poll.expires_at) ? "만료" : "활성"}
                  </span>
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <DeleteAction target="poll" id={poll.id} redirectTo="/admin/community" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {polls.length === 0 && (
          <div style={{ padding: 40, textAlign: "center", color: "#8b95a1", fontSize: 14 }}>투표가 없습니다.</div>
        )}
      </div>
    </>
  );
}

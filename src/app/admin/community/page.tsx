import { requireAdmin } from "@/lib/admin";
import { createServiceRoleSupabaseClient } from "@/lib/supabase";
import { DeleteAction } from "@/components/admin/delete-action";

async function getPolls() {
  const supabase = createServiceRoleSupabaseClient();
  const { data } = await supabase
    .from("polls")
    .select("id, question, user_id, expires_at, created_at")
    .order("created_at", { ascending: false })
    .limit(50);
  return data ?? [];
}

async function getComments() {
  const supabase = createServiceRoleSupabaseClient();
  const { data } = await supabase
    .from("poll_comments")
    .select("id, content, user_id, poll_id, parent_id, created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  return data ?? [];
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
  const [polls, comments] = await Promise.all([getPolls(), getComments()]);

  return (
    <>
      <h1 style={{ margin: "0 0 32px", fontSize: 22, fontWeight: 700, color: "#191f28", letterSpacing: "-0.02em" }}>
        커뮤니티 관리
      </h1>

      {/* 투표 목록 */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: "#191f28" }}>
          민심투표 <span style={{ fontSize: 13, fontWeight: 400, color: "#8b95a1" }}>최근 50개</span>
        </h2>
        <div style={{ background: "#ffffff", border: "1px solid #e5e8eb", borderRadius: 12, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e8eb" }}>
                <th style={{ padding: "12px 16px", textAlign: "left", color: "#6b7684", fontWeight: 600 }}>질문</th>
                <th style={{ padding: "12px 16px", textAlign: "left", color: "#6b7684", fontWeight: 600, whiteSpace: "nowrap" }}>작성자 ID</th>
                <th style={{ padding: "12px 16px", textAlign: "left", color: "#6b7684", fontWeight: 600, whiteSpace: "nowrap" }}>등록일</th>
                <th style={{ padding: "12px 16px", textAlign: "left", color: "#6b7684", fontWeight: 600, whiteSpace: "nowrap" }}>상태</th>
                <th style={{ padding: "12px 16px", textAlign: "left", color: "#6b7684", fontWeight: 600 }}>작업</th>
              </tr>
            </thead>
            <tbody>
              {polls.map((poll) => (
                <tr key={poll.id} style={{ borderBottom: "1px solid #f2f4f6" }}>
                  <td style={{ padding: "12px 16px", color: "#191f28", maxWidth: 400 }}>
                    <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{poll.question}</div>
                    <div style={{ fontSize: 11, color: "#b0b8c1", marginTop: 2, fontFamily: "monospace" }}>{poll.id}</div>
                  </td>
                  <td style={{ padding: "12px 16px", color: "#8b95a1", fontFamily: "monospace", fontSize: 11, whiteSpace: "nowrap" }}>
                    {poll.user_id.slice(0, 8)}…
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
                    <DeleteAction target="poll" id={poll.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {polls.length === 0 && (
            <div style={{ padding: 40, textAlign: "center", color: "#8b95a1", fontSize: 14 }}>투표가 없습니다.</div>
          )}
        </div>
      </section>

      {/* 댓글 목록 */}
      <section>
        <h2 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: "#191f28" }}>
          댓글 <span style={{ fontSize: 13, fontWeight: 400, color: "#8b95a1" }}>최근 100개</span>
        </h2>
        <div style={{ background: "#ffffff", border: "1px solid #e5e8eb", borderRadius: 12, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e8eb" }}>
                <th style={{ padding: "12px 16px", textAlign: "left", color: "#6b7684", fontWeight: 600 }}>내용</th>
                <th style={{ padding: "12px 16px", textAlign: "left", color: "#6b7684", fontWeight: 600, whiteSpace: "nowrap" }}>작성자 ID</th>
                <th style={{ padding: "12px 16px", textAlign: "left", color: "#6b7684", fontWeight: 600, whiteSpace: "nowrap" }}>대댓글</th>
                <th style={{ padding: "12px 16px", textAlign: "left", color: "#6b7684", fontWeight: 600, whiteSpace: "nowrap" }}>등록일</th>
                <th style={{ padding: "12px 16px", textAlign: "left", color: "#6b7684", fontWeight: 600 }}>작업</th>
              </tr>
            </thead>
            <tbody>
              {comments.map((comment) => (
                <tr key={comment.id} style={{ borderBottom: "1px solid #f2f4f6" }}>
                  <td style={{ padding: "12px 16px", color: "#191f28", maxWidth: 360 }}>
                    <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{comment.content}</div>
                    <div style={{ fontSize: 11, color: "#b0b8c1", marginTop: 2, fontFamily: "monospace" }}>
                      poll: {comment.poll_id.slice(0, 8)}…
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px", color: "#8b95a1", fontFamily: "monospace", fontSize: 11, whiteSpace: "nowrap" }}>
                    {comment.user_id.slice(0, 8)}…
                  </td>
                  <td style={{ padding: "12px 16px", color: "#8b95a1", fontSize: 11 }}>
                    {comment.parent_id ? "대댓글" : "—"}
                  </td>
                  <td style={{ padding: "12px 16px", color: "#8b95a1", whiteSpace: "nowrap" }}>{formatDate(comment.created_at)}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <DeleteAction target="comment" id={comment.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {comments.length === 0 && (
            <div style={{ padding: 40, textAlign: "center", color: "#8b95a1", fontSize: 14 }}>댓글이 없습니다.</div>
          )}
        </div>
      </section>
    </>
  );
}

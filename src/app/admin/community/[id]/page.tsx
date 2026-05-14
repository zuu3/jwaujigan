import { requireAdmin } from "@/lib/admin";
import { createServiceRoleSupabaseClient } from "@/lib/supabase";
import { DeleteAction } from "@/components/admin/delete-action";
import Link from "next/link";
import { notFound } from "next/navigation";

async function getPoll(id: string) {
  const supabase = createServiceRoleSupabaseClient();
  const { data } = await supabase
    .from("polls")
    .select("id, question, options, user_id, expires_at, created_at")
    .eq("id", id)
    .maybeSingle();
  return data;
}

async function getComments(pollId: string) {
  const supabase = createServiceRoleSupabaseClient();
  const { data } = await supabase
    .from("poll_comments")
    .select("id, content, user_id, parent_id, created_at")
    .eq("poll_id", pollId)
    .order("created_at", { ascending: true });
  return data ?? [];
}

async function getVoteCounts(pollId: string) {
  const supabase = createServiceRoleSupabaseClient();
  const { data } = await supabase
    .from("poll_votes")
    .select("option_id")
    .eq("poll_id", pollId);

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    counts[row.option_id] = (counts[row.option_id] ?? 0) + 1;
  }
  return counts;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function isExpired(expiresAt: string) {
  return new Date(expiresAt) < new Date();
}

type Params = Promise<{ id: string }>;

export default async function AdminCommunityDetailPage({ params }: { params: Params }) {
  await requireAdmin();
  const { id } = await params;
  const [poll, comments, voteCounts] = await Promise.all([getPoll(id), getComments(id), getVoteCounts(id)]);

  if (!poll) notFound();

  const options = poll.options as { id: string; text: string }[];
  const totalVotes = Object.values(voteCounts).reduce((a, b) => a + b, 0);

  const rootComments = comments.filter((c) => !c.parent_id);
  const replies = comments.filter((c) => c.parent_id);

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <Link
          href="/admin/community"
          style={{ fontSize: 13, color: "#8b95a1", textDecoration: "none" }}
        >
          ← 커뮤니티 목록
        </Link>
      </div>

      {/* 투표 정보 */}
      <div style={{ background: "#ffffff", border: "1px solid #e5e8eb", borderRadius: 12, padding: 24, marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#191f28", letterSpacing: "-0.01em", marginBottom: 6 }}>
              {poll.question}
            </div>
            <div style={{ display: "flex", gap: 12, fontSize: 12, color: "#8b95a1" }}>
              <span>등록: {formatDate(poll.created_at)}</span>
              <span>만료: {formatDate(poll.expires_at)}</span>
              <span style={{
                padding: "1px 6px", borderRadius: 4, fontWeight: 600,
                background: isExpired(poll.expires_at) ? "#f2f4f6" : "#e8f3ff",
                color: isExpired(poll.expires_at) ? "#8b95a1" : "#3182f6",
              }}>
                {isExpired(poll.expires_at) ? "만료" : "활성"}
              </span>
            </div>
            <div style={{ fontSize: 11, color: "#b0b8c1", fontFamily: "monospace", marginTop: 4 }}>{poll.id}</div>
          </div>
          <DeleteAction target="poll" id={poll.id} redirectTo="/admin/community" />
        </div>

        {/* 선택지 + 투표 현황 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {options.map((opt) => {
            const count = voteCounts[opt.id] ?? 0;
            const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
            return (
              <div key={opt.id}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#4e5968", marginBottom: 4 }}>
                  <span>{opt.text}</span>
                  <span style={{ color: "#6b7684", fontWeight: 600 }}>{count}표 ({pct}%)</span>
                </div>
                <div style={{ height: 6, background: "#f2f4f6", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: "#3182f6", borderRadius: 3, transition: "width 300ms" }} />
                </div>
              </div>
            );
          })}
          <div style={{ fontSize: 12, color: "#8b95a1", marginTop: 4 }}>총 {totalVotes}표</div>
        </div>
      </div>

      {/* 댓글 */}
      <div style={{ background: "#ffffff", border: "1px solid #e5e8eb", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f2f4f6", fontSize: 14, fontWeight: 600, color: "#191f28" }}>
          댓글 {comments.length}개
        </div>
        {rootComments.length === 0 && (
          <div style={{ padding: 40, textAlign: "center", color: "#8b95a1", fontSize: 14 }}>댓글이 없습니다.</div>
        )}
        {rootComments.map((comment) => {
          const children = replies.filter((r) => r.parent_id === comment.id);
          return (
            <div key={comment.id} style={{ borderBottom: "1px solid #f2f4f6" }}>
              {/* 루트 댓글 */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, padding: "14px 20px" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: "#191f28", lineHeight: 1.6 }}>{comment.content}</div>
                  <div style={{ display: "flex", gap: 10, fontSize: 11, color: "#b0b8c1", marginTop: 4, fontFamily: "monospace" }}>
                    <span>{comment.user_id.slice(0, 8)}…</span>
                    <span>{formatDate(comment.created_at)}</span>
                  </div>
                </div>
                <DeleteAction target="comment" id={comment.id} />
              </div>
              {/* 대댓글 */}
              {children.map((reply) => (
                <div
                  key={reply.id}
                  style={{
                    display: "flex", alignItems: "flex-start", justifyContent: "space-between",
                    gap: 12, padding: "12px 20px 12px 44px",
                    background: "#f9fafb", borderTop: "1px solid #f2f4f6",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: "#4e5968", lineHeight: 1.6 }}>{reply.content}</div>
                    <div style={{ display: "flex", gap: 10, fontSize: 11, color: "#b0b8c1", marginTop: 4, fontFamily: "monospace" }}>
                      <span>{reply.user_id.slice(0, 8)}…</span>
                      <span>{formatDate(reply.created_at)}</span>
                    </div>
                  </div>
                  <DeleteAction target="comment" id={reply.id} />
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </>
  );
}

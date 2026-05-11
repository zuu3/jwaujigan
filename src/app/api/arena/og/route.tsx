import { ImageResponse } from "next/og";
import { createServiceRoleSupabaseClient } from "@/lib/supabase";
import { getCachedArenaBattle } from "@/lib/arena";

export const runtime = "nodejs";

function pct(count: number, total: number) {
  if (total === 0) return 0;
  return Math.round((count / total) * 100);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const issueId = searchParams.get("issueId");

  if (!issueId) {
    return new Response("Missing issueId", { status: 400 });
  }

  const supabase = createServiceRoleSupabaseClient();

  const [issueResult, cachedBattle, verdictResult] = await Promise.all([
    supabase.from("issues").select("title, summary").eq("id", issueId).single(),
    getCachedArenaBattle(issueId),
    supabase
      .from("verdict_vote_counts")
      .select("progressive, conservative, draw, total")
      .eq("issue_id", issueId)
      .maybeSingle(),
  ]);

  const issue = issueResult.data;
  const verdictCounts = verdictResult.data;
  const winner = cachedBattle?.result.winner ?? null;

  const winnerLabel =
    winner === "progressive"
      ? "진보 AI 우세"
      : winner === "conservative"
        ? "보수 AI 우세"
        : winner === "draw"
          ? "팽팽한 승부"
          : "AI 배틀 진행 중";

  const winnerColor =
    winner === "progressive"
      ? "#3182f6"
      : winner === "conservative"
        ? "#e5484d"
        : "#4e5968";

  const progressivePct = verdictCounts
    ? pct(verdictCounts.progressive, verdictCounts.total)
    : null;
  const conservativePct = verdictCounts
    ? pct(verdictCounts.conservative, verdictCounts.total)
    : null;
  const drawPct = verdictCounts
    ? pct(verdictCounts.draw, verdictCounts.total)
    : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: "#ffffff",
          display: "flex",
          flexDirection: "column",
          fontFamily: "sans-serif",
          padding: "56px 64px",
          gap: 0,
        }}
      >
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 32 }}>
          <div style={{ display: "flex", fontSize: 18, fontWeight: 700, color: "#3182f6", letterSpacing: "-0.03em" }}>
            좌우지간
          </div>
          <div style={{ display: "flex", fontSize: 14, color: "#8b95a1" }}>AI 배틀 결과</div>
        </div>

        {/* Title */}
        <div style={{ display: "flex", fontSize: 34, fontWeight: 700, color: "#191f28", lineHeight: 1.35, letterSpacing: "-0.02em", marginBottom: 12, maxWidth: 900 }}>
          {issue?.title ?? "이슈 배틀"}
        </div>

        {/* Summary */}
        <div style={{ display: "flex", fontSize: 18, color: "#6b7684", lineHeight: 1.6, marginBottom: 40, maxWidth: 800 }}>
          {issue?.summary ?? ""}
        </div>

        {/* Winner Banner */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            alignSelf: "flex-start",
            gap: 12,
            background: winnerColor + "14",
            border: `2px solid ${winnerColor}28`,
            borderRadius: 12,
            padding: "16px 24px",
            marginBottom: 32,
          }}
        >
          <div style={{ display: "flex", fontSize: 13, fontWeight: 600, color: winnerColor, letterSpacing: "0.04em" }}>
            AI 판정
          </div>
          <div style={{ display: "flex", width: 1, height: 16, background: winnerColor + "40" }} />
          <div style={{ display: "flex", fontSize: 22, fontWeight: 700, color: winnerColor }}>
            {winnerLabel}
          </div>
        </div>

        {/* Verdict Bars */}
        {verdictCounts && verdictCounts.total > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
            <div style={{ display: "flex", fontSize: 13, fontWeight: 600, color: "#8b95a1", marginBottom: 4 }}>
              시청자 판정 · {verdictCounts.total}명 참여
            </div>
            {[
              { label: "진보 AI", pct: progressivePct ?? 0, color: "#3182f6" },
              { label: "무승부", pct: drawPct ?? 0, color: "#4e5968" },
              { label: "보수 AI", pct: conservativePct ?? 0, color: "#e5484d" },
            ].map(({ label, pct: p, color }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ display: "flex", width: 48, fontSize: 13, fontWeight: 600, color }}>{label}</div>
                <div style={{ display: "flex", flex: 1, height: 8, background: "#f2f4f6", borderRadius: 9999, overflow: "hidden" }}>
                  <div style={{ display: "flex", width: `${p}%`, height: "100%", background: color, borderRadius: 9999 }} />
                </div>
                <div style={{ display: "flex", width: 36, fontSize: 14, fontWeight: 700, color }}>{p}%</div>
              </div>
            ))}
          </div>
        ) : null}

        {/* Footer */}
        <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ display: "flex", fontSize: 13, color: "#b0b8c1" }}>선동 없는 정치 정보</div>
          <div style={{ display: "flex", fontSize: 13, color: "#b0b8c1" }}>jwj.zuu3.kr</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}

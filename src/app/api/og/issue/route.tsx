import { ImageResponse } from "next/og";
import { createServiceRoleSupabaseClient } from "@/lib/supabase";

export const runtime = "nodejs";

function pct(count: number, total: number) {
  if (total === 0) return 0;
  return Math.round((count / total) * 100);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new Response("Missing id", { status: 400 });
  }

  const supabase = createServiceRoleSupabaseClient();

  const [issueResult, voteResult] = await Promise.all([
    supabase
      .from("issues")
      .select("title, summary, progressive, conservative")
      .eq("id", id)
      .single(),
    supabase
      .from("issue_vote_counts")
      .select("progressive, conservative, neutral, total")
      .eq("issue_id", id)
      .maybeSingle(),
  ]);

  const issue = issueResult.data;
  const voteCounts = voteResult.data;

  const progressivePct = voteCounts && voteCounts.total > 0
    ? pct(voteCounts.progressive, voteCounts.total)
    : null;
  const conservativePct = voteCounts && voteCounts.total > 0
    ? pct(voteCounts.conservative, voteCounts.total)
    : null;
  const neutralPct = voteCounts && voteCounts.total > 0
    ? pct(voteCounts.neutral, voteCounts.total)
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
        }}
      >
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32 }}>
          <div style={{ display: "flex", fontSize: 18, fontWeight: 700, color: "#3182f6", letterSpacing: "-0.03em" }}>
            좌우지간
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 12,
              fontWeight: 600,
              color: "#3182f6",
              background: "#e8f3ff",
              borderRadius: 4,
              padding: "3px 8px",
            }}
          >
            이슈 분석
          </div>
        </div>

        {/* Title */}
        <div
          style={{
            display: "flex",
            fontSize: 34,
            fontWeight: 700,
            color: "#191f28",
            lineHeight: 1.35,
            letterSpacing: "-0.02em",
            marginBottom: 14,
            maxWidth: 960,
          }}
        >
          {issue?.title ?? "이슈"}
        </div>

        {/* Summary */}
        <div
          style={{
            display: "flex",
            fontSize: 18,
            color: "#6b7684",
            lineHeight: 1.6,
            marginBottom: 40,
            maxWidth: 840,
          }}
        >
          {issue?.summary ?? ""}
        </div>

        {/* Vote bars — only if data exists */}
        {progressivePct !== null && conservativePct !== null && neutralPct !== null ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
            <div style={{ display: "flex", fontSize: 13, fontWeight: 600, color: "#8b95a1", marginBottom: 2 }}>
              사용자 의견 · {(voteCounts?.total ?? 0).toLocaleString()}명 참여
            </div>
            {[
              { label: "진보 지지", p: progressivePct, color: "#3182f6", tint: "#e8f3ff" },
              { label: "모르겠음",  p: neutralPct,      color: "#8b95a1", tint: "#f2f4f6" },
              { label: "보수 지지", p: conservativePct, color: "#e5484d", tint: "#fef2f2" },
            ].map(({ label, p, color, tint }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ display: "flex", width: 56, fontSize: 13, fontWeight: 600, color }}>{label}</div>
                <div
                  style={{
                    display: "flex",
                    flex: 1,
                    height: 8,
                    background: tint,
                    borderRadius: 9999,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      width: `${p}%`,
                      height: "100%",
                      background: color,
                      borderRadius: 9999,
                    }}
                  />
                </div>
                <div
                  style={{
                    display: "flex",
                    width: 36,
                    fontSize: 14,
                    fontWeight: 700,
                    color,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {p}%
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {/* Footer */}
        <div
          style={{
            marginTop: "auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
          }}
        >
          <div style={{ display: "flex", fontSize: 13, color: "#b0b8c1" }}>선동 없는 정치 정보</div>
          <div style={{ display: "flex", fontSize: 13, color: "#b0b8c1" }}>jwj.zuu3.kr</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}

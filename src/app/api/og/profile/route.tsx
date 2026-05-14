import { ImageResponse } from "next/og";
import { createServiceRoleSupabaseClient } from "@/lib/supabase";
import { getLevel } from "@/services/points/points";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return new Response("Missing userId", { status: 400 });
  }

  const supabase = createServiceRoleSupabaseClient();

  const [userResult, profileResult] = await Promise.all([
    supabase
      .from("users")
      .select("name, points")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("user_political_profiles")
      .select("economic_score, political_type")
      .eq("user_id", userId)
      .order("completed_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const user = userResult.data;
  const politicalProfile = profileResult.data;

  if (!user) {
    return new Response("Not found", { status: 404 });
  }

  const level = getLevel(user.points);
  const name = user.name ?? "사용자";

  // economic_score: -100 (진보) ~ +100 (보수)
  // spectrum bar: 0 (진보) ~ 100 (보수), center 50 = 중립
  const spectrumPct =
    politicalProfile != null
      ? Math.round((politicalProfile.economic_score + 100) / 2)
      : null;

  const progressiveColor = "#3182f6";
  const conservativeColor = "#e5484d";

  // Derive which side the needle sits on
  const isProgressive = spectrumPct != null && spectrumPct < 45;
  const isConservative = spectrumPct != null && spectrumPct > 55;
  const needleColor = isProgressive
    ? progressiveColor
    : isConservative
      ? conservativeColor
      : "#4e5968";

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
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 40 }}>
          <div style={{ display: "flex", fontSize: 18, fontWeight: 700, color: "#3182f6", letterSpacing: "-0.03em" }}>
            좌우지간
          </div>
          <div style={{ display: "flex", fontSize: 14, color: "#8b95a1" }}>정치 성향 프로필</div>
        </div>

        {/* Name + Level */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 40 }}>
          <div style={{ display: "flex", fontSize: 48, fontWeight: 700, color: "#191f28", letterSpacing: "-0.03em", lineHeight: 1.2 }}>
            {name}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                padding: "6px 16px",
                borderRadius: 9999,
                background: "#e8f3ff",
                fontSize: 18,
                fontWeight: 600,
                color: "#3182f6",
              }}
            >
              {level.title}
            </div>
            <div style={{ display: "flex", fontSize: 18, color: "#8b95a1" }}>
              {user.points.toLocaleString()}점
            </div>
          </div>
        </div>

        {/* Political type + Spectrum bar */}
        {politicalProfile ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 20,
              padding: "28px 32px",
              borderRadius: 16,
              border: "1px solid #e5e8eb",
              background: "#f9fafb",
              marginBottom: 32,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", fontSize: 22, fontWeight: 700, color: needleColor }}>
                {politicalProfile.political_type}
              </div>
              <div style={{ display: "flex", fontSize: 14, color: "#8b95a1" }}>경제 성향 스펙트럼</div>
            </div>

            {/* Bar */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div
                style={{
                  display: "flex",
                  position: "relative",
                  height: 16,
                  borderRadius: 9999,
                  overflow: "hidden",
                  background: `linear-gradient(to right, ${progressiveColor}40, #e5e8eb, ${conservativeColor}40)`,
                }}
              >
                {/* Filled progressive side */}
                <div
                  style={{
                    display: "flex",
                    position: "absolute",
                    top: 0,
                    left: 0,
                    height: "100%",
                    width: `${spectrumPct ?? 50}%`,
                    background:
                      spectrumPct != null && spectrumPct < 50
                        ? `${progressiveColor}80`
                        : `${conservativeColor}80`,
                    borderRadius: 9999,
                  }}
                />
                {/* Needle */}
                <div
                  style={{
                    display: "flex",
                    position: "absolute",
                    top: -2,
                    left: `${spectrumPct ?? 50}%`,
                    transform: "translateX(-50%)",
                    width: 6,
                    height: 20,
                    borderRadius: 3,
                    background: needleColor,
                  }}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div style={{ display: "flex", fontSize: 13, fontWeight: 600, color: progressiveColor }}>진보</div>
                <div style={{ display: "flex", fontSize: 13, fontWeight: 600, color: conservativeColor }}>보수</div>
              </div>
            </div>
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

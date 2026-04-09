import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "../../../auth";
import { ONBOARDING_SKIP_COOKIE } from "@/lib/onboarding";
import { getPoliticalProfileByUserId } from "@/lib/users";

export default async function HomePage() {
  const session = await auth();

  if (!session?.user?.email || !session.user.id) {
    redirect("/");
  }

  const [cookieStore, profile] = await Promise.all([
    cookies(),
    getPoliticalProfileByUserId(session.user.id),
  ]);

  const canSkipOnboarding =
    cookieStore.get(ONBOARDING_SKIP_COOKIE)?.value === "true";

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "32px 24px 64px",
        color: "#191f28",
        background: "#f8fbff",
      }}
    >
      <div style={{ width: "min(100%, 960px)", margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "16px",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <strong>좌우지간</strong>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <Link href="/">랜딩으로</Link>
            <Link href="/onboarding">테스트 다시 하기</Link>
          </div>
        </div>

        <section style={{ marginTop: "32px" }}>
          <p style={{ color: "#3182f6", fontWeight: 700 }}>
            {session.user.name ? `${session.user.name}님 환영합니다` : "환영합니다"}
          </p>
          <h1
            style={{
              margin: "12px 0 0",
              fontSize: "clamp(2rem, 5vw, 3.4rem)",
              lineHeight: 1.15,
              letterSpacing: "-0.06em",
            }}
          >
            정치 리터러시 홈
          </h1>
          <p style={{ marginTop: "16px", color: "#6b7684", lineHeight: 1.7 }}>
            로그인과 온보딩 이후 진입하는 기본 홈 화면입니다. 정치인 탐색과 AI
            아레나를 붙일 수 있는 기준 화면으로 두었습니다.
          </p>
        </section>

        <section
          style={{
            marginTop: "24px",
            display: "grid",
            gap: "16px",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          }}
        >
          <div
            style={{
              padding: "24px",
              borderRadius: "24px",
              background: "#ffffff",
              boxShadow: "0 18px 48px rgba(15, 23, 42, 0.05)",
            }}
          >
            <div style={{ color: "#6b7684", fontSize: "14px", fontWeight: 700 }}>
              이메일
            </div>
            <div style={{ marginTop: "8px", fontWeight: 700 }}>
              {session.user.email}
            </div>
          </div>

          <div
            style={{
              padding: "24px",
              borderRadius: "24px",
              background: "#ffffff",
              boxShadow: "0 18px 48px rgba(15, 23, 42, 0.05)",
            }}
          >
            <div style={{ color: "#6b7684", fontSize: "14px", fontWeight: 700 }}>
              지역구
            </div>
            <div style={{ marginTop: "8px", fontWeight: 700 }}>
              {session.user.district ?? "미설정"}
            </div>
          </div>

          <div
            style={{
              padding: "24px",
              borderRadius: "24px",
              background: "#ffffff",
              boxShadow: "0 18px 48px rgba(15, 23, 42, 0.05)",
            }}
          >
            <div style={{ color: "#6b7684", fontSize: "14px", fontWeight: 700 }}>
              정치 성향
            </div>
            <div style={{ marginTop: "8px", fontWeight: 700 }}>
              {profile?.political_type ??
                (canSkipOnboarding
                  ? "건너뛴 상태"
                  : "아직 테스트를 완료하지 않았습니다")}
            </div>
          </div>
        </section>

        {profile ? (
          <section
            style={{
              marginTop: "16px",
              display: "grid",
              gap: "16px",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            }}
          >
            {[
              ["경제", profile.economic_score],
              ["안보/외교", profile.security_score],
              ["사회", profile.social_score],
            ].map(([label, value]) => (
              <div
                key={label}
                style={{
                  padding: "24px",
                  borderRadius: "24px",
                  background: "#ffffff",
                  boxShadow: "0 18px 48px rgba(15, 23, 42, 0.05)",
                }}
              >
                <div style={{ color: "#6b7684", fontSize: "14px", fontWeight: 700 }}>
                  {label}
                </div>
                <div
                  style={{
                    marginTop: "8px",
                    fontSize: "32px",
                    fontWeight: 800,
                    letterSpacing: "-0.04em",
                  }}
                >
                  {value}
                </div>
              </div>
            ))}
          </section>
        ) : null}
      </div>
    </main>
  );
}

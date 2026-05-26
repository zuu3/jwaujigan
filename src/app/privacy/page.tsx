import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "개인정보처리방침",
};

const EFFECTIVE_DATE = "2026년 5월 26일";

export default function PrivacyPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#ffffff", padding: "0 0 80px" }}>
      <div style={{ width: "min(100%, 720px)", margin: "0 auto", padding: "48px 24px 0" }}>

        <Link
          href="/"
          style={{ display: "inline-block", marginBottom: 32, color: "#8b95a1", fontSize: 14, textDecoration: "none" }}
        >
          ← 좌우지간
        </Link>

        <h1 style={{ margin: "0 0 8px", fontSize: 26, fontWeight: 700, color: "#191f28", letterSpacing: "-0.02em" }}>
          개인정보처리방침
        </h1>
        <p style={{ margin: "0 0 48px", fontSize: 14, color: "#8b95a1" }}>
          시행일: {EFFECTIVE_DATE}
        </p>

        <Section title="1. 개인정보 수집 항목 및 목적">
          <p>좌우지간은 서비스 제공을 위해 아래 항목을 수집합니다.</p>
          <Table
            headers={["구분", "수집 항목", "수집 목적"]}
            rows={[
              ["필수", "이메일 주소, 이름, 프로필 사진", "Google 소셜 로그인 및 회원 식별"],
              ["선택", "지역구 정보", "지역 정치인 정보 제공"],
              ["선택", "정치 성향 테스트 응답 및 결과", "맞춤형 이슈·아레나 서비스 제공"],
              ["서비스 이용 중 생성", "이슈 투표 기록, 아레나 배틀 기록, 정치인 팔로우 정보, 커뮤니티 활동", "서비스 기능 제공 및 활동 이력 표시"],
            ]}
          />
        </Section>

        <Section title="2. 개인정보 보유 및 이용 기간">
          <p>수집된 개인정보는 <strong>회원 탈퇴 시까지</strong> 보유합니다.</p>
          <p>단, 관계 법령에 따라 보존이 필요한 경우 해당 기간 동안 별도 보관합니다.</p>
        </Section>

        <Section title="3. 개인정보 제3자 제공">
          <p>좌우지간은 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다.</p>
          <p>다만 아래 경우는 예외로 합니다.</p>
          <ul>
            <li>이용자가 사전에 동의한 경우</li>
            <li>법령에 의해 수사 목적으로 관계기관의 요구가 있는 경우</li>
          </ul>
        </Section>

        <Section title="4. 개인정보 처리 위탁">
          <Table
            headers={["수탁 업체", "위탁 업무"]}
            rows={[
              ["Google LLC", "소셜 로그인(OAuth 2.0) 인증"],
              ["Supabase Inc.", "데이터베이스 저장 및 관리"],
              ["Vercel Inc.", "서비스 호스팅"],
              ["Google LLC (Gemini API)", "이슈 분석·요약 콘텐츠 AI 생성"],
              ["DeepSeek (DeepSeek API)", "아레나 토론 AI 생성"],
              ["Sentry Inc.", "서비스 오류 모니터링"],
            ]}
          />
        </Section>

        <Section title="5. 이용자의 권리">
          <p>이용자는 언제든지 아래 권리를 행사할 수 있습니다.</p>
          <ul>
            <li>개인정보 열람 요청</li>
            <li>개인정보 수정·삭제 요청</li>
            <li>개인정보 처리 정지 요청</li>
            <li>회원 탈퇴 (마이페이지에서 직접 처리 가능)</li>
          </ul>
          <p>권리 행사는 아래 개인정보 보호책임자에게 이메일로 요청하실 수 있습니다.</p>
        </Section>

        <Section title="6. 쿠키 및 자동 수집 정보">
          <p>
            좌우지간은 로그인 상태 유지를 위해 세션 쿠키를 사용합니다.
            브라우저 설정에서 쿠키를 거부할 수 있으나, 이 경우 로그인이 제한될 수 있습니다.
          </p>
        </Section>

        <Section title="7. AI 생성 콘텐츠 안내">
          <p>
            좌우지간의 이슈 요약·진보·보수 분석은 Google Gemini API를 통해 생성되며, 아레나 토론은 DeepSeek API를 통해 생성됩니다.
            AI가 생성한 내용은 실제 특정 단체·개인의 공식 입장이 아니며, 정보 제공 목적으로만 활용됩니다.
          </p>
          <p>
            아레나 배틀에서 이용자가 직접 입력한 발언은 토론 맥락 생성을 위해 DeepSeek 서버로 전송됩니다.
            이름·이메일 등 식별 정보는 전송되지 않으며, 입력 내용은 AI 응답 생성 후 별도로 저장되지 않습니다.
          </p>
        </Section>

        <Section title="8. 개인정보 보호책임자">
          <Table
            headers={["항목", "내용"]}
            rows={[
              ["책임자", "좌우지간 운영팀"],
              ["이메일", "24.036@bssm.hs.kr"],
            ]}
          />
        </Section>

        <Section title="9. 방침 변경 안내">
          <p>
            이 방침은 {EFFECTIVE_DATE}부터 시행됩니다.
            내용이 변경될 경우 시행 7일 전에 서비스 내 공지사항을 통해 안내합니다.
          </p>
        </Section>

      </div>
    </main>
  );
}

/* ── Sub-components ──────────────────────────────────── */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 40 }}>
      <h2 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: "#191f28", letterSpacing: "-0.01em" }}>
        {title}
      </h2>
      <div style={{ fontSize: 14, color: "#4e5968", lineHeight: 1.8, display: "flex", flexDirection: "column", gap: 8 }}>
        {children}
      </div>
    </section>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div style={{ overflowX: "auto", marginTop: 8 }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr>
            {headers.map((h) => (
              <th
                key={h}
                style={{
                  padding: "10px 12px",
                  background: "#f2f4f6",
                  color: "#4e5968",
                  fontWeight: 600,
                  textAlign: "left",
                  borderBottom: "1px solid #e5e8eb",
                  whiteSpace: "nowrap",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td
                  key={j}
                  style={{
                    padding: "10px 12px",
                    color: "#4e5968",
                    borderBottom: "1px solid #f2f4f6",
                    verticalAlign: "top",
                    lineHeight: 1.6,
                  }}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

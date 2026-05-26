import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "이용약관",
};

const EFFECTIVE_DATE = "2026년 5월 26일";

export default function TermsPage() {
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
          이용약관
        </h1>
        <p style={{ margin: "0 0 48px", fontSize: 14, color: "#8b95a1" }}>
          시행일: {EFFECTIVE_DATE}
        </p>

        <Section title="제1조 목적">
          <p>
            이 약관은 좌우지간(이하 "서비스")이 제공하는 정치 정보 서비스 이용과 관련하여
            서비스와 이용자 간의 권리·의무 및 책임사항을 규정하는 것을 목적으로 합니다.
          </p>
        </Section>

        <Section title="제2조 서비스 정의">
          <p>서비스는 다음을 제공합니다.</p>
          <ul>
            <li>국회 법안을 진보·보수 두 시각으로 정리한 이슈 콘텐츠</li>
            <li>AI 기반 정치 토론 배틀(아레나)</li>
            <li>커뮤니티 민심투표</li>
            <li>정치인 정보 및 팔로우 기능</li>
          </ul>
        </Section>

        <Section title="제3조 이용 계약 체결">
          <p>
            이용자가 Google 소셜 로그인을 통해 회원가입을 완료하면 이 약관에 동의한 것으로 간주합니다.
            만 14세 미만은 서비스를 이용할 수 없습니다.
          </p>
        </Section>

        <Section title="제4조 서비스 이용">
          <p>이용자는 다음 행위를 하여서는 안 됩니다.</p>
          <ul>
            <li>타인의 정보를 도용하거나 허위 정보를 등록하는 행위</li>
            <li>서비스의 정상적인 운영을 방해하는 행위</li>
            <li>다른 이용자에게 혐오·차별적 표현을 사용하는 행위</li>
            <li>상업적 목적으로 서비스를 무단 이용하는 행위</li>
            <li>관련 법령을 위반하는 행위</li>
          </ul>
        </Section>

        <Section title="제5조 콘텐츠 및 AI 생성물">
          <p>
            서비스 내 이슈 요약·진보·보수 분석은 Google Gemini API를 통해 생성되며, 아레나 토론은 DeepSeek API를 통해 생성됩니다.
            AI 생성 콘텐츠는 정보 제공 목적으로만 제공되며, 특정 정치 성향을 지지하거나
            공식 입장을 대변하지 않습니다. 이용자는 AI 생성 콘텐츠를 최종 판단의 근거로
            단독 활용하여서는 안 됩니다.
          </p>
        </Section>

        <Section title="제6조 포인트 및 레벨">
          <p>
            서비스 내 포인트와 레벨은 이용 활동에 따라 부여되는 서비스 내부 수치입니다.
            포인트와 레벨은 현금 또는 재화로 교환할 수 없으며, 서비스 정책에 따라
            변경되거나 소멸될 수 있습니다.
          </p>
        </Section>

        <Section title="제7조 서비스 변경 및 중단">
          <p>
            서비스는 운영상·기술상 필요에 따라 서비스의 전부 또는 일부를 변경하거나
            중단할 수 있습니다. 이 경우 이용자에게 사전 공지합니다.
            다만, 불가피한 사유로 사전 공지가 어려운 경우 사후에 공지할 수 있습니다.
          </p>
        </Section>

        <Section title="제8조 면책">
          <p>서비스는 다음의 경우 책임을 지지 않습니다.</p>
          <ul>
            <li>천재지변 또는 서비스에 준하는 불가항력으로 인해 서비스를 제공할 수 없는 경우</li>
            <li>이용자의 귀책사유로 발생한 서비스 이용 장애</li>
            <li>AI 생성 콘텐츠의 정확성·완전성·신뢰성에 관한 사항</li>
            <li>이용자가 서비스를 통해 얻은 정보로 인한 손해</li>
          </ul>
        </Section>

        <Section title="제9조 준거법 및 분쟁 해결">
          <p>
            이 약관은 대한민국 법령에 따라 해석됩니다.
            서비스 이용과 관련하여 분쟁이 발생한 경우 관할 법원은 민사소송법에 따릅니다.
          </p>
        </Section>

        <Section title="제10조 약관 변경">
          <p>
            서비스는 필요한 경우 약관을 변경할 수 있습니다.
            변경 시 시행 7일 전에 서비스 내 공지사항을 통해 안내합니다.
            변경 후에도 계속 서비스를 이용하면 변경된 약관에 동의한 것으로 간주합니다.
          </p>
        </Section>

        <p style={{ marginTop: 48, fontSize: 13, color: "#8b95a1" }}>
          문의: <a href="mailto:24.036@bssm.hs.kr" style={{ color: "#3182f6", textDecoration: "none" }}>24.036@bssm.hs.kr</a>
        </p>

      </div>
    </main>
  );
}

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

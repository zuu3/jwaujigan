import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export type WeeklyDigestIssue = {
  id: string;
  title: string;
  summary: string;
  progressive: string;
  conservative: string;
  source_url: string | null;
};

type Props = {
  issues: WeeklyDigestIssue[];
  unsubscribeUrl: string;
  appUrl: string;
};

const BLUE = "#3182f6";
const RED = "#e5484d";
const CHARCOAL = "#191f28";
const GREY600 = "#6b7684";
const GREY500 = "#8b95a1";
const GREY200 = "#e5e8eb";
const BLUE50 = "#e8f3ff";
const RED_LIGHT = "#fef2f2";
const WHITE = "#ffffff";
const GREY100 = "#f2f4f6";

export default function WeeklyDigest({ issues, unsubscribeUrl, appUrl }: Props) {
  const previewText = `이번 주 주요 이슈 ${issues.length}개를 정리했습니다.`;

  return (
    <Html lang="ko">
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={body}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={logo}>좌우지간</Text>
            <Text style={logoSub}>선동 없는 정치 정보</Text>
          </Section>

          <Hr style={divider} />

          {/* Title */}
          <Section style={titleSection}>
            <Heading style={mainHeading}>이번 주 주요 이슈</Heading>
            <Text style={subText}>
              국회에서 다뤄지고 있는 법안을 진보·보수 관점으로 정리했습니다.
            </Text>
          </Section>

          {/* Issues */}
          {issues.map((issue, i) => (
            <Section key={issue.id} style={i > 0 ? { marginTop: "24px" } : {}}>
              <Section style={issueCard}>
                {/* Issue title */}
                <Text style={issueTitle}>{issue.title}</Text>
                <Text style={issueSummary}>{issue.summary}</Text>

                {/* Progressive */}
                <Section style={positionBlock(BLUE50)}>
                  <Text style={positionLabel(BLUE)}>진보 관점</Text>
                  <Text style={positionText}>{issue.progressive}</Text>
                </Section>

                {/* Conservative */}
                <Section style={positionBlock(RED_LIGHT)}>
                  <Text style={positionLabel(RED)}>보수 관점</Text>
                  <Text style={positionText}>{issue.conservative}</Text>
                </Section>

                {/* CTA */}
                <Section style={{ marginTop: "16px" }}>
                  <Button
                    href={`${appUrl}/issues/${issue.id}`}
                    style={ctaButton}
                  >
                    이슈 자세히 보기
                  </Button>
                </Section>
              </Section>
            </Section>
          ))}

          <Hr style={{ ...divider, marginTop: "32px" }} />

          {/* Footer */}
          <Section style={footer}>
            <Button href={appUrl} style={footerCta}>
              좌우지간 열기
            </Button>
            <Text style={footerText}>
              매주 월요일, 이번 주 주요 법안을 정리해 보내드립니다.
            </Text>
            <Text style={footerMeta}>
              <Link href={unsubscribeUrl} style={unsubLink}>
                구독 취소
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const body = {
  backgroundColor: GREY100,
  fontFamily: '"Apple SD Gothic Neo", "Noto Sans KR", sans-serif',
  margin: "0",
  padding: "0",
};

const container = {
  backgroundColor: WHITE,
  margin: "0 auto",
  maxWidth: "600px",
  padding: "0 0 32px",
};

const header = {
  backgroundColor: WHITE,
  padding: "32px 32px 20px",
  textAlign: "center" as const,
};

const logo = {
  color: CHARCOAL,
  fontSize: "22px",
  fontWeight: "700",
  margin: "0",
  letterSpacing: "-0.3px",
};

const logoSub = {
  color: GREY500,
  fontSize: "12px",
  fontWeight: "400",
  margin: "4px 0 0",
};

const divider = {
  borderColor: GREY200,
  borderTopWidth: "1px",
  margin: "0",
};

const titleSection = {
  padding: "24px 32px 16px",
};

const mainHeading = {
  color: CHARCOAL,
  fontSize: "20px",
  fontWeight: "700",
  margin: "0 0 8px",
  lineHeight: "28px",
};

const subText = {
  color: GREY600,
  fontSize: "14px",
  fontWeight: "400",
  margin: "0",
  lineHeight: "22px",
};

const issueCard = {
  border: `1px solid ${GREY200}`,
  borderRadius: "12px",
  margin: "0 32px",
  padding: "20px",
};

const issueTitle = {
  color: CHARCOAL,
  fontSize: "16px",
  fontWeight: "600",
  margin: "0 0 8px",
  lineHeight: "24px",
};

const issueSummary = {
  color: GREY600,
  fontSize: "14px",
  fontWeight: "400",
  margin: "0 0 16px",
  lineHeight: "22px",
};

const positionBlock = (bg: string) => ({
  backgroundColor: bg,
  borderRadius: "8px",
  marginBottom: "8px",
  padding: "12px 14px",
});

const positionLabel = (color: string) => ({
  color,
  fontSize: "12px",
  fontWeight: "600",
  margin: "0 0 4px",
  lineHeight: "18px",
});

const positionText = {
  color: CHARCOAL,
  fontSize: "13px",
  fontWeight: "400",
  margin: "0",
  lineHeight: "20px",
};

const ctaButton = {
  backgroundColor: BLUE,
  borderRadius: "8px",
  color: WHITE,
  display: "inline-block",
  fontSize: "14px",
  fontWeight: "600",
  padding: "10px 20px",
  textDecoration: "none",
};

const footer = {
  padding: "24px 32px 0",
  textAlign: "center" as const,
};

const footerCta = {
  backgroundColor: CHARCOAL,
  borderRadius: "8px",
  color: WHITE,
  display: "inline-block",
  fontSize: "14px",
  fontWeight: "600",
  padding: "10px 24px",
  textDecoration: "none",
  marginBottom: "16px",
};

const footerText = {
  color: GREY500,
  fontSize: "12px",
  fontWeight: "400",
  margin: "0 0 8px",
  lineHeight: "18px",
};

const footerMeta = {
  color: GREY500,
  fontSize: "12px",
  margin: "0",
};

const unsubLink = {
  color: GREY500,
  textDecoration: "underline",
};

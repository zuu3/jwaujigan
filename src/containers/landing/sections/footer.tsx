import Link from "next/link";
import styled from "@emotion/styled";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { Container } from "../shared";

type LandingFooterProps = {
  isAuthenticated: boolean;
};

export function LandingFooter({ isAuthenticated }: LandingFooterProps) {
  return (
    <Footer>
      {!isAuthenticated && (
        <CtaBand>
          <Container>
            <CtaHeading>지금 시작해보세요</CtaHeading>
            <CtaSub>선동 없는 정치 정보, 좌우지간</CtaSub>
            <CtaButton callbackUrl="/home" />
          </Container>
        </CtaBand>
      )}
      <FooterInner>
        <FooterBrand>좌우지간</FooterBrand>
        <FooterText>
          우리 동네 정치인부터 이슈 비교까지, 정치를 더 쉽게 보는 방법
        </FooterText>
        <FooterDisclaimer>
          AI 결과는 참고용 정보이며 최종 판단을 대신하지 않습니다.
        </FooterDisclaimer>
        <FooterLinks>
          <FooterLink href="/terms">이용약관</FooterLink>
          <FooterLink href="/privacy">개인정보처리방침</FooterLink>
        </FooterLinks>
      </FooterInner>
    </Footer>
  );
}

const CtaBand = styled.section`
  padding: 56px 24px;
  border-top: 1px solid var(--line);
  text-align: center;

  @media (max-width: 640px) {
    padding: 48px 20px;
  }
`;

const CtaHeading = styled.h2`
  margin: 0;
  color: var(--text);
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.03em;
`;

const CtaSub = styled.p`
  margin: 8px 0 24px;
  color: var(--sub);
  font-size: 15px;
  font-weight: 400;
  letter-spacing: -0.01em;
`;

const CtaButton = styled(GoogleSignInButton)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 28px;
  background: #191f28;
  color: #ffffff;
  font-size: 15px;
  font-weight: 600;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  letter-spacing: -0.01em;
  transition: opacity 120ms;

  &:hover {
    opacity: 0.85;
  }
`;

const Footer = styled.footer`
  padding: 0 24px 40px;

  @media (max-width: 640px) {
    padding: 0 20px 32px;
  }
`;

const FooterInner = styled(Container)`
  padding-top: 24px;
  border-top: 1px solid var(--line);
`;

const FooterBrand = styled.div`
  color: var(--text);
  font-size: 16px;
  font-weight: 700;
  letter-spacing: -0.02em;
`;

const FooterText = styled.p`
  margin: 8px 0 0;
  color: var(--sub);
  font-size: 14px;
  font-weight: 400;
  line-height: 1.55;
  letter-spacing: -0.01em;
  word-break: keep-all;
`;

const FooterLinks = styled.div`
  display: flex;
  gap: 16px;
  margin-top: 16px;
`;

const FooterLink = styled(Link)`
  color: var(--muted);
  font-size: 13px;
  font-weight: 400;
  text-decoration: underline;
  text-underline-offset: 2px;

  &:hover {
    color: var(--sub);
  }
`;

const FooterDisclaimer = styled.p`
  margin: 16px 0 0;
  color: var(--muted);
  font-size: 14px;
  font-weight: 400;
  line-height: 1.55;
  letter-spacing: -0.01em;
  word-break: keep-all;
`;

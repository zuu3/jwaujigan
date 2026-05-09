import styled from "@emotion/styled";
import { Container } from "../shared";

export function LandingFooter() {
  return (
    <Footer>
      <FooterInner>
        <FooterBrand>좌우지간</FooterBrand>
        <FooterText>
          우리 동네 정치인부터 이슈 비교까지, 정치를 더 쉽게 보는 방법
        </FooterText>
        <FooterDisclaimer>
          AI 결과는 참고용 정보이며 최종 판단을 대신하지 않습니다.
        </FooterDisclaimer>
      </FooterInner>
    </Footer>
  );
}

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

const FooterDisclaimer = styled.p`
  margin: 16px 0 0;
  color: var(--muted);
  font-size: 14px;
  font-weight: 400;
  line-height: 1.55;
  letter-spacing: -0.01em;
  word-break: keep-all;
`;

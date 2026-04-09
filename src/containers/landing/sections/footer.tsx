import styled from "@emotion/styled";
import { Container } from "../shared";

export function LandingFooter() {
  return (
    <Footer>
      <FooterInner>
        <FooterBrand>좌우지간</FooterBrand>
        <FooterText>
          우리 동네 정치인부터 이슈 비교까지, 정치를 더 쉽게 이해하는 방법
        </FooterText>
        <FooterDisclaimer>
          AI 결과는 참고용 정보이며 최종 판단을 대신하지 않습니다.
        </FooterDisclaimer>
      </FooterInner>
    </Footer>
  );
}

const Footer = styled.footer`
  padding: 0 24px 56px;

  @media (max-width: 640px) {
    padding: 0 20px 40px;
  }
`;

const FooterInner = styled(Container)`
  padding-top: 28px;
  border-top: 1px solid rgba(229, 232, 235, 0.55);
`;

const FooterBrand = styled.div`
  color: var(--text);
  font-size: 1rem;
  font-weight: 800;
  letter-spacing: -0.04em;
`;

const FooterText = styled.p`
  margin: 10px 0 0;
  color: var(--muted);
  font-size: 0.94rem;
  font-weight: 500;
  line-height: 1.6;
  letter-spacing: -0.02em;
  word-break: keep-all;
`;

const FooterDisclaimer = styled.p`
  margin: 18px 0 0;
  color: var(--muted);
  font-size: 0.88rem;
  font-weight: 500;
  line-height: 1.55;
  letter-spacing: -0.02em;
  word-break: keep-all;
`;

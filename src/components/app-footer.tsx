"use client";

import styled from "@/lib/styled";
import Link from "next/link";

export function AppFooter() {
  return (
    <Footer>
      <Inner>
        <Brand>좌우지간</Brand>
        <Tagline>선동 없는 정치 정보</Tagline>
        <Links>
          <FooterLink href="/terms">이용약관</FooterLink>
          <FooterLink href="/privacy">개인정보처리방침</FooterLink>
          <FooterMail href="mailto:24.036@bssm.hs.kr">문의</FooterMail>
        </Links>
        <Copyright>© 2026 좌우지간. All rights reserved.</Copyright>
      </Inner>
    </Footer>
  );
}

const Footer = styled.footer`
  padding: 24px 24px 32px;

  @media (max-width: 640px) {
    padding: 20px 20px 28px;
  }
`;

const Inner = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: min(100%, 880px);
  margin: 0 auto;
  padding-top: 20px;
  border-top: 1px solid #f2f4f6;
`;

const Brand = styled.div`
  color: #191f28;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: -0.02em;
`;

const Tagline = styled.p`
  margin: 0;
  color: #8b95a1;
  font-size: 12px;
  font-weight: 400;
`;

const Links = styled.div`
  display: flex;
  gap: 14px;
  margin-top: 8px;
`;

const FooterLink = styled(Link)`
  color: #b0b8c1;
  font-size: 12px;
  font-weight: 400;
  text-decoration: underline;
  text-underline-offset: 2px;

  &:hover {
    color: #8b95a1;
  }
`;

const FooterMail = styled.a`
  color: #b0b8c1;
  font-size: 12px;
  font-weight: 400;
  text-decoration: underline;
  text-underline-offset: 2px;

  &:hover {
    color: #8b95a1;
  }
`;

const Copyright = styled.p`
  margin: 0;
  color: #b0b8c1;
  font-size: 11px;
  font-weight: 400;
`;

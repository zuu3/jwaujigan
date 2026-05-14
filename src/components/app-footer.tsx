"use client";

import styled from "@emotion/styled";
import Link from "next/link";

export function AppFooter() {
  return (
    <Footer>
      <FooterLink href="/privacy">개인정보처리방침</FooterLink>
    </Footer>
  );
}

const Footer = styled.div`
  display: flex;
  justify-content: center;
  padding: 24px 20px 8px;
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

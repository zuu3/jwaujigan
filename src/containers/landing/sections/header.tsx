import styled from "@emotion/styled";
import Link from "next/link";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { Container } from "../shared";

type LandingHeaderProps = {
  isAuthenticated: boolean;
};

export function LandingHeader({ isAuthenticated }: LandingHeaderProps) {
  return (
    <Header>
      <HeaderInner>
        <Brand href="/" aria-label="좌우지간 홈">
          좌우지간
        </Brand>

        <Nav aria-label="랜딩 메뉴">
          <NavLink href="#overview">소개</NavLink>
          <NavLink href="#local-info">정치인 탐색</NavLink>
          <NavLink href="#arena">AI 아레나</NavLink>
          <NavLink href="#analysis">이슈 분석</NavLink>
        </Nav>

        {isAuthenticated ? (
          <HeaderLinkCta href="/home">계속하기</HeaderLinkCta>
        ) : (
          <HeaderButtonCta callbackUrl="/onboarding">
            로그인
          </HeaderButtonCta>
        )}
      </HeaderInner>
    </Header>
  );
}

const Header = styled.header`
  position: sticky;
  top: 0;
  z-index: 20;
  padding: 0 24px;
  border-bottom: 1px solid var(--line);
  background: #ffffff;

  @media (max-width: 640px) {
    padding: 0 20px;
  }
`;

const HeaderInner = styled(Container)`
  display: flex;
  min-height: 64px;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
`;

const Brand = styled(Link)`
  color: var(--text);
  font-size: 16px;
  font-weight: 700;
  letter-spacing: -0.02em;
  flex-shrink: 0;
`;

const Nav = styled.nav`
  display: flex;
  align-items: center;
  gap: 4px;

  @media (max-width: 1024px) {
    display: none;
  }
`;

const NavLink = styled(Link)`
  padding: 8px 12px;
  color: var(--sub);
  font-size: 14px;
  font-weight: 500;
  letter-spacing: -0.01em;

  &:hover {
    color: var(--text);
  }
`;

const headerCtaStyles = `
  display: inline-flex;
  min-height: 40px;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  border-radius: 8px;
  color: #ffffff;
  background: #191f28;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: -0.01em;
  flex-shrink: 0;
  border: 0;
  cursor: pointer;
  transition: opacity 140ms ease;

  &:hover {
    opacity: 0.9;
  }

  @media (max-width: 640px) {
    min-height: 40px;
    padding: 0 14px;
  }
`;

const HeaderLinkCta = styled(Link)`
  ${headerCtaStyles}
`;

const HeaderButtonCta = styled(GoogleSignInButton)`
  ${headerCtaStyles}
`;

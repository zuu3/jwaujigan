import styled from "@emotion/styled";
import Link from "next/link";
import { Container } from "../shared";

export function LandingHeader() {
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

        <HeaderCta href="#local-info">살펴보기</HeaderCta>
      </HeaderInner>
    </Header>
  );
}

const Header = styled.header`
  position: sticky;
  top: 0;
  z-index: 20;
  padding: 0 24px;
  border-bottom: 1px solid rgba(229, 232, 235, 0.88);
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(14px);

  @media (max-width: 640px) {
    padding: 0 20px;
  }
`;

const HeaderInner = styled(Container)`
  display: flex;
  min-height: 72px;
  align-items: center;
  justify-content: space-between;
  gap: 16px;

  @media (max-width: 640px) {
    min-height: 64px;
  }
`;

const Brand = styled(Link)`
  color: var(--text);
  font-size: 1.05rem;
  font-weight: 800;
  letter-spacing: -0.04em;
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
  padding: 10px 12px;
  border-radius: 999px;
  color: var(--muted);
  font-size: 0.94rem;
  font-weight: 600;
  letter-spacing: -0.02em;

  &:hover {
    color: var(--text);
    background: var(--surface);
  }
`;

const HeaderCta = styled(Link)`
  display: inline-flex;
  min-height: 42px;
  align-items: center;
  justify-content: center;
  padding: 0 18px;
  border-radius: 999px;
  color: #fff;
  background: var(--blue);
  font-size: 0.94rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  flex-shrink: 0;

  @media (max-width: 640px) {
    min-height: 38px;
    padding: 0 14px;
    font-size: 0.88rem;
  }
`;

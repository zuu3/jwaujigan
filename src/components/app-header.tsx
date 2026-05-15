"use client";

import styled from "@/lib/styled";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { FileText, Home, MessagesSquare, Swords, User } from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";

type AppHeaderProps = {
  userName?: string | null;
  userImage?: string | null;
};

function getInitial(name: string | null | undefined, fallback = "U") {
  return (name?.trim()?.[0] ?? fallback).toUpperCase();
}

export function AppHeader({ userName, userImage }: AppHeaderProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const resolvedName = userName ?? session?.user?.name;
  const resolvedImage = userImage ?? session?.user?.image;

  return (
    <>
      <Header>
        <Inner>
          <Brand href="/home" aria-label="좌우지간 홈">
            좌우지간
          </Brand>

          <Nav aria-label="주요 메뉴">
            <NavLink href="/home" $active={pathname === "/home"}>홈</NavLink>
            <NavLink href="/issues" $active={pathname.startsWith("/issues")}>이슈</NavLink>
            <NavLink href="/arena" $active={pathname.startsWith("/arena")}>아레나</NavLink>
            <NavLink href="/community" $active={pathname.startsWith("/community")}>커뮤니티</NavLink>
            <NavLink href="/mypage" $active={pathname === "/mypage"}>마이페이지</NavLink>
          </Nav>

          <Actions>
            <ProfileChip href="/mypage" aria-label="마이페이지로 이동">
              <AvatarWrap aria-hidden="true">
                {resolvedImage ? (
                  <AvatarImg src={resolvedImage} alt="" width={28} height={28} />
                ) : (
                  getInitial(resolvedName)
                )}
              </AvatarWrap>
              <ProfileName>{resolvedName ?? "사용자"}</ProfileName>
            </ProfileChip>
            <SignOutBtn callbackUrl="/" />
          </Actions>
        </Inner>
      </Header>

      <BottomNav aria-label="하단 메뉴">
        <BottomNavItem href="/home" $active={pathname === "/home"}>
          <Home size={22} aria-hidden="true" />
          <BottomNavLabel>홈</BottomNavLabel>
        </BottomNavItem>
        <BottomNavItem href="/issues" $active={pathname.startsWith("/issues")}>
          <FileText size={22} aria-hidden="true" />
          <BottomNavLabel>이슈</BottomNavLabel>
        </BottomNavItem>
        <BottomNavItem href="/arena" $active={pathname.startsWith("/arena")}>
          <Swords size={22} aria-hidden="true" />
          <BottomNavLabel>아레나</BottomNavLabel>
        </BottomNavItem>
        <BottomNavItem href="/community" $active={pathname.startsWith("/community")}>
          <MessagesSquare size={22} aria-hidden="true" />
          <BottomNavLabel>커뮤니티</BottomNavLabel>
        </BottomNavItem>
        <BottomNavItem href="/mypage" $active={pathname === "/mypage"}>
          <User size={22} aria-hidden="true" />
          <BottomNavLabel>마이페이지</BottomNavLabel>
        </BottomNavItem>
      </BottomNav>
    </>
  );
}

const Header = styled.header`
  position: sticky;
  top: 0;
  z-index: 20;
  background: #ffffff;
  border-bottom: 1px solid #f2f4f6;
`;

const Inner = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  width: min(100%, 1160px);
  min-height: 56px;
  margin: 0 auto;
  padding: 0 24px;

  @media (max-width: 640px) {
    padding: 0 20px;
  }
`;

const Brand = styled(Link)`
  color: #191f28;
  font-size: 18px;
  font-weight: 800;
  letter-spacing: -0.04em;
  flex-shrink: 0;
`;

const Nav = styled.nav`
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: 16px;

  @media (max-width: 640px) {
    display: none;
  }
`;

const NavLink = styled(Link, {
  shouldForwardProp: (prop) => prop !== "$active",
})<{ $active: boolean }>`
  padding: 6px 12px;
  border-radius: 6px;
  color: ${({ $active }) => ($active ? "#191f28" : "#4e5968")};
  font-size: 14px;
  font-weight: ${({ $active }) => ($active ? 600 : 400)};
  background: ${({ $active }) => ($active ? "#f2f4f6" : "transparent")};
  transition: background 120ms, color 120ms;

  &:hover {
    background: #f2f4f6;
    color: #191f28;
  }
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
`;

const ProfileChip = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px 10px 4px 4px;
  border-radius: 999px;
  border: 1px solid #e5e8eb;
  transition: border-color 120ms;

  &:hover {
    border-color: #b0b8c1;
  }
`;

const AvatarWrap = styled.div`
  display: inline-flex;
  width: 28px;
  height: 28px;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 50%;
  background: rgba(49, 130, 246, 0.12);
  color: #1d4ed8;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
`;

const AvatarImg = styled(Image)`
  object-fit: cover;
  border-radius: 50%;
`;

const ProfileName = styled.span`
  color: #191f28;
  font-size: 13px;
  font-weight: 500;
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  @media (max-width: 480px) {
    display: none;
  }
`;

const SignOutBtn = styled(SignOutButton)`
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid #e5e8eb;
  background: transparent;
  color: #6b7684;
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: border-color 120ms, color 120ms;

  &:hover {
    border-color: #b0b8c1;
    color: #191f28;
  }
`;

const BottomNav = styled.nav`
  display: none;

  @media (max-width: 640px) {
    display: flex;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 20;
    background: #ffffff;
    border-top: 1px solid #e5e8eb;
    padding-bottom: env(safe-area-inset-bottom);
  }
`;

const BottomNavItem = styled(Link, {
  shouldForwardProp: (prop) => prop !== "$active",
})<{ $active: boolean }>`
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-height: 56px;
  padding: 8px 0;
  color: ${({ $active }) => ($active ? "#3182f6" : "#b0b8c1")};
  transition: color 120ms;
`;

const BottomNavLabel = styled.span`
  font-size: 10px;
  font-weight: 500;
  line-height: 1;
`;

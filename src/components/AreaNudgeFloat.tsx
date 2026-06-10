"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { X, MapPin } from "lucide-react";
import { keyframes } from "@emotion/react";
import styled from "@/lib/styled";

const DISMISS_KEY = "area-nudge-dismissed";

export function AreaNudgeFloat() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (status !== "authenticated") return;
    if (session?.user?.area) return;
    try {
      if (localStorage.getItem(DISMISS_KEY)) return;
    } catch { /* ignore */ }
    setVisible(true);
  }, [status, session?.user?.area]);

  const dismiss = () => {
    setVisible(false);
    try { localStorage.setItem(DISMISS_KEY, "1"); } catch { /* ignore */ }
  };

  // 설정 페이지에선 안 띄움
  if (!visible || pathname.startsWith("/settings/district")) return null;

  return (
    <Float>
      <MapPin size={16} />
      <Text>
        <Title>내 지역 대표 확인하기</Title>
        <Desc>행정동을 설정하면 내 선거구를 볼 수 있어요</Desc>
      </Text>
      <SetLink href="/settings/district" onClick={dismiss}>설정하기</SetLink>
      <CloseBtn type="button" onClick={dismiss} aria-label="닫기">
        <X size={14} />
      </CloseBtn>
    </Float>
  );
}

const float = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
`;

const Float = styled.div`
  position: fixed;
  bottom: calc(72px + env(safe-area-inset-bottom, 0px));
  left: 50%;
  transform: translateX(-50%);
  z-index: 30;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: #191f28;
  border-radius: 12px;
  box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.20);
  color: #ffffff;
  white-space: nowrap;
  animation: ${float} 2.4s ease-in-out infinite;

  @media (min-width: 641px) {
    bottom: 32px;
  }
`;

const Text = styled.div`
  display: grid;
  gap: 1px;
`;

const Title = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: #ffffff;
`;

const Desc = styled.div`
  font-size: 11px;
  font-weight: 400;
  color: #8b95a1;
`;

const SetLink = styled(Link)`
  flex-shrink: 0;
  padding: 6px 12px;
  border-radius: 6px;
  background: #3182f6;
  color: #ffffff;
  font-size: 12px;
  font-weight: 600;
  text-decoration: none;
`;

const CloseBtn = styled.button`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: 0;
  background: transparent;
  color: #6b7684;
  cursor: pointer;
  padding: 0;

  &:hover {
    color: #b0b8c1;
  }
`;

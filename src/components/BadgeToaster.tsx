"use client";

import styled from "@/lib/styled";
import { useEffect, useState } from "react";
import { Award } from "lucide-react";
import type { BadgeToastDetail } from "@/lib/badge-toast";

const SHOW_MS = 3000;
const EXIT_MS = 300;

type Toast = BadgeToastDetail & { id: number; exiting: boolean };

export function BadgeToaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    let counter = 0;

    function handler(e: Event) {
      const detail = (e as CustomEvent<BadgeToastDetail>).detail;
      const id = ++counter;

      setToasts((prev) => [...prev, { ...detail, id, exiting: false }]);

      // fade-out 시작
      setTimeout(() => {
        setToasts((prev) =>
          prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)),
        );
      }, SHOW_MS);

      // DOM에서 제거
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, SHOW_MS + EXIT_MS);
    }

    window.addEventListener("badge-toast", handler);
    return () => window.removeEventListener("badge-toast", handler);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <Anchor>
      {toasts.map((t) => (
        <ToastItem key={t.id} $exiting={t.exiting}>
          <IconWrap>
            <Award size={20} color="#fe9800" />
          </IconWrap>
          <TextWrap>
            <BadgeLabel>뱃지 달성!</BadgeLabel>
            <BadgeTitle>{t.title}</BadgeTitle>
            <BadgeDesc>{t.desc}</BadgeDesc>
          </TextWrap>
        </ToastItem>
      ))}
    </Anchor>
  );
}

/* ── Styled ─────────────────────────────────────────────── */

const Anchor = styled.div`
  position: fixed;
  bottom: calc(72px + env(safe-area-inset-bottom));
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  z-index: 9999;
  pointer-events: none;
`;

const ToastItem = styled.div<{ $exiting: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  border-radius: 10px;
  background: #191f28;
  color: #ffffff;
  min-width: 180px;
  box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.12);
  white-space: nowrap;
  animation: ${({ $exiting }) => ($exiting ? "fadeOut" : "slideUp")}
    ${({ $exiting }) => ($exiting ? EXIT_MS : 200)}ms
    ${({ $exiting }) =>
      $exiting
        ? "cubic-bezier(0.4, 0.0, 1, 1)"
        : "cubic-bezier(0.0, 0.0, 0.2, 1)"}
    both;

  @keyframes slideUp {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @keyframes fadeOut {
    from { opacity: 1; transform: translateY(0); }
    to   { opacity: 0; transform: translateY(-4px); }
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const IconWrap = styled.div`
  flex-shrink: 0;
  display: flex;
  align-items: center;
`;

const TextWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const BadgeLabel = styled.span`
  font-size: 12px;
  font-weight: 400;
  color: #8b95a1;
`;

const BadgeTitle = styled.span`
  font-size: 14px;
  font-weight: 700;
  color: #ffffff;
`;

const BadgeDesc = styled.span`
  font-size: 12px;
  font-weight: 400;
  color: #6b7684;
`;

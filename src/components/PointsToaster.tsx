"use client";

import styled from "@/lib/styled";
import { useEffect, useState } from "react";
import type { PointsToastDetail } from "@/lib/points-toast";

const SHOW_MS = 2600;
const EXIT_MS = 300;

type Toast = PointsToastDetail & { id: number; exiting: boolean };

export function PointsToaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    let counter = 0;

    function handler(e: Event) {
      const detail = (e as CustomEvent<PointsToastDetail>).detail;
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

    window.addEventListener("points-toast", handler);
    return () => window.removeEventListener("points-toast", handler);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <Anchor>
      {toasts.map((t) => (
        <ToastItem key={t.id} $exiting={t.exiting}>
          <Points>+{t.points + (t.bonus ?? 0)}pt</Points>
          <Label>
            {t.label}
            {t.bonus ? <Bonus> · 첫 참여 +{t.bonus}pt</Bonus> : null}
          </Label>
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
  gap: 8px;
  padding: 10px 16px;
  border-radius: 10px;
  background: #191f28;
  color: #ffffff;
  font-size: 14px;
  font-weight: 400;
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

const Points = styled.span`
  font-size: 15px;
  font-weight: 700;
  color: #60a5fa;
  font-variant-numeric: tabular-nums;
`;

const Label = styled.span`
  color: #e5e8eb;
`;

const Bonus = styled.span`
  color: #8b95a1;
  font-size: 12px;
`;

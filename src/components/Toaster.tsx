"use client";

import styled from "@emotion/styled";
import { useEffect, useState } from "react";
import type { ToastDetail } from "@/lib/toast";

const SHOW_MS = 3000;
const EXIT_MS = 300;

type Toast = ToastDetail & { id: number; exiting: boolean };

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    let counter = 0;

    function handler(e: Event) {
      const detail = (e as CustomEvent<ToastDetail>).detail;
      const id = ++counter;

      setToasts((prev) => [...prev, { ...detail, id, exiting: false }]);

      setTimeout(() => {
        setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
      }, SHOW_MS);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, SHOW_MS + EXIT_MS);
    }

    window.addEventListener("app-toast", handler);
    return () => window.removeEventListener("app-toast", handler);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <Anchor>
      {toasts.map((t) => (
        <ToastItem key={t.id} $type={t.type ?? "default"} $exiting={t.exiting}>
          {t.message}
        </ToastItem>
      ))}
    </Anchor>
  );
}

const Anchor = styled.div`
  position: fixed;
  bottom: calc(80px + env(safe-area-inset-bottom));
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  z-index: 9998;
  pointer-events: none;
  width: max-content;
  max-width: calc(100vw - 40px);
`;

const ToastItem = styled.div<{ $type: "default" | "error" | "success"; $exiting: boolean }>`
  padding: 12px 20px;
  border-radius: 10px;
  background: ${({ $type }) =>
    $type === "error" ? "#f04452" : $type === "success" ? "#03b26c" : "#191f28"};
  color: #ffffff;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.4;
  white-space: pre-wrap;
  word-break: keep-all;
  text-align: center;
  animation: ${({ $exiting }) => ($exiting ? "fadeOut" : "slideUp")}
    ${({ $exiting }) => ($exiting ? EXIT_MS : 200)}ms
    ${({ $exiting }) =>
      $exiting ? "cubic-bezier(0.4, 0.0, 1, 1)" : "cubic-bezier(0.0, 0.0, 0.2, 1)"}
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

"use client";

import { useEffect, useState } from "react";
import styled from "@/lib/styled";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const STORAGE_KEY = "pwa-banner-dismissed";

function isIos() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isInStandaloneMode() {
  if (typeof window === "undefined") return false;
  return (
    ("standalone" in window.navigator && (window.navigator as { standalone?: boolean }).standalone === true) ||
    window.matchMedia("(display-mode: standalone)").matches
  );
}

export function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosBanner, setShowIosBanner] = useState(false);
  const [dismissed, setDismissed] = useState(true); // start hidden, reveal after check

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) return;
    if (isInStandaloneMode()) return;

    if (isIos()) {
      setShowIosBanner(true);
      setDismissed(false);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setDismissed(false);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setDismissed(true);
    setDeferredPrompt(null);
    setShowIosBanner(false);
  }

  async function install() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      localStorage.setItem(STORAGE_KEY, "1");
    }
    setDeferredPrompt(null);
    setDismissed(true);
  }

  if (dismissed) return null;

  if (showIosBanner) {
    return (
      <Banner role="banner">
        <BannerIcon aria-hidden>
          <svg width="32" height="32" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
            <rect width="512" height="512" fill="#191f28" rx="96"/>
            <text x="128" y="300" textAnchor="middle" dominantBaseline="middle"
              fontFamily="Apple SD Gothic Neo, sans-serif" fontSize="180" fontWeight="700" fill="#3182f6">좌</text>
            <text x="384" y="300" textAnchor="middle" dominantBaseline="middle"
              fontFamily="Apple SD Gothic Neo, sans-serif" fontSize="180" fontWeight="700" fill="#e5484d">우</text>
          </svg>
        </BannerIcon>
        <BannerText>
          <BannerTitle>홈 화면에 추가하기</BannerTitle>
          <BannerDesc>
            Safari 하단 공유 버튼(<ShareIconInline aria-label="공유" />) → <strong>홈 화면에 추가</strong>
          </BannerDesc>
        </BannerText>
        <DismissBtn type="button" onClick={dismiss} aria-label="닫기">×</DismissBtn>
      </Banner>
    );
  }

  if (deferredPrompt) {
    return (
      <Banner role="banner">
        <BannerIcon aria-hidden>
          <svg width="32" height="32" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
            <rect width="512" height="512" fill="#191f28" rx="96"/>
            <text x="128" y="300" textAnchor="middle" dominantBaseline="middle"
              fontFamily="Apple SD Gothic Neo, sans-serif" fontSize="180" fontWeight="700" fill="#3182f6">좌</text>
            <text x="384" y="300" textAnchor="middle" dominantBaseline="middle"
              fontFamily="Apple SD Gothic Neo, sans-serif" fontSize="180" fontWeight="700" fill="#e5484d">우</text>
          </svg>
        </BannerIcon>
        <BannerText>
          <BannerTitle>앱으로 설치하기</BannerTitle>
          <BannerDesc>홈 화면에 추가하면 더 빠르게 열 수 있어요.</BannerDesc>
        </BannerText>
        <InstallBtn type="button" onClick={() => void install()}>설치</InstallBtn>
        <DismissBtn type="button" onClick={dismiss} aria-label="닫기">×</DismissBtn>
      </Banner>
    );
  }

  return null;
}

// ─── SW registration ──────────────────────────────────────────────────────────

export function RegisterSW() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js");
    }
  }, []);
  return null;
}

// ─── Styled ───────────────────────────────────────────────────────────────────

const Banner = styled.div`
  position: fixed;
  bottom: calc(68px + env(safe-area-inset-bottom, 0px));
  left: 50%;
  transform: translateX(-50%);
  width: min(calc(100% - 32px), 440px);
  background: #191f28;
  border-radius: 14px;
  padding: 12px 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  z-index: 200;
`;

const BannerIcon = styled.div`
  flex-shrink: 0;
  border-radius: 8px;
  overflow: hidden;
  line-height: 0;
`;

const BannerText = styled.div`
  flex: 1;
  min-width: 0;
`;

const BannerTitle = styled.div`
  font-size: 13px;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 2px;
`;

const BannerDesc = styled.div`
  font-size: 12px;
  color: #8b95a1;
  line-height: 1.4;

  strong {
    color: #b0b8c1;
    font-weight: 600;
  }
`;

function ShareIconInline({ "aria-label": label }: { "aria-label": string }) {
  return (
    <svg
      aria-label={label}
      width="12"
      height="14"
      viewBox="0 0 16 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "inline", verticalAlign: "middle", margin: "0 1px" }}
    >
      <path d="M8 1v12M4 5l4-4 4 4" stroke="#3182f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="1" y="9" width="14" height="10" rx="2" stroke="#3182f6" strokeWidth="1.5"/>
    </svg>
  );
}

const InstallBtn = styled.button`
  flex-shrink: 0;
  padding: 8px 14px;
  min-height: 36px;
  background: #3182f6;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
`;

const DismissBtn = styled.button`
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  background: rgba(255, 255, 255, 0.1);
  color: #8b95a1;
  border: none;
  border-radius: 50%;
  font-size: 16px;
  font-family: inherit;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
`;

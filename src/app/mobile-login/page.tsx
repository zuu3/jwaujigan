import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "좌우지간 — 앱 로그인" };

type Props = {
  searchParams: Promise<{ error?: string }>;
};

export default async function MobileLoginPage({ searchParams }: Props) {
  const { error } = await searchParams;

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24, padding: 24, fontFamily: "system-ui, sans-serif", background: "#fff" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, textAlign: "center" }}>
        <span style={{ fontSize: 32, fontWeight: 800, color: "#2563eb", letterSpacing: "-0.02em" }}>좌우지간</span>
        <p style={{ fontSize: 16, color: "#4b5563", margin: 0 }}>앱에서 계속하려면 Google 계정으로 로그인해주세요.</p>
        {error ? (
          <p style={{ fontSize: 14, color: "#ef4444", margin: 0 }}>
            {error === "unauthenticated" ? "로그인이 필요해요." : "로그인 중 오류가 발생했어요. 다시 시도해주세요."}
          </p>
        ) : null}
      </div>
      <GoogleSignInButton
        callbackUrl="/api/auth/mobile/issue-token"
        style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 28px", borderRadius: 12, background: "#2563eb", color: "#fff", fontSize: 16, fontWeight: 600, border: "none", cursor: "pointer", minWidth: 220, justifyContent: "center" }}
      >
        Google로 로그인
      </GoogleSignInButton>
      <p style={{ fontSize: 12, color: "#9ca3af", margin: 0, textAlign: "center" }}>
        로그인 후 자동으로 앱으로 돌아갑니다.
      </p>
    </div>
  );
}

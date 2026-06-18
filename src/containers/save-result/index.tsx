"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import styled from "@/lib/styled";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import type {
  PoliticalAnswers,
  PoliticalProfileResult,
} from "@/lib/political-profile";

type Props = {
  isAuthenticated: boolean;
  answers: PoliticalAnswers | null;
  profile: PoliticalProfileResult | null;
  encoded: string | null;
};

export function SaveResultContainer({ isAuthenticated, answers, profile, encoded }: Props) {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);

  // 결과 정보가 깨졌거나 없음
  if (!answers || !profile) {
    return (
      <Page>
        <Inner>
          <Badge>좌우지간</Badge>
          <Title>결과 정보를 불러올 수 없어요</Title>
          <Desc>QR 다시 스캔하거나 테스트를 다시 해주세요.</Desc>
        </Inner>
      </Page>
    );
  }

  const handleSave = async () => {
    setStatus("saving");
    setError(null);
    try {
      const res = await fetch("/api/political-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      if (!res.ok) throw new Error("save failed");
      void updateSession({ hasPoliticalProfile: true });
      setStatus("saved");
    } catch {
      setStatus("idle");
      setError("저장에 실패했어요. 다시 시도해주세요.");
    }
  };

  return (
    <Page>
      <Inner>
        <Badge>좌우지간</Badge>

        {status === "saved" ? (
          <>
            <Title>결과가 저장됐어요!</Title>
            <Desc>이제 나만의 정치 피드를 받아봐요.</Desc>
          </>
        ) : (
          <>
            <Title>테스트 결과가 도착했어요</Title>
            <Desc>이 결과를 내 계정에 저장해요.</Desc>
          </>
        )}

        <ResultCard>
          <ResultType>{profile.political_type}</ResultType>
          <AxisList>
            <AxisBar label="경제" score={profile.economic_score} />
            <AxisBar label="안보" score={profile.security_score} />
            <AxisBar label="사회" score={profile.social_score} />
          </AxisList>
        </ResultCard>

        {error ? <ErrorText>{error}</ErrorText> : null}

        {status === "saved" ? (
          <PrimaryButton onClick={() => router.push("/onboarding")}>
            좌우지간 시작하기
          </PrimaryButton>
        ) : isAuthenticated ? (
          <PrimaryButton onClick={handleSave} disabled={status === "saving"}>
            {status === "saving" ? "저장 중…" : "내 결과 저장하기"}
          </PrimaryButton>
        ) : (
          <LoginButton callbackUrl={`/save-result?a=${encoded ?? ""}`}>
            로그인하고 내 결과 저장하기
          </LoginButton>
        )}

        {!isAuthenticated && status !== "saved" ? (
          <Caption>구글 계정으로 3초 만에 저장돼요</Caption>
        ) : null}
      </Inner>
    </Page>
  );
}

// ─── AxisBar ─────────────────────────────────────────────────────────────────

function AxisBar({ label, score }: { label: string; score: number }) {
  const clamped = Math.max(-100, Math.min(100, score));
  const pct = Math.abs(clamped) / 2; // 0~50
  const positive = clamped >= 0;

  return (
    <AxisWrap>
      <AxisMeta>
        <AxisLabel>{label}</AxisLabel>
        <AxisSides>
          <span style={{ color: "#3182f6", fontWeight: clamped > 10 ? 700 : 400 }}>진보</span>
          <span style={{ color: "#b0b8c1" }}>·</span>
          <span style={{ color: "#e5484d", fontWeight: clamped < -10 ? 700 : 400 }}>보수</span>
        </AxisSides>
      </AxisMeta>
      <BarTrack>
        <BarCenter />
        {positive ? (
          // 진보: 중앙에서 왼쪽으로
          <BarFill style={{ right: "50%", width: `${pct}%`, background: "#3182f6" }} />
        ) : (
          // 보수: 중앙에서 오른쪽으로
          <BarFill style={{ left: "50%", width: `${pct}%`, background: "#e5484d" }} />
        )}
      </BarTrack>
    </AxisWrap>
  );
}

// ─── Styled ──────────────────────────────────────────────────────────────────

const Page = styled.main`
  min-height: 100dvh;
  width: 100%;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: "Pretendard", "Apple SD Gothic Neo", sans-serif;
`;

const Inner = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  width: 100%;
  max-width: 440px;
  padding: 48px 24px 56px;
`;

const Badge = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #3182f6;
  margin-bottom: 20px;
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: 700;
  color: #191f28;
  line-height: 1.35;
  margin: 0 0 10px;
  word-break: keep-all;
`;

const Desc = styled.p`
  font-size: 15px;
  color: #6b7684;
  line-height: 1.6;
  margin: 0 0 32px;
  word-break: keep-all;
`;

const ResultCard = styled.div`
  width: 100%;
  border: 1px solid #e5e8eb;
  border-radius: 12px;
  padding: 24px 20px;
  margin-bottom: 24px;
`;

const ResultType = styled.div`
  font-size: 22px;
  font-weight: 700;
  color: #191f28;
  margin-bottom: 24px;
`;

const AxisList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 18px;
`;

const AxisWrap = styled.div`
  width: 100%;
`;

const AxisMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const AxisLabel = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: #191f28;
`;

const AxisSides = styled.div`
  display: flex;
  gap: 6px;
  font-size: 13px;
`;

const BarTrack = styled.div`
  position: relative;
  width: 100%;
  height: 10px;
  background: #f2f4f6;
  border-radius: 5px;
  overflow: hidden;
`;

const BarCenter = styled.div`
  position: absolute;
  left: 50%;
  top: 0;
  width: 2px;
  height: 100%;
  background: #e5e8eb;
  transform: translateX(-50%);
  z-index: 1;
`;

const BarFill = styled.div`
  position: absolute;
  top: 0;
  height: 100%;
  border-radius: 5px;
`;

const ErrorText = styled.p`
  margin: 0 0 16px;
  font-size: 14px;
  color: #e5484d;
`;

const PrimaryButton = styled.button`
  width: 100%;
  height: 56px;
  background: #3182f6;
  color: #ffffff;
  border: none;
  border-radius: 12px;
  font-size: 17px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: background 150ms;

  &:hover:not(:disabled) { background: #2272eb; }
  &:disabled { opacity: 0.5; cursor: default; }
`;

const LoginButton = styled(GoogleSignInButton)`
  width: 100%;
  height: 56px;
  background: #3182f6;
  color: #ffffff;
  border: none;
  border-radius: 12px;
  font-size: 17px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: background 150ms;

  &:hover { background: #2272eb; }
`;

const Caption = styled.p`
  margin-top: 14px;
  font-size: 13px;
  color: #b0b8c1;
`;

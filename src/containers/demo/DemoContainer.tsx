"use client";

import { useState, useCallback } from "react";
import styled from "@/lib/styled";
import { QRCodeSVG } from "qrcode.react";
import { questions, likertOptions } from "@/containers/onboarding/questions";
import { calculatePoliticalProfile } from "@/lib/political-profile";
import type { PoliticalAnswers, PoliticalProfileResult } from "@/lib/political-profile";

type Screen = "landing" | "test" | "result";

const BASE_URL = "https://jwj.zuu3.kr";

export function DemoContainer() {
  const [screen, setScreen] = useState<Screen>("landing");
  const [answers, setAnswers] = useState<PoliticalAnswers>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [result, setResult] = useState<PoliticalProfileResult | null>(null);

  const handleAnswer = useCallback(async (score: number) => {
    const q = questions[currentIndex];
    const next = { ...answers, [q.id]: score };
    setAnswers(next);

    if (currentIndex + 1 >= questions.length) {
      const profile = calculatePoliticalProfile(next);
      setResult(profile);
      setScreen("result");
    } else {
      setCurrentIndex((i) => i + 1);
    }
  }, [currentIndex, answers]);

  const reset = () => {
    setScreen("landing");
    setAnswers({});
    setCurrentIndex(0);
    setResult(null);
  };

  if (screen === "landing") return <LandingScreen onStart={() => setScreen("test")} />;
  if (screen === "test") return (
    <TestScreen
      currentIndex={currentIndex}
      onAnswer={handleAnswer}
    />
  );
  if (screen === "result" && result) return (
    <ResultScreen result={result} onReset={reset} />
  );
  return null;
}

function LandingScreen({ onStart }: { onStart: () => void }) {
  return (
    <FullPage>
      <LandingInner>
        <AppBadge>좌우지간</AppBadge>
        <LandingTitle>나의 정치 성향을<br />알아보세요.</LandingTitle>
        <LandingDesc>15개 질문으로 경제·안보·사회 3가지 축의<br />정치 성향을 분석해드립니다.</LandingDesc>
        <StartButton onClick={onStart}>성향 테스트 시작</StartButton>
        <LandingCaption>로그인 없이 체험할 수 있어요</LandingCaption>
      </LandingInner>
    </FullPage>
  );
}

function TestScreen({
  currentIndex,
  onAnswer,
}: {
  currentIndex: number;
  onAnswer: (score: number) => void;
}) {
  const question = questions[currentIndex];
  const progress = ((currentIndex) / questions.length) * 100;
  const [selected, setSelected] = useState<number | null>(null);

  const handleSelect = (value: number) => {
    setSelected(value);
    setTimeout(() => {
      setSelected(null);
      onAnswer(value);
    }, 180);
  };

  return (
    <FullPage>
      <TestInner>
        <ProgressBarWrap>
          <ProgressFill style={{ width: `${progress}%` }} />
        </ProgressBarWrap>
        <QuestionCount>{currentIndex + 1} / {questions.length}</QuestionCount>
        <AxisBadge>{question.axis === "economic" ? "경제" : question.axis === "security" ? "안보" : "사회"}</AxisBadge>
        <QuestionText>{question.text}</QuestionText>
        {question.context && (
          <ContextBox>{question.context}</ContextBox>
        )}
        <AnswerGrid>
          {[...likertOptions].reverse().map((opt) => (
            <AnswerBtn
              key={opt.value}
              $selected={selected === opt.value}
              onClick={() => handleSelect(opt.value)}
            >
              {opt.label}
            </AnswerBtn>
          ))}
        </AnswerGrid>
      </TestInner>
    </FullPage>
  );
}

function ResultScreen({
  result,
  onReset,
}: {
  result: PoliticalProfileResult;
  onReset: () => void;
}) {
  const qrUrl = BASE_URL;

  return (
    <FullPage>
      <ResultInner>
        <ResultBadge>분석 완료</ResultBadge>
        <ResultType>{result.political_type}</ResultType>
        <ResultSub>경제·안보·사회 3가지 축으로 분석한 결과예요.</ResultSub>

        <AxisList>
          <AxisBar label="경제" score={result.economic_score} />
          <AxisBar label="안보" score={result.security_score} />
          <AxisBar label="사회" score={result.social_score} />
        </AxisList>

        <Divider />

        <QRSection>
          <QRText>QR 스캔하고 로그인하면<br /><strong>내 결과를 저장</strong>할 수 있어요</QRText>
          <QRWrap>
            <QRCodeSVG value={qrUrl} size={160} />
          </QRWrap>
          <QRUrl>jwj.zuu3.kr</QRUrl>
        </QRSection>

        <ResetButton onClick={onReset}>다시 하기</ResetButton>
      </ResultInner>
    </FullPage>
  );
}

function AxisBar({ label, score }: { label: string; score: number }) {
  const pct = Math.round((score + 100) / 2);
  const isLeft = score < -10;
  const isRight = score > 10;

  return (
    <AxisWrap>
      <AxisMeta>
        <AxisLabel>{label}</AxisLabel>
        <AxisSides>
          <span style={{ color: "#e5484d", fontWeight: isLeft ? 700 : 400 }}>보수</span>
          <span style={{ color: "#8b95a1" }}>·</span>
          <span style={{ color: "#3182f6", fontWeight: isRight ? 700 : 400 }}>진보</span>
        </AxisSides>
      </AxisMeta>
      <BarTrack>
        <BarCenter />
        <BarFill $pct={pct} $positive={score >= 0} />
      </BarTrack>
    </AxisWrap>
  );
}

// ─── Styled ─────────────────────────────────────────────────────────────────

const FullPage = styled.div`
  min-height: 100dvh;
  width: 100%;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: "Pretendard", "Apple SD Gothic Neo", sans-serif;
`;

const LandingInner = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 60px 40px;
  max-width: 600px;
  width: 100%;
`;

const AppBadge = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: #3182f6;
  letter-spacing: 0.02em;
  margin-bottom: 32px;
`;

const LandingTitle = styled.h1`
  font-size: 48px;
  font-weight: 700;
  color: #191f28;
  line-height: 1.3;
  margin: 0 0 20px;
  word-break: keep-all;

  @media (max-width: 600px) {
    font-size: 34px;
  }
`;

const LandingDesc = styled.p`
  font-size: 20px;
  font-weight: 400;
  color: #6b7684;
  line-height: 1.6;
  margin: 0 0 48px;
  word-break: keep-all;

  @media (max-width: 600px) {
    font-size: 16px;
  }
`;

const StartButton = styled.button`
  width: 100%;
  max-width: 400px;
  height: 72px;
  background: #3182f6;
  color: #ffffff;
  border: none;
  border-radius: 16px;
  font-size: 22px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: background 150ms;

  &:hover { background: #2272eb; }
  &:active { background: #1a65d6; }

  @media (max-width: 600px) {
    height: 60px;
    font-size: 18px;
  }
`;

const LandingCaption = styled.p`
  margin-top: 16px;
  font-size: 14px;
  color: #b0b8c1;
`;

// Test

const TestInner = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 640px;
  padding: 48px 40px 60px;

  @media (max-width: 600px) {
    padding: 32px 24px 40px;
  }
`;

const ProgressBarWrap = styled.div`
  width: 100%;
  height: 4px;
  background: #f2f4f6;
  border-radius: 2px;
  margin-bottom: 24px;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: #3182f6;
  border-radius: 2px;
  transition: width 300ms ease;
`;

const QuestionCount = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: #8b95a1;
  margin-bottom: 12px;
`;

const AxisBadge = styled.div`
  display: inline-flex;
  align-self: flex-start;
  padding: 4px 12px;
  background: #e8f3ff;
  color: #3182f6;
  font-size: 13px;
  font-weight: 600;
  border-radius: 9999px;
  margin-bottom: 20px;
`;

const QuestionText = styled.h2`
  font-size: 26px;
  font-weight: 700;
  color: #191f28;
  line-height: 1.45;
  margin: 0 0 20px;
  word-break: keep-all;

  @media (max-width: 600px) {
    font-size: 20px;
  }
`;

const ContextBox = styled.p`
  font-size: 14px;
  color: #6b7684;
  line-height: 1.7;
  background: #f9fafb;
  border-radius: 10px;
  padding: 14px 16px;
  margin: 0 0 28px;
  word-break: keep-all;
`;

const AnswerGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const AnswerBtn = styled.button<{ $selected: boolean }>`
  width: 100%;
  height: 68px;
  border: 1.5px solid ${({ $selected }) => $selected ? "#3182f6" : "#e5e8eb"};
  background: ${({ $selected }) => $selected ? "#e8f3ff" : "#ffffff"};
  color: ${({ $selected }) => $selected ? "#3182f6" : "#191f28"};
  border-radius: 14px;
  font-size: 18px;
  font-weight: ${({ $selected }) => $selected ? 600 : 400};
  font-family: inherit;
  cursor: pointer;
  transition: all 120ms;

  &:hover {
    border-color: #3182f6;
    background: #f0f7ff;
  }

  @media (max-width: 600px) {
    height: 58px;
    font-size: 16px;
  }
`;

// Result

const ResultInner = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 560px;
  padding: 48px 40px 60px;
  text-align: center;

  @media (max-width: 600px) {
    padding: 32px 24px 40px;
  }
`;

const ResultBadge = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: #3182f6;
  background: #e8f3ff;
  padding: 4px 14px;
  border-radius: 9999px;
  margin-bottom: 20px;
`;

const ResultType = styled.h1`
  font-size: 42px;
  font-weight: 700;
  color: #191f28;
  margin: 0 0 12px;

  @media (max-width: 600px) {
    font-size: 32px;
  }
`;

const ResultSub = styled.p`
  font-size: 16px;
  color: #6b7684;
  margin: 0 0 36px;
`;

const AxisList = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 32px;
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
  font-size: 15px;
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
`;

const BarFill = styled.div<{ $pct: number; $positive: boolean }>`
  position: absolute;
  top: 0;
  height: 100%;
  background: ${({ $positive }) => $positive ? "#3182f6" : "#e5484d"};
  border-radius: 5px;
  ${({ $pct, $positive }) =>
    $positive
      ? `left: 50%; width: ${Math.abs($pct - 50)}%;`
      : `right: ${100 - $pct}%; width: ${Math.abs($pct - 50)}%;`
  }
`;

const Divider = styled.div`
  width: 100%;
  height: 1px;
  background: #e5e8eb;
  margin: 8px 0 32px;
`;

const QRSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
`;

const QRText = styled.p`
  font-size: 17px;
  color: #4e5968;
  line-height: 1.6;
  margin: 0;
  word-break: keep-all;

  strong {
    color: #191f28;
    font-weight: 700;
  }
`;

const QRWrap = styled.div`
  padding: 16px;
  background: #ffffff;
  border: 1.5px solid #e5e8eb;
  border-radius: 16px;
`;

const QRUrl = styled.div`
  font-size: 14px;
  color: #8b95a1;
  font-weight: 500;
`;

const ResetButton = styled.button`
  height: 56px;
  padding: 0 40px;
  background: #f2f4f6;
  color: #191f28;
  border: none;
  border-radius: 12px;
  font-size: 17px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: background 150ms;

  &:hover { background: #e5e8eb; }
`;

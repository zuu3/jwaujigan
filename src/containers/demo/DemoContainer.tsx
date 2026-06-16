"use client";

import { useState, useEffect } from "react";
import styled from "@/lib/styled";
import { QRCodeSVG } from "qrcode.react";
import { questions, likertOptions } from "@/containers/onboarding/questions";
import { calculatePoliticalProfile } from "@/lib/political-profile";
import type { PoliticalAnswers, PoliticalProfileResult } from "@/lib/political-profile";

type Screen = "landing" | "test" | "result";

const BASE_URL = "https://jwj.zuu3.kr";

function encodeAnswers(answers: PoliticalAnswers): string {
  const encoded = btoa(JSON.stringify(answers));
  return encodeURIComponent(encoded);
}
const AXIS_LABEL: Record<string, string> = { economic: "경제", security: "안보", social: "사회" };

export function DemoContainer() {
  const [screen, setScreen] = useState<Screen>("landing");
  const [answers, setAnswers] = useState<PoliticalAnswers>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [result, setResult] = useState<PoliticalProfileResult | null>(null);

  const currentQuestion = questions[currentIndex];
  const existingAnswer = answers[currentQuestion?.id] ?? null;

  const handleSelect = (score: number) => {
    const next = { ...answers, [currentQuestion.id]: score };
    setAnswers(next);
    setTimeout(() => {
      if (currentIndex + 1 >= questions.length) {
        const profile = calculatePoliticalProfile(next);
        setResult(profile);
        setScreen("result");
      } else {
        setCurrentIndex((i) => i + 1);
      }
    }, 180);
  };

  const handleNext = () => {
    if (existingAnswer === null) return;
    if (currentIndex + 1 >= questions.length) {
      const profile = calculatePoliticalProfile(answers as PoliticalAnswers);
      setResult(profile);
      setScreen("result");
    } else {
      setCurrentIndex((i) => i + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  };

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
      selectedAnswer={existingAnswer as number | null}
      onSelect={handleSelect}
      onPrev={handlePrev}
      onNext={handleNext}
    />
  );
  if (screen === "result" && result) return <ResultScreen result={result} answers={answers} onReset={reset} />;
  return null;
}

// ─── Landing ────────────────────────────────────────────────────────────────

function LandingScreen({ onStart }: { onStart: () => void }) {
  return (
    <FullPage>
      <LandingInner>
        <AppBadge>좌우지간</AppBadge>
        <LandingTitle>나는 어떤<br />정치 성향일까?</LandingTitle>
        <LandingDesc>
          15개 질문으로 경제·안보·사회<br />3가지 축을 분석해드려요.
        </LandingDesc>
        <StartButton onClick={onStart}>테스트 시작하기</StartButton>
        <LandingCaption>로그인 없이도 할 수 있어요</LandingCaption>
      </LandingInner>
    </FullPage>
  );
}

// ─── Test ────────────────────────────────────────────────────────────────────

function TestScreen({
  currentIndex,
  selectedAnswer,
  onSelect,
  onPrev,
  onNext,
}: {
  currentIndex: number;
  selectedAnswer: number | null;
  onSelect: (score: number) => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const question = questions[currentIndex];
  const progress = (currentIndex / questions.length) * 100;
  const isLast = currentIndex === questions.length - 1;

  return (
    <FullPage>
      <TestLayout>
        {/* Top: progress + meta */}
        <TestHeader>
          <ProgressBarWrap>
            <ProgressFill style={{ width: `${progress}%` }} />
          </ProgressBarWrap>
          <TestMeta>
            <QuestionCount>{currentIndex + 1} / {questions.length}</QuestionCount>
            <AxisBadge>{AXIS_LABEL[question.axis]}</AxisBadge>
          </TestMeta>
        </TestHeader>

        {/* Middle: question + context — fixed height prevents jump */}
        <QuestionArea>
          <QuestionText>{question.text}</QuestionText>
          <ContextSlot>
            {question.context ? (
              <ContextBox>{question.context}</ContextBox>
            ) : null}
          </ContextSlot>
        </QuestionArea>

        {/* Bottom: answers + navigation */}
        <AnswerArea>
          <AnswerGrid>
            {[...likertOptions].reverse().map((opt) => (
              <AnswerBtn
                key={opt.value}
                $selected={selectedAnswer === opt.value}
                onClick={() => onSelect(opt.value)}
              >
                {opt.label}
              </AnswerBtn>
            ))}
          </AnswerGrid>

          <NavRow>
            <NavBtn onClick={onPrev} disabled={currentIndex === 0}>이전</NavBtn>
            <NextBtn onClick={onNext} disabled={selectedAnswer === null}>
              {isLast ? "결과 보기" : "다음"}
            </NextBtn>
          </NavRow>
        </AnswerArea>
      </TestLayout>
    </FullPage>
  );
}

// ─── Result ──────────────────────────────────────────────────────────────────

function ResultScreen({ result, answers, onReset }: { result: PoliticalProfileResult; answers: PoliticalAnswers; onReset: () => void }) {
  const qrUrl = `${BASE_URL}/onboarding?demo=1&a=${encodeAnswers(answers)}`;

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
          <QRText>
            QR을 스캔하고 로그인하면<br /><strong>내 결과가 저장</strong>돼요
          </QRText>
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

// ─── AxisBar ─────────────────────────────────────────────────────────────────

function AxisBar({ label, score }: { label: string; score: number }) {
  const pct = (score + 100) / 2; // 0~100
  const isPositive = score >= 0;

  return (
    <AxisWrap>
      <AxisMeta>
        <AxisLabel>{label}</AxisLabel>
        <AxisSides>
          <span style={{ color: "#e5484d", fontWeight: score < -10 ? 700 : 400 }}>보수</span>
          <span style={{ color: "#b0b8c1" }}>·</span>
          <span style={{ color: "#3182f6", fontWeight: score > 10 ? 700 : 400 }}>진보</span>
        </AxisSides>
      </AxisMeta>
      <BarTrack>
        <BarCenter />
        {isPositive ? (
          <BarFill style={{ left: "50%", width: `${pct - 50}%`, background: "#3182f6" }} />
        ) : (
          <BarFill style={{ left: `${pct}%`, width: `${50 - pct}%`, background: "#e5484d" }} />
        )}
      </BarTrack>
    </AxisWrap>
  );
}

// ─── Styled ──────────────────────────────────────────────────────────────────

const FullPage = styled.div`
  min-height: 100dvh;
  width: 100%;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: "Pretendard", "Apple SD Gothic Neo", sans-serif;
`;

// Landing

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
  margin-bottom: 32px;
`;

const LandingTitle = styled.h1`
  font-size: 52px;
  font-weight: 700;
  color: #191f28;
  line-height: 1.3;
  margin: 0 0 20px;
  word-break: keep-all;

  @media (max-width: 600px) { font-size: 34px; }
`;

const LandingDesc = styled.p`
  font-size: 20px;
  color: #6b7684;
  line-height: 1.7;
  margin: 0 0 48px;
  word-break: keep-all;

  @media (max-width: 600px) { font-size: 16px; }
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

  @media (max-width: 600px) { height: 60px; font-size: 18px; }
`;

const LandingCaption = styled.p`
  margin-top: 16px;
  font-size: 14px;
  color: #b0b8c1;
`;

// Test layout — fixed 3-zone: header / question / answers+nav

const TestLayout = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 640px;
  min-height: 100dvh;
  padding: 40px 40px 48px;

  @media (max-width: 600px) { padding: 28px 24px 36px; }
`;

const TestHeader = styled.div`
  flex-shrink: 0;
  margin-bottom: 32px;
`;

const ProgressBarWrap = styled.div`
  width: 100%;
  height: 4px;
  background: #f2f4f6;
  border-radius: 2px;
  margin-bottom: 16px;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: #3182f6;
  border-radius: 2px;
  transition: width 300ms ease;
`;

const TestMeta = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const QuestionCount = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: #8b95a1;
`;

const AxisBadge = styled.div`
  padding: 4px 12px;
  background: #e8f3ff;
  color: #3182f6;
  font-size: 13px;
  font-weight: 600;
  border-radius: 9999px;
`;

// Question area: flex: 1 so it fills the middle, won't jump

const QuestionArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  margin-bottom: 32px;
`;

const QuestionText = styled.h2`
  font-size: 26px;
  font-weight: 700;
  color: #191f28;
  line-height: 1.5;
  margin: 0 0 24px;
  word-break: keep-all;

  @media (max-width: 600px) { font-size: 20px; }
`;

/* Fixed-height slot prevents layout jump when context appears/disappears */
const ContextSlot = styled.div`
  min-height: 96px;
`;

const ContextBox = styled.p`
  font-size: 14px;
  color: #6b7684;
  line-height: 1.7;
  border: 1px solid #e5e8eb;
  border-radius: 12px;
  padding: 14px 16px;
  margin: 0;
  word-break: keep-all;
`;

// Answer area: fixed at bottom

const AnswerArea = styled.div`
  flex-shrink: 0;
`;

const AnswerGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
`;

const AnswerBtn = styled.button<{ $selected: boolean }>`
  width: 100%;
  height: 64px;
  border: 1.5px solid ${({ $selected }) => $selected ? "#3182f6" : "#e5e8eb"};
  background: ${({ $selected }) => $selected ? "#e8f3ff" : "#ffffff"};
  color: ${({ $selected }) => $selected ? "#3182f6" : "#191f28"};
  border-radius: 12px;
  font-size: 18px;
  font-weight: ${({ $selected }) => $selected ? 600 : 400};
  font-family: inherit;
  cursor: pointer;
  transition: border-color 120ms, background 120ms, color 120ms;

  &:hover {
    border-color: #3182f6;
    background: #f0f7ff;
  }

  @media (max-width: 600px) { height: 54px; font-size: 16px; }
`;

const NavRow = styled.div`
  display: flex;
  gap: 12px;
`;

const NavBtn = styled.button`
  height: 56px;
  padding: 0 28px;
  background: #f2f4f6;
  color: #4e5968;
  border: none;
  border-radius: 12px;
  font-size: 17px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: background 150ms;
  flex-shrink: 0;

  &:hover:not(:disabled) { background: #e5e8eb; }
  &:disabled { opacity: 0.35; cursor: default; }
`;

const NextBtn = styled.button`
  flex: 1;
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
  &:disabled { opacity: 0.35; cursor: default; }
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

  @media (max-width: 600px) { padding: 32px 24px 40px; }
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

  @media (max-width: 600px) { font-size: 32px; }
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

const AxisWrap = styled.div`width: 100%;`;

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
  z-index: 1;
`;

const BarFill = styled.div`
  position: absolute;
  top: 0;
  height: 100%;
  border-radius: 5px;
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

  strong { color: #191f28; font-weight: 700; }
`;

const QRWrap = styled.div`
  padding: 16px;
  border: 1px solid #e5e8eb;
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

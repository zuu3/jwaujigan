"use client";

import { useState } from "react";
import styled from "@/lib/styled";
import { HelpCircle, X } from "lucide-react";
import { TargetCursor } from "@/components/cursor/target-cursor";
import { questions, likertOptions } from "./questions";

const AXIS_LABEL: Record<string, string> = {
  economic: "경제",
  security: "안보",
  social: "사회",
};

export type QuestionsStepProps = {
  district: string | null;
  resolvedAddress: string | null;
  currentIndex: number;
  canAnswer: boolean;
  currentSelection: number | undefined;
  isSubmitting: boolean;
  onAnswer: (score: number) => Promise<void>;
  onBackToDistrictStep: () => void;
};

export function QuestionsStep({
  district,
  resolvedAddress,
  currentIndex,
  canAnswer,
  currentSelection,
  isSubmitting,
  onAnswer,
  onBackToDistrictStep,
}: QuestionsStepProps) {
  const question = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const [contextOpen, setContextOpen] = useState(false);

  const handleAnswer = async (score: number) => {
    setContextOpen(false);
    await onAnswer(score);
  };

  return (
    <>
      <QuestionStage>
        <QuestionMeta>
          <ProgressText>
            질문 {currentIndex + 1} / {questions.length}
          </ProgressText>
          <ProgressBar>
            <ProgressFill style={{ width: `${progress}%` }} />
          </ProgressBar>
        </QuestionMeta>
        <QuestionCard key={question.id}>
          <QuestionEyebrow>{AXIS_LABEL[question.axis] ?? question.axis} 축</QuestionEyebrow>
          <QuestionText>{question.text}</QuestionText>
          {question.context && (
            <ContextToggle
              type="button"
              onClick={() => setContextOpen((v) => !v)}
              aria-expanded={contextOpen}
            >
              {contextOpen ? <X size={14} /> : <HelpCircle size={14} />}
              <span>{contextOpen ? "닫기" : "이 질문이 뭔가요?"}</span>
            </ContextToggle>
          )}
          {contextOpen && question.context && (
            <ContextCard>{question.context}</ContextCard>
          )}
        </QuestionCard>
      </QuestionStage>

      <AnswerGrid>
        <AnswerInstruction>가장 가까운 입장을 고르세요</AnswerInstruction>
        {likertOptions.map((option) => (
          <AnswerButton
            key={option.label}
            type="button"
            data-cursor-target="onboarding-answer"
            onClick={() => void handleAnswer(option.value)}
            disabled={!canAnswer}
            $selected={currentSelection === option.value}
          >
            <span>{option.label}</span>
          </AnswerButton>
        ))}
      </AnswerGrid>

      <TargetCursor
        targetSelector='[data-cursor-target="onboarding-answer"]'
        spinDuration={3.2}
        hoverDuration={0.14}
      />
    </>
  );
}

const ProgressText = styled.div`
  color: #8b95a1;
  font-size: 14px;
  font-weight: 500;
`;

const AnswerInstruction = styled.p`
  margin: 0 0 4px;
  font-size: 13px;
  font-weight: 500;
  color: #8b95a1;
`;

const ProgressBar = styled.div`
  height: 4px;
  margin-top: 24px;
  border-radius: 999px;
  background: #f2f4f6;
  overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  border-radius: inherit;
  background: #191f28;
  transition: width 220ms ease;
`;

const QuestionStage = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 32px;
`;

const QuestionMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const QuestionCard = styled.div`
  padding: 24px 0;
  border-top: 1px solid #f2f4f6;
  border-bottom: 1px solid #f2f4f6;
  animation: fadeIn 200ms ease;

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const QuestionEyebrow = styled.div`
  color: #8b95a1;
  font-size: 14px;
  font-weight: 500;
`;

const QuestionText = styled.p`
  margin: 12px 0 0;
  color: #191f28;
  font-size: 24px;
  font-weight: 700;
  line-height: 1.4;
  word-break: keep-all;

  @media (max-width: 640px) {
    font-size: 18px;
  }
`;

const ContextToggle = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-top: 14px;
  padding: 0;
  border: none;
  background: transparent;
  color: #8b95a1;
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  cursor: none;
  transition: color 150ms;

  &:hover {
    color: #4e5968;
  }
`;

const ContextCard = styled.div`
  margin-top: 10px;
  padding: 14px 16px;
  border-radius: 8px;
  background: #f2f4f6;
  color: #4e5968;
  font-size: 13px;
  font-weight: 400;
  line-height: 1.6;
  word-break: keep-all;
  animation: fadeIn 180ms ease;

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-4px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const AnswerGrid = styled.div`
  display: grid;
  margin-top: 32px;
  grid-template-columns: 1fr;
  gap: 8px;
`;

const AnswerButton = styled.button<{ $selected: boolean }>`
  display: flex;
  min-height: 44px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  color: #191f28;
  background: ${({ $selected }) => ($selected ? "#f4f6f8" : "#ffffff")};
  font-size: 16px;
  font-weight: ${({ $selected }) => ($selected ? 600 : 500)};
  text-align: left;
  cursor: none;
  transition: background 140ms ease;

  &:hover:enabled {
    background: #f4f6f8;
  }

  &:disabled {
    cursor: none;
    opacity: 0.6;
  }
`;

"use client";

import styled from "@/lib/styled";
import { TargetCursor } from "@/components/cursor/target-cursor";
import { questions, likertOptions } from "./questions";

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
          <QuestionEyebrow>{question.axis}</QuestionEyebrow>
          <QuestionText>{question.text}</QuestionText>
        </QuestionCard>
      </QuestionStage>

      <AnswerGrid>
        <AnswerInstruction>가장 가까운 입장을 고르세요</AnswerInstruction>
        {likertOptions.map((option) => (
          <AnswerButton
            key={option.label}
            type="button"
            data-cursor-target="onboarding-answer"
            onClick={() => void onAnswer(option.value)}
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
  cursor: pointer;
  transition: background 140ms ease;

  &:hover:enabled {
    background: #f4f6f8;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

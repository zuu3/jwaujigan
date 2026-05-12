"use client";

import styled from "@emotion/styled";
import { AnimatePresence, motion } from "framer-motion";
import { TargetCursor } from "@/components/cursor/target-cursor";
import { questions, likertOptions } from "./questions";
import { StatusLabel, StatusValue, StatusHint, SecondaryActionButton } from "./index";

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
      <DistrictSummaryCard>
        <DistrictSummaryText>
          <StatusLabel>선택한 지역구</StatusLabel>
          <StatusValue>{district ?? "설정되지 않음"}</StatusValue>
          {resolvedAddress ? <StatusHint>{resolvedAddress}</StatusHint> : null}
        </DistrictSummaryText>
        <SecondaryActionButton
          type="button"
          onClick={onBackToDistrictStep}
          disabled={isSubmitting}
        >
          다시 선택
        </SecondaryActionButton>
      </DistrictSummaryCard>

      <Header>
        <ProgressMeta>
          <ProgressText>
            질문 {currentIndex + 1} / {questions.length}
          </ProgressText>
          <ProgressTitle>가장 가까운 입장을 고르세요</ProgressTitle>
        </ProgressMeta>

        <ProgressBar>
          <ProgressFill style={{ width: `${progress}%` }} />
        </ProgressBar>
      </Header>

      <QuestionStage>
        <AnimatePresence mode="wait">
          <QuestionCard
            key={question.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <QuestionEyebrow>{question.axis}</QuestionEyebrow>
            <QuestionText>{question.text}</QuestionText>
          </QuestionCard>
        </AnimatePresence>
      </QuestionStage>

      <AnswerGrid>
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

const DistrictSummaryCard = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 40px;
  padding: 16px 0;
  border-top: 1px solid #f2f4f6;
  border-bottom: 1px solid #f2f4f6;

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const DistrictSummaryText = styled.div`
  display: grid;
  gap: 4px;
`;

const Header = styled.div`
  margin-top: 32px;
`;

const ProgressMeta = styled.div`
  display: grid;
  gap: 8px;
`;

const ProgressText = styled.div`
  color: #8b95a1;
  font-size: 14px;
  font-weight: 500;
`;

const ProgressTitle = styled.h1`
  margin: 0;
  color: #191f28;
  font-size: 24px;
  font-weight: 700;
  line-height: 1.35;
  word-break: keep-all;

  @media (max-width: 640px) {
    font-size: 18px;
  }
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
  margin-top: 32px;
`;

const QuestionCard = styled(motion.div)`
  padding: 24px 0;
  border-top: 1px solid #f2f4f6;
  border-bottom: 1px solid #f2f4f6;
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

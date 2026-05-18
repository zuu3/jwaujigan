"use client";

import styled from "@/lib/styled";
import { BarChart3, ArrowRight } from "lucide-react";
import { useState } from "react";
import type { PoliticalProfile } from "@/types/mypage";
import { clampScore, formatDate } from "@/lib/mypage-utils";
import {
  Section,
  SectionHeader,
  SectionKicker,
  SectionDate,
  EmptyState,
  EmptyTitle,
  EmptyText,
  PrimaryLink,
} from "./shared-styles";

export interface PoliticalProfileSectionProps {
  politicalProfile: PoliticalProfile | null;
}

export function PoliticalProfileSection({
  politicalProfile,
}: PoliticalProfileSectionProps) {
  const completedAt = politicalProfile?.completed_at ?? null;
  const [politicalDetailOpen, setPoliticalDetailOpen] = useState(false);

  return (
    <Section>
      <SectionHeader>
        <SectionKicker>
          <BarChart3 size={14} />
          <span>정치 성향</span>
        </SectionKicker>
        {completedAt ? (
          <SectionDate>{formatDate(completedAt)} 완료</SectionDate>
        ) : null}
      </SectionHeader>

      {politicalProfile ? (
        <>
          <PoliticalTypeHero>
            <PoliticalTypeBadge>나의 정치 성향</PoliticalTypeBadge>
            <PoliticalType>{politicalProfile.political_type}</PoliticalType>
          </PoliticalTypeHero>
          <PoliticalDetail>
            <PoliticalDetailToggle
              type="button"
              onClick={() => setPoliticalDetailOpen((o) => !o)}
              aria-expanded={politicalDetailOpen}
            >
              {politicalDetailOpen ? "상세 좌표 접기" : "상세 좌표 보기"}
            </PoliticalDetailToggle>
            {politicalDetailOpen ? (
              <>
                <PoliticalMap profile={politicalProfile} />
                <SecurityBar score={politicalProfile.security_score} />
              </>
            ) : null}
          </PoliticalDetail>
        </>
      ) : (
        <EmptyState>
          <EmptyTitle>아직 정치 성향 분석을 하지 않았습니다.</EmptyTitle>
          <EmptyText>
            15문항에 답하면 경제·사회·안보 3축으로 분석한 나만의 성향 타입이
            나옵니다.
          </EmptyText>
          <PrimaryLink href="/onboarding">
            3분 성향 테스트 시작하기
            <ArrowRight size={14} />
          </PrimaryLink>
        </EmptyState>
      )}
    </Section>
  );
}

/* ── Sub-components ───────────────────────────────────── */

function getScoreDirection({
  score,
  positiveLabel,
  negativeLabel,
}: {
  score: number;
  positiveLabel: string;
  negativeLabel: string;
}) {
  const clampedScore = clampScore(score);
  if (Math.abs(clampedScore) < 5) return "중립";
  return `${clampedScore > 0 ? positiveLabel : negativeLabel} ${Math.abs(clampedScore)}`;
}

const CHART_SIZE = 280;
const CHART_CENTER = CHART_SIZE / 2;
const CHART_PADDING = 32;
const CHART_RANGE = CHART_CENTER - CHART_PADDING;

function PoliticalMap({ profile }: { profile: PoliticalProfile }) {
  const economicScore = clampScore(profile.economic_score);
  const socialScore = clampScore(profile.social_score);
  const x = CHART_CENTER - (economicScore / 100) * CHART_RANGE;
  const y = CHART_CENTER - (socialScore / 100) * CHART_RANGE;

  return (
    <MapPanel>
      <MapHeader>
        <MapTitle>정치 좌표</MapTitle>
        <MapSummary>
          {getScoreDirection({
            score: economicScore,
            positiveLabel: "경제 진보",
            negativeLabel: "경제 보수",
          })}
          {" · "}
          {getScoreDirection({
            score: socialScore,
            positiveLabel: "사회 개방",
            negativeLabel: "사회 전통",
          })}
        </MapSummary>
      </MapHeader>
      <ChartFrame>
        <svg
          width="100%"
          viewBox={`0 0 ${CHART_SIZE} ${CHART_SIZE}`}
          role="img"
          aria-label="정치 좌표 그래프"
        >
          <line
            x1={CHART_PADDING}
            y1={CHART_CENTER}
            x2={CHART_SIZE - CHART_PADDING}
            y2={CHART_CENTER}
            stroke="#e5e8eb"
            strokeWidth={1}
          />
          <line
            x1={CHART_CENTER}
            y1={CHART_PADDING}
            x2={CHART_CENTER}
            y2={CHART_SIZE - CHART_PADDING}
            stroke="#e5e8eb"
            strokeWidth={1}
          />
          <text x={CHART_PADDING + 4} y={CHART_CENTER - 6} fontSize={11} fill="#8b95a1">
            진보
          </text>
          <text
            x={CHART_SIZE - CHART_PADDING - 4}
            y={CHART_CENTER - 6}
            fontSize={11}
            fill="#8b95a1"
            textAnchor="end"
          >
            보수
          </text>
          <text x={CHART_CENTER + 4} y={CHART_PADDING + 12} fontSize={11} fill="#8b95a1">
            개방
          </text>
          <text
            x={CHART_CENTER + 4}
            y={CHART_SIZE - CHART_PADDING - 4}
            fontSize={11}
            fill="#8b95a1"
          >
            전통
          </text>
          <circle cx={x} cy={y} r={10} fill="#3182f6" />
          <text
            x={x}
            y={y + 4}
            fontSize={11}
            fill="#FFFFFF"
            textAnchor="middle"
            fontWeight={700}
          >
            나
          </text>
        </svg>
      </ChartFrame>
    </MapPanel>
  );
}

function SecurityBar({ score }: { score: number }) {
  const clampedScore = clampScore(score);
  const isPositive = clampedScore >= 0;
  const fillRatio = Math.abs(clampedScore) / 100;
  const fillWidth = `${fillRatio * 50}%`;
  const fillLeft = isPositive ? `${50 - fillRatio * 50}%` : "50%";
  const fillColor = isPositive ? "#3182f6" : "#e5484d";

  return (
    <AxisItem>
      <AxisHeader>
        <AxisTitle>안보 축</AxisTitle>
        <AxisScore>{clampedScore > 0 ? `+${clampedScore}` : clampedScore}</AxisScore>
      </AxisHeader>
      <AxisTrack>
        <AxisFill $color={fillColor} $left={fillLeft} $width={fillWidth} />
        <AxisCenter />
      </AxisTrack>
      <AxisLabels>
        <span>대화</span>
        <span>안보</span>
      </AxisLabels>
    </AxisItem>
  );
}

/* ── Styled components ────────────────────────────────── */

const PoliticalTypeHero = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 24px 0 8px;
`;

const PoliticalTypeBadge = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: #8b95a1;
`;

const PoliticalDetail = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const PoliticalDetailToggle = styled.button`
  align-self: flex-start;
  padding: 6px 12px;
  border: 1px solid #e5e8eb;
  border-radius: 9999px;
  background: transparent;
  color: #6b7684;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 140ms ease-out;

  &:hover {
    background: #f2f4f6;
  }

  &:focus-visible {
    outline: 2px solid #3182f6;
    outline-offset: 2px;
  }
`;

const PoliticalType = styled.div`
  color: #191f28;
  font-size: 24px;
  font-weight: 700;
  line-height: 1.3;
  word-break: keep-all;
`;

const MapPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const MapHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  @media (max-width: 560px) {
    align-items: flex-start;
    flex-direction: column;
  }
`;

const MapTitle = styled.div`
  color: #191f28;
  font-size: 16px;
  font-weight: 600;
`;

const MapSummary = styled.div`
  color: #4E5968;
  font-size: 14px;
  font-weight: 500;
`;

const ChartFrame = styled.div`
  width: 100%;
  max-width: 360px;
  margin: 0 auto;

  & > svg {
    display: block;
  }
`;

const AxisItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const AxisHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const AxisTitle = styled.div`
  color: #191f28;
  font-size: 16px;
  font-weight: 600;
`;

const AxisScore = styled.div`
  color: #4E5968;
  font-size: 14px;
  font-weight: 600;
`;

const AxisTrack = styled.div`
  position: relative;
  height: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: #f2f4f6;
`;

const AxisCenter = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  width: 1px;
  background: #e5e8eb;
`;

const AxisFill = styled("div", {
  shouldForwardProp: (prop) =>
    prop !== "$color" && prop !== "$left" && prop !== "$width",
})<{ $color: string; $left: string; $width: string }>`
  position: absolute;
  top: 0;
  bottom: 0;
  left: ${({ $left }) => $left};
  width: ${({ $width }) => $width};
  border-radius: 999px;
  background: ${({ $color }) => $color};
`;

const AxisLabels = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #8b95a1;
  font-size: 14px;
  font-weight: 500;
`;

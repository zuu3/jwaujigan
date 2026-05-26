"use client";

import styled from "@/lib/styled";
import { Activity, ArrowRight } from "lucide-react";
import type { ActivityResponse, BattleInsights } from "@/types/mypage";
import { formatDate, getActivityTypeLabel, getActivityTypeTone } from "@/lib/mypage-utils";
import {
  Section,
  SectionHeader,
  SectionKicker,
  SectionDate,
  EmptyState,
  EmptyTitle,
  EmptyText,
  PrimaryLink,
  SkeletonBlock,
} from "./shared-styles";

export interface ActivitySectionProps {
  activityData: ActivityResponse | null;
}

export function ActivitySection({ activityData }: ActivitySectionProps) {
  return (
    <Section>
      <SectionHeader>
        <SectionKicker>
          <Activity size={14} />
          <span>내 활동</span>
        </SectionKicker>
        {activityData ? (
          <SectionDate>총 {activityData.summary.total_issues}개 이슈 참여</SectionDate>
        ) : null}
      </SectionHeader>

      {activityData ? (
        activityData.summary.total_issues === 0 ? (
          <EmptyState>
            <EmptyTitle>아직 참여한 이슈가 없습니다</EmptyTitle>
            <EmptyText>
              이슈에 투표하거나 배틀을 완료하면 나의 정치 활동 흐름이 여기에
              쌓입니다.
            </EmptyText>
            <PrimaryLink href="/home">
              오늘의 핫이슈 보기
              <ArrowRight size={14} />
            </PrimaryLink>
          </EmptyState>
        ) : (
          <>
            <ActivitySummaryCard>
              <SummaryBlock>
                <SummaryLabel>이슈 참여</SummaryLabel>
                <SummaryValue>{activityData.summary.total_issues}</SummaryValue>
              </SummaryBlock>
              <SummaryDivider />
              <SummaryBlock>
                <SummaryLabel>투표 성향</SummaryLabel>
                <VoteRatioBar ratio={activityData.summary.vote_ratio} />
              </SummaryBlock>
              {activityData.summary.last_orientation ? (
                <>
                  <SummaryDivider />
                  <SummaryBlock>
                    <SummaryLabel>마지막 성향</SummaryLabel>
                    <SummaryOrientationType>
                      {activityData.summary.last_orientation.type}
                    </SummaryOrientationType>
                    <SummaryDate>
                      {formatDate(activityData.summary.last_orientation.date)}
                    </SummaryDate>
                  </SummaryBlock>
                </>
              ) : null}
            </ActivitySummaryCard>

            {activityData.battle_insights && activityData.battle_insights.total > 0 ? (
              <BattleInsightsCard insights={activityData.battle_insights} />
            ) : null}

            <Timeline as="ul">
              {activityData.activities.map((item, i) => (
                <TimelineItem
                  as="li"
                  key={`${item.type}-${item.created_at}-${i}`}
                >
                  <TimelineDot
                    $tone={getActivityTypeTone(item.type)}
                    aria-hidden="true"
                  />
                  <TimelineContent>
                    <TimelineTypeBadge $tone={getActivityTypeTone(item.type)}>
                      {getActivityTypeLabel(item.type)}
                    </TimelineTypeBadge>
                    <TimelineLabel>{item.label}</TimelineLabel>
                    <TimelineDate>{formatDate(item.created_at)}</TimelineDate>
                  </TimelineContent>
                </TimelineItem>
              ))}
            </Timeline>
          </>
        )
      ) : (
        <ActivitySkeleton>
          <SkeletonBlock $h={80} />
          <SkeletonBlock $h={52} />
          <SkeletonBlock $h={52} />
          <SkeletonBlock $h={52} />
        </ActivitySkeleton>
      )}
    </Section>
  );
}

/* ── Sub-component ────────────────────────────────────── */

function VoteRatioBar({
  ratio,
}: {
  ratio: { progressive: number; conservative: number; neutral: number };
}) {
  const total = ratio.progressive + ratio.conservative + ratio.neutral;
  if (total === 0)
    return (
      <SummaryValue style={{ fontSize: 14, color: "#8b95a1" }}>
        투표 없음
      </SummaryValue>
    );
  const pPct = Math.round((ratio.progressive / total) * 100);
  const cPct = Math.round((ratio.conservative / total) * 100);
  const nPct = 100 - pPct - cPct;

  return (
    <VoteRatioWrap>
      <VoteRatioTrack>
        {pPct > 0 && <VoteRatioSegment $color="#3182f6" $pct={pPct} />}
        {nPct > 0 && <VoteRatioSegment $color="#b0b8c1" $pct={nPct} />}
        {cPct > 0 && <VoteRatioSegment $color="#e5484d" $pct={cPct} />}
      </VoteRatioTrack>
      <VoteRatioLegend>
        <VoteRatioLegendItem $color="#3182f6">진보 {pPct}%</VoteRatioLegendItem>
        <VoteRatioLegendItem $color="#b0b8c1">중립 {nPct}%</VoteRatioLegendItem>
        <VoteRatioLegendItem $color="#e5484d">보수 {cPct}%</VoteRatioLegendItem>
      </VoteRatioLegend>
    </VoteRatioWrap>
  );
}

/* ── Styled components ────────────────────────────────── */

const ActivitySummaryCard = styled.div`
  display: flex;
  gap: 0;
  border: 1px solid #e5e8eb;
  border-radius: 12px;
  overflow: hidden;

  @media (max-width: 560px) {
    flex-direction: column;
  }
`;

const SummaryBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  padding: 20px;
`;

const SummaryDivider = styled.div`
  width: 1px;
  background: #e5e8eb;
  flex-shrink: 0;

  @media (max-width: 560px) {
    width: auto;
    height: 1px;
  }
`;

const SummaryLabel = styled.div`
  color: #8b95a1;
  font-size: 12px;
  font-weight: 600;
`;

const SummaryValue = styled.div`
  color: #191f28;
  font-size: 28px;
  font-weight: 700;
  line-height: 1;
  font-variant-numeric: tabular-nums;
`;

const SummaryOrientationType = styled.div`
  color: #191f28;
  font-size: 15px;
  font-weight: 700;
  word-break: keep-all;
`;

const SummaryDate = styled.div`
  color: #8b95a1;
  font-size: 12px;
  font-weight: 500;
`;

const VoteRatioWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const VoteRatioTrack = styled.div`
  display: flex;
  height: 8px;
  border-radius: 9999px;
  overflow: hidden;
  gap: 2px;
`;

const VoteRatioSegment = styled.div<{ $color: string; $pct: number }>`
  flex: ${({ $pct }) => $pct};
  background: ${({ $color }) => $color};
`;

const VoteRatioLegend = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
`;

const VoteRatioLegendItem = styled.span<{ $color: string }>`
  font-size: 11px;
  font-weight: 600;
  color: ${({ $color }) => $color};
  font-variant-numeric: tabular-nums;
`;

const Timeline = styled.div`
  display: flex;
  flex-direction: column;
  padding-left: 0;
  list-style: none;
  margin: 0;
  padding: 0;
`;

const TimelineItem = styled.div`
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 14px 0;

  &:not(:last-of-type) {
    border-bottom: 1px solid #f2f4f6;
  }
`;

const TimelineDot = styled.div<{ $tone: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ $tone }) => $tone};
  flex-shrink: 0;
  margin-top: 6px;
`;

const TimelineContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
`;

const TimelineTypeBadge = styled.span<{ $tone: string }>`
  display: inline-block;
  width: fit-content;
  padding: 2px 7px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  background: ${({ $tone }) => $tone}18;
  color: ${({ $tone }) => $tone};
`;

const TimelineLabel = styled.div`
  color: #191f28;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.5;
  word-break: keep-all;
`;

const TimelineDate = styled.div`
  color: #8b95a1;
  font-size: 12px;
  font-weight: 500;
`;

const ActivitySkeleton = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

/* ── BattleInsightsCard ───────────────────────────────── */

function BattleInsightsCard({ insights }: { insights: BattleInsights }) {
  return (
    <BattleInsightWrap>
      <BattleInsightTitle>배틀 {insights.total}전</BattleInsightTitle>
    </BattleInsightWrap>
  );
}

const BattleInsightWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 20px;
  border: 1px solid #e5e8eb;
  border-radius: 12px;
  margin-bottom: 4px;
`;

const BattleInsightTitle = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: #8b95a1;
`;


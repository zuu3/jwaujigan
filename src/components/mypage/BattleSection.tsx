"use client";

import styled from "@/lib/styled";
import { Swords, ArrowRight } from "lucide-react";
import type { BattleLogItem } from "@/types/mypage";
import { formatDate } from "@/lib/mypage-utils";
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

export interface BattleSectionProps {
  battleLogs: BattleLogItem[];
}

export function BattleSection({ battleLogs }: BattleSectionProps) {
  const recentBattleLogs = battleLogs.slice(0, 5);

  return (
    <Section>
      <SectionHeader>
        <SectionKicker>
          <Swords size={14} />
          <span>배틀 전적</span>
        </SectionKicker>
        <SectionDate>전체 {battleLogs.length}전</SectionDate>
      </SectionHeader>

      {recentBattleLogs.length > 0 ? (
        <>
          <BattleList>
            {recentBattleLogs.map((log) => (
              <BattleItem key={log.id}>
                <BattleTopic>{log.topic}</BattleTopic>
                <BattleMeta>
                  <span>{formatDate(log.created_at)}</span>
                </BattleMeta>
              </BattleItem>
            ))}
          </BattleList>
        </>
      ) : (
        <EmptyState>
          <EmptyTitle>아직 배틀 기록이 없습니다</EmptyTitle>
          <EmptyText>
            이슈에 투표한 뒤 진보 AI와 보수 AI의 논쟁을 직접 판정해 보세요.
          </EmptyText>
          <PrimaryLink href="/home">
            이슈 보러 가기
            <ArrowRight size={14} />
          </PrimaryLink>
        </EmptyState>
      )}
    </Section>
  );
}

/* ── Styled components ────────────────────────────────── */

const BattleList = styled.div`
  display: flex;
  flex-direction: column;
`;

const BattleItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 0;
  border-bottom: 1px solid #f2f4f6;

  &:last-of-type {
    border-bottom: 0;
  }

  @media (max-width: 560px) {
    align-items: flex-start;
    flex-direction: column;
  }
`;

const BattleTopic = styled.div`
  color: #191f28;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.5;
  word-break: keep-all;
`;

const BattleMeta = styled.div`
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 12px;
  color: #8b95a1;
  font-size: 14px;
  font-weight: 500;
`;


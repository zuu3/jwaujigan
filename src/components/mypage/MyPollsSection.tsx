"use client";

import styled from "@/lib/styled";
import { BarChart2, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { MyPollItem } from "@/app/api/me/polls/route";
import {
  Section,
  SectionHeader,
  SectionKicker,
  EmptyState,
  EmptyTitle,
  EmptyText,
  PrimaryLink,
  SkeletonBlock,
} from "./shared-styles";

export interface MyPollsSectionProps {
  polls: MyPollItem[] | null;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`;
}

export function MyPollsSection({ polls }: MyPollsSectionProps) {
  return (
    <Section>
      <SectionHeader>
        <SectionKicker>
          <BarChart2 size={14} />
          <span>내가 만든 투표</span>
        </SectionKicker>
      </SectionHeader>

      {polls === null ? (
        <SkeletonWrap>
          <SkeletonBlock $h={72} />
          <SkeletonBlock $h={72} />
        </SkeletonWrap>
      ) : polls.length === 0 ? (
        <EmptyState>
          <EmptyTitle>아직 만든 투표가 없습니다</EmptyTitle>
          <EmptyText>민심 투표를 만들면 참여 현황을 여기서 확인할 수 있습니다.</EmptyText>
          <PrimaryLink href="/polls">
            투표 만들러 가기
            <ArrowRight size={14} />
          </PrimaryLink>
        </EmptyState>
      ) : (
        <PollList>
          {polls.map((poll) => (
            <PollCardLink key={poll.id} href={`/polls/${poll.id}`}>
              <PollQuestion>{poll.question}</PollQuestion>
              <PollMeta>
                <PollVoteCount>{poll.total_votes.toLocaleString()}명 참여</PollVoteCount>
                <PollDate>{formatDate(poll.created_at)}</PollDate>
              </PollMeta>
              {poll.total_votes > 0 ? (
                <OptionBars>
                  {poll.options.map((opt) => {
                    const count = poll.option_counts[opt.id] ?? 0;
                    const pct = Math.round((count / poll.total_votes) * 100);
                    return (
                      <OptionBarRow key={opt.id}>
                        <OptionBarLabel>{opt.text}</OptionBarLabel>
                        <OptionBarTrack>
                          <OptionBarFill $pct={pct} />
                        </OptionBarTrack>
                        <OptionBarPct>{pct}%</OptionBarPct>
                      </OptionBarRow>
                    );
                  })}
                </OptionBars>
              ) : null}
            </PollCardLink>
          ))}
        </PollList>
      )}
    </Section>
  );
}

const SkeletonWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const PollList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const PollCardLink = styled(Link)`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px 20px;
  border: 1px solid #e5e8eb;
  border-radius: 12px;
  background: #ffffff;
  text-decoration: none;
  color: inherit;

  &:hover {
    background: #f9fafb;
  }
`;

const PollQuestion = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #191f28;
  line-height: 1.5;
  word-break: keep-all;
`;

const PollMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const PollVoteCount = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: #3182f6;
  font-variant-numeric: tabular-nums;
`;

const PollDate = styled.span`
  font-size: 12px;
  color: #8b95a1;
`;

const OptionBars = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const OptionBarRow = styled.div`
  display: grid;
  grid-template-columns: 1fr auto 36px;
  align-items: center;
  gap: 8px;
`;

const OptionBarLabel = styled.span`
  font-size: 12px;
  color: #4e5968;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const OptionBarTrack = styled.div`
  height: 6px;
  border-radius: 9999px;
  background: #f2f4f6;
  overflow: hidden;
  min-width: 60px;
`;

const OptionBarFill = styled.div<{ $pct: number }>`
  height: 100%;
  border-radius: 9999px;
  background: #3182f6;
  width: ${({ $pct }) => $pct}%;
`;

const OptionBarPct = styled.span`
  font-size: 11px;
  font-weight: 600;
  color: #191f28;
  font-variant-numeric: tabular-nums;
  text-align: right;
`;

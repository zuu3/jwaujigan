"use client";

import styled from "@/lib/styled";
import { ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";
import { memo, useEffect, useState } from "react";
import type { HotIssue } from "@/types/issue";

type IssueDetailProps = {
  issue: HotIssue;
};

type VerdictCounts = { progressive: number; conservative: number; draw: number; total: number };

function formatPublishedAt(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`;
}

export function BillStatusBadge({ status }: { status: string | null }) {
  if (!status) return null;
  const color =
    status === "통과" ? "#03b26c" :
    status === "폐기" ? "#8b95a1" :
    "#fe9800";
  return <BillStatusChip $color={color}>{status}</BillStatusChip>;
}

const IssueOpinionSnapshot = memo(function IssueOpinionSnapshot({ issueId }: { issueId: string }) {
  const [counts, setCounts] = useState<VerdictCounts | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/arena/verdict?issueId=${issueId}`, { signal: controller.signal })
      .then((r) => r.json() as Promise<{ counts: VerdictCounts }>)
      .then(({ counts: c }) => { if (c.total > 0) setCounts(c); })
      .catch((e: unknown) => { if (e instanceof Error && e.name !== "AbortError") console.error(e); });
    return () => controller.abort();
  }, [issueId]);

  if (!counts) return null;

  const bars: { side: keyof Omit<VerdictCounts, "total">; label: string; color: string; tint: string }[] = [
    { side: "progressive", label: "진보 AI 우세", color: "#3182f6", tint: "#e8f3ff" },
    { side: "draw",        label: "무승부",       color: "#4e5968", tint: "#f2f4f6" },
    { side: "conservative",label: "보수 AI 우세", color: "#e5484d", tint: "#fef2f2" },
  ];

  return (
    <OpinionSnapshot>
      <OpinionSnapshotHeader>
        <OpinionSnapshotTitle>여론 현황</OpinionSnapshotTitle>
        <OpinionSnapshotMeta>배틀 참여자 {counts.total.toLocaleString()}명의 판정</OpinionSnapshotMeta>
      </OpinionSnapshotHeader>
      <OpinionBarList>
        {bars.map(({ side, label, color, tint }) => {
          const pct = Math.round((counts[side] / counts.total) * 100);
          return (
            <OpinionBarRow key={side}>
              <OpinionBarLabel $color={color}>{label}</OpinionBarLabel>
              <OpinionBarTrack $tint={tint}>
                <OpinionBarFill $color={color} $pct={pct} />
              </OpinionBarTrack>
              <OpinionBarPct>{pct}%</OpinionBarPct>
            </OpinionBarRow>
          );
        })}
      </OpinionBarList>
    </OpinionSnapshot>
  );
});

export function ArenaIssueDetail({ issue }: IssueDetailProps) {
  const hasMeta = issue.proposer || issue.committee || issue.bill_status || issue.published_at;
  const isExpired = issue.expires_at ? new Date(issue.expires_at) < new Date() : false;

  return (
    <Page>
      <Shell>
        <BackLink href="/arena">
          <ArrowLeft size={16} />
          <span>다른 이슈 보기</span>
        </BackLink>

        {isExpired ? (
          <ExpiredBanner>
            이 이슈는 투표가 종료됐습니다.
            {issue.bill_status ? (
              <> 최종 법안 상태: <BillStatusBadge status={issue.bill_status} /></>
            ) : null}
          </ExpiredBanner>
        ) : null}

        <DetailPanel>
          <HeroEyebrow>어느 쪽 논리가 더 설득력 있을까요?</HeroEyebrow>
          <DetailTitle>{issue.title}</DetailTitle>
          <DetailSummary>{issue.summary}</DetailSummary>

          {hasMeta ? (
            <BillMetaRow>
              {issue.proposer ? (
                <BillMetaItem>
                  <BillMetaLabel>제안자</BillMetaLabel>
                  <BillMetaValue>{issue.proposer}</BillMetaValue>
                </BillMetaItem>
              ) : null}
              {issue.committee ? (
                <BillMetaItem>
                  <BillMetaLabel>소관위원회</BillMetaLabel>
                  <BillMetaValue>{issue.committee}</BillMetaValue>
                </BillMetaItem>
              ) : null}
              {issue.published_at ? (
                <BillMetaItem>
                  <BillMetaLabel>제안일</BillMetaLabel>
                  <BillMetaValue>{formatPublishedAt(issue.published_at)}</BillMetaValue>
                </BillMetaItem>
              ) : null}
              {issue.bill_status ? (
                <BillMetaItem>
                  <BillMetaLabel>법안 상태</BillMetaLabel>
                  <BillStatusBadge status={issue.bill_status} />
                </BillMetaItem>
              ) : null}
              {issue.source_url ? (
                <BillMetaSourceLink href={issue.source_url} target="_blank" rel="noopener noreferrer">
                  원문 보기
                  <ExternalLink size={13} />
                </BillMetaSourceLink>
              ) : null}
            </BillMetaRow>
          ) : null}

          <ContextGrid>
            <ContextBox>
              <ContextLabel $tone="#3182f6">진보 관점</ContextLabel>
              <ContextText>{issue.progressive}</ContextText>
            </ContextBox>
            <ContextBox>
              <ContextLabel $tone="#e5484d">보수 관점</ContextLabel>
              <ContextText>{issue.conservative}</ContextText>
            </ContextBox>
          </ContextGrid>

          <IssueOpinionSnapshot issueId={issue.id} />

          {!isExpired ? (
            <>
              <StanceGuide>편을 고르면 AI 토론 중에 내 생각을 추가할 수 있어요. 그냥 구경만 해도 됩니다.</StanceGuide>
              <StanceActions>
                <StanceButton
                  href={`/arena/${issue.id}/battle?stance=progressive`}
                  $tone="#3182f6"
                >
                  진보 편으로 참여
                </StanceButton>
                <StanceButton
                  href={`/arena/${issue.id}/battle?stance=conservative`}
                  $tone="#e5484d"
                >
                  보수 편으로 참여
                </StanceButton>
                <WatchButton href={`/arena/${issue.id}/battle?stance=watch`}>
                  구경만 할래요
                </WatchButton>
              </StanceActions>
            </>
          ) : null}

        </DetailPanel>
      </Shell>
    </Page>
  );
}

const Page = styled.main`
  min-height: 100vh;
  padding-bottom: 80px;
  color: #191f28;
  background: #ffffff;
  animation: fadeIn 200ms ease-out;

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @media (max-width: 640px) {
    padding-bottom: 64px;
  }
`;

const Shell = styled.div`
  display: grid;
  width: min(100%, 1120px);
  gap: 40px;
  margin: 0 auto;
  padding: 32px 24px 0;

  @media (max-width: 640px) {
    padding: 24px 20px 0;
  }
`;

const BackLink = styled(Link)`
  display: inline-flex;
  width: fit-content;
  align-items: center;
  gap: 6px;
  color: #4e5968;
  font-size: 14px;
  font-weight: 600;
`;

const BillMetaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 20px;
  padding: 16px 20px;
  border: 1px solid #e5e8eb;
  border-radius: 8px;
  background: #f2f4f6;
`;

const BillMetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const BillMetaLabel = styled.span`
  color: #8b95a1;
  font-size: 12px;
  font-weight: 600;
`;

const BillMetaValue = styled.span`
  color: #4e5968;
  font-size: 12px;
  font-weight: 400;
`;

const BillStatusChip = styled("span", {
  shouldForwardProp: (prop) => prop !== "$color",
})<{ $color: string }>`
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 4px;
  background: ${({ $color }) => `${$color}18`};
  color: ${({ $color }) => $color};
  font-size: 12px;
  font-weight: 600;
`;

const BillMetaSourceLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
  color: #3182f6;
  font-size: 12px;
  font-weight: 600;

  &:hover {
    text-decoration: underline;
  }

  @media (max-width: 480px) {
    margin-left: 0;
  }
`;

const ExpiredBanner = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 8px;
  background: #f2f4f6;
  border: 1px solid #e5e8eb;
  color: #6b7684;
  font-size: 14px;
  font-weight: 500;
`;

const DetailPanel = styled.section`
  display: grid;
  gap: 24px;
`;

const HeroEyebrow = styled.div`
  color: #4e5968;
  font-size: 14px;
  font-weight: 600;
`;

const DetailTitle = styled.h1`
  max-width: 860px;
  margin: 0;
  color: #191f28;
  font-size: 32px;
  font-weight: 700;
  line-height: 1.25;
  letter-spacing: -0.02em;
  word-break: keep-all;
`;

const DetailSummary = styled.p`
  max-width: 760px;
  margin: 0;
  color: #4e5968;
  font-size: 16px;
  font-weight: 400;
  line-height: 1.6;
`;

const ContextGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`;

const ContextBox = styled.div`
  display: grid;
  gap: 8px;
  padding: 20px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
`;

const ContextLabel = styled("div", {
  shouldForwardProp: (prop) => prop !== "$tone",
})<{ $tone: string }>`
  color: ${({ $tone }) => $tone};
  font-size: 14px;
  font-weight: 700;
`;

const ContextText = styled.p`
  margin: 0;
  color: #4e5968;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.6;
`;

const StanceGuide = styled.p`
  margin: 0;
  color: #6b7684;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.5;
`;

const StanceActions = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`;

const StanceButton = styled(Link, {
  shouldForwardProp: (prop) => prop !== "$tone",
})<{ $tone: string }>`
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  padding: 0 20px;
  color: #ffffff;
  background: ${({ $tone }) => $tone};
  font-size: 16px;
  font-weight: 600;
`;

const WatchButton = styled(Link)`
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  padding: 0 20px;
  color: #6b7684;
  background: transparent;
  border: 1px solid #e5e8eb;
  font-size: 15px;
  font-weight: 500;
  text-decoration: none;

  &:hover {
    background: #f2f4f6;
  }
`;

/* ── Issue Opinion Snapshot ───────────────────────────── */

const OpinionSnapshot = styled.div`
  display: grid;
  gap: 12px;
  padding: 20px;
  border: 1px solid #e5e8eb;
  border-radius: 12px;
  background: #f2f4f6;
`;

const OpinionSnapshotHeader = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
`;

const OpinionSnapshotTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #191f28;
`;

const OpinionSnapshotMeta = styled.div`
  font-size: 12px;
  color: #8b95a1;
  font-variant-numeric: tabular-nums;
`;

const OpinionBarList = styled.div`
  display: grid;
  gap: 8px;
`;

const OpinionBarRow = styled.div`
  display: grid;
  grid-template-columns: 88px 1fr 36px;
  align-items: center;
  gap: 10px;
`;

const OpinionBarLabel = styled.span<{ $color: string }>`
  font-size: 12px;
  font-weight: 600;
  color: ${({ $color }) => $color};
`;

const OpinionBarTrack = styled.div<{ $tint: string }>`
  height: 6px;
  border-radius: 9999px;
  background: ${({ $tint }) => $tint};
  overflow: hidden;
`;

const OpinionBarFill = styled.div<{ $color: string; $pct: number }>`
  height: 100%;
  border-radius: 9999px;
  background: ${({ $color }) => $color};
  transform: scaleX(${({ $pct }) => $pct / 100});
  transform-origin: left;
  transition: transform 400ms cubic-bezier(0.4, 0, 0.2, 1);

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const OpinionBarPct = styled.span`
  font-size: 12px;
  font-weight: 700;
  color: #191f28;
  font-variant-numeric: tabular-nums;
  text-align: right;
`;

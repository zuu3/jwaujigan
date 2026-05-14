"use client";

import styled from "@emotion/styled";
import { ArrowLeft, CheckCircle2, Clock, ExternalLink, HelpCircle, Landmark, Swords, User, X, XCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { AppHeader } from "@/components/app-header";
import type { HotIssue, IssueVoteCounts, IssueVoteStance } from "@/types/issue";

type IssueDetailContainerProps = {
  issue: HotIssue;
  initialBodyText?: string;
};

const STANCE_OPTIONS: { stance: IssueVoteStance; label: string; color: string; tint: string }[] = [
  { stance: "progressive", label: "진보 지지", color: "#3182f6", tint: "#e8f3ff" },
  { stance: "neutral",     label: "모르겠음",  color: "#8b95a1", tint: "#f2f4f6" },
  { stance: "conservative",label: "보수 지지", color: "#e5484d", tint: "#fef2f2" },
];

function VoteBar({ label, color, tint, pct }: { label: string; color: string; tint: string; pct: number }) {
  return (
    <VoteBarRow>
      <VoteBarLabel $color={color}>{label}</VoteBarLabel>
      <VoteBarTrack $tint={tint}>
        <VoteBarFill $color={color} $pct={pct} />
      </VoteBarTrack>
      <VoteBarPct>{pct}%</VoteBarPct>
    </VoteBarRow>
  );
}

function pct(count: number, total: number) {
  return total === 0 ? 0 : Math.round((count / total) * 100);
}

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`;
}

export function IssueDetailContainer({ issue: initialIssue, initialBodyText }: IssueDetailContainerProps) {
  const [issue, setIssue] = useState(initialIssue);
  // RSC는 null prop을 직렬화에서 드롭하므로 body는 별도 string prop으로 받아 merge
  const bodyText = initialBodyText || issue.body || null;
  const [isVoting, setIsVoting] = useState(false);
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);

  const { vote_counts: counts, user_vote } = issue;
  const hasMeta = issue.proposer || issue.committee || issue.bill_status || issue.published_at;

  async function handleVote(stance: IssueVoteStance) {
    if (isVoting) return;
    setIsVoting(true);

    const isToggle = user_vote === stance;
    const newVote = isToggle ? null : stance;

    // Optimistic update
    setIssue((prev) => {
      const next: IssueVoteCounts = { ...prev.vote_counts };
      if (prev.user_vote) next[prev.user_vote] = Math.max(0, next[prev.user_vote] - 1);
      if (newVote) next[newVote]++;
      next.total = next.progressive + next.conservative + next.neutral;
      return { ...prev, user_vote: newVote, vote_counts: next };
    });

    try {
      const res = await fetch(`/api/issues/${issue.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stance }),
      });
      if (!res.ok) {
        setIssue(initialIssue);
        return;
      }

      const data = await res.json() as { vote_counts: IssueVoteCounts; user_vote: IssueVoteStance | null };
      setIssue((prev) => ({ ...prev, vote_counts: data.vote_counts, user_vote: data.user_vote }));
    } catch {
      // rollback on error
      setIssue(initialIssue);
    } finally {
      setIsVoting(false);
    }
  }

  return (
    <Page>
      <AppHeader />
      <Shell>
        <BackLink href="/arena">
          <ArrowLeft size={16} />
          <span>다른 이슈 보기</span>
        </BackLink>

        <Article>
          <Header>
            <TitleRow>
              <IssueTitle>{issue.title}</IssueTitle>
              <MethodologyButton
                type="button"
                onClick={() => setIsMethodologyOpen((v) => !v)}
                aria-expanded={isMethodologyOpen}
                aria-label="이 콘텐츠가 어떻게 만들어졌는지 보기"
              >
                <HelpCircle size={18} />
              </MethodologyButton>
            </TitleRow>
            <IssueSummary>{issue.summary}</IssueSummary>
          </Header>

          {isMethodologyOpen && (
            <MethodologyPanel role="region" aria-label="콘텐츠 생성 방식">
              <MethodologyHead>
                <MethodologyTitle>이 콘텐츠는 어떻게 만들어지나요?</MethodologyTitle>
                <MethodologyClose
                  type="button"
                  onClick={() => setIsMethodologyOpen(false)}
                  aria-label="닫기"
                >
                  <X size={16} />
                </MethodologyClose>
              </MethodologyHead>

              <MethodologyBlock>
                <MethodologyLabel>데이터 출처</MethodologyLabel>
                <MethodologyText>
                  법안의 제목·제안자·소관위원회·상태는 국회 의안정보 Open API
                  (open.assembly.go.kr)에서 직접 가져옵니다. 본문 설명과 진보·보수
                  관점은 Google 검색으로 수집한 뉴스·국회 자료를 바탕으로 AI(Gemini)가
                  작성합니다.
                </MethodologyText>
              </MethodologyBlock>

              <MethodologyBlock>
                <MethodologyLabel>중립성 원칙</MethodologyLabel>
                <MethodologyText>
                  좌우지간은 어느 진영도 대변하지 않습니다. 진보·보수 관점은 동일한
                  분량과 동일한 시각적 비중으로 제시되며, 한쪽을 결론으로 유도하지
                  않습니다. 사실 진술과 의견을 구분해 표기합니다.
                </MethodologyText>
              </MethodologyBlock>

              <MethodologyBlock>
                <MethodologyLabel>한계와 주의사항</MethodologyLabel>
                <MethodologyText>
                  법안 원문이 공개 API로 제공되지 않는 경우, AI가 검색 결과와 법안명을
                  바탕으로 추론한 내용이 포함될 수 있습니다. 정확한 조항·표결·의결
                  내용은 반드시 아래 원문 링크에서 확인하세요.
                </MethodologyText>
              </MethodologyBlock>

              <MethodologyBlock>
                <MethodologyLabel>사용자 투표</MethodologyLabel>
                <MethodologyText>
                  &lsquo;사용자 의견&rsquo;의 진보 지지·모르겠음·보수 지지 통계는 좌우지간
                  사용자들의 자발적 투표만 집계한 것이며, 전체 여론을 대표하지
                  않습니다.
                </MethodologyText>
              </MethodologyBlock>

              {issue.source_url && (
                <MethodologySourceLink
                  href={issue.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  국회 의안정보시스템에서 원문 확인하기
                  <ExternalLink size={13} />
                </MethodologySourceLink>
              )}
            </MethodologyPanel>
          )}

          {hasMeta && (
            <MetaRow>
              {issue.proposer && (
                <MetaItem>
                  <MetaIcon><User size={12} /></MetaIcon>
                  <MetaValue>{issue.proposer}</MetaValue>
                </MetaItem>
              )}
              {issue.committee && (
                <MetaItem>
                  <MetaIcon><Landmark size={12} /></MetaIcon>
                  <MetaValue>{issue.committee}</MetaValue>
                </MetaItem>
              )}
              {issue.published_at && (
                <MetaItem>
                  <MetaIcon><Clock size={12} /></MetaIcon>
                  <MetaValue>{formatDate(issue.published_at)}</MetaValue>
                </MetaItem>
              )}
              {issue.bill_status && (
                <StatusChip $status={issue.bill_status}>
                  {issue.bill_status === "통과" && <CheckCircle2 size={12} />}
                  {issue.bill_status === "폐기" && <XCircle size={12} />}
                  {issue.bill_status === "계류 중" && <Clock size={12} />}
                  {issue.bill_status}
                </StatusChip>
              )}
              {issue.source_url && (
                <MetaSourceLink href={issue.source_url} target="_blank" rel="noopener noreferrer">
                  원문 보기
                  <ExternalLink size={13} />
                </MetaSourceLink>
              )}
            </MetaRow>
          )}

          {bodyText && (
            <BodySection>
              <BodyTitle>법안 상세 내용</BodyTitle>
              <BodyText>
                {bodyText.split("\n\n").map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </BodyText>
            </BodySection>
          )}

          <ViewpointGrid>
            <ViewpointBox $side="progressive">
              <ViewpointLabel $color="#3182f6">진보 관점</ViewpointLabel>
              <ViewpointText>{issue.progressive}</ViewpointText>
            </ViewpointBox>
            <ViewpointBox $side="conservative">
              <ViewpointLabel $color="#e5484d">보수 관점</ViewpointLabel>
              <ViewpointText>{issue.conservative}</ViewpointText>
            </ViewpointBox>
          </ViewpointGrid>

          <OpinionSection>
            <OpinionHeader>
              <OpinionTitle>사용자 의견</OpinionTitle>
              {counts.total > 0 && (
                <OpinionMeta>{counts.total.toLocaleString("ko-KR")}명 참여</OpinionMeta>
              )}
            </OpinionHeader>

            {counts.total > 0 ? (
              <VoteBarList>
                <VoteBar label="진보 지지" color="#3182f6" tint="#e8f3ff" pct={pct(counts.progressive, counts.total)} />
                <VoteBar label="모르겠음" color="#8b95a1" tint="#f2f4f6" pct={pct(counts.neutral, counts.total)} />
                <VoteBar label="보수 지지" color="#e5484d" tint="#fef2f2" pct={pct(counts.conservative, counts.total)} />
              </VoteBarList>
            ) : (
              <NoVotes>아직 의견을 남긴 사용자가 없어요. 첫 번째로 의견을 남겨보세요.</NoVotes>
            )}

            <VoteButtons>
              {STANCE_OPTIONS.map(({ stance, label, color, tint }) => (
                <VoteButton
                  key={stance}
                  type="button"
                  $color={color}
                  $tint={tint}
                  $active={user_vote === stance}
                  disabled={isVoting}
                  onClick={() => void handleVote(stance)}
                >
                  {label}
                </VoteButton>
              ))}
            </VoteButtons>
            {user_vote && (
              <VoteHint>다시 누르면 취소돼요.</VoteHint>
            )}
          </OpinionSection>

          <BattleCta>
            <BattleCtaLabel>
              <Swords size={16} />
              AI 배틀
            </BattleCtaLabel>
            <BattleCtaDesc>진보·보수 AI가 논쟁하는 걸 보고 판정해보세요.</BattleCtaDesc>
            <BattleCtaButtons>
              <BattleLink href={`/arena/${issue.id}/battle?stance=progressive`} $color="#3182f6">
                진보 편으로 참여
              </BattleLink>
              <BattleLink href={`/arena/${issue.id}/battle?stance=conservative`} $color="#e5484d">
                보수 편으로 참여
              </BattleLink>
              <BattleWatchLink href={`/arena/${issue.id}/battle?stance=watch`}>
                구경만 할래요
              </BattleWatchLink>
            </BattleCtaButtons>
          </BattleCta>
        </Article>
      </Shell>
    </Page>
  );
}

/* ── Styled components ──────────────────────────────────── */

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
  width: min(100%, 760px);
  gap: 32px;
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
  text-decoration: none;

  &:hover {
    color: #191f28;
  }
`;

const Article = styled.article`
  display: grid;
  gap: 32px;
`;

const Header = styled.div`
  display: grid;
  gap: 12px;
`;

const TitleRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 8px;
`;

const MethodologyButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  margin-top: 4px;
  flex-shrink: 0;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: #8b95a1;
  cursor: pointer;
  transition: background 140ms cubic-bezier(0.16, 1, 0.3, 1), color 140ms cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    background: #f2f4f6;
    color: #4e5968;
  }

  &[aria-expanded="true"] {
    background: #e8f3ff;
    color: #3182f6;
  }
`;

const MethodologyPanel = styled.section`
  display: grid;
  gap: 14px;
  padding: 20px;
  border: 1px solid #e5e8eb;
  border-radius: 12px;
  background: #f9fafb;
`;

const MethodologyHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const MethodologyTitle = styled.h3`
  margin: 0;
  color: #191f28;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: -0.01em;
`;

const MethodologyClose = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #8b95a1;
  cursor: pointer;

  &:hover {
    background: #e5e8eb;
    color: #4e5968;
  }
`;

const MethodologyBlock = styled.div`
  display: grid;
  gap: 4px;
`;

const MethodologyLabel = styled.div`
  color: #3182f6;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: -0.01em;
`;

const MethodologyText = styled.p`
  margin: 0;
  color: #4e5968;
  font-size: 13px;
  line-height: 1.7;
  word-break: keep-all;
`;

const MethodologySourceLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  width: fit-content;
  margin-top: 4px;
  padding: 8px 12px;
  border-radius: 8px;
  background: #ffffff;
  border: 1px solid #e5e8eb;
  color: #3182f6;
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  transition: background 140ms cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    background: #e8f3ff;
  }
`;

const IssueTitle = styled.h1`
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  line-height: 1.3;
  letter-spacing: -0.02em;
  color: #191f28;
  word-break: keep-all;

  @media (max-width: 640px) {
    font-size: 22px;
  }
`;

const IssueSummary = styled.p`
  margin: 0;
  font-size: 16px;
  font-weight: 400;
  line-height: 1.7;
  color: #4e5968;
  word-break: keep-all;
`;

const MetaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 20px;
  padding: 16px 20px;
  border: 1px solid #e5e8eb;
  border-radius: 8px;
  background: #f9fafb;
`;

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const MetaIcon = styled.span`
  display: inline-flex;
  align-items: center;
  color: #8b95a1;
  flex-shrink: 0;
`;

const MetaValue = styled.span`
  color: #4e5968;
  font-size: 12px;
  font-weight: 400;
`;

const StatusChip = styled.span<{ $status: string }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  background: ${({ $status }) =>
    $status === "통과" ? "#e8f3ff" :
    $status === "폐기" ? "#fef2f2" :
    "#fff7e6"};
  color: ${({ $status }) =>
    $status === "통과" ? "#3182f6" :
    $status === "폐기" ? "#e5484d" :
    "#fe9800"};
`;

const MetaSourceLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
  color: #3182f6;
  font-size: 12px;
  font-weight: 600;
  text-decoration: none;

  &:hover { text-decoration: underline; }

  @media (max-width: 480px) { margin-left: 0; }
`;

const BodySection = styled.section`
  display: grid;
  gap: 16px;
`;

const BodyTitle = styled.h2`
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #191f28;
`;

const BodyText = styled.div`
  display: grid;
  gap: 12px;

  p {
    margin: 0;
    font-size: 15px;
    font-weight: 400;
    line-height: 1.8;
    color: #333d4b;
    word-break: keep-all;
  }
`;

const ViewpointGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const ViewpointBox = styled.div<{ $side: "progressive" | "conservative" }>`
  display: grid;
  gap: 10px;
  padding: 20px;
  border-radius: 10px;
  background: ${({ $side }) => $side === "progressive" ? "#f0f7ff" : "#fff5f5"};
  border: 1px solid ${({ $side }) => $side === "progressive" ? "#d0e8ff" : "#ffd9d9"};
`;

const ViewpointLabel = styled.div<{ $color: string }>`
  font-size: 13px;
  font-weight: 700;
  color: ${({ $color }) => $color};
`;

const ViewpointText = styled.p`
  margin: 0;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.7;
  color: #333d4b;
  word-break: keep-all;
`;

const OpinionSection = styled.section`
  display: grid;
  gap: 16px;
  padding: 24px;
  border: 1px solid #e5e8eb;
  border-radius: 12px;
`;

const OpinionHeader = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
`;

const OpinionTitle = styled.h2`
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #191f28;
`;

const OpinionMeta = styled.span`
  font-size: 12px;
  color: #8b95a1;
  font-variant-numeric: tabular-nums;
`;

const VoteBarList = styled.div`
  display: grid;
  gap: 10px;
`;

const VoteBarRow = styled.div`
  display: grid;
  grid-template-columns: 72px 1fr 36px;
  align-items: center;
  gap: 10px;
`;

const VoteBarLabel = styled.span<{ $color: string }>`
  font-size: 12px;
  font-weight: 600;
  color: ${({ $color }) => $color};
`;

const VoteBarTrack = styled.div<{ $tint: string }>`
  height: 6px;
  border-radius: 9999px;
  background: ${({ $tint }) => $tint};
  overflow: hidden;
`;

const VoteBarFill = styled.div<{ $color: string; $pct: number }>`
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

const VoteBarPct = styled.span`
  font-size: 12px;
  font-weight: 700;
  color: #191f28;
  font-variant-numeric: tabular-nums;
  text-align: right;
`;

const NoVotes = styled.p`
  margin: 0;
  font-size: 14px;
  color: #8b95a1;
  line-height: 1.6;
`;

const VoteButtons = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const VoteButton = styled.button<{ $color: string; $tint: string; $active: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  padding: 0 16px;
  border-radius: 8px;
  border: 1.5px solid ${({ $active, $color }) => $active ? $color : "#e5e8eb"};
  background: ${({ $active, $tint }) => $active ? $tint : "#ffffff"};
  color: ${({ $active, $color }) => $active ? $color : "#4e5968"};
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 150ms;

  &:hover:not(:disabled) {
    border-color: ${({ $color }) => $color};
    color: ${({ $color }) => $color};
    background: ${({ $tint }) => $tint};
  }

  &:disabled {
    opacity: 0.6;
    cursor: default;
  }
`;

const VoteHint = styled.p`
  margin: 0;
  font-size: 12px;
  color: #b0b8c1;
`;

const BattleCta = styled.section`
  display: grid;
  gap: 12px;
  padding: 24px;
  border: 1px solid #e5e8eb;
  border-radius: 12px;
  background: #f9fafb;
`;

const BattleCtaLabel = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 700;
  color: #4e5968;
`;

const BattleCtaDesc = styled.p`
  margin: 0;
  font-size: 14px;
  color: #6b7684;
  line-height: 1.6;
`;

const BattleCtaButtons = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const BattleLink = styled(Link)<{ $color: string }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 44px;
  padding: 0 20px;
  border-radius: 8px;
  background: ${({ $color }) => $color};
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  transition: opacity 140ms;

  &:hover { opacity: 0.88; }
`;

const BattleWatchLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 44px;
  padding: 0 20px;
  border-radius: 8px;
  border: 1px solid #e5e8eb;
  background: #ffffff;
  color: #6b7684;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  transition: background 150ms;

  &:hover { background: #f2f4f6; }
`;

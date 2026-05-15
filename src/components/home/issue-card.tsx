"use client";

import styled from "@/lib/styled";
import { ArrowRight, CheckCircle2, ChevronDown, Clock, Landmark, User, XCircle } from "lucide-react";
import Link from "next/link";
import type { HotIssue, IssueVoteStance } from "@/types/issue";
import dynamic from "next/dynamic";

const TendencySection = dynamic(
  () => import("@/containers/community/tendency-section").then((m) => m.TendencySection),
  { ssr: false },
);

type VoteOption = {
  stance: IssueVoteStance;
  label: string;
  barLabel: string;
  color: string;
  tint: string;
};

const VOTE_OPTIONS: VoteOption[] = [
  { stance: "progressive", label: "진보 지지", barLabel: "진보", color: "#3182f6", tint: "#e8f3ff" },
  { stance: "neutral",     label: "모르겠음",  barLabel: "모름", color: "#8b95a1", tint: "#f2f4f6" },
  { stance: "conservative",label: "보수 지지", barLabel: "보수", color: "#e5484d", tint: "#fef2f2" },
];

function getVotePercent(count: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((count / total) * 100);
}

function getIssueLink(issue: HotIssue) {
  return `/issues/${issue.id}`;
}

function getIssueMetaLabel(issue: HotIssue) {
  if (issue.published_at) {
    return new Intl.DateTimeFormat("ko-KR", {
      month: "numeric",
      day: "numeric",
    }).format(new Date(issue.published_at));
  }

  if (issue.bill_id) {
    return issue.bill_id;
  }

  return "국회 발의안";
}

type IssueCardProps = {
  issue: HotIssue;
  isExpanded: boolean;
  showConservativeFirst: boolean;
  followedNames: Set<string>;
  isVoting: boolean;
  onToggleExpand: (id: string) => void;
  onVote: (issueId: string, stance: IssueVoteStance) => void;
};

export function IssueCard({
  issue,
  isExpanded,
  showConservativeFirst,
  followedNames,
  isVoting,
  onToggleExpand,
  onVote,
}: IssueCardProps) {
  return (
    <IssueItem>
      <IssueRow>
        <IssueRowMeta>{getIssueMetaLabel(issue)}</IssueRowMeta>
        <IssueRowBody href={getIssueLink(issue)}>
          <IssueTitle>{issue.title}</IssueTitle>
          <IssueSummary>{issue.summary}</IssueSummary>
          {(issue.committee ?? issue.proposer ?? issue.bill_status) ? (
            <IssueBodyMeta>
              {issue.bill_status ? (
                <BillStatusBadge $status={issue.bill_status}>
                  {issue.bill_status === "통과" && <CheckCircle2 size={11} />}
                  {issue.bill_status === "폐기" && <XCircle size={11} />}
                  {issue.bill_status === "계류 중" && <Clock size={11} />}
                  {issue.bill_status}
                </BillStatusBadge>
              ) : null}
              {issue.committee ? (
                <IssueMetaChip>
                  <Landmark size={11} />
                  {issue.committee}
                </IssueMetaChip>
              ) : null}
              {issue.proposer ? (() => {
                const isFollowed = [...followedNames].some((n) => issue.proposer!.includes(n));
                return (
                  <IssueMetaChip $dim={!isFollowed} $followed={isFollowed}>
                    <User size={11} />
                    {isFollowed ? "★ " : ""}{issue.proposer}
                  </IssueMetaChip>
                );
              })() : null}
            </IssueBodyMeta>
          ) : null}
        </IssueRowBody>
        <IssueActions>
          <IssueToggleButton
            type="button"
            onClick={() => onToggleExpand(issue.id)}
            aria-expanded={isExpanded}
          >
            입장 비교
            <IssueChevron $expanded={isExpanded}>
              <ChevronDown size={15} />
            </IssueChevron>
          </IssueToggleButton>
          <IssueTopLink href={getIssueLink(issue)}>
            AI 배틀
            <ArrowRight size={15} />
          </IssueTopLink>
        </IssueActions>
      </IssueRow>

      {isExpanded ? (
        <IssueExpanded>
          <IssueComparisonList>
            {(showConservativeFirst ? [
              { tone: "red" as const, label: "보수", text: issue.conservative },
              { tone: "blue" as const, label: "진보", text: issue.progressive },
            ] : [
              { tone: "blue" as const, label: "진보", text: issue.progressive },
              { tone: "red" as const, label: "보수", text: issue.conservative },
            ]).map(({ tone, label, text }) => (
              <IssueComparisonRow key={label}>
                <IssueLabel $tone={tone}>{label}</IssueLabel>
                <IssueText>{text}</IssueText>
              </IssueComparisonRow>
            ))}
          </IssueComparisonList>
          <IssueVoteSection>
            <IssueVoteLabel>이 이슈에 대한 입장은?</IssueVoteLabel>
            <IssueVoteButtons role="group" aria-label="입장 선택">
              {VOTE_OPTIONS.map(({ stance, label, color, tint }) => {
                const isSelected = issue.user_vote === stance;
                return (
                  <VoteButton
                    key={stance}
                    type="button"
                    $color={color}
                    $tint={tint}
                    $selected={isSelected}
                    $loading={isVoting}
                    onClick={() => {
                      if (!isVoting) {
                        onVote(issue.id, stance);
                      }
                    }}
                    disabled={isVoting}
                    aria-pressed={isSelected}
                  >
                    {label}
                  </VoteButton>
                );
              })}
            </IssueVoteButtons>
            {issue.vote_counts.total > 0 ? (
              <IssueVoteBars>
                {VOTE_OPTIONS.map(({ stance, barLabel, color, tint }) => {
                  const pct = getVotePercent(
                    issue.vote_counts[stance],
                    issue.vote_counts.total,
                  );
                  const isMyVote = issue.user_vote === stance;
                  return (
                    <VoteBarRow key={stance}>
                      <VoteBarLabel $color={isMyVote ? color : "#b0b8c1"}>
                        {barLabel}
                      </VoteBarLabel>
                      <VoteBarTrack $tint={tint}>
                        <VoteBarFill $color={color} $pct={pct} />
                      </VoteBarTrack>
                      <VoteBarPct $active={isMyVote}>{pct}%</VoteBarPct>
                    </VoteBarRow>
                  );
                })}
                <VoteTotal>
                  총 {issue.vote_counts.total.toLocaleString()}명 참여
                </VoteTotal>
              </IssueVoteBars>
            ) : null}
            {issue.user_vote ? (
              <BattleCTA href={`/arena/${issue.id}/battle`}>
                <BattleCTAIcon aria-hidden="true">⚔</BattleCTAIcon>
                AI 배틀로 더 깊이 파고들기
              </BattleCTA>
            ) : null}
          </IssueVoteSection>
          <TendencySpacer>
            <TendencySection issueId={issue.id} />
          </TendencySpacer>
        </IssueExpanded>
      ) : null}
    </IssueItem>
  );
}

/* ── Styled components ──────────────────────────────────── */

const IssueItem = styled.div`
  display: grid;
  border-bottom: 1px solid #f2f4f6;

  &:last-of-type {
    border-bottom: 0;
  }
`;

const IssueRow = styled.article`
  display: grid;
  grid-template-columns: 80px minmax(0, 1fr) auto;
  gap: 16px;
  align-items: start;
  padding: 16px 0;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 8px;
  }
`;

const IssueRowMeta = styled.div`
  color: #8b95a1;
  font-size: 14px;
  font-weight: 500;
  padding-top: 4px;
`;

const IssueRowBody = styled(Link)`
  display: grid;
  gap: 6px;
  color: inherit;
  text-decoration: none;
  cursor: pointer;
  transition: opacity 140ms cubic-bezier(0.16, 1, 0.3, 1);

  &:hover h3 {
    color: #3182f6;
  }
`;

const IssueTitle = styled.h3`
  margin: 0;
  color: #191f28;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: -0.02em;
  word-break: keep-all;
`;

const IssueSummary = styled.p`
  margin: 0;
  color: #4e5968;
  font-size: 14px;
  line-height: 1.7;
  word-break: keep-all;
`;

const IssueBodyMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 2px;
`;

const BillStatusBadge = styled.span<{ $status: string }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  background: ${({ $status }) =>
    $status === "통과" ? "#e8f3ff" : $status === "폐기" ? "#fef2f2" : "#fff7e6"};
  color: ${({ $status }) =>
    $status === "통과" ? "#3182f6" : $status === "폐기" ? "#e5484d" : "#fe9800"};
`;

const IssueMetaChip = styled.span<{ $dim?: boolean; $followed?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 4px;
  background: ${({ $followed }) => ($followed ? "#e8f3ff" : "#f2f4f6")};
  color: ${({ $followed, $dim }) => ($followed ? "#3182f6" : $dim ? "#8b95a1" : "#6b7684")};
  font-size: 12px;
  font-weight: ${({ $followed }) => ($followed ? 600 : 500)};
  line-height: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
`;

const IssueActions = styled.div`
  display: grid;
  align-content: start;
  justify-items: end;
  gap: 12px;
  min-width: 108px;

  @media (max-width: 768px) {
    justify-items: start;
    min-width: 0;
    grid-auto-flow: column;
    gap: 16px;
  }
`;

const IssueToggleButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  padding: 0;
  color: #4e5968;
  background: transparent;
  border: 0;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: color 120ms cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    color: #191f28;
  }

  @media (max-width: 768px) {
    justify-content: flex-start;
  }
`;

const IssueChevron = styled.span<{ $expanded: boolean }>`
  display: inline-flex;
  svg {
    transform: rotate(${({ $expanded }) => ($expanded ? "180deg" : "0deg")});
    transition: transform 200ms cubic-bezier(0.16, 1, 0.3, 1);
  }
`;

const IssueTopLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  color: #191f28;
  font-size: 14px;
  font-weight: 600;
  transition: opacity 120ms cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    opacity: 0.6;
  }

  @media (max-width: 768px) {
    justify-content: flex-start;
  }
`;

const IssueComparisonList = styled.div`
  display: grid;
  gap: 0;
`;

const IssueComparisonRow = styled.div`
  display: grid;
  gap: 6px;
  padding: 12px 0;

  &:not(:last-of-type) {
    border-bottom: 1px solid #f2f4f6;
  }
`;

const IssueLabel = styled.div<{ $tone: "blue" | "red" }>`
  color: ${({ $tone }) => ($tone === "blue" ? "#3182f6" : "#e5484d")};
  font-size: 14px;
  font-weight: 700;
  letter-spacing: -0.01em;
`;

const IssueText = styled.p`
  margin: 0;
  color: #191f28;
  font-size: 16px;
  line-height: 1.7;
  word-break: keep-all;
`;

const IssueExpanded = styled.div`
  padding: 12px 0 16px 16px;
  margin-left: 96px;
  border-left: 1px solid #e5e7eb;

  @media (max-width: 768px) {
    margin-left: 0;
  }
`;

const IssueVoteSection = styled.div`
  display: grid;
  gap: 12px;
  padding-top: 16px;
  margin-top: 4px;
  border-top: 1px solid #f2f4f6;
`;

const IssueVoteLabel = styled.div`
  color: #8b95a1;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: -0.01em;
`;

const IssueVoteButtons = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
`;

const VoteButton = styled.button<{
  $color: string;
  $tint: string;
  $selected: boolean;
  $loading: boolean;
}>`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 36px;
  padding: 0 8px;
  border-radius: 8px;
  border: 1.5px solid ${({ $color, $selected }) => ($selected ? "transparent" : $color)};
  background: ${({ $color, $selected }) => ($selected ? $color : "transparent")};
  color: ${({ $color, $selected }) => ($selected ? "#ffffff" : $color)};
  font-size: 13px;
  font-weight: 600;
  letter-spacing: -0.01em;
  cursor: pointer;
  transition:
    background 150ms cubic-bezier(0.4, 0, 0.2, 1),
    color 150ms cubic-bezier(0.4, 0, 0.2, 1),
    border-color 150ms cubic-bezier(0.4, 0, 0.2, 1),
    opacity 150ms cubic-bezier(0.4, 0, 0.2, 1);
  opacity: ${({ $loading }) => ($loading ? 0.55 : 1)};

  &:hover:not(:disabled) {
    background: ${({ $color, $tint, $selected }) => ($selected ? $color : $tint)};
  }

  &:disabled {
    cursor: default;
  }
`;

const IssueVoteBars = styled.div`
  display: grid;
  gap: 8px;
`;

const VoteBarRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const VoteBarLabel = styled.span<{ $color: string }>`
  width: 28px;
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: ${({ $color }) => $color};
  transition: color 150ms cubic-bezier(0.4, 0, 0.2, 1);
`;

const VoteBarTrack = styled.div<{ $tint: string }>`
  flex: 1;
  height: 6px;
  border-radius: 99px;
  background: ${({ $tint }) => $tint};
  position: relative;
  overflow: hidden;
`;

const VoteBarFill = styled.div<{ $color: string; $pct: number }>`
  position: absolute;
  inset: 0;
  border-radius: 99px;
  background: ${({ $color }) => $color};
  transform-origin: left center;
  transform: scaleX(${({ $pct }) => $pct / 100});
  transition: transform 250ms cubic-bezier(0.4, 0, 0.2, 1);
`;

const VoteBarPct = styled.span<{ $active: boolean }>`
  width: 36px;
  flex-shrink: 0;
  text-align: right;
  font-size: 13px;
  font-weight: ${({ $active }) => ($active ? "700" : "400")};
  font-variant-numeric: tabular-nums;
  color: ${({ $active }) => ($active ? "#191f28" : "#8b95a1")};
  letter-spacing: -0.01em;
  transition: color 150ms cubic-bezier(0.4, 0, 0.2, 1);
`;

const VoteTotal = styled.div`
  font-size: 12px;
  font-weight: 400;
  color: #8b95a1;
  font-variant-numeric: tabular-nums;
  text-align: right;
  letter-spacing: -0.01em;
`;

const BattleCTA = styled(Link)`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
  padding: 12px 16px;
  border-radius: 8px;
  background: #191f28;
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  transition: opacity 140ms ease-out;

  &:hover {
    opacity: 0.88;
  }

  &:focus-visible {
    outline: 2px solid #3182f6;
    outline-offset: 2px;
  }
`;

const BattleCTAIcon = styled.span`
  font-size: 15px;
  line-height: 1;
`;

const TendencySpacer = styled.div`
  margin-top: 16px;
`;

"use client";

import { useState } from "react";
import styled from "@emotion/styled";
import { useRouter } from "next/navigation";
import { ArrowLeft, Share2, Check } from "lucide-react";
import {
  usePollQuery,
  useVotePollMutation,
} from "@/services/community/community.queries";
import type { PollOption } from "@/services/community/community.api";

const OPTION_COLORS = ["#3182f6", "#e5484d", "#03b26c", "#fe9800"] as const;

function timeLeft(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "마감된 투표";
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}일 남음`;
  if (hours > 0) return `${hours}시간 남음`;
  const mins = Math.floor(diff / 60_000);
  return `${mins}분 남음`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

type Props = { pollId: string };

export function PollDetailContainer({ pollId }: Props) {
  const router = useRouter();
  const { data: poll, isLoading, error } = usePollQuery(pollId);
  const voteMutation = useVotePollMutation(pollId);
  const [voteError, setVoteError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const expired = poll ? new Date(poll.expires_at) < new Date() : false;
  const hasVoted = Boolean(poll?.user_option_id);
  const showResults = hasVoted || expired;

  async function handleVote(opt: PollOption) {
    if (hasVoted || expired) return;
    setVoteError(null);
    try {
      await voteMutation.mutateAsync(opt.id);
    } catch (err) {
      setVoteError(err instanceof Error ? err.message : "투표에 실패했습니다.");
    }
  }

  async function handleCopy() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (isLoading) {
    return (
      <Page>
        <Shell>
          <BackBtn onClick={() => router.push("/community")}>
            <ArrowLeft size={18} />
            민심투표
          </BackBtn>
          <SkeletonBlock style={{ height: 120, borderRadius: 12 }} />
          <SkeletonBlock style={{ height: 200, borderRadius: 12 }} />
        </Shell>
      </Page>
    );
  }

  if (error || !poll) {
    return (
      <Page>
        <Shell>
          <BackBtn onClick={() => router.push("/community")}>
            <ArrowLeft size={18} />
            민심투표
          </BackBtn>
          <ErrorPanel>
            <ErrorTitle>투표를 불러오지 못했어요</ErrorTitle>
            <ErrorBody>잠시 후 다시 시도해주세요.</ErrorBody>
          </ErrorPanel>
        </Shell>
      </Page>
    );
  }

  const totalCount = poll.total_count;

  return (
    <Page>
      <Shell>
        <TopRow>
          <BackBtn onClick={() => router.push("/community")}>
            <ArrowLeft size={18} />
            민심투표
          </BackBtn>
          <ShareBtn onClick={() => { void handleCopy(); }}>
            {copied ? <Check size={16} /> : <Share2 size={16} />}
            {copied ? "복사됨" : "공유"}
          </ShareBtn>
        </TopRow>

        <QuestionCard>
          <PollMeta>
            {expired ? (
              <StatusBadge $expired>마감된 투표</StatusBadge>
            ) : (
              <StatusBadge $expired={false}>{timeLeft(poll.expires_at)}</StatusBadge>
            )}
            <MetaRight>{formatDate(poll.created_at)}</MetaRight>
          </PollMeta>
          <PollQuestion>{poll.question}</PollQuestion>
          <TotalCount>
            {totalCount.toLocaleString()}명 참여
          </TotalCount>
        </QuestionCard>

        <OptionsSection>
          {poll.options.map((opt, idx) => {
            const color = OPTION_COLORS[idx] ?? "#8b95a1";
            const count = poll.option_counts[opt.id] ?? 0;
            const pct = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
            const isMine = poll.user_option_id === opt.id;

            if (showResults) {
              return (
                <ResultRow key={opt.id} $mine={isMine}>
                  <ResultTop>
                    <ResultLabel $mine={isMine}>
                      {isMine && <CheckMark />}
                      {opt.text}
                    </ResultLabel>
                    <ResultPct $color={color}>{pct}%</ResultPct>
                  </ResultTop>
                  <BarTrack>
                    <BarFill $color={color} $pct={pct} />
                  </BarTrack>
                  <ResultCount>{count.toLocaleString()}명</ResultCount>
                </ResultRow>
              );
            }

            return (
              <VoteBtn
                key={opt.id}
                $color={color}
                onClick={() => { void handleVote(opt); }}
                disabled={voteMutation.isPending}
              >
                {opt.text}
              </VoteBtn>
            );
          })}

          {voteError && <ErrorText>{voteError}</ErrorText>}
        </OptionsSection>
      </Shell>
    </Page>
  );
}

/* ── Styles ──────────────────────────────────────────────── */

const Page = styled.main`
  min-height: 100vh;
  background: #ffffff;
  padding-bottom: 80px;
`;

const Shell = styled.div`
  max-width: 480px;
  margin: 0 auto;
  padding: 16px 20px 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const TopRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const BackBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  padding: 0 12px 0 8px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #4e5968;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: #f2f4f6;
    color: #191f28;
  }
`;

const ShareBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  padding: 0 14px;
  border: 1px solid #e5e8eb;
  border-radius: 8px;
  background: #ffffff;
  color: #4e5968;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: border-color 150ms;

  &:hover {
    border-color: #3182f6;
    color: #3182f6;
  }
`;

const QuestionCard = styled.div`
  padding: 20px;
  border: 1px solid #e5e8eb;
  border-radius: 12px;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const PollMeta = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const StatusBadge = styled.span<{ $expired: boolean }>`
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 4px;
  background: ${({ $expired }) => ($expired ? "#f2f4f6" : "#e8f3ff")};
  color: ${({ $expired }) => ($expired ? "#8b95a1" : "#3182f6")};
  font-size: 12px;
  font-weight: 600;
`;

const MetaRight = styled.span`
  font-size: 12px;
  font-weight: 400;
  color: #8b95a1;
`;

const PollQuestion = styled.h1`
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #191f28;
  line-height: 1.45;
  word-break: keep-all;
`;

const TotalCount = styled.p`
  margin: 0;
  font-size: 13px;
  font-weight: 400;
  color: #8b95a1;
  font-variant-numeric: tabular-nums;
`;

const OptionsSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const VoteBtn = styled.button<{ $color: string }>`
  width: 100%;
  min-height: 56px;
  padding: 0 20px;
  border: 2px solid ${({ $color }) => $color};
  border-radius: 12px;
  background: #ffffff;
  color: ${({ $color }) => $color};
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  text-align: left;
  transition: background 150ms, color 150ms;

  &:hover:not(:disabled) {
    background: ${({ $color }) => $color};
    color: #ffffff;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ResultRow = styled.div<{ $mine: boolean }>`
  padding: 16px;
  border: 1px solid ${({ $mine }) => ($mine ? "#3182f6" : "#e5e8eb")};
  border-radius: 12px;
  background: ${({ $mine }) => ($mine ? "#f0f7ff" : "#ffffff")};
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ResultTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

const ResultLabel = styled.span<{ $mine: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 15px;
  font-weight: ${({ $mine }) => ($mine ? 600 : 400)};
  color: #191f28;
  word-break: keep-all;
`;

const CheckMark = styled.span`
  display: inline-block;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #3182f6;
  flex-shrink: 0;
  position: relative;

  &::after {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(45deg);
    width: 4px;
    height: 7px;
    border-right: 2px solid #ffffff;
    border-bottom: 2px solid #ffffff;
    margin-top: -1px;
  }
`;

const ResultPct = styled.span<{ $color: string }>`
  font-size: 16px;
  font-weight: 700;
  color: ${({ $color }) => $color};
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
`;

const BarTrack = styled.div`
  height: 6px;
  border-radius: 9999px;
  background: #e5e8eb;
  overflow: hidden;
`;

const BarFill = styled.div<{ $color: string; $pct: number }>`
  height: 100%;
  border-radius: 9999px;
  background: ${({ $color }) => $color};
  width: ${({ $pct }) => $pct}%;
  transition: width 400ms cubic-bezier(0.4, 0.0, 0.2, 1);
`;

const ResultCount = styled.span`
  font-size: 12px;
  font-weight: 400;
  color: #8b95a1;
  font-variant-numeric: tabular-nums;
`;

const SkeletonBlock = styled.div`
  background: #f2f4f6;
  animation: shimmer 1.2s linear infinite;

  @keyframes shimmer {
    0% { opacity: 1; }
    50% { opacity: 0.6; }
    100% { opacity: 1; }
  }
`;

const ErrorPanel = styled.div`
  padding: 32px 20px;
  border: 1px solid #e5e8eb;
  border-radius: 12px;
  background: #ffffff;
  text-align: center;
`;

const ErrorTitle = styled.p`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #191f28;
`;

const ErrorBody = styled.p`
  margin: 8px 0 0;
  font-size: 14px;
  font-weight: 400;
  color: #6b7684;
`;

const ErrorText = styled.p`
  margin: 0;
  font-size: 13px;
  font-weight: 400;
  color: #f04452;
  text-align: center;
`;

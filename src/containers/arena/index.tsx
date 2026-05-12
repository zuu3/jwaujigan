"use client";

import styled from "@emotion/styled";
import { ArrowLeft, ArrowRight, ExternalLink, RotateCcw, Share2, Swords } from "lucide-react";
import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { useCallback, useEffect, useMemo, useRef, useState, memo } from "react";
import type { CachedArenaBattle } from "@/lib/arena";
import type { HotIssue } from "@/types/issue";

export type DebateMessage = {
  role: "progressive" | "conservative" | "user";
  content: string;
};

export type DebateResult = {
  winner: "progressive" | "conservative" | "draw";
  reason: string;
};

type Stance = "progressive" | "conservative";
type BattleStance = Stance | "watch";
type BattlePhase =
  | "ai-turn"
  | "between-turns"
  | "intervention"
  | "judging"
  | "result";

type ArenaIndexProps = {
  issues: HotIssue[];
  isAuthenticated: boolean;
};

type IssueDetailProps = {
  issue: HotIssue;
};

type VerdictCounts = { progressive: number; conservative: number; draw: number; total: number };

type BattleProps = {
  issue: HotIssue;
  stance: BattleStance;
  isAuthenticated: boolean;
  initialCachedBattle: CachedArenaBattle | null;
};

const MAX_ARGUMENT_LENGTH = 200;

function getStanceLabel(stance: Stance) {
  return stance === "progressive" ? "진보" : "보수";
}

function getStanceTone(stance: Stance) {
  return stance === "progressive" ? "#3182f6" : "#e5484d";
}

function getResultCopy(result: DebateResult) {
  if (result.winner === "progressive") {
    return {
      title: "진보 AI가 우세했습니다",
      color: "#3182f6",
    };
  }

  if (result.winner === "conservative") {
    return {
      title: "보수 AI가 우세했습니다",
      color: "#e5484d",
    };
  }

  return {
    title: "팽팽한 승부였습니다",
    color: "#4e5968",
  };
}

function sleep(milliseconds: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}

async function readDebateStream({
  payload,
  onToken,
}: {
  payload: {
    issueId: string;
    issueTitle: string;
    progressiveContext: string;
    conservativeContext: string;
    speakerStance: Stance;
    round: number;
    history: DebateMessage[];
  };
  onToken: (token: string) => void;
}) {
  const response = await fetch("/api/arena/debate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok || !response.body) {
    throw new Error("AI 토론 응답을 불러오지 못했습니다.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";

  while (true) {
    const { value, done } = await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";

    for (const event of events) {
      const isErrorEvent = event
        .split("\n")
        .some((item) => item.trim() === "event: error");
      const line = event
        .split("\n")
        .find((item) => item.startsWith("data: "));

      if (!line) {
        continue;
      }

      const data = line.slice(6);

      if (data === "[DONE]") {
        continue;
      }

      const parsed = JSON.parse(data) as { message?: string; text?: string };

      if (isErrorEvent) {
        throw new Error(parsed.message ?? "AI 토론 응답을 불러오지 못했습니다.");
      }

      const token = parsed.text ?? "";

      if (token) {
        fullText += token;
        onToken(token);
      }
    }
  }

  return fullText.trim();
}

async function saveBattleCache({
  issueId,
  messages,
  result,
}: {
  issueId: string;
  messages: DebateMessage[];
  result: DebateResult;
}) {
  await fetch("/api/arena/battle-cache", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      issueId,
      messages,
      result,
    }),
  });
}

export function ArenaIndex({ issues, isAuthenticated }: ArenaIndexProps) {
  return (
    <Page>
      {isAuthenticated ? <AppHeader /> : (
        <GuestNav>
          <Brand href="/home">좌우지간</Brand>
          <GuestNavLink href="/">로그인</GuestNavLink>
        </GuestNav>
      )}
      <Shell>
        {!isAuthenticated ? (
          <LoginBanner>
            <BannerText>
              로그인하면 배틀 결과가 기록되고 나중에 다시 확인할 수 있습니다.
            </BannerText>
            <BannerAction href="/">로그인하기</BannerAction>
          </LoginBanner>
        ) : null}

        <Hero>
          <HeroEyebrow>AI 토론 배틀</HeroEyebrow>
          <HeroTitle>이슈를 고르고 AI 토론을 지켜보세요</HeroTitle>
          <HeroDescription>
            진보 AI와 보수 AI가 3라운드 토론을 벌입니다. 원할 때 내 생각을 보내면 AI가 다음 발언에 반영합니다.
          </HeroDescription>
          <HowItWorks>
            <HowStep>
              <HowNum>1</HowNum>
              <HowText>이슈 선택</HowText>
            </HowStep>
            <HowDivider aria-hidden="true" />
            <HowStep>
              <HowNum>2</HowNum>
              <HowText>편 고르기 또는 구경</HowText>
            </HowStep>
            <HowDivider aria-hidden="true" />
            <HowStep>
              <HowNum>3</HowNum>
              <HowText>AI 토론 + 내 의견 추가</HowText>
            </HowStep>
            <HowDivider aria-hidden="true" />
            <HowStep>
              <HowNum>4</HowNum>
              <HowText>AI 판정 확인</HowText>
            </HowStep>
          </HowItWorks>
        </Hero>

        {issues.length > 0 ? (
          <IssueGrid>
            {issues.map((issue) => {
              const total = issue.vote_counts?.total ?? 0;
              const statusColor =
                issue.bill_status === "통과" ? "#03b26c" :
                issue.bill_status === "폐기" ? "#8b95a1" :
                issue.bill_status ? "#fe9800" : null;

              return (
                <IssueCard key={issue.id} href={`/arena/${issue.id}`}>
                  <IssueCardTop>
                    {issue.bill_status && statusColor ? (
                      <IssueCardBadge $color={statusColor}>{issue.bill_status}</IssueCardBadge>
                    ) : (
                      <IssueCardBadge $color="#8b95a1">토론</IssueCardBadge>
                    )}
                    {total > 0 ? (
                      <IssueCardParticipants>
                        {total.toLocaleString()}명 참여
                      </IssueCardParticipants>
                    ) : null}
                  </IssueCardTop>
                  <IssueCardTitle>{issue.title}</IssueCardTitle>
                  <IssueCardSummary>{issue.summary}</IssueCardSummary>
                  {issue.proposer || issue.committee ? (
                    <IssueCardMeta>
                      {[issue.committee, issue.proposer].filter(Boolean).join(" · ")}
                    </IssueCardMeta>
                  ) : null}
                  <IssueCardFooter>
                    <span>배틀 참여하기</span>
                    <ArrowRight size={16} />
                  </IssueCardFooter>
                </IssueCard>
              );
            })}
          </IssueGrid>
        ) : (
          <EmptyPanel>
            <EmptyTitle>오늘은 배틀 이슈가 없어요</EmptyTitle>
            <EmptyText>매일 새 이슈가 추가돼요. 홈에서 핫이슈를 먼저 확인해 보세요.</EmptyText>
          </EmptyPanel>
        )}
      </Shell>
    </Page>
  );
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

function formatPublishedAt(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`;
}

function BillStatusBadge({ status }: { status: string | null }) {
  if (!status) return null;
  const color =
    status === "통과" ? "#03b26c" :
    status === "폐기" ? "#8b95a1" :
    "#fe9800";
  return <BillStatusChip $color={color}>{status}</BillStatusChip>;
}

export function ArenaIssueDetail({ issue }: IssueDetailProps) {
  const hasMeta = issue.proposer || issue.committee || issue.bill_status || issue.published_at;

  return (
    <Page>
      <AppHeader />
      <Shell>
        <BackLink href="/arena">
          <ArrowLeft size={16} />
          <span>다른 이슈 보기</span>
        </BackLink>

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
        </DetailPanel>
      </Shell>
    </Page>
  );
}

export function ArenaBattle({
  issue,
  stance,
  isAuthenticated,
  initialCachedBattle,
}: BattleProps) {
  const [messages, setMessages] = useState<DebateMessage[]>([]);
  const [turnIndex, setTurnIndex] = useState(0);
  const [phase, setPhase] = useState<BattlePhase>("ai-turn");
  const [streamingText, setStreamingText] = useState("");
  const [streamingRole, setStreamingRole] = useState<Stance>("progressive");
  const [argument, setArgument] = useState("");
  const [result, setResult] = useState<DebateResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [verdictCounts, setVerdictCounts] = useState<VerdictCounts | null>(null);
  const [userVerdict, setUserVerdict] = useState<string | null>(null);
  const [verdictLoading, setVerdictLoading] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const startedRef = useRef(false);
  const runningTurnRef = useRef<number | null>(null);
  const messagesRef = useRef<DebateMessage[]>([]);
  const logSavedRef = useRef(false);
  const cacheSavedRef = useRef(Boolean(initialCachedBattle));
  const hadInterventionRef = useRef(false);
  const cachedBattleRef = useRef(initialCachedBattle);
  const nextTurnTimerRef = useRef<number | null>(null);
  const round = Math.min(Math.floor(turnIndex / 2) + 1, 3);
  const canSubmit =
    phase === "intervention" &&
    argument.trim().length > 0 &&
    argument.length <= MAX_ARGUMENT_LENGTH;

  const clearNextTurnTimer = useCallback(() => {
    if (nextTurnTimerRef.current != null) {
      window.clearTimeout(nextTurnTimerRef.current);
      nextTurnTimerRef.current = null;
    }
  }, []);

  const getSpeakerForTurn = useCallback((index: number): Stance => {
    return index % 2 === 0 ? "progressive" : "conservative";
  }, []);

  const getNextTurnDelay = useCallback(() => 2600, []);

  const callDebate = useCallback(
    async ({
      speakerStance,
      currentRound,
      history,
    }: {
      speakerStance: Stance;
      currentRound: number;
      history: DebateMessage[];
    }) => {
      setStreamingRole(speakerStance);
      setStreamingText("");
      setError(null);

      const aiText = await readDebateStream({
        payload: {
          issueId: issue.id,
          issueTitle: issue.title,
          progressiveContext: issue.progressive,
          conservativeContext: issue.conservative,
          speakerStance,
          round: currentRound,
          history,
        },
        onToken: (token) => {
          setStreamingText((current) => current + token);
        },
      });

      const nextMessages = [...history, { role: speakerStance, content: aiText }];
      messagesRef.current = nextMessages;
      setMessages(nextMessages);
      setStreamingText("");

      return nextMessages;
    },
    [issue],
  );

  const playCachedTurn = useCallback(
    async ({
      speakerStance,
      cachedMessage,
      history,
    }: {
      speakerStance: Stance;
      cachedMessage: DebateMessage;
      history: DebateMessage[];
    }) => {
      setStreamingRole(speakerStance);
      setStreamingText("");
      setError(null);

      let visibleText = "";

      for (const character of cachedMessage.content) {
        visibleText += character;
        setStreamingText(visibleText);
        await sleep(18);
      }

      const nextMessages = [...history, cachedMessage];
      messagesRef.current = nextMessages;
      setMessages(nextMessages);
      setStreamingText("");

      return nextMessages;
    },
    [],
  );

  const judgeDebate = useCallback(
    async (history: DebateMessage[]) => {
      const response = await fetch("/api/arena/judge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          issueTitle: issue.title,
          history,
        }),
      });

      if (!response.ok) {
        throw new Error("토론 결과를 판정하지 못했습니다.");
      }

      return (await response.json()) as DebateResult;
    },
    [issue.title],
  );

  const saveBattleLog = useCallback(
    async (winner: DebateResult["winner"], finalMessages: DebateMessage[]) => {
      if (!isAuthenticated || logSavedRef.current) {
        return;
      }

      logSavedRef.current = true;

      await fetch("/api/arena/battle-log", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic: issue.title,
          messages: finalMessages,
          winner,
          userStance: stance,
        }),
      });
    },
    [isAuthenticated, issue.title, stance],
  );

  const saveCacheIfReusable = useCallback(
    async (judged: DebateResult, finalMessages: DebateMessage[]) => {
      if (cacheSavedRef.current || hadInterventionRef.current) {
        return;
      }

      cacheSavedRef.current = true;

      try {
        await saveBattleCache({
          issueId: issue.id,
          messages: finalMessages,
          result: judged,
        });
      } catch (cacheError) {
        console.error("Failed to save battle cache", cacheError);
      }
    },
    [issue.id],
  );

  const startBattle = useCallback(async () => {
    clearNextTurnTimer();
    startedRef.current = true;
    runningTurnRef.current = null;
    messagesRef.current = [];
    logSavedRef.current = false;
    cacheSavedRef.current = false;
    hadInterventionRef.current = false;
    cachedBattleRef.current = null;
    setMessages([]);
    setTurnIndex(0);
    setResult(null);
    setArgument("");
    setStreamingText("");
    setPhase("ai-turn");
  }, [clearNextTurnTimer]);

  useEffect(() => {
    if (!startedRef.current) {
      startedRef.current = true;
    }
  }, []);

  useEffect(() => {
    if (phase !== "ai-turn" || runningTurnRef.current === turnIndex || result) {
      return;
    }

    runningTurnRef.current = turnIndex;

    const runTurn = async () => {
      const speakerStance = getSpeakerForTurn(turnIndex);
      const currentRound = Math.min(Math.floor(turnIndex / 2) + 1, 3);
      const history = messagesRef.current;
      const cachedBattle = cachedBattleRef.current;

      try {
        const cachedMessage = !hadInterventionRef.current
          ? cachedBattle?.messages[turnIndex]
          : null;
        const nextMessages =
          cachedMessage?.role === speakerStance
            ? await playCachedTurn({
                speakerStance,
                cachedMessage,
                history,
              })
            : await callDebate({
                speakerStance,
                currentRound,
                history,
              });

        if (turnIndex >= 5) {
          const cachedResult =
            !hadInterventionRef.current && cachedBattle
              ? cachedBattle.result
              : null;

          setPhase(cachedResult ? "result" : "judging");
          const judged = cachedResult ?? (await judgeDebate(nextMessages));
          setResult(judged);
          setPhase("result");

          if (!cachedResult) {
            void saveCacheIfReusable(judged, nextMessages);
            void saveBattleLog(judged.winner, nextMessages);
          }

          // 판정 투표 초기 데이터 로드
          void fetch(`/api/arena/verdict?issueId=${issue.id}`)
            .then((r) => r.json() as Promise<{ counts: VerdictCounts; user_verdict: string | null }>)
            .then(({ counts, user_verdict }) => {
              setVerdictCounts(counts);
              setUserVerdict(user_verdict);
            })
            .catch(() => null);

          return;
        }

        setPhase("between-turns");
        nextTurnTimerRef.current = window.setTimeout(() => {
          setTurnIndex((current) => current + 1);
          setPhase("ai-turn");
        }, getNextTurnDelay());
      } catch (turnError) {
        console.error(turnError);
        setError(
          turnError instanceof Error
            ? turnError.message
            : "AI 토론을 이어가지 못했습니다.",
        );
        setStreamingText("");
        setPhase("between-turns");
      } finally {
        if (runningTurnRef.current === turnIndex) {
          runningTurnRef.current = null;
        }
      }
    };

    void runTurn();
  }, [
    callDebate,
    getNextTurnDelay,
    getSpeakerForTurn,
    judgeDebate,
    playCachedTurn,
    phase,
    result,
    saveBattleLog,
    saveCacheIfReusable,
    turnIndex,
  ]);

  useEffect(() => {
    return () => {
      clearNextTurnTimer();
    };
  }, [clearNextTurnTimer]);

  const handleOpenIntervention = () => {
    if (phase !== "between-turns") {
      return;
    }

    clearNextTurnTimer();
    hadInterventionRef.current = true;
    setPhase("intervention");
  };

  const handleContinue = () => {
    if (phase !== "between-turns" && phase !== "intervention") {
      return;
    }

    clearNextTurnTimer();
    setArgument("");
    setTurnIndex((current) => current + 1);
    setPhase("ai-turn");
  };

  const handleSubmit = async () => {
    if (!canSubmit) {
      return;
    }

    const userMessage = { role: "user" as const, content: argument.trim() };
    const nextMessages = [...messagesRef.current, userMessage];
    messagesRef.current = nextMessages;
    setMessages(nextMessages);
    setArgument("");
    setTurnIndex((current) => current + 1);
    setPhase("ai-turn");
  };

  const resultCopy = useMemo(
    () => (result ? getResultCopy(result) : null),
    [result],
  );

  return (
    <BattlePage>
      <BattleShell>
        <BattleHeader>
          <BackLink href={`/arena/${issue.id}`}>
            <ArrowLeft size={16} />
            <span>입장 다시 선택</span>
          </BackLink>
          <RoundBadge>Round {round} / 3</RoundBadge>
        </BattleHeader>

        <BattleTitleBlock>
          <BattleKicker>
            <Swords size={16} />
            <span>{stance === "watch" ? "AI 배틀 구경 중" : `${getStanceLabel(stance)} AI 응원 중`}</span>
          </BattleKicker>
          <BattleTitle>{issue.title}</BattleTitle>
          <BattleSummary>{issue.summary}</BattleSummary>
        </BattleTitleBlock>

        {error ? <ErrorPanel>{error}</ErrorPanel> : null}

        <ChatPanel aria-live="polite" aria-label="AI 토론 내용">
          {messages.map((message, index) => (
            <MessageRow
              key={`${message.role}-${index}-${message.content}`}
              $role={message.role}
            >
              <MessageBubble
                $role={message.role}
                $tone={
                  message.role === "user"
                    ? getStanceTone(stance === "watch" ? "progressive" : stance)
                    : getStanceTone(message.role)
                }
              >
                <MessageLabel
                  $tone={
                    message.role === "user"
                      ? getStanceTone(stance === "watch" ? "progressive" : stance)
                      : getStanceTone(message.role)
                  }
                >
                  {message.role === "user"
                    ? `내 의견`
                    : `${getStanceLabel(message.role)} AI`}
                </MessageLabel>
                <MessageText>{message.content}</MessageText>
              </MessageBubble>
            </MessageRow>
          ))}

          {streamingText ? (
            <MessageRow $role={streamingRole}>
              <MessageBubble $role={streamingRole} $tone={getStanceTone(streamingRole)}>
                <MessageLabel $tone={getStanceTone(streamingRole)}>
                  {getStanceLabel(streamingRole)} AI
                </MessageLabel>
                <MessageText>
                  {streamingText}
                  <Cursor aria-hidden="true" />
                </MessageText>
              </MessageBubble>
            </MessageRow>
          ) : null}

          {messages.length === 0 && !streamingText ? (
            <EmptyChat>진보 AI가 첫 주장을 준비하고 있습니다.</EmptyChat>
          ) : null}
        </ChatPanel>

        {phase === "between-turns" ? (
          <StatusPanel>
            다음 AI 발언으로 이어집니다. 원하면 아래 버튼으로 직접 개입할 수 있습니다.
          </StatusPanel>
        ) : null}

        {phase === "judging" ? (
          <StatusPanel>논리성, 근거, 설득력을 기준으로 판정 중입니다.</StatusPanel>
        ) : null}

        {phase === "result" && result && resultCopy ? (
          <>
            <ResultCard $tone={resultCopy.color}>
              <ResultTitle>{resultCopy.title}</ResultTitle>
              <ResultReason>{result.reason}</ResultReason>
              <ResultActions>
                <ResultButton type="button" onClick={() => void startBattle()}>
                  <RotateCcw size={16} />
                  <span>다시 도전</span>
                </ResultButton>
                <ResultLink href="/arena">다른 이슈</ResultLink>
                <ShareButton
                  type="button"
                  $copied={shareCopied}
                  onClick={async () => {
                    const url = `${window.location.origin}/arena/${issue.id}`;
                    const shareData = {
                      title: `${issue.title} | 좌우지간 AI 배틀`,
                      text: resultCopy.title,
                      url,
                    };
                    if (navigator.share && navigator.canShare?.(shareData)) {
                      await navigator.share(shareData);
                    } else {
                      await navigator.clipboard.writeText(url);
                      setShareCopied(true);
                      setTimeout(() => setShareCopied(false), 2000);
                    }
                  }}
                >
                  <Share2 size={15} />
                  <span>{shareCopied ? "복사됨" : "공유"}</span>
                </ShareButton>
              </ResultActions>
            </ResultCard>

            <VerdictSection>
              <VerdictLabel>당신의 판정은?</VerdictLabel>
              <VerdictButtons>
                {(
                  [
                    { side: "progressive", label: "진보 AI 우세", color: "#3182f6", tint: "#e8f3ff" },
                    { side: "draw", label: "비겼음", color: "#4e5968", tint: "#f2f4f6" },
                    { side: "conservative", label: "보수 AI 우세", color: "#e5484d", tint: "#fef2f2" },
                  ] as const
                ).map(({ side, label, color, tint }) => (
                  <VerdictButton
                    key={side}
                    type="button"
                    $color={color}
                    $tint={tint}
                    $selected={userVerdict === side}
                    $loading={verdictLoading}
                    disabled={verdictLoading || !isAuthenticated}
                    onClick={async () => {
                      if (!isAuthenticated || verdictLoading) return;
                      setVerdictLoading(true);
                      try {
                        const res = await fetch("/api/arena/verdict", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ issueId: issue.id, side }),
                        });
                        const data = await res.json() as { counts: VerdictCounts; user_verdict: string | null };
                        setVerdictCounts(data.counts);
                        setUserVerdict(data.user_verdict);
                      } finally {
                        setVerdictLoading(false);
                      }
                    }}
                  >
                    {label}
                  </VerdictButton>
                ))}
              </VerdictButtons>

              {verdictCounts && verdictCounts.total > 0 ? (
                <VerdictBars>
                  {(
                    [
                      { side: "progressive", label: "진보", color: "#3182f6", tint: "#e8f3ff" },
                      { side: "draw", label: "무승부", color: "#4e5968", tint: "#f2f4f6" },
                      { side: "conservative", label: "보수", color: "#e5484d", tint: "#fef2f2" },
                    ] as const
                  ).map(({ side, label, color, tint }) => {
                    const pct = verdictCounts.total === 0 ? 0 : Math.round((verdictCounts[side] / verdictCounts.total) * 100);
                    return (
                      <VerdictBarRow key={side}>
                        <VerdictBarLabel $color={userVerdict === side ? color : "#b0b8c1"}>{label}</VerdictBarLabel>
                        <VerdictBarTrack $tint={tint}>
                          <VerdictBarFill $color={color} $pct={pct} />
                        </VerdictBarTrack>
                        <VerdictBarPct $active={userVerdict === side}>{pct}%</VerdictBarPct>
                      </VerdictBarRow>
                    );
                  })}
                  <VerdictTotal>총 {verdictCounts.total.toLocaleString()}명 참여</VerdictTotal>
                </VerdictBars>
              ) : null}

              {!isAuthenticated ? (
                <VerdictLoginNote>로그인하면 판정 투표에 참여할 수 있어요.</VerdictLoginNote>
              ) : null}
            </VerdictSection>
          </>
        ) : stance === "watch" ? null : (
          <Composer>
            <ComposerMeta>
              <label htmlFor="argument-input">
                {phase === "intervention" ? "내 생각 보내기" : "내 생각 추가하기"}
              </label>
              <span id="argument-counter">
                {argument.length} / {MAX_ARGUMENT_LENGTH}
              </span>
            </ComposerMeta>
            {phase === "intervention" ? (
              <InterventionHint>
                내 생각을 보내면 AI가 다음 발언에 반영합니다. 이슈에 대한 근거나 반론을 자유롭게 적어보세요.
              </InterventionHint>
            ) : null}
            <ArgumentInput
              id="argument-input"
              aria-describedby="argument-counter"
              value={argument}
              onChange={(event) => setArgument(event.target.value.slice(0, MAX_ARGUMENT_LENGTH))}
              onKeyDown={(event) => {
                if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                  event.preventDefault();
                  void handleSubmit();
                }
              }}
              placeholder={
                phase === "intervention"
                  ? "예: '이 정책은 서민 부담만 늘립니다' / '장기적으로 성장에 도움이 됩니다'"
                  : "AI 발언이 끝나면 내 생각을 추가할 수 있어요."
              }
              disabled={phase !== "intervention"}
              rows={4}
            />
            <ComposerActions>
              {phase === "between-turns" ? (
                <>
                  <SecondaryButton type="button" onClick={handleContinue}>
                    다음 발언 보기
                  </SecondaryButton>
                  <SubmitButton
                    type="button"
                    onClick={handleOpenIntervention}
                    $tone={getStanceTone(stance)}
                  >
                    내 생각 추가하기
                  </SubmitButton>
                </>
              ) : null}
              {phase === "intervention" ? (
                <>
                  <SecondaryButton
                    type="button"
                    onClick={handleContinue}
                  >
                    건너뛰기
                  </SecondaryButton>
                  <SubmitButton
                    type="button"
                    onClick={() => void handleSubmit()}
                    disabled={!canSubmit}
                    $tone={getStanceTone(stance)}
                  >
                    보내고 계속
                  </SubmitButton>
                </>
              ) : null}
            </ComposerActions>
          </Composer>
        )}
      </BattleShell>
    </BattlePage>
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
    padding: 24px 16px 0;
  }
`;

const GuestNav = styled.nav`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: min(100%, 1160px);
  min-height: 56px;
  margin: 0 auto;
  padding: 0 24px;
  border-bottom: 1px solid #f2f4f6;

  @media (max-width: 640px) {
    padding: 0 20px;
  }
`;

const Brand = styled(Link)`
  color: #191f28;
  font-size: 18px;
  font-weight: 800;
  letter-spacing: -0.04em;
`;

const GuestNavLink = styled(Link)`
  display: inline-flex;
  min-height: 36px;
  align-items: center;
  justify-content: center;
  padding: 0 14px;
  border: 1px solid #e5e8eb;
  border-radius: 6px;
  color: #4e5968;
  font-size: 13px;
  font-weight: 500;
  transition: border-color 120ms, color 120ms;

  &:hover {
    border-color: #b0b8c1;
    color: #191f28;
  }
`;

const LoginBanner = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 20px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;

  @media (max-width: 640px) {
    align-items: stretch;
    flex-direction: column;
  }
`;

const BannerText = styled.p`
  margin: 0;
  color: #4e5968;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.55;
`;

const BannerAction = styled(Link)`
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  padding: 0 16px;
  color: #ffffff;
  background: #3182f6;
  font-size: 14px;
  font-weight: 600;
`;

const Hero = styled.section`
  display: grid;
  gap: 16px;
`;

const HeroEyebrow = styled.div`
  color: #4e5968;
  font-size: 14px;
  font-weight: 600;
`;

const HeroTitle = styled.h1`
  max-width: 780px;
  margin: 0;
  color: #191f28;
  font-size: 32px;
  font-weight: 700;
  line-height: 1.25;
  letter-spacing: -0.02em;
  word-break: keep-all;
`;

const HeroDescription = styled.p`
  max-width: 640px;
  margin: 0;
  color: #4e5968;
  font-size: 16px;
  font-weight: 400;
  line-height: 1.6;
`;

const IssueGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;

  @media (max-width: 980px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const HowItWorks = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 4px;
`;

const HowStep = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const HowNum = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #e8f3ff;
  color: #3182f6;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
`;

const HowText = styled.span`
  color: #4e5968;
  font-size: 13px;
  font-weight: 400;
`;

const HowDivider = styled.span`
  color: #b0b8c1;
  font-size: 12px;

  &::before {
    content: "→";
  }
`;

const IssueCard = styled(Link)`
  display: grid;
  min-height: 200px;
  align-content: start;
  gap: 12px;
  padding: 24px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
  transition: border-color 200ms ease;

  &:hover {
    border-color: #191f28;
  }
`;

const IssueCardTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

const IssueCardBadge = styled.span<{ $color: string }>`
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 4px;
  background: ${({ $color }) => `${$color}18`};
  color: ${({ $color }) => $color};
  font-size: 12px;
  font-weight: 600;
`;

const IssueCardParticipants = styled.span`
  color: #8b95a1;
  font-size: 12px;
  font-weight: 400;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
`;

const IssueCardMeta = styled.div`
  color: #8b95a1;
  font-size: 13px;
  font-weight: 400;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const IssueCardTitle = styled.h2`
  margin: 0;
  color: #191f28;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.4;
  word-break: keep-all;
`;

const IssueCardSummary = styled.p`
  margin: 0;
  color: #4e5968;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.6;
`;

const IssueCardFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid #f2f4f6;
  color: #191f28;
  font-size: 14px;
  font-weight: 600;
`;

const EmptyPanel = styled.div`
  padding: 32px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
`;

const EmptyTitle = styled.h2`
  margin: 0;
  color: #191f28;
  font-size: 18px;
  font-weight: 700;
`;

const EmptyText = styled.p`
  margin: 8px 0 0;
  color: #4e5968;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.6;
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
  background: #f9fafb;
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

const DetailPanel = styled.section`
  display: grid;
  gap: 24px;
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

const ShareButton = styled.button<{ $copied: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 16px;
  height: 40px;
  border-radius: 8px;
  border: 1px solid ${({ $copied }) => ($copied ? "#03b26c" : "#e5e8eb")};
  background: ${({ $copied }) => ($copied ? "#e6f9f1" : "transparent")};
  color: ${({ $copied }) => ($copied ? "#03b26c" : "#6b7684")};
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 150ms;

  &:hover {
    border-color: #3182f6;
    color: #3182f6;
  }
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

/* ── Verdict Vote ─────────────────────────────────────── */

const VerdictSection = styled.div`
  display: grid;
  gap: 16px;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid #e5e8eb;
  background: #fafafa;
`;

const VerdictLabel = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #191f28;
`;

const VerdictButtons = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8px;

  @media (max-width: 400px) {
    grid-template-columns: 1fr;
  }
`;

const VerdictButton = styled.button<{
  $color: string;
  $tint: string;
  $selected: boolean;
  $loading: boolean;
}>`
  padding: 10px 8px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 150ms;
  border: 1.5px solid ${({ $selected, $color }) => ($selected ? $color : "#e5e8eb")};
  background: ${({ $selected, $tint }) => ($selected ? $tint : "transparent")};
  color: ${({ $selected, $color }) => ($selected ? $color : "#6b7684")};
  opacity: ${({ $loading }) => ($loading ? 0.6 : 1)};

  &:hover:not(:disabled) {
    border-color: ${({ $color }) => $color};
    color: ${({ $color }) => $color};
    background: ${({ $tint }) => $tint};
  }

  &:focus-visible {
    outline: 2px solid #3182f6;
    outline-offset: 2px;
  }
`;

const VerdictBars = styled.div`
  display: grid;
  gap: 8px;
`;

const VerdictBarRow = styled.div`
  display: grid;
  grid-template-columns: 36px 1fr 40px;
  align-items: center;
  gap: 8px;
`;

const VerdictBarLabel = styled.span<{ $color: string }>`
  font-size: 12px;
  font-weight: 600;
  color: ${({ $color }) => $color};
`;

const VerdictBarTrack = styled.div<{ $tint: string }>`
  height: 6px;
  border-radius: 9999px;
  background: ${({ $tint }) => $tint};
  overflow: hidden;
`;

const VerdictBarFill = styled.div<{ $color: string; $pct: number }>`
  height: 100%;
  border-radius: 9999px;
  background: ${({ $color }) => $color};
  transform: scaleX(${({ $pct }) => $pct / 100});
  transform-origin: left;
  transition: transform 250ms cubic-bezier(0.4, 0, 0.2, 1);

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const VerdictBarPct = styled.span<{ $active: boolean }>`
  font-size: 12px;
  font-weight: ${({ $active }) => ($active ? 700 : 400)};
  color: ${({ $active }) => ($active ? "#191f28" : "#8b95a1")};
  font-variant-numeric: tabular-nums;
  text-align: right;
`;

const VerdictTotal = styled.div`
  font-size: 12px;
  color: #8b95a1;
  text-align: right;
`;

const VerdictLoginNote = styled.div`
  font-size: 13px;
  color: #8b95a1;
`;

const BattlePage = styled(Page)`
  padding-bottom: 64px;
`;

const BattleShell = styled(Shell)`
  max-width: 900px;
  gap: 40px;
`;

const BattleHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
`;

const RoundBadge = styled.div`
  display: inline-flex;
  min-height: 36px;
  align-items: center;
  border: 1px solid #e5e7eb;
  border-radius: 999px;
  padding: 0 14px;
  color: #4e5968;
  background: #ffffff;
  font-size: 14px;
  font-weight: 600;
`;

const BattleTitleBlock = styled.section`
  display: grid;
  gap: 12px;
`;

const BattleKicker = styled.div`
  display: inline-flex;
  width: fit-content;
  align-items: center;
  gap: 6px;
  color: #4e5968;
  font-size: 14px;
  font-weight: 600;
`;

const BattleTitle = styled.h1`
  margin: 0;
  color: #191f28;
  font-size: 24px;
  font-weight: 700;
  line-height: 1.3;
  letter-spacing: -0.02em;
  word-break: keep-all;
`;

const BattleSummary = styled.p`
  margin: 0;
  color: #4e5968;
  font-size: 16px;
  font-weight: 400;
  line-height: 1.6;
`;

const ChatPanel = styled.section`
  display: grid;
  min-height: 360px;
  align-content: start;
  gap: 16px;
  padding: 24px 0;
  border-top: 1px solid #f2f4f6;
  border-bottom: 1px solid #f2f4f6;

  @media (max-width: 640px) {
    padding: 16px 0;
  }
`;

const MessageRow = styled("div", {
  shouldForwardProp: (prop) => prop !== "$role",
})<{ $role: DebateMessage["role"] }>`
  display: flex;
  justify-content: ${({ $role }) =>
    $role === "conservative" || $role === "user" ? "flex-end" : "flex-start"};
`;

const MessageBubble = styled("div", {
  shouldForwardProp: (prop) => prop !== "$role" && prop !== "$tone",
})<{ $role: DebateMessage["role"]; $tone: string }>`
  display: flex;
  flex-direction: column;
  max-width: min(78%, 620px);
  gap: 6px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 14px 16px;
  color: #191f28;
  background: #ffffff;

  @media (max-width: 640px) {
    max-width: 92%;
  }
`;

const MessageLabel = styled.div<{ $tone?: string }>`
  color: ${({ $tone }) => $tone ?? "#4e5968"};
  font-size: 14px;
  font-weight: 600;
`;

const MessageText = styled.div`
  color: #191f28;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: keep-all;
`;

const Cursor = styled.span`
  display: inline-block;
  width: 6px;
  height: 1em;
  margin-left: 2px;
  background: #191f28;
  vertical-align: -0.14em;
  animation: blink 0.9s steps(2, start) infinite;

  @keyframes blink {
    50% { opacity: 0; }
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    opacity: 1;
  }
`;

const EmptyChat = styled.div`
  align-self: center;
  justify-self: center;
  color: #8b95a1;
  font-size: 14px;
  font-weight: 500;
`;

const Composer = styled.section`
  display: grid;
  gap: 12px;
`;

const ComposerMeta = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: #8b95a1;
  font-size: 14px;
  font-weight: 500;
`;

const InterventionHint = styled.p`
  margin: 0;
  padding: 10px 14px;
  border-radius: 6px;
  background: #f2f4f6;
  color: #4e5968;
  font-size: 13px;
  font-weight: 400;
  line-height: 1.5;
`;

const ComposerActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
`;

const ArgumentInput = styled.textarea`
  width: 100%;
  resize: vertical;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 14px 16px;
  color: #191f28;
  background: #ffffff;
  font-size: 16px;
  font-weight: 400;
  line-height: 1.6;
  transition: border-color 200ms ease;

  &:focus {
    outline: none;
    border-color: #3182f6;
  }

  &:disabled {
    color: #8b95a1;
    background: #f2f4f6;
    cursor: not-allowed;
  }

  &::placeholder {
    color: #8b95a1;
  }
`;

const SubmitButton = styled("button", {
  shouldForwardProp: (prop) => prop !== "$tone",
})<{ $tone: string }>`
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 8px;
  padding: 0 20px;
  color: #ffffff;
  background: #3182f6;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 200ms ease;

  &:hover {
    opacity: 0.92;
  }

  &:disabled {
    color: #8b95a1;
    background: #f2f4f6;
    cursor: not-allowed;
  }
`;

const SecondaryButton = styled.button`
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 0 16px;
  color: #4e5968;
  background: #ffffff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: border-color 200ms ease;

  &:hover {
    border-color: #191f28;
  }
`;

const StatusPanel = styled.div`
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  color: #4e5968;
  background: #ffffff;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.6;
`;

const ErrorPanel = styled.div`
  padding: 16px;
  border: 1px solid #f04452;
  border-radius: 8px;
  color: #f04452;
  background: #ffffff;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.6;
`;

const ResultCard = styled("section", {
  shouldForwardProp: (prop) => prop !== "$tone",
})<{ $tone: string }>`
  display: grid;
  gap: 12px;
  padding: 24px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
`;

const ResultTitle = styled.h2`
  margin: 0;
  color: #191f28;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.02em;
`;

const ResultReason = styled.p`
  margin: 0;
  color: #4e5968;
  font-size: 16px;
  font-weight: 400;
  line-height: 1.6;
`;

const ResultActions = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 8px;
`;

const ResultButton = styled.button`
  display: inline-flex;
  min-height: 44px;
  min-width: 120px;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 0;
  border-radius: 8px;
  padding: 0 16px;
  color: #ffffff;
  background: #3182f6;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 200ms ease;

  &:hover {
    opacity: 0.92;
  }
`;

const ResultLink = styled(Link)`
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 0 16px;
  color: #4e5968;
  background: #ffffff;
  font-size: 14px;
  font-weight: 600;
  transition: border-color 200ms ease;

  &:hover {
    border-color: #191f28;
  }
`;

/* ── Issue Opinion Snapshot ───────────────────────────── */

const OpinionSnapshot = styled.div`
  display: grid;
  gap: 12px;
  padding: 20px;
  border: 1px solid #e5e8eb;
  border-radius: 12px;
  background: #f9fafb;
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

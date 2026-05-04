"use client";

import styled from "@emotion/styled";
import { ArrowLeft, ArrowRight, RotateCcw, Swords } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

type BattleProps = {
  issue: HotIssue;
  stance: Stance;
  isAuthenticated: boolean;
  initialCachedBattle: CachedArenaBattle | null;
};

const MAX_ARGUMENT_LENGTH = 200;

function getStanceLabel(stance: Stance) {
  return stance === "progressive" ? "진보" : "보수";
}

function getStanceTone(stance: Stance) {
  return stance === "progressive" ? "#3182f6" : "#ef4444";
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
      color: "#ef4444",
    };
  }

  return {
    title: "팽팽한 승부였습니다",
    color: "var(--adaptiveGrey700)",
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
      <Shell>
        <TopNav>
          <Brand href="/">좌우지간</Brand>
          <HomeLink href="/home">홈</HomeLink>
        </TopNav>

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
          <HeroTitle>이슈를 고르고 3라운드 논리 싸움을 시작하세요</HeroTitle>
          <HeroDescription>
            진보 AI와 보수 AI가 서로 번갈아 토론합니다. 원하는 순간에만 의견을 개입할 수 있습니다.
          </HeroDescription>
        </Hero>

        {issues.length > 0 ? (
          <IssueGrid>
            {issues.map((issue) => (
              <IssueCard key={issue.id} href={`/arena/${issue.id}`}>
                <IssueCardMeta>토론 이슈</IssueCardMeta>
                <IssueCardTitle>{issue.title}</IssueCardTitle>
                <IssueCardSummary>{issue.summary}</IssueCardSummary>
                <IssueCardFooter>
                  <span>토론 입장 고르기</span>
                  <ArrowRight size={16} />
                </IssueCardFooter>
              </IssueCard>
            ))}
          </IssueGrid>
        ) : (
          <EmptyPanel>
            <EmptyTitle>진행 가능한 이슈가 없습니다</EmptyTitle>
            <EmptyText>유효한 이슈가 생성되면 이곳에 표시됩니다.</EmptyText>
          </EmptyPanel>
        )}
      </Shell>
    </Page>
  );
}

export function ArenaIssueDetail({ issue }: IssueDetailProps) {
  return (
    <Page>
      <Shell>
        <BackLink href="/arena">
          <ArrowLeft size={16} />
          <span>다른 이슈 보기</span>
        </BackLink>

        <DetailPanel>
          <HeroEyebrow>응원할 입장 선택</HeroEyebrow>
          <DetailTitle>{issue.title}</DetailTitle>
          <DetailSummary>{issue.summary}</DetailSummary>

          <ContextGrid>
            <ContextBox>
              <ContextLabel $tone="#3182f6">진보 관점</ContextLabel>
              <ContextText>{issue.progressive}</ContextText>
            </ContextBox>
            <ContextBox>
              <ContextLabel $tone="#ef4444">보수 관점</ContextLabel>
              <ContextText>{issue.conservative}</ContextText>
            </ContextBox>
          </ContextGrid>

          <StanceActions>
            <StanceButton
              href={`/arena/${issue.id}/battle?stance=progressive`}
              $tone="#3182f6"
            >
              진보 AI 응원하기
            </StanceButton>
            <StanceButton
              href={`/arena/${issue.id}/battle?stance=conservative`}
              $tone="#ef4444"
            >
              보수 AI 응원하기
            </StanceButton>
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
            <span>{getStanceLabel(stance)} AI 응원 중</span>
          </BattleKicker>
          <BattleTitle>{issue.title}</BattleTitle>
          <BattleSummary>{issue.summary}</BattleSummary>
        </BattleTitleBlock>

        {error ? <ErrorPanel>{error}</ErrorPanel> : null}

        <ChatPanel>
          {messages.map((message, index) => (
            <MessageBubble
              key={`${message.role}-${index}-${message.content}`}
              $role={message.role}
              $tone={
                message.role === "user" ? getStanceTone(stance) : getStanceTone(message.role)
              }
            >
              <MessageLabel>
                {message.role === "user"
                  ? `내 의견 · ${getStanceLabel(stance)}`
                  : `${getStanceLabel(message.role)} AI`}
              </MessageLabel>
              <MessageText>{message.content}</MessageText>
            </MessageBubble>
          ))}

          {streamingText ? (
            <MessageBubble $role={streamingRole} $tone={getStanceTone(streamingRole)}>
              <MessageLabel>{getStanceLabel(streamingRole)} AI</MessageLabel>
              <MessageText>
                {streamingText}
                <Cursor aria-hidden="true" />
              </MessageText>
            </MessageBubble>
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
          <ResultCard $tone={resultCopy.color}>
            <ResultTitle>{resultCopy.title}</ResultTitle>
            <ResultReason>{result.reason}</ResultReason>
            <ResultActions>
              <ResultButton type="button" onClick={() => void startBattle()}>
                <RotateCcw size={16} />
                <span>다시 도전</span>
              </ResultButton>
              <ResultLink href="/arena">다른 이슈</ResultLink>
            </ResultActions>
          </ResultCard>
        ) : (
          <Composer>
            <ComposerMeta>
              <span>내 의견 개입</span>
              <span>
                {argument.length} / {MAX_ARGUMENT_LENGTH}
              </span>
            </ComposerMeta>
            <ArgumentInput
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
                  ? "토론에 참고시킬 의견을 짧게 입력하세요."
                  : "AI끼리 토론 중입니다. 개입 버튼을 누르면 의견을 넣을 수 있습니다."
              }
              disabled={phase !== "intervention"}
              rows={4}
            />
            <ComposerActions>
              {phase === "between-turns" ? (
                <>
                  <SecondaryButton type="button" onClick={handleContinue}>
                    바로 다음 발언
                  </SecondaryButton>
                  <SubmitButton
                    type="button"
                    onClick={handleOpenIntervention}
                    $tone={getStanceTone(stance)}
                  >
                    의견 개입
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
                    의견 넣고 계속
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
  padding: 28px 24px 64px;
  color: var(--adaptiveGrey900);
  background: var(--adaptiveBackground);

  @media (max-width: 640px) {
    padding: 20px 16px 48px;
  }
`;

const Shell = styled.div`
  display: grid;
  width: min(100%, 1120px);
  gap: 22px;
  margin: 0 auto;
`;

const TopNav = styled.nav`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
`;

const Brand = styled(Link)`
  color: var(--adaptiveGrey900);
  font-size: 1.05rem;
  font-weight: 900;
`;

const HomeLink = styled(Link)`
  display: inline-flex;
  min-height: 40px;
  align-items: center;
  border: 1px solid var(--adaptiveHairlineBorder);
  border-radius: var(--radius-control);
  padding: 0 14px;
  color: var(--adaptiveGrey700);
  background: var(--adaptiveLayeredBackground);
  font-size: 0.9rem;
  font-weight: 700;
`;

const LoginBanner = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 18px;
  border: 1px solid var(--adaptiveBlue100);
  border-radius: var(--radius-card);
  background: var(--adaptiveBlue50);

  @media (max-width: 640px) {
    align-items: stretch;
    flex-direction: column;
  }
`;

const BannerText = styled.p`
  margin: 0;
  color: var(--adaptiveBlue800);
  font-size: 0.95rem;
  font-weight: 700;
  line-height: 1.55;
`;

const BannerAction = styled(Link)`
  display: inline-flex;
  min-height: 40px;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-control);
  padding: 0 14px;
  color: var(--white);
  background: var(--adaptiveBlue500);
  font-size: 0.9rem;
  font-weight: 800;
`;

const Hero = styled.section`
  display: grid;
  gap: 12px;
  padding: 36px 0 12px;
`;

const HeroEyebrow = styled.div`
  color: var(--adaptiveBlue600);
  font-size: 0.92rem;
  font-weight: 800;
`;

const HeroTitle = styled.h1`
  max-width: 780px;
  margin: 0;
  color: var(--adaptiveGrey900);
  font-size: clamp(2rem, 5vw, 3.8rem);
  font-weight: 900;
  line-height: 1.15;
  word-break: keep-all;
`;

const HeroDescription = styled.p`
  max-width: 640px;
  margin: 0;
  color: var(--adaptiveGrey600);
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.7;
`;

const IssueGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;

  @media (max-width: 980px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const IssueCard = styled(Link)`
  display: grid;
  min-height: 236px;
  align-content: start;
  gap: 12px;
  padding: 22px;
  border: 1px solid var(--adaptiveHairlineBorder);
  border-radius: var(--radius-card);
  background: var(--adaptiveLayeredBackground);
  box-shadow: var(--shadow-card);
  transition:
    transform 0.2s ease,
    border-color 0.2s ease;

  &:hover {
    border-color: var(--adaptiveBlue200);
    transform: translateY(-2px);
  }
`;

const IssueCardMeta = styled.div`
  color: var(--adaptiveBlue600);
  font-size: 0.82rem;
  font-weight: 800;
`;

const IssueCardTitle = styled.h2`
  margin: 0;
  color: var(--adaptiveGrey900);
  font-size: 1.2rem;
  font-weight: 900;
  line-height: 1.35;
  word-break: keep-all;
`;

const IssueCardSummary = styled.p`
  margin: 0;
  color: var(--adaptiveGrey600);
  font-size: 0.95rem;
  font-weight: 600;
  line-height: 1.65;
`;

const IssueCardFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: auto;
  color: var(--adaptiveGrey800);
  font-size: 0.9rem;
  font-weight: 800;
`;

const EmptyPanel = styled.div`
  padding: 28px;
  border: 1px solid var(--adaptiveHairlineBorder);
  border-radius: var(--radius-card);
  background: var(--adaptiveLayeredBackground);
`;

const EmptyTitle = styled.h2`
  margin: 0;
  font-size: 1.2rem;
`;

const EmptyText = styled.p`
  margin: 8px 0 0;
  color: var(--adaptiveGrey600);
`;

const BackLink = styled(Link)`
  display: inline-flex;
  width: fit-content;
  align-items: center;
  gap: 6px;
  color: var(--adaptiveGrey600);
  font-size: 0.92rem;
  font-weight: 800;
`;

const DetailPanel = styled.section`
  display: grid;
  gap: 22px;
  padding: 28px;
  border: 1px solid var(--adaptiveHairlineBorder);
  border-radius: var(--radius-card);
  background: var(--adaptiveLayeredBackground);
  box-shadow: var(--shadow-card);
`;

const DetailTitle = styled.h1`
  max-width: 860px;
  margin: 0;
  color: var(--adaptiveGrey900);
  font-size: clamp(1.8rem, 4vw, 3rem);
  font-weight: 900;
  line-height: 1.22;
  word-break: keep-all;
`;

const DetailSummary = styled.p`
  max-width: 760px;
  margin: 0;
  color: var(--adaptiveGrey600);
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.72;
`;

const ContextGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`;

const ContextBox = styled.div`
  display: grid;
  gap: 8px;
  padding: 18px;
  border-radius: var(--radius-control);
  background: var(--adaptiveGreyBackground);
`;

const ContextLabel = styled("div", {
  shouldForwardProp: (prop) => prop !== "$tone",
})<{ $tone: string }>`
  color: ${({ $tone }) => $tone};
  font-size: 0.88rem;
  font-weight: 900;
`;

const ContextText = styled.p`
  margin: 0;
  color: var(--adaptiveGrey700);
  font-size: 0.94rem;
  font-weight: 600;
  line-height: 1.65;
`;

const StanceActions = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
`;

const StanceButton = styled(Link, {
  shouldForwardProp: (prop) => prop !== "$tone",
})<{ $tone: string }>`
  display: inline-flex;
  min-height: 48px;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-control);
  padding: 0 18px;
  color: #ffffff;
  background: ${({ $tone }) => $tone};
  font-size: 0.98rem;
  font-weight: 900;
`;

const BattlePage = styled(Page)`
  padding-bottom: 48px;
`;

const BattleShell = styled(Shell)`
  max-width: 900px;
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
  border-radius: 999px;
  padding: 0 13px;
  color: var(--adaptiveGrey800);
  background: var(--adaptiveGreyBackground);
  font-size: 0.88rem;
  font-weight: 900;
`;

const BattleTitleBlock = styled.section`
  display: grid;
  gap: 10px;
`;

const BattleKicker = styled.div`
  display: inline-flex;
  width: fit-content;
  align-items: center;
  gap: 6px;
  color: var(--adaptiveBlue600);
  font-size: 0.9rem;
  font-weight: 900;
`;

const BattleTitle = styled.h1`
  margin: 0;
  color: var(--adaptiveGrey900);
  font-size: clamp(1.45rem, 4vw, 2.4rem);
  font-weight: 900;
  line-height: 1.25;
  word-break: keep-all;
`;

const BattleSummary = styled.p`
  margin: 0;
  color: var(--adaptiveGrey600);
  font-size: 0.98rem;
  font-weight: 600;
  line-height: 1.65;
`;

const ChatPanel = styled.section`
  display: grid;
  min-height: 360px;
  align-content: start;
  gap: 12px;
  padding: 20px;
  border: 1px solid var(--adaptiveHairlineBorder);
  border-radius: var(--radius-card);
  background: var(--adaptiveLayeredBackground);
  box-shadow: var(--shadow-card);

  @media (max-width: 640px) {
    padding: 14px;
  }
`;

const MessageBubble = styled("div", {
  shouldForwardProp: (prop) => prop !== "$role" && prop !== "$tone",
})<{ $role: DebateMessage["role"]; $tone: string }>`
  display: grid;
  width: fit-content;
  max-width: min(78%, 620px);
  gap: 6px;
  justify-self: ${({ $role }) =>
    $role === "conservative" || $role === "user" ? "end" : "start"};
  border-radius: 18px;
  padding: 13px 15px;
  color: ${({ $role }) =>
    $role === "conservative" || $role === "user"
      ? "var(--white)"
      : "var(--adaptiveGrey900)"};
  background: ${({ $role, $tone }) =>
    $role === "conservative" || $role === "user"
      ? $tone
      : "var(--adaptiveBlue50)"};

  @media (max-width: 640px) {
    max-width: 92%;
  }
`;

const MessageLabel = styled.div`
  opacity: 0.78;
  font-size: 0.75rem;
  font-weight: 900;
`;

const MessageText = styled.div`
  font-size: 0.96rem;
  font-weight: 700;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: keep-all;
`;

const Cursor = styled.span`
  display: inline-block;
  width: 7px;
  height: 1.05em;
  margin-left: 2px;
  background: currentColor;
  vertical-align: -0.16em;
  animation: blink 0.9s steps(2, start) infinite;

  @keyframes blink {
    50% {
      opacity: 0;
    }
  }
`;

const EmptyChat = styled.div`
  align-self: center;
  justify-self: center;
  color: var(--adaptiveGrey500);
  font-size: 0.95rem;
  font-weight: 800;
`;

const Composer = styled.section`
  display: grid;
  gap: 10px;
  padding: 16px;
  border: 1px solid var(--adaptiveBlue200);
  border-radius: var(--radius-card);
  background: var(--adaptiveLayeredBackground);
  box-shadow: var(--shadow-card);
`;

const ComposerMeta = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: var(--adaptiveGrey600);
  font-size: 0.86rem;
  font-weight: 800;
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
  border: 1px solid var(--adaptiveHairlineBorder);
  border-radius: var(--radius-control);
  padding: 14px;
  color: var(--adaptiveGrey900);
  background: var(--adaptiveGreyBackground);
  font-size: 0.96rem;
  font-weight: 650;
  line-height: 1.6;

  &:disabled {
    color: var(--adaptiveGrey500);
    cursor: not-allowed;
  }

  &::placeholder {
    color: var(--adaptiveGrey500);
  }
`;

const SubmitButton = styled("button", {
  shouldForwardProp: (prop) => prop !== "$tone",
})<{ $tone: string }>`
  display: inline-flex;
  min-height: 46px;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: var(--radius-control);
  padding: 0 18px;
  color: var(--white);
  background: ${({ $tone }) => $tone};
  font-size: 0.96rem;
  font-weight: 900;
  cursor: pointer;
  box-shadow: 0 10px 22px ${({ $tone }) => `${$tone}33`};

  &:disabled {
    color: var(--adaptiveGrey600);
    background: #e5e7eb;
    box-shadow: none;
    cursor: not-allowed;
  }
`;

const SecondaryButton = styled.button`
  display: inline-flex;
  min-height: 46px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--adaptiveHairlineBorder);
  border-radius: var(--radius-control);
  padding: 0 16px;
  color: var(--adaptiveGrey800);
  background: var(--adaptiveLayeredBackground);
  font-size: 0.94rem;
  font-weight: 900;
  cursor: pointer;
`;

const StatusPanel = styled.div`
  padding: 16px;
  border-radius: var(--radius-control);
  color: var(--adaptiveBlue700);
  background: var(--adaptiveBlue50);
  font-size: 0.94rem;
  font-weight: 800;
`;

const ErrorPanel = styled.div`
  padding: 16px;
  border-radius: var(--radius-control);
  color: var(--adaptiveRed700);
  background: var(--adaptiveRed50);
  font-size: 0.94rem;
  font-weight: 800;
`;

const ResultCard = styled("section", {
  shouldForwardProp: (prop) => prop !== "$tone",
})<{ $tone: string }>`
  display: grid;
  gap: 12px;
  padding: 22px;
  border: 1px solid ${({ $tone }) => $tone};
  border-radius: var(--radius-card);
  background: var(--adaptiveLayeredBackground);
  box-shadow: var(--shadow-card);
`;

const ResultTitle = styled.h2`
  margin: 0;
  color: var(--adaptiveGrey900);
  font-size: 1.45rem;
  font-weight: 900;
`;

const ResultReason = styled.p`
  margin: 0;
  color: var(--adaptiveGrey600);
  font-size: 0.98rem;
  font-weight: 700;
  line-height: 1.6;
`;

const ResultActions = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 4px;
`;

const ResultButton = styled.button`
  display: inline-flex;
  min-height: 42px;
  min-width: 104px;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 0;
  border-radius: var(--radius-control);
  padding: 0 14px;
  color: #ffffff;
  background: #3182f6;
  font-size: 0.92rem;
  font-weight: 900;
  cursor: pointer;
  box-shadow: 0 10px 22px rgba(49, 130, 246, 0.22);
`;

const ResultLink = styled(Link)`
  display: inline-flex;
  min-height: 42px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--adaptiveHairlineBorder);
  border-radius: var(--radius-control);
  padding: 0 14px;
  color: var(--adaptiveGrey800);
  background: var(--adaptiveLayeredBackground);
  font-size: 0.92rem;
  font-weight: 900;
`;

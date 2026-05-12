import type { DebateMessage, DebateResult } from "@/containers/arena/battle";

export type VerdictCounts = {
  progressive: number;
  conservative: number;
  draw: number;
  total: number;
};

export type VerdictResponse = {
  counts: VerdictCounts;
  user_verdict: string | null;
};

export type VerdictSide = "progressive" | "conservative" | "draw";

export type { DebateMessage, DebateResult };

export type DebateStreamPayload = {
  issueId: string;
  issueTitle: string;
  progressiveContext: string;
  conservativeContext: string;
  speakerStance: "progressive" | "conservative";
  round: number;
  history: DebateMessage[];
};

export async function streamDebate({
  payload,
  onToken,
}: {
  payload: DebateStreamPayload;
  onToken: (token: string) => void;
}): Promise<string> {
  const response = await fetch("/api/arena/debate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";

    for (const event of events) {
      const isErrorEvent = event
        .split("\n")
        .some((item) => item.trim() === "event: error");
      const line = event.split("\n").find((item) => item.startsWith("data: "));
      if (!line) continue;

      const data = line.slice(6);
      if (data === "[DONE]") continue;

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

export async function judgeDebate({
  issueTitle,
  history,
}: {
  issueTitle: string;
  history: DebateMessage[];
}): Promise<DebateResult> {
  const response = await fetch("/api/arena/judge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ issueTitle, history }),
  });
  if (!response.ok) throw new Error("토론 결과를 판정하지 못했습니다.");
  return response.json() as Promise<DebateResult>;
}

export async function saveBattleCache({
  issueId,
  messages,
  result,
}: {
  issueId: string;
  messages: DebateMessage[];
  result: DebateResult;
}): Promise<void> {
  await fetch("/api/arena/battle-cache", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ issueId, messages, result }),
  });
}

export async function saveBattleLog({
  topic,
  messages,
  winner,
  userStance,
}: {
  topic: string;
  messages: DebateMessage[];
  winner: DebateResult["winner"];
  userStance: string;
}): Promise<void> {
  await fetch("/api/arena/battle-log", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic, messages, winner, userStance }),
  });
}

export async function fetchVerdict(issueId: string): Promise<VerdictResponse> {
  const res = await fetch(`/api/arena/verdict?issueId=${issueId}`);
  if (!res.ok) throw new Error("Failed to fetch verdict");
  return res.json() as Promise<VerdictResponse>;
}

export async function postVerdict({
  issueId,
  side,
}: {
  issueId: string;
  side: VerdictSide;
}): Promise<VerdictResponse> {
  const res = await fetch("/api/arena/verdict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ issueId, side }),
  });
  if (!res.ok) throw new Error("Failed to post verdict");
  return res.json() as Promise<VerdictResponse>;
}

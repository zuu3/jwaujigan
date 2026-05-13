import type { PollRow, PollOption } from "@/app/api/polls/route";
import type { PollDetail } from "@/app/api/polls/[id]/route";

export type { PollRow, PollOption, PollDetail };

export type CreatePollInput = {
  question: string;
  options: PollOption[];
  expires_in_days: 1 | 3 | 7;
};

export type PollVoteResult = {
  option_counts: Record<string, number>;
  user_vote: string;
  total_count: number;
  points_earned: number;
};

export async function fetchPolls(cursor?: string): Promise<{ polls: PollRow[] }> {
  const url = cursor ? `/api/polls?cursor=${encodeURIComponent(cursor)}` : "/api/polls";
  const res = await fetch(url);
  if (!res.ok) throw new Error("투표 목록을 불러오지 못했습니다.");
  return res.json() as Promise<{ polls: PollRow[] }>;
}

export async function fetchPoll(id: string): Promise<{ poll: PollDetail }> {
  const res = await fetch(`/api/polls/${id}`);
  if (!res.ok) throw new Error("투표를 불러오지 못했습니다.");
  return res.json() as Promise<{ poll: PollDetail }>;
}

export async function createPoll(input: CreatePollInput): Promise<{ poll: PollRow }> {
  const res = await fetch("/api/polls", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (res.status === 402) throw new Error("포인트가 부족합니다.");
  if (!res.ok) {
    const body = await res.json() as { message?: string };
    throw new Error(body.message ?? "투표 생성에 실패했습니다.");
  }
  return res.json() as Promise<{ poll: PollRow }>;
}

export async function votePoll(pollId: string, option_id: string): Promise<PollVoteResult> {
  const res = await fetch(`/api/polls/${pollId}/vote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ option_id }),
  });
  if (res.status === 409) throw new Error("이미 투표했습니다.");
  if (res.status === 410) throw new Error("마감된 투표입니다.");
  if (!res.ok) {
    const body = await res.json() as { message?: string };
    throw new Error(body.message ?? "투표에 실패했습니다.");
  }
  return res.json() as Promise<PollVoteResult>;
}

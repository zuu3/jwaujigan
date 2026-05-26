import type {
  ElectionType,
  LocalElectionWinner,
  LocalElectionCandidate,
} from "@/lib/local-election.types";

export type LocalElectionResponse = {
  sdName: string;
  wiwNames: string[];
  district: string;
  winners: Record<ElectionType, LocalElectionWinner[]>;
  candidates: Record<ElectionType, LocalElectionCandidate[]>;
};

export async function fetchLocalElection(): Promise<LocalElectionResponse> {
  const res = await fetch("/api/local-election");

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? "Failed to fetch local election data");
  }

  return res.json() as Promise<LocalElectionResponse>;
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchPolls, fetchPoll, createPoll, votePoll } from "./community.api";
import type { CreatePollInput } from "./community.api";

export const pollKeys = {
  all: ["polls"] as const,
  list: () => [...pollKeys.all, "list"] as const,
  detail: (id: string) => [...pollKeys.all, "detail", id] as const,
};

export function usePollsQuery() {
  return useQuery({
    queryKey: pollKeys.list(),
    queryFn: () => fetchPolls(),
    select: (data) => data.polls,
  });
}

export function usePollQuery(id: string) {
  return useQuery({
    queryKey: pollKeys.detail(id),
    queryFn: () => fetchPoll(id),
    select: (data) => data.poll,
  });
}

export function useCreatePollMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePollInput) => createPoll(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: pollKeys.list() });
    },
  });
}

export function useVotePollMutation(pollId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (option_id: string) => votePoll(pollId, option_id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: pollKeys.detail(pollId) });
      void qc.invalidateQueries({ queryKey: pollKeys.list() });
    },
  });
}

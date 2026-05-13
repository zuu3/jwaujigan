import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchPolls, fetchPoll, createPoll, votePoll } from "./community.api";
import type { CreatePollInput } from "./community.api";

export const pollKeys = {
  all: ["polls"] as const,
  list: (sort: "latest" | "hot" = "latest") => [...pollKeys.all, "list", sort] as const,
  detail: (id: string) => [...pollKeys.all, "detail", id] as const,
};

export function usePollsQuery(sort: "latest" | "hot" = "latest") {
  return useQuery({
    queryKey: pollKeys.list(sort),
    queryFn: () => fetchPolls(undefined, sort),
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
      // 정렬 탭 모두 무효화하기 위해 상위 키 사용
      void qc.invalidateQueries({ queryKey: pollKeys.all });
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

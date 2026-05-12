import { useMutation, useQueryClient } from "@tanstack/react-query";
import { voteIssue } from "./issues.api";
import type { HotIssuesResponse, IssueVoteStance } from "./issues.api";

export function useVoteIssue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: voteIssue,
    onMutate: async ({ issueId, stance }) => {
      await queryClient.cancelQueries({ queryKey: ["issues"] });
      const previous = queryClient.getQueryData<HotIssuesResponse>(["issues"]);
      queryClient.setQueryData<HotIssuesResponse>(["issues"], (old) => {
        if (!old) return old;
        return {
          issues: old.issues.map((issue) => {
            if (issue.id !== issueId) return issue;
            const prev = issue.user_vote;
            const isToggle = prev === stance;
            const newVote = isToggle ? null : stance;
            const counts = { ...issue.vote_counts };
            if (prev) counts[prev] = Math.max(0, counts[prev] - 1);
            if (newVote) counts[newVote]++;
            counts.total = counts.progressive + counts.conservative + counts.neutral;
            return { ...issue, user_vote: newVote, vote_counts: counts };
          }),
        };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData<HotIssuesResponse>(["issues"], context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["issues"] });
    },
  });
}

export type { IssueVoteStance };

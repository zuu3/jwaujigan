import { useMutation, useQueryClient } from "@tanstack/react-query";
import { voteIssue } from "./issues.api";
import type { HotIssuesResponse, IssueVoteStance } from "./issues.api";
import { showPointsToast } from "@/lib/points-toast";
import { showBadgeToast } from "@/lib/badge-toast";
import { BADGE_DEFS, DAILY_BONUS, POINTS } from "@/services/points/points";

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
    onSuccess: (data) => {
      if (data.points_earned > 0) {
        showPointsToast({
          points: POINTS.VOTE,
          label: "투표 완료",
          bonus: data.daily_bonus_earned ? DAILY_BONUS : undefined,
        });
        void queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      }
      if (data.newly_earned_badges?.length) {
        for (const badgeId of data.newly_earned_badges) {
          const badge = BADGE_DEFS.find((b) => b.id === badgeId);
          if (badge) showBadgeToast({ title: badge.title, desc: badge.desc });
        }
      }
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

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postVerdict } from "./arena.api";

export function usePostVerdict(issueId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: postVerdict,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["verdict", issueId] });
    },
  });
}

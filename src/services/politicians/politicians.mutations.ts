import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toggleFollow } from "./politicians.api";

export function useToggleFollow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: toggleFollow,
    onSuccess: (_data, { politicianId }) => {
      void queryClient.invalidateQueries({ queryKey: ["follow-status", politicianId] });
      void queryClient.invalidateQueries({ queryKey: ["followed-politician-names"] });
    },
  });
}

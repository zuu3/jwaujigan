import { useQuery } from "@tanstack/react-query";
import { fetchVerdict } from "./arena.api";

export function useVerdict(issueId: string | null) {
  return useQuery({
    queryKey: ["verdict", issueId],
    enabled: Boolean(issueId),
    queryFn: () => fetchVerdict(issueId!),
    staleTime: 30_000,
  });
}

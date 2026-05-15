import { useQuery } from "@tanstack/react-query";
import { fetchIssues } from "./issues.api";
import type { HotIssuesResponse } from "./issues.api";

export function useIssues(options?: { initialData?: HotIssuesResponse }) {
  return useQuery({
    queryKey: ["issues"],
    queryFn: fetchIssues,
    staleTime: 1000 * 60 * 30,
    ...(options?.initialData && {
      initialData: options.initialData,
      initialDataUpdatedAt: Date.now(),
    }),
  });
}

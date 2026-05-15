import { useQuery } from "@tanstack/react-query";
import { fetchIssues } from "./issues.api";

export function useIssues() {
  return useQuery({
    queryKey: ["issues"],
    queryFn: fetchIssues,
    staleTime: 1000 * 60 * 30,
  });
}

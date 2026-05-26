import { useQuery } from "@tanstack/react-query";
import { fetchLocalElection } from "./local-election.api";

export function useLocalElection(district: string | null | undefined) {
  return useQuery({
    queryKey: ["local-election", district],
    queryFn: fetchLocalElection,
    enabled: Boolean(district),
    staleTime: 60 * 60 * 1000, // 1 hour — election data changes rarely
    retry: 1,
  });
}

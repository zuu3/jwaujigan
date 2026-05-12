import { useQuery } from "@tanstack/react-query";
import {
  fetchLocalPoliticians,
  fetchPoliticianDetail,
  fetchFollowedPoliticianNames,
  fetchFollowStatus,
} from "./politicians.api";

export function useLocalPoliticians({ enabled }: { enabled: boolean }) {
  return useQuery({
    queryKey: ["local-politicians"],
    enabled,
    queryFn: fetchLocalPoliticians,
    staleTime: 1000 * 60 * 60 * 12,
  });
}

export function usePoliticianDetail(id: string | null) {
  return useQuery({
    queryKey: ["politician-detail", id],
    enabled: Boolean(id),
    queryFn: () => fetchPoliticianDetail(id!),
    staleTime: 1000 * 60 * 60 * 12,
  });
}

export function useFollowedPoliticianNames() {
  return useQuery({
    queryKey: ["followed-politician-names"],
    queryFn: fetchFollowedPoliticianNames,
    staleTime: 60_000,
  });
}

export function useFollowStatus(politicianId: string) {
  return useQuery({
    queryKey: ["follow-status", politicianId],
    queryFn: () => fetchFollowStatus(politicianId),
    staleTime: 60_000,
  });
}

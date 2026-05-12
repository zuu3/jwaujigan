import { useQuery } from "@tanstack/react-query";
import { fetchActivity, fetchFollowedPoliticians } from "./activity.api";

export function useActivity() {
  return useQuery({
    queryKey: ["activity"],
    queryFn: fetchActivity,
    staleTime: 60_000,
  });
}

export function useFollowedPoliticians() {
  return useQuery({
    queryKey: ["followed-politicians"],
    queryFn: fetchFollowedPoliticians,
    staleTime: 60_000,
  });
}

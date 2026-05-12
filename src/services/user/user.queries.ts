import { useQuery } from "@tanstack/react-query";
import { fetchUserProfile } from "./user.api";

export function useUserProfile() {
  return useQuery({
    queryKey: ["user-profile"],
    queryFn: fetchUserProfile,
    staleTime: 1000 * 60 * 10,
  });
}

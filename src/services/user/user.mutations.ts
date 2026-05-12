import { useMutation } from "@tanstack/react-query";
import { savePoliticalProfile } from "./user.api";

export function useSavePoliticalProfile() {
  return useMutation({
    mutationFn: savePoliticalProfile,
  });
}

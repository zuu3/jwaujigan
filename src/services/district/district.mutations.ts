import { useMutation } from "@tanstack/react-query";
import { saveDistrict } from "./district.api";

export function useSaveDistrict() {
  return useMutation({
    mutationFn: saveDistrict,
  });
}

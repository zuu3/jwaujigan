import { useQuery } from "@tanstack/react-query";
import { fetchSearch } from "./search.api";

export function useSearch(query: string) {
  return useQuery({
    queryKey: ["search", query],
    enabled: query.length >= 2,
    queryFn: () => fetchSearch(query),
  });
}

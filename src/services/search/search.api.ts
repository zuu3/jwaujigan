import type { SearchResponse } from "@/app/api/search/route";

export type { SearchResponse };

export async function fetchSearch(q: string): Promise<SearchResponse> {
  const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
  if (!res.ok) throw new Error("Search failed");
  return res.json() as Promise<SearchResponse>;
}

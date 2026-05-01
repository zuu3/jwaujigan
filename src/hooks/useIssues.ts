"use client";

import { useQuery } from "@tanstack/react-query";
import type { HotIssuesResponse } from "@/types/issue";

async function fetchIssues() {
  const response = await fetch("/api/issues");

  if (!response.ok) {
    throw new Error("Failed to fetch issues");
  }

  return (await response.json()) as HotIssuesResponse;
}

export function useIssues() {
  return useQuery({
    queryKey: ["issues"],
    queryFn: fetchIssues,
    staleTime: 1000 * 60 * 30,
  });
}

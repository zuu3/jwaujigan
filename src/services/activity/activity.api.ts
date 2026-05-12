import type { ActivityResponse, FollowedPolitician } from "@/types/mypage";

export type { ActivityResponse };

export type FollowedPoliticiansResponse = {
  follows: FollowedPolitician[];
};

export async function fetchActivity(): Promise<ActivityResponse> {
  const res = await fetch("/api/me/activity");
  if (!res.ok) throw new Error("Failed to fetch activity");
  return res.json() as Promise<ActivityResponse>;
}

export async function fetchFollowedPoliticians(): Promise<FollowedPolitician[]> {
  const res = await fetch("/api/politicians/follows");
  if (!res.ok) throw new Error("Failed to fetch followed politicians");
  const data = (await res.json()) as FollowedPoliticiansResponse;
  return data.follows;
}

export type UserProfileResponse = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  district: string | null;
  hasPoliticalProfile: boolean;
  points: number;
  streak: number;
  today_active: boolean;
};

export type PoliticalProfilePayload = {
  answers: Record<string, number>;
};

export async function fetchUserProfile(): Promise<UserProfileResponse> {
  const res = await fetch("/api/user/profile");
  if (!res.ok) throw new Error("Failed to fetch user profile");
  return res.json() as Promise<UserProfileResponse>;
}

export async function savePoliticalProfile(
  payload: PoliticalProfilePayload
): Promise<void> {
  const res = await fetch("/api/political-profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to save political profile.");
}

import type { PoliticianDetail } from "@/lib/assembly";

export type LocalPolitician = {
  id: string;
  name: string;
  party: string;
  district: string;
  committee: string | null;
  reelection: string | null;
  office: string | null;
  image: string | null;
};

export type LocalPoliticiansResponse = {
  district: string | null;
  politicians: LocalPolitician[];
};

export type FollowedNamesResponse = {
  names: string[];
};

export type FollowStatusResponse = {
  following: boolean;
};

export type FollowToggleResponse = {
  following: boolean;
};

export async function fetchLocalPoliticians(): Promise<LocalPoliticiansResponse> {
  const res = await fetch("/api/politicians/local");
  if (!res.ok) throw new Error("Failed to fetch local politicians");
  return res.json() as Promise<LocalPoliticiansResponse>;
}

export async function fetchPoliticianDetail(id: string): Promise<PoliticianDetail> {
  const res = await fetch(`/api/politicians/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch politician detail for ${id}`);
  return res.json() as Promise<PoliticianDetail>;
}

export async function fetchFollowedPoliticianNames(): Promise<string[]> {
  const res = await fetch("/api/politicians/follows");
  if (!res.ok) throw new Error("Failed to fetch followed politician names");
  const data = (await res.json()) as FollowedNamesResponse;
  return data.names;
}

export async function fetchFollowStatus(politicianId: string): Promise<boolean> {
  const res = await fetch(`/api/politicians/${politicianId}/follow`);
  if (!res.ok) throw new Error("Failed to fetch follow status");
  const data = (await res.json()) as FollowStatusResponse;
  return data.following;
}

export async function toggleFollow({
  politicianId,
  name,
  image,
}: {
  politicianId: string;
  name: string;
  image: string | null | undefined;
}): Promise<FollowToggleResponse> {
  const res = await fetch(`/api/politicians/${politicianId}/follow`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, image }),
  });
  if (res.status === 401) {
    window.location.href = "/";
    throw new Error("Unauthorized");
  }
  if (!res.ok) throw new Error("Failed to toggle follow");
  return res.json() as Promise<FollowToggleResponse>;
}

export type PoliticianBill = {
  title: string;
  proposer: string;
  proposedAt: string | null;
  result: string | null;
  url: string | null;
};

export type PoliticianBillsResponse = {
  bills: PoliticianBill[];
};

export async function fetchPoliticianBills(politicianId: string): Promise<PoliticianBill[]> {
  const res = await fetch(`/api/politicians/${politicianId}/bills`);
  if (!res.ok) throw new Error("Failed to fetch politician bills");
  const data = (await res.json()) as PoliticianBillsResponse;
  return data.bills;
}

export type { PoliticianDetail };

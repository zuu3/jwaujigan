export type DistrictRequestPayload = {
  latitude?: number;
  longitude?: number;
  district?: string;
  matchedArea?: string;
  sourceAddress?: string;
};

export type DistrictResponse = {
  district: string;
  province: string | null;
  matchedArea: string | null;
  sourceAddress: string;
};

export async function saveDistrict(
  payload: DistrictRequestPayload
): Promise<DistrictResponse> {
  const res = await fetch("/api/district", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const result = (await res.json()) as DistrictResponse & { message?: string };

  if (!res.ok) {
    throw new Error(result.message ?? "Failed to resolve district.");
  }

  return result;
}

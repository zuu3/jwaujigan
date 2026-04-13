import { NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { getDistrictEntryByName, resolveDistrictFromAddress } from "@/lib/districts";
import { updateUserDistrict } from "@/lib/users";

type DistrictRequestBody = {
  address?: string;
  latitude?: number;
  longitude?: number;
  district?: string;
  matchedArea?: string;
  sourceAddress?: string;
};

type ReverseGeocodeResponse = {
  display_name?: string;
  address?: Record<string, string | undefined>;
};

type BigDataCloudResponse = {
  principalSubdivision?: string;
  city?: string;
  locality?: string;
  postcode?: string;
  localityInfo?: {
    administrative?: Array<{
      name?: string;
      adminLevel?: number;
    }>;
    informative?: Array<{
      name?: string;
    }>;
  };
};

function dedupe(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function buildKoreanAddress(payload: ReverseGeocodeResponse) {
  const fields = payload.address ?? {};
  const ordered = [
    fields.state,
    fields.province,
    fields.municipality,
    fields.city,
    fields.county,
    fields.district,
    fields.city_district,
    fields.town,
    fields.borough,
    fields.suburb,
    fields.neighbourhood,
    fields.village,
    fields.hamlet,
    fields.quarter,
  ].filter(Boolean) as string[];

  const deduped = [...new Set(ordered)];

  if (deduped.length > 0) {
    return deduped.join(" ");
  }

  return payload.display_name ?? "";
}

function buildNominatimCandidates(payload: ReverseGeocodeResponse) {
  return dedupe([
    buildKoreanAddress(payload),
    payload.display_name ?? "",
  ]);
}

function buildBigDataCloudCandidates(payload: BigDataCloudResponse) {
  const administrative = [...(payload.localityInfo?.administrative ?? [])]
    .sort((left, right) => (right.adminLevel ?? 0) - (left.adminLevel ?? 0))
    .map((item) => item.name ?? "");
  const informative = (payload.localityInfo?.informative ?? []).map(
    (item) => item.name ?? "",
  );

  return dedupe([
    [payload.principalSubdivision, payload.city, payload.locality].filter(Boolean).join(" "),
    [payload.principalSubdivision, ...administrative].filter(Boolean).join(" "),
    [payload.principalSubdivision, ...informative].filter(Boolean).join(" "),
    [payload.city, payload.locality].filter(Boolean).join(" "),
  ]);
}

async function reverseGeocodeWithNominatim(latitude: number, longitude: number) {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("lat", String(latitude));
  url.searchParams.set("lon", String(longitude));
  url.searchParams.set("zoom", "18");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("accept-language", "ko");

  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      "User-Agent": "jwaujigan/1.0 district resolve",
    },
  });

  if (!response.ok) {
    throw new Error("Reverse geocoding failed");
  }

  const payload = (await response.json()) as ReverseGeocodeResponse;
  return buildNominatimCandidates(payload);
}

async function reverseGeocodeWithBigDataCloud(latitude: number, longitude: number) {
  const url = new URL("https://api-bdc.net/data/reverse-geocode-client");
  url.searchParams.set("latitude", String(latitude));
  url.searchParams.set("longitude", String(longitude));
  url.searchParams.set("localityLanguage", "ko");

  const response = await fetch(url, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("BigDataCloud reverse geocoding failed");
  }

  const payload = (await response.json()) as BigDataCloudResponse;
  return buildBigDataCloudCandidates(payload);
}

async function reverseGeocodeCandidates(latitude: number, longitude: number) {
  const candidates: string[] = [];

  try {
    candidates.push(...(await reverseGeocodeWithNominatim(latitude, longitude)));
  } catch (error) {
    console.error("Failed to reverse geocode coordinates with Nominatim", error);
  }

  try {
    candidates.push(...(await reverseGeocodeWithBigDataCloud(latitude, longitude)));
  } catch (error) {
    console.error("Failed to reverse geocode coordinates with BigDataCloud", error);
  }

  const uniqueCandidates = dedupe(candidates);

  if (uniqueCandidates.length === 0) {
    throw new Error("Reverse geocoding failed");
  }

  return uniqueCandidates;
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as DistrictRequestBody;
  const requestedDistrict = body.district?.trim();

  if (requestedDistrict) {
    const entry = getDistrictEntryByName(requestedDistrict);

    if (!entry) {
      return NextResponse.json(
        { message: "선택한 지역구를 확인하지 못했습니다. 다시 선택해 주세요." },
        { status: 422 },
      );
    }

    const updated = await updateUserDistrict(session.user.email, entry.district);

    if (!updated.ok) {
      return NextResponse.json(
        { message: "지역구를 저장하지 못했습니다." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      district: entry.district,
      province: entry.province,
      matchedArea: body.matchedArea?.trim() || null,
      sourceAddress: body.sourceAddress?.trim() || entry.district,
    });
  }

  const candidateAddresses = dedupe([body.address?.trim() ?? ""]);

  if (
    candidateAddresses.length === 0 &&
    body.latitude != null &&
    body.longitude != null
  ) {
    try {
      candidateAddresses.push(
        ...(await reverseGeocodeCandidates(body.latitude, body.longitude)),
      );
    } catch (error) {
      console.error("Failed to reverse geocode coordinates", error);

      return NextResponse.json(
        {
          message:
            "현재 위치로 지역구를 찾지 못했습니다. 직접 지역구를 선택해 주세요.",
        },
        { status: 502 },
      );
    }
  }

  if (candidateAddresses.length === 0) {
    return NextResponse.json(
      { message: "지역구 정보가 필요합니다." },
      { status: 400 },
    );
  }

  const resolvedCandidate = candidateAddresses
    .map((sourceAddress) => ({
      sourceAddress,
      resolved: resolveDistrictFromAddress(sourceAddress),
    }))
    .find((candidate) => candidate.resolved);

  if (!resolvedCandidate?.resolved) {
    console.error("Failed to resolve district from candidates", {
      candidateAddresses,
      latitude: body.latitude ?? null,
      longitude: body.longitude ?? null,
    });

    return NextResponse.json(
      {
        message:
          "현재 위치로 지역구를 찾지 못했습니다. 직접 지역구를 선택해 주세요.",
      },
      { status: 422 },
    );
  }

  const updated = await updateUserDistrict(
    session.user.email,
    resolvedCandidate.resolved.district,
  );

  if (!updated.ok) {
    return NextResponse.json(
      { message: "지역구를 저장하지 못했습니다." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    district: resolvedCandidate.resolved.district,
    province: resolvedCandidate.resolved.province,
    matchedArea: resolvedCandidate.resolved.matchedArea,
    sourceAddress: resolvedCandidate.sourceAddress,
  });
}

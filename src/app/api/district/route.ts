import { NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { resolveDistrictFromAddress } from "@/lib/districts";
import { updateUserDistrict } from "@/lib/users";

type DistrictRequestBody = {
  address?: string;
  latitude?: number;
  longitude?: number;
};

type ReverseGeocodeResponse = {
  display_name?: string;
  address?: Record<string, string | undefined>;
};

function buildKoreanAddress(payload: ReverseGeocodeResponse) {
  const fields = payload.address ?? {};
  const ordered = [
    fields.state,
    fields.city,
    fields.county,
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

async function reverseGeocode(latitude: number, longitude: number) {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("lat", String(latitude));
  url.searchParams.set("lon", String(longitude));
  url.searchParams.set("zoom", "16");
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
  return buildKoreanAddress(payload);
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as DistrictRequestBody;

  let sourceAddress = body.address?.trim() ?? "";

  if (!sourceAddress && body.latitude != null && body.longitude != null) {
    try {
      sourceAddress = await reverseGeocode(body.latitude, body.longitude);
    } catch (error) {
      console.error("Failed to reverse geocode coordinates", error);

      return NextResponse.json(
        {
          message:
            "현재 위치를 주소로 변환하지 못했습니다. 주소를 직접 입력해 주세요.",
        },
        { status: 502 },
      );
    }
  }

  if (!sourceAddress) {
    return NextResponse.json(
      { message: "주소 또는 위치 정보가 필요합니다." },
      { status: 400 },
    );
  }

  const resolved = resolveDistrictFromAddress(sourceAddress);

  if (!resolved) {
    return NextResponse.json(
      {
        message:
          "지역구를 찾지 못했습니다. 시/군/구와 읍/면/동까지 포함해서 다시 입력해 주세요.",
      },
      { status: 422 },
    );
  }

  const updated = await updateUserDistrict(session.user.email, resolved.district);

  if (!updated.ok) {
    return NextResponse.json(
      { message: "지역구를 저장하지 못했습니다." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    district: resolved.district,
    province: resolved.province,
    matchedArea: resolved.matchedArea,
    sourceAddress,
  });
}

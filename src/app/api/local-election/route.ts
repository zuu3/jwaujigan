import { requestAuth } from "@/lib/request-auth";
import {
  extractLocalElectionFilter,
  getLocalElectionData,
} from "@/lib/local-election";
import { getDistrictEntryByName } from "@/lib/districts/index";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await requestAuth(request);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userDistrict = session.user.district ?? null;

  if (!userDistrict) {
    return NextResponse.json(
      { error: "District not set", district: null },
      { status: 200 },
    );
  }

  const entry = getDistrictEntryByName(userDistrict);
  const province = entry?.province ?? null;

  // Fallback: extract province from district string if catalog lookup fails
  const resolvedProvince = province;

  if (!resolvedProvince) {
    return NextResponse.json(
      { error: "Could not resolve province", district: userDistrict },
      { status: 200 },
    );
  }

  const filter = extractLocalElectionFilter(resolvedProvince, userDistrict);

  if (!filter) {
    return NextResponse.json(
      { error: "Could not extract region filter", district: userDistrict },
      { status: 200 },
    );
  }

  try {
    const data = await getLocalElectionData(filter.sdName, filter.wiwNames);
    return NextResponse.json({ ...data, district: userDistrict });
  } catch (err) {
    console.error("local-election API error:", err);
    return NextResponse.json(
      { error: "Failed to fetch election data" },
      { status: 500 },
    );
  }
}

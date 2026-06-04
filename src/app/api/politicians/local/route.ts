import { NextResponse } from "next/server";
import { requestAuth } from "@/lib/request-auth";
import { getLocalPoliticiansByDistrict } from "@/lib/assembly";

export async function GET(request: Request) {
  const session = await requestAuth(request);

  if (!session?.user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const district = session.user.district ?? null;

  if (!district) {
    return NextResponse.json({
      district: null,
      politicians: [],
    });
  }

  try {
    const politicians = await getLocalPoliticiansByDistrict(district);

    if (politicians.length === 0) {
      console.warn("[local-politicians] no politicians matched", { district });
    }

    return NextResponse.json({ district, politicians });
  } catch (routeError) {
    console.error("Failed to fetch local politicians", routeError);

    return NextResponse.json({ district, politicians: [] });
  }
}

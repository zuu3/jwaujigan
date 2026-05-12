import { unstable_cache } from "next/cache";
import { NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { getLocalPoliticiansByDistrict } from "@/lib/assembly";
import { createServiceRoleSupabaseClient } from "@/lib/supabase";

const getCachedLocalPoliticians = unstable_cache(
  (district: string) => getLocalPoliticiansByDistrict(district),
  ["local-politicians"],
  { revalidate: 60 * 60 * 24, tags: ["local-politicians"] },
);

export async function GET() {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleSupabaseClient();
  const { data: user, error } = await supabase
    .from("users")
    .select("district")
    .eq("email", session.user.email)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch user district", error);

    return NextResponse.json(
      { message: "Failed to fetch district." },
      { status: 500 },
    );
  }

  if (!user?.district) {
    return NextResponse.json({
      district: null,
      politicians: [],
    });
  }

  try {
    const politicians = await getCachedLocalPoliticians(user.district);

    return NextResponse.json({
      district: user.district,
      politicians,
    });
  } catch (routeError) {
    console.error("Failed to fetch local politicians", routeError);

    return NextResponse.json({
      district: user.district,
      politicians: [],
    });
  }
}

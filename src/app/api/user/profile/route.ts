import { NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { createServiceRoleSupabaseClient } from "@/lib/supabase";

export async function GET() {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from("users")
    .select("id, email, name, image, district")
    .eq("email", session.user.email)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch user profile", error);

    return NextResponse.json(
      { message: "Failed to fetch user profile." },
      { status: 500 },
    );
  }

  return NextResponse.json(
    data ?? {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name ?? null,
      image: session.user.image ?? null,
      district: session.user.district ?? null,
    },
  );
}

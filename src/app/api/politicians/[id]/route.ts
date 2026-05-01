import { NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { getPoliticianDetailById } from "@/lib/assembly";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const politician = await getPoliticianDetailById(id);

    if (!politician) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    return NextResponse.json(politician);
  } catch (error) {
    console.error("Failed to fetch politician detail", error);

    return NextResponse.json(
      { message: "Failed to fetch politician detail." },
      { status: 500 },
    );
  }
}

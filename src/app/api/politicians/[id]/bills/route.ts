import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getBillsByPoliticianName, getPoliticianDetailById } from "@/lib/assembly";

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

    const bills = await getBillsByPoliticianName(politician.name);
    return NextResponse.json({ bills: bills.slice(0, 5) });
  } catch (error) {
    console.error("Failed to fetch politician bills", error);
    return NextResponse.json({ message: "Failed to fetch bills." }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin";
import { createServiceRoleSupabaseClient } from "@/lib/supabase";

export async function POST(req: Request) {
  const { error } = await requireAdminApi();
  if (error) return error;

  const body = await req.json() as { userId: string; amount: number };

  if (!body.userId || typeof body.amount !== "number" || body.amount === 0) {
    return NextResponse.json({ message: "잘못된 요청" }, { status: 400 });
  }

  const supabase = createServiceRoleSupabaseClient();
  const { error: dbError } = await supabase.rpc("increment_user_points", {
    p_user_id: body.userId,
    p_amount: body.amount,
  });

  if (dbError) return NextResponse.json({ message: dbError.message }, { status: 500 });

  return NextResponse.json({ message: `${body.amount > 0 ? "+" : ""}${body.amount} 포인트 완료` });
}

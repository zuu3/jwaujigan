import { NextResponse } from "next/server";
import { requestAuth } from "@/lib/request-auth";
import { createServiceRoleSupabaseClient } from "@/lib/supabase";

export async function GET(request: Request) {
  const session = await requestAuth(request);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleSupabaseClient();
  const [profileResult, battleLogsResult] = await Promise.all([
    supabase
      .from("user_political_profiles")
      .select("economic_score, social_score, security_score, political_type, completed_at")
      .eq("user_id", session.user.id)
      .order("completed_at", { ascending: false, nullsFirst: false })
      .limit(1),
    supabase
      .from("battle_logs")
      .select("id, topic, result, created_at")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  return NextResponse.json({
    politicalProfile: profileResult.data?.[0] ?? null,
    battleLogs: battleLogsResult.data ?? [],
  });
}

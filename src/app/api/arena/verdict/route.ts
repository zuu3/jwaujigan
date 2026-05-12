import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createServiceRoleSupabaseClient } from "@/lib/supabase";

type VerdictSide = "progressive" | "conservative" | "draw";
const VALID_SIDES: VerdictSide[] = ["progressive", "conservative", "draw"];

type VerdictCounts = { progressive: number; conservative: number; draw: number; total: number };
const EMPTY_COUNTS: VerdictCounts = { progressive: 0, conservative: 0, draw: 0, total: 0 };

async function getVerdictCounts(issueId: string): Promise<VerdictCounts> {
  const supabase = createServiceRoleSupabaseClient();
  const { data } = await supabase
    .from("verdict_vote_counts")
    .select("progressive, conservative, draw, total")
    .eq("issue_id", issueId)
    .single();
  return data ?? EMPTY_COUNTS;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const issueId = searchParams.get("issueId");
  if (!issueId) return NextResponse.json({ message: "Missing issueId" }, { status: 400 });

  const session = await auth();
  const supabase = createServiceRoleSupabaseClient();

  const [counts, userVote] = await Promise.all([
    getVerdictCounts(issueId),
    session?.user?.id
      ? supabase
          .from("verdict_votes")
          .select("side")
          .eq("issue_id", issueId)
          .eq("user_id", session.user.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return NextResponse.json({
    counts,
    user_verdict: (userVote as { data: { side: string } | null })?.data?.side ?? null,
  });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json() as { issueId?: string; side?: string };
  const { issueId, side } = body;

  if (!issueId) return NextResponse.json({ message: "Missing issueId" }, { status: 400 });
  if (!side || !VALID_SIDES.includes(side as VerdictSide)) {
    return NextResponse.json({ message: "Invalid side" }, { status: 400 });
  }

  const supabase = createServiceRoleSupabaseClient();
  const userId = session.user.id;

  const { data: existing } = await supabase
    .from("verdict_votes")
    .select("side")
    .eq("issue_id", issueId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing?.side === side) {
    await supabase
      .from("verdict_votes")
      .delete()
      .eq("issue_id", issueId)
      .eq("user_id", userId);
  } else {
    await supabase
      .from("verdict_votes")
      .upsert(
        { issue_id: issueId, user_id: userId, side: side as VerdictSide },
        { onConflict: "issue_id,user_id" },
      );
  }

  const counts = await getVerdictCounts(issueId);
  return NextResponse.json({ counts, user_verdict: existing?.side === side ? null : side });
}

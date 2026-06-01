import { NextResponse } from "next/server";
import { requestAuth } from "@/lib/request-auth";
import { createServiceRoleSupabaseClient } from "@/lib/supabase";
import type { HotIssue, IssueVoteCounts } from "@/types/issue";

type Ctx = { params: Promise<{ id: string }> };

const ISSUE_SELECT =
  "id, title, summary, body, progressive, conservative, scenario, source_url, bill_id, published_at, proposer, committee, bill_status, created_at, expires_at" as const;

const EMPTY_COUNTS: IssueVoteCounts = { progressive: 0, conservative: 0, neutral: 0, total: 0 };

export async function GET(request: Request, { params }: Ctx) {
  const { id } = await params;
  const session = await requestAuth(request);
  const supabase = createServiceRoleSupabaseClient();

  const { data: row, error } = await supabase
    .from("issues")
    .select(ISSUE_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let userId: string | null = null;
  if (session?.user?.email) {
    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("email", session.user.email)
      .single();
    userId = user?.id ?? null;
  }

  const [{ data: counts }, { data: userVoteRow }] = await Promise.all([
    supabase
      .from("issue_vote_counts")
      .select("progressive, conservative, neutral, total")
      .eq("issue_id", id)
      .maybeSingle(),
    userId
      ? supabase
          .from("issue_votes")
          .select("stance")
          .eq("issue_id", id)
          .eq("user_id", userId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const issue: HotIssue = {
    ...row,
    vote_counts: counts
      ? { progressive: counts.progressive, conservative: counts.conservative, neutral: counts.neutral, total: counts.total }
      : EMPTY_COUNTS,
    user_vote: (userVoteRow?.stance ?? null) as HotIssue["user_vote"],
  };

  return NextResponse.json({ issue });
}

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createServiceRoleSupabaseClient } from "@/lib/supabase";

export type MyPollItem = {
  id: string;
  question: string;
  options: { id: string; text: string }[];
  created_at: string;
  expires_at: string;
  total_votes: number;
  option_counts: Record<string, number>;
};

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleSupabaseClient();
  const userId = session.user.id;

  const { data: polls, error } = await supabase
    .from("polls")
    .select("id, question, options, created_at, expires_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  if (!polls || polls.length === 0) {
    return NextResponse.json({ polls: [] });
  }

  const pollIds = polls.map((p) => p.id);
  const { data: votes } = await supabase
    .from("poll_votes")
    .select("poll_id, option_id")
    .in("poll_id", pollIds);

  const votesByPoll: Record<string, { total: number; byOption: Record<string, number> }> = {};
  for (const v of votes ?? []) {
    if (!votesByPoll[v.poll_id]) {
      votesByPoll[v.poll_id] = { total: 0, byOption: {} };
    }
    votesByPoll[v.poll_id].total++;
    votesByPoll[v.poll_id].byOption[v.option_id] = (votesByPoll[v.poll_id].byOption[v.option_id] ?? 0) + 1;
  }

  const result: MyPollItem[] = polls.map((p) => ({
    id: p.id,
    question: p.question,
    options: p.options as { id: string; text: string }[],
    created_at: p.created_at,
    expires_at: p.expires_at,
    total_votes: votesByPoll[p.id]?.total ?? 0,
    option_counts: votesByPoll[p.id]?.byOption ?? {},
  }));

  return NextResponse.json({ polls: result });
}

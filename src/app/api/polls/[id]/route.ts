import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createServiceRoleSupabaseClient } from "@/lib/supabase";
import type { PollOption } from "@/app/api/polls/route";

export type PollDetail = {
  id: string;
  user_id: string;
  question: string;
  options: PollOption[];
  expires_at: string;
  created_at: string;
  option_counts: Record<string, number>;
  total_count: number;
  user_option_id: string | null;
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: pollId } = await params;
  const session = await auth();
  const supabase = createServiceRoleSupabaseClient();

  const { data: poll, error } = await supabase
    .from("polls")
    .select("id, user_id, question, options, expires_at, created_at")
    .eq("id", pollId)
    .single();

  if (error || !poll) {
    return NextResponse.json({ message: "Poll not found" }, { status: 404 });
  }

  const { data: votes } = await supabase
    .from("poll_votes")
    .select("option_id")
    .eq("poll_id", pollId);

  const option_counts: Record<string, number> = {};
  const options = poll.options as PollOption[];
  for (const opt of options) {
    option_counts[opt.id] = 0;
  }
  for (const v of votes ?? []) {
    if (option_counts[v.option_id] !== undefined) {
      option_counts[v.option_id]++;
    } else {
      option_counts[v.option_id] = 1;
    }
  }

  const total_count = (votes ?? []).length;

  let user_option_id: string | null = null;
  if (session?.user?.email) {
    const { data: userRow } = await supabase
      .from("users")
      .select("id")
      .eq("email", session.user.email)
      .maybeSingle();

    if (userRow?.id) {
      const { data: myVote } = await supabase
        .from("poll_votes")
        .select("option_id")
        .eq("poll_id", pollId)
        .eq("user_id", userRow.id)
        .maybeSingle();

      user_option_id = myVote?.option_id ?? null;
    }
  }

  const detail: PollDetail = {
    id: poll.id,
    user_id: poll.user_id,
    question: poll.question,
    options,
    expires_at: poll.expires_at,
    created_at: poll.created_at,
    option_counts,
    total_count,
    user_option_id,
  };

  return NextResponse.json({ poll: detail });
}

import { NextResponse } from "next/server";
import { requestAuth } from "@/lib/request-auth";
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
  option_counts_by_tendency: Record<string, Record<string, number>>;
  total_with_profile: number;
  total_count: number;
  user_option_id: string | null;
};

function getTendencyGroup(politicalType: string | null | undefined) {
  if (!politicalType) return null;
  if (politicalType.includes("중도진보")) return "moderate_progressive";
  if (politicalType.includes("중도보수")) return "moderate_conservative";
  if (politicalType.includes("진보")) return "progressive";
  if (politicalType.includes("보수")) return "conservative";
  if (politicalType.includes("중도") || politicalType.includes("실용")) return "moderate";
  return "moderate";
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: pollId } = await params;
  const session = await requestAuth(request);
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
    .select("user_id, option_id")
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
  const userIds = Array.from(new Set((votes ?? []).map((vote) => vote.user_id)));
  const option_counts_by_tendency: Record<string, Record<string, number>> = {};
  let total_with_profile = 0;

  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("user_political_profiles")
      .select("user_id, political_type")
      .in("user_id", userIds);
    const profileMap = new Map(
      (profiles ?? []).map((profile) => [profile.user_id, profile.political_type]),
    );

    for (const vote of votes ?? []) {
      const group = getTendencyGroup(profileMap.get(vote.user_id));
      if (!group) continue;
      option_counts_by_tendency[group] ??= {};
      for (const opt of options) {
        option_counts_by_tendency[group][opt.id] ??= 0;
      }
      option_counts_by_tendency[group][vote.option_id] =
        (option_counts_by_tendency[group][vote.option_id] ?? 0) + 1;
      total_with_profile++;
    }
  }

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
    option_counts_by_tendency,
    total_with_profile,
    total_count,
    user_option_id,
  };

  return NextResponse.json({ poll: detail });
}

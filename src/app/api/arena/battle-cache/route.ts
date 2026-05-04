import { NextResponse } from "next/server";
import { getArenaBattleCacheTopic } from "@/lib/arena";
import { createServiceRoleSupabaseClient } from "@/lib/supabase";

type DebateMessage = {
  role: "progressive" | "conservative" | "user";
  content: string;
};

type DebateResult = {
  winner: "progressive" | "conservative" | "draw";
  reason: string;
};

type BattleCacheRequestBody = {
  issueId?: string;
  messages?: DebateMessage[];
  result?: DebateResult;
};

function isValidMessages(value: unknown): value is DebateMessage[] {
  return (
    Array.isArray(value) &&
    value.length >= 6 &&
    value.every(
      (message) =>
        typeof message === "object" &&
        message !== null &&
        ((message as DebateMessage).role === "progressive" ||
          (message as DebateMessage).role === "conservative" ||
          (message as DebateMessage).role === "user") &&
        typeof (message as DebateMessage).content === "string" &&
        (message as DebateMessage).content.trim().length > 0,
    )
  );
}

function isValidResult(value: unknown): value is DebateResult {
  return (
    typeof value === "object" &&
    value !== null &&
    ((value as DebateResult).winner === "progressive" ||
      (value as DebateResult).winner === "conservative" ||
      (value as DebateResult).winner === "draw") &&
    typeof (value as DebateResult).reason === "string" &&
    (value as DebateResult).reason.trim().length > 0
  );
}

export async function POST(request: Request) {
  const body = (await request.json()) as BattleCacheRequestBody;

  if (!body.issueId || !isValidMessages(body.messages) || !isValidResult(body.result)) {
    return NextResponse.json(
      { message: "Invalid battle cache request." },
      { status: 400 },
    );
  }

  const topic = getArenaBattleCacheTopic(body.issueId);
  const supabase = createServiceRoleSupabaseClient();
  const { data: existing, error: existingError } = await supabase
    .from("battle_logs")
    .select("id")
    .is("user_id", null)
    .eq("topic", topic)
    .limit(1)
    .maybeSingle();

  if (existingError) {
    console.error("Failed to check battle cache", existingError);
  }

  if (existing) {
    return NextResponse.json({ id: existing.id, cached: true });
  }

  const { data, error } = await supabase
    .from("battle_logs")
    .insert({
      user_id: null,
      topic,
      messages: body.messages,
      result: JSON.stringify(body.result),
    })
    .select("id")
    .single();

  if (error) {
    console.error("Failed to insert battle cache", error);

    return NextResponse.json(
      { message: "Failed to insert battle cache." },
      { status: 500 },
    );
  }

  return NextResponse.json({ id: data.id, cached: false });
}

import { NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { createServiceRoleSupabaseClient } from "@/lib/supabase";

type DebateMessage = {
  role: "progressive" | "conservative" | "user";
  content: string;
};

type BattleLogRequestBody = {
  topic?: string;
  messages?: DebateMessage[];
  winner?: "progressive" | "conservative" | "draw";
  userStance?: "progressive" | "conservative";
};

function isValidMessages(value: unknown): value is DebateMessage[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every(
      (message) =>
        typeof message === "object" &&
        message !== null &&
        ((message as DebateMessage).role === "progressive" ||
          (message as DebateMessage).role === "conservative" ||
          (message as DebateMessage).role === "user") &&
        typeof (message as DebateMessage).content === "string",
    )
  );
}

function mapWinnerToResult(
  winner: BattleLogRequestBody["winner"],
  userStance: BattleLogRequestBody["userStance"],
) {
  if (winner === "draw") {
    return "draw";
  }

  if (winner === userStance) {
    return "win";
  }

  return "lose";
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as BattleLogRequestBody;

  if (
    !body.topic ||
    !isValidMessages(body.messages) ||
    (body.winner !== "progressive" &&
      body.winner !== "conservative" &&
      body.winner !== "draw") ||
    (body.userStance !== "progressive" && body.userStance !== "conservative")
  ) {
    return NextResponse.json({ message: "Invalid battle log request." }, { status: 400 });
  }

  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from("battle_logs")
    .insert({
      user_id: session.user.id,
      topic: body.topic,
      messages: body.messages,
      result: mapWinnerToResult(body.winner, body.userStance),
    })
    .select("id")
    .single();

  if (error) {
    console.error("Failed to insert battle log", error);

    return NextResponse.json(
      { message: "Failed to insert battle log." },
      { status: 500 },
    );
  }

  return NextResponse.json({ id: data.id });
}

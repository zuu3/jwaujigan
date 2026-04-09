import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { createServiceRoleSupabaseClient } from "@/lib/supabase";
import { ONBOARDING_SKIP_COOKIE } from "@/lib/onboarding";
import {
  calculatePoliticalProfile,
  isCompletePoliticalAnswers,
  type PoliticalAnswers,
} from "@/lib/political-profile";

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { answers?: PoliticalAnswers };
  const answers = body.answers ?? {};

  if (!isCompletePoliticalAnswers(answers)) {
    return NextResponse.json(
      { message: "All 15 questions must be answered with a valid score." },
      { status: 400 },
    );
  }

  const result = calculatePoliticalProfile(answers);
  const supabase = createServiceRoleSupabaseClient();
  const completed_at = new Date().toISOString();

  const { error } = await supabase.from("user_political_profiles").upsert(
    {
      user_id: session.user.id,
      test_answers: answers,
      completed_at,
      ...result,
    },
    {
      onConflict: "user_id",
    },
  );

  if (error) {
    console.error("Failed to upsert political profile", error);

    return NextResponse.json(
      {
        message:
          "Failed to save political profile. Ensure user_political_profiles has a unique user_id column.",
      },
      { status: 500 },
    );
  }

  const cookieStore = await cookies();
  cookieStore.delete(ONBOARDING_SKIP_COOKIE);

  return NextResponse.json(result);
}

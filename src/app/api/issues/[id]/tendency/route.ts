import { NextResponse } from "next/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase";

export type TendencyStanceCounts = {
  progressive: number;
  conservative: number;
  neutral: number;
};

export type TendencyResponse = {
  stance_by_type: Record<string, TendencyStanceCounts>;
  total_with_profile: number;
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: issueId } = await params;

  const supabase = createServiceRoleSupabaseClient();

  // 해당 이슈의 모든 투표 가져오기
  const { data: votes, error: votesError } = await supabase
    .from("issue_votes")
    .select("user_id, stance")
    .eq("issue_id", issueId);

  if (votesError) {
    return NextResponse.json({ message: "투표 데이터를 불러오지 못했어요." }, { status: 500 });
  }

  if (!votes || votes.length === 0) {
    return NextResponse.json({
      stance_by_type: {},
      total_with_profile: 0,
    } satisfies TendencyResponse);
  }

  const userIds = votes.map((v) => v.user_id);

  // 투표자들의 성향 프로필 가져오기
  const { data: profiles, error: profilesError } = await supabase
    .from("user_political_profiles")
    .select("user_id, political_type")
    .in("user_id", userIds);

  if (profilesError) {
    return NextResponse.json({ message: "성향 데이터를 불러오지 못했어요." }, { status: 500 });
  }

  if (!profiles || profiles.length === 0) {
    return NextResponse.json({
      stance_by_type: {},
      total_with_profile: 0,
    } satisfies TendencyResponse);
  }

  // user_id → political_type 매핑
  const profileMap = new Map<string, string>(
    profiles.map((p) => [p.user_id, p.political_type]),
  );

  // political_type별 stance 집계
  const stanceByType: Record<string, TendencyStanceCounts> = {};

  for (const vote of votes) {
    const politicalType = profileMap.get(vote.user_id);
    if (!politicalType) continue;

    if (!stanceByType[politicalType]) {
      stanceByType[politicalType] = { progressive: 0, conservative: 0, neutral: 0 };
    }

    const counts = stanceByType[politicalType];
    if (vote.stance === "progressive") counts.progressive += 1;
    else if (vote.stance === "conservative") counts.conservative += 1;
    else if (vote.stance === "neutral") counts.neutral += 1;
  }

  const totalWithProfile = votes.filter((v) => profileMap.has(v.user_id)).length;

  return NextResponse.json({
    stance_by_type: stanceByType,
    total_with_profile: totalWithProfile,
  } satisfies TendencyResponse);
}

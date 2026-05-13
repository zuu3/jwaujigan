import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createServiceRoleSupabaseClient } from "@/lib/supabase";
import { getBillsByPoliticianName, getPoliticianDetailById } from "@/lib/assembly";
import { POINTS } from "@/services/points/points";

export type ReportData = {
  bill_count: number;
  pass_count: number;
  pending_count: number;
  fail_count: number;
  categories: { name: string; count: number }[];
  notable_bills: { title: string; date: string | null; result: string | null; url: string | null }[];
};

export type ReportResponse = {
  report: ReportData;
  created_at: string;
  is_cached: boolean;
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id: politicianId } = await params;
  const supabase = createServiceRoleSupabaseClient();

  const { data: userRow } = await supabase
    .from("users")
    .select("id")
    .eq("email", session.user.email)
    .maybeSingle();
  if (!userRow?.id) return NextResponse.json({ message: "User not found" }, { status: 404 });

  const { data } = await supabase
    .from("politician_reports")
    .select("report, created_at")
    .eq("user_id", userRow.id)
    .eq("politician_id", politicianId)
    .maybeSingle();

  if (!data) return NextResponse.json({ report: null });

  return NextResponse.json({
    report: data.report as ReportData,
    created_at: data.created_at as string,
    is_cached: true,
  } satisfies ReportResponse);
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id: politicianId } = await params;
  const supabase = createServiceRoleSupabaseClient();

  const { data: userRow } = await supabase
    .from("users")
    .select("id, points")
    .eq("email", session.user.email)
    .maybeSingle();
  if (!userRow?.id) return NextResponse.json({ message: "User not found" }, { status: 404 });

  const currentPoints = userRow.points ?? 0;
  if (currentPoints < POINTS.REPORT) {
    return NextResponse.json(
      { message: "포인트가 부족해요", required: POINTS.REPORT, current: currentPoints },
      { status: 402 },
    );
  }

  // 이미 생성된 리포트가 있으면 포인트 차감 없이 반환
  const { data: existing } = await supabase
    .from("politician_reports")
    .select("report, created_at")
    .eq("user_id", userRow.id)
    .eq("politician_id", politicianId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({
      report: existing.report as ReportData,
      created_at: existing.created_at as string,
      is_cached: true,
    } satisfies ReportResponse);
  }

  // 정치인 정보 + 법안 데이터 수집
  const [politician, bills] = await Promise.all([
    getPoliticianDetailById(politicianId),
    (async () => {
      try {
        const detail = await getPoliticianDetailById(politicianId);
        if (!detail) return [];
        return getBillsByPoliticianName(detail.name);
      } catch {
        return [];
      }
    })(),
  ]);

  if (!politician) return NextResponse.json({ message: "Not found" }, { status: 404 });

  // 분류 계산
  const CATEGORY_KEYWORDS: { name: string; keywords: string[] }[] = [
    { name: "경제·산업", keywords: ["경제", "산업", "기업", "금융", "세금", "조세", "무역", "중소기업"] },
    { name: "복지·보건", keywords: ["복지", "의료", "건강", "보건", "장애", "노인", "아동", "육아", "보육"] },
    { name: "교육", keywords: ["교육", "학교", "학생", "대학", "유아", "학습"] },
    { name: "환경·에너지", keywords: ["환경", "에너지", "기후", "탄소", "재생", "원전"] },
    { name: "디지털·과학", keywords: ["디지털", "AI", "인공지능", "데이터", "과학기술", "정보통신", "ICT", "반도체"] },
    { name: "노동·고용", keywords: ["노동", "고용", "근로", "일자리", "임금", "최저임금"] },
    { name: "부동산·주거", keywords: ["부동산", "주택", "임대", "전세", "주거"] },
    { name: "안보·외교", keywords: ["국방", "안보", "외교", "군", "방위"] },
  ];

  const categories: { name: string; count: number }[] = [];
  for (const cat of CATEGORY_KEYWORDS) {
    const count = bills.filter((b) =>
      cat.keywords.some((kw) => b.title.includes(kw)),
    ).length;
    if (count > 0) categories.push({ name: cat.name, count });
  }
  categories.sort((a, b) => b.count - a.count);

  const passCount = bills.filter((b) => b.result?.includes("가결")).length;
  const failCount = bills.filter((b) =>
    b.result && (b.result.includes("부결") || b.result.includes("폐기") || b.result.includes("철회")),
  ).length;
  const pendingCount = bills.length - passCount - failCount;

  const notableBills = bills
    .filter((b) => b.result?.includes("가결"))
    .slice(0, 5)
    .map((b) => ({ title: b.title, date: b.proposedAt, result: b.result, url: b.url }));

  const reportData: ReportData = {
    bill_count: bills.length,
    pass_count: passCount,
    pending_count: pendingCount,
    fail_count: failCount,
    categories: categories.slice(0, 5),
    notable_bills: notableBills,
  };

  // 저장 + 포인트 차감 (트랜잭션 없이 순서대로)
  const { error: insertError } = await supabase
    .from("politician_reports")
    .insert({
      user_id: userRow.id,
      politician_id: politicianId,
      politician_name: politician.name,
      report: reportData,
    });

  if (insertError) {
    console.error("[report] insert failed", insertError);
    return NextResponse.json({ message: "리포트 저장에 실패했어요." }, { status: 500 });
  }

  const { error: pointsError } = await supabase
    .from("users")
    .update({ points: currentPoints - POINTS.REPORT })
    .eq("id", userRow.id);
  if (pointsError) console.error("[report] points deduct failed", pointsError);

  const { data: saved } = await supabase
    .from("politician_reports")
    .select("created_at")
    .eq("user_id", userRow.id)
    .eq("politician_id", politicianId)
    .maybeSingle();

  return NextResponse.json({
    report: reportData,
    created_at: saved?.created_at ?? new Date().toISOString(),
    is_cached: false,
  } satisfies ReportResponse);
}

import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getServiceRoleSupabaseClient } from "@/lib/supabase";
import { IssueDetailContainer } from "@/containers/issues/issue-detail";
import type { HotIssue, IssueVoteCounts } from "@/types/issue";

export const dynamic = "force-dynamic";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://jwj.zuu3.kr";

type Props = { params: Promise<{ id: string }> };

const EMPTY_COUNTS: IssueVoteCounts = { progressive: 0, conservative: 0, neutral: 0, total: 0 };

// cache()로 generateMetadata와 페이지 핸들러가 같은 요청에서 중복 호출해도 DB 쿼리 1회만 실행
const getIssue = cache(async (id: string): Promise<HotIssue | null> => {
  const [session, supabase] = [await auth(), getServiceRoleSupabaseClient()];
  const userId = session?.user?.id ?? null;

  // issue + vote_counts + user_vote 세 쿼리 병렬 실행 (users 테이블 조회 제거 — userId는 JWT에서)
  const [{ data: row, error: rowError }, { data: counts }, { data: userVoteRow }] =
    await Promise.all([
      supabase.from("issues").select("*").eq("id", id).maybeSingle(),
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

  console.log("[issue-page] row?.body =", row?.body, "| rowError =", rowError);

  if (!row) return null;

  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    body: row.body ?? null,
    progressive: row.progressive,
    conservative: row.conservative,
    scenario: row.scenario ?? null,
    source_url: row.source_url,
    bill_id: row.bill_id,
    published_at: row.published_at,
    proposer: row.proposer,
    committee: row.committee,
    bill_status: row.bill_status,
    created_at: row.created_at,
    vote_counts: counts
      ? { progressive: counts.progressive, conservative: counts.conservative, neutral: counts.neutral, total: counts.total }
      : EMPTY_COUNTS,
    user_vote: (userVoteRow?.stance ?? null) as HotIssue["user_vote"],
  };
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const issue = await getIssue(id);
  if (!issue) return {};
  const ogImage = `${BASE_URL}/api/og/issue?id=${id}`;
  return {
    title: `${issue.title} | 좌우지간`,
    description: issue.summary,
    openGraph: { images: [ogImage] },
    twitter: { card: "summary_large_image", images: [ogImage] },
  };
}

export default async function IssueDetailPage({ params }: Props) {
  const { id } = await params;
  const issue = await getIssue(id);

  if (!issue) notFound();

  // body는 null이면 RSC 직렬화에서 키가 드롭되므로 별도 prop으로 전달
  return <IssueDetailContainer issue={issue} initialBodyText={issue.body ?? ""} />;
}

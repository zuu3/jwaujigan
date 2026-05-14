import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createServiceRoleSupabaseClient } from "@/lib/supabase";
import { IssuesListContainer } from "@/containers/issues/issues-list";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "이슈 | 좌우지간",
  description: "국회에서 논의 중이거나 처리된 법안 이슈를 모아봤어요.",
};

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

export default async function IssuesPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/");

  const supabase = createServiceRoleSupabaseClient();
  const { data } = await supabase
    .from("issues")
    .select("id, title, summary, published_at, proposer, committee, bill_status, created_at")
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE + 1);

  const items = data ?? [];
  const hasMore = items.length > PAGE_SIZE;
  const issues = hasMore ? items.slice(0, PAGE_SIZE) : items;
  const nextCursor = hasMore ? issues[issues.length - 1].created_at : null;

  return <IssuesListContainer initialIssues={issues} initialNextCursor={nextCursor} />;
}

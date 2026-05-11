import { NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { createServiceRoleSupabaseClient } from "@/lib/supabase";
import { searchPoliticiansByName, type PoliticianSearchResult } from "@/lib/assembly";
import type { HotIssue } from "@/types/issue";

type SearchIssue = Pick<HotIssue, "id" | "title" | "summary" | "bill_id" | "committee" | "published_at">;

export type SearchResponse = {
  issues: SearchIssue[];
  politicians: PoliticianSearchResult[];
};

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";

  if (q.length < 2) {
    return NextResponse.json({ issues: [], politicians: [] } satisfies SearchResponse);
  }

  const supabase = createServiceRoleSupabaseClient();

  const [issuesResult, politiciansResult] = await Promise.allSettled([
    supabase
      .from("issues")
      .select("id, title, summary, bill_id, committee, published_at")
      .gt("expires_at", new Date().toISOString())
      .or(`title.ilike.%${q}%,summary.ilike.%${q}%`)
      .limit(5),
    searchPoliticiansByName(q),
  ]);

  const issues: SearchIssue[] =
    issuesResult.status === "fulfilled" ? (issuesResult.value.data ?? []) : [];
  const politicians: PoliticianSearchResult[] =
    politiciansResult.status === "fulfilled" ? politiciansResult.value : [];

  return NextResponse.json({ issues, politicians } satisfies SearchResponse);
}

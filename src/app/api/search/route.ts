import { NextResponse } from "next/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase";
import { searchPoliticiansByName, type PoliticianSearchResult } from "@/lib/assembly";
import type { HotIssue } from "@/types/issue";

type SearchIssue = Pick<HotIssue, "id" | "title" | "summary" | "bill_id" | "committee" | "published_at">;

export type SearchResponse = {
  issues: SearchIssue[];
  politicians: PoliticianSearchResult[];
};

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), ms)
    ),
  ]);
}

export async function GET(request: Request) {
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
      .or(`title.ilike.%${q}%,summary.ilike.%${q}%`)
      .order("created_at", { ascending: false })
      .limit(5),
    withTimeout(searchPoliticiansByName(q), 3000),
  ]);

  const issues: SearchIssue[] =
    issuesResult.status === "fulfilled" ? (issuesResult.value.data ?? []) : [];
  const politicians: PoliticianSearchResult[] =
    politiciansResult.status === "fulfilled" ? politiciansResult.value : [];

  return NextResponse.json({ issues, politicians } satisfies SearchResponse);
}

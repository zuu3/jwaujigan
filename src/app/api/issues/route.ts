import { NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { getRecentIssueBills } from "@/lib/assembly";
import { buildIssueFromBill } from "@/lib/issues";
import { createServiceRoleSupabaseClient } from "@/lib/supabase";
import type { HotIssue, HotIssuesResponse } from "@/types/issue";

function mapIssueRowToHotIssue(issue: {
  id: string;
  title: string;
  summary: string;
  progressive: string;
  conservative: string;
  source_url: string | null;
  bill_id: string | null;
  published_at: string | null;
  created_at: string;
}): HotIssue {
  return issue;
}

export async function GET() {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleSupabaseClient();
  const now = new Date().toISOString();

  const { data: cachedIssues, error: cachedIssuesError } = await supabase
    .from("issues")
    .select(
      "id, title, summary, progressive, conservative, source_url, bill_id, published_at, created_at",
    )
    .gt("expires_at", now)
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(5);

  if (cachedIssuesError) {
    console.error("Failed to fetch cached issues", cachedIssuesError);

    return NextResponse.json(
      { message: "Failed to fetch issues." },
      { status: 500 },
    );
  }

  if ((cachedIssues?.length ?? 0) > 0) {
    const response: HotIssuesResponse = {
      issues: cachedIssues.map(mapIssueRowToHotIssue),
    };

    return NextResponse.json(response);
  }

  try {
    const bills = await getRecentIssueBills();
    const issueRecords = await Promise.all(bills.map((bill) => buildIssueFromBill(bill)));

    if (issueRecords.length === 0) {
      return NextResponse.json({ issues: [] satisfies HotIssue[] });
    }

    const { data: insertedIssues, error: insertError } = await supabase
      .from("issues")
      .insert(issueRecords)
      .select(
        "id, title, summary, progressive, conservative, source_url, bill_id, published_at, created_at",
      );

    if (insertError) {
      console.error("Failed to store generated issues", insertError);

      return NextResponse.json(
        { message: "Failed to create issues." },
        { status: 500 },
      );
    }

    const response: HotIssuesResponse = {
      issues: (insertedIssues ?? []).map(mapIssueRowToHotIssue),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Failed to generate hot issues", error);

    return NextResponse.json(
      { message: "Failed to generate issues." },
      { status: 500 },
    );
  }
}

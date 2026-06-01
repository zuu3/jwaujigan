import { NextResponse } from "next/server";
import { requestAuth } from "@/lib/request-auth";
import { createServiceRoleSupabaseClient } from "@/lib/supabase";

const PAGE_SIZE = 20;

export async function GET(req: Request) {
  const session = await requestAuth(req);
  if (!session?.user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor"); // created_at ISO string
  const supabase = createServiceRoleSupabaseClient();

  let query = supabase
    .from("issues")
    .select("id, title, summary, progressive, conservative, source_url, bill_id, published_at, proposer, committee, bill_status, created_at")
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE + 1);

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  const items = data ?? [];
  const hasMore = items.length > PAGE_SIZE;
  const issues = hasMore ? items.slice(0, PAGE_SIZE) : items;
  const nextCursor = hasMore ? issues[issues.length - 1].created_at : null;

  return NextResponse.json({ issues, nextCursor });
}

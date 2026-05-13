import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServiceRoleSupabaseClient } from "@/lib/supabase";

type Ctx = { params: Promise<{ id: string }> };

export type CommentItem = {
  id: string;
  content: string;
  created_at: string;
  parent_id: string | null;
  author_name: string | null;
  author_image: string | null;
  author_political_type: string | null;
  is_mine: boolean;
  mentions: Record<string, string>; // name -> userId
  replies: CommentItem[];
};

type RawRow = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  parent_id: string | null;
};

function extractMentions(
  content: string,
  nameToId: Map<string, string>
): Record<string, string> {
  const result: Record<string, string> = {};
  const regex = /@([\w가-힣]+)/g;
  let m;
  while ((m = regex.exec(content)) !== null) {
    const name = m[1];
    const id = nameToId.get(name);
    if (id) result[name] = id;
  }
  return result;
}

function buildComment(
  row: RawRow,
  nameMap: Map<string, string | null>,
  imageMap: Map<string, string | null>,
  typeMap: Map<string, string>,
  nameToId: Map<string, string>,
  currentUserId: string | null,
  replies: CommentItem[] = []
): CommentItem {
  return {
    id: row.id,
    content: row.content,
    created_at: row.created_at,
    parent_id: row.parent_id,
    author_name: nameMap.get(row.user_id) ?? null,
    author_image: imageMap.get(row.user_id) ?? null,
    author_political_type: typeMap.get(row.user_id) ?? null,
    is_mine: row.user_id === currentUserId,
    mentions: extractMentions(row.content, nameToId),
    replies,
  };
}

export async function GET(req: NextRequest, { params }: Ctx) {
  const { id: pollId } = await params;
  const cursor = req.nextUrl.searchParams.get("cursor");

  const session = await getServerSession(authOptions);
  const svc = createServiceRoleSupabaseClient();

  let currentUserId: string | null = null;
  if (session?.user?.email) {
    const { data: me } = await svc
      .from("users").select("id").eq("email", session.user.email).single();
    currentUserId = me?.id ?? null;
  }

  // Fetch top-level comments
  let q = svc
    .from("poll_comments")
    .select("id, content, created_at, user_id, parent_id")
    .eq("poll_id", pollId)
    .is("parent_id", null)
    .order("created_at", { ascending: false })
    .limit(20);

  if (cursor) q = q.lt("created_at", cursor);

  const { data: topRows, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!topRows || topRows.length === 0) return NextResponse.json({ comments: [], nextCursor: null });

  const topIds = topRows.map((r) => r.id);

  // Fetch all replies for these top-level comments
  const { data: replyRows } = await svc
    .from("poll_comments")
    .select("id, content, created_at, user_id, parent_id")
    .in("parent_id", topIds)
    .order("created_at", { ascending: true });

  const allRows = [...topRows, ...(replyRows ?? [])];
  const userIds = [...new Set(allRows.map((r) => r.user_id))];

  const [{ data: users }, { data: profiles }] = await Promise.all([
    svc.from("users").select("id, name, image").in("id", userIds),
    svc.from("user_political_profiles").select("user_id, political_type").in("user_id", userIds),
  ]);

  const nameMap = new Map((users ?? []).map((u) => [u.id, u.name]));
  const imageMap = new Map((users ?? []).map((u) => [u.id, u.image]));
  const typeMap = new Map((profiles ?? []).map((p) => [p.user_id, p.political_type]));
  const nameToId = new Map(
    (users ?? []).filter((u) => u.name).map((u) => [u.name as string, u.id])
  );

  // Group replies by parent_id
  const replyMap = new Map<string, CommentItem[]>();
  for (const row of (replyRows ?? [])) {
    const reply = buildComment(row as RawRow, nameMap, imageMap, typeMap, nameToId, currentUserId);
    const bucket = replyMap.get(row.parent_id!) ?? [];
    bucket.push(reply);
    replyMap.set(row.parent_id!, bucket);
  }

  const comments: CommentItem[] = topRows.map((row) =>
    buildComment(row as RawRow, nameMap, imageMap, typeMap, nameToId, currentUserId, replyMap.get(row.id) ?? [])
  );

  const nextCursor = topRows.length === 20 ? topRows[topRows.length - 1].created_at : null;
  return NextResponse.json({ comments, nextCursor });
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const { id: pollId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  const body = (await req.json()) as { content?: string; parent_id?: string | null };
  const content = body.content?.trim() ?? "";
  if (!content || content.length > 500) {
    return NextResponse.json({ error: "댓글은 1자 이상 500자 이하여야 해요." }, { status: 400 });
  }

  const svc = createServiceRoleSupabaseClient();
  const { data: user } = await svc
    .from("users").select("id").eq("email", session.user.email).single();
  if (!user) return NextResponse.json({ error: "사용자를 찾을 수 없어요." }, { status: 404 });

  // Validate parent_id — must be a top-level comment of this poll
  let resolvedParentId: string | null = null;
  if (body.parent_id) {
    const { data: parent } = await svc
      .from("poll_comments")
      .select("id, parent_id")
      .eq("id", body.parent_id)
      .eq("poll_id", pollId)
      .single();
    if (parent) {
      // Always attach to the root (1-depth max)
      resolvedParentId = parent.parent_id ?? parent.id;
    }
  }

  const { data: comment, error } = await svc
    .from("poll_comments")
    .insert({ poll_id: pollId, user_id: user.id, content, parent_id: resolvedParentId })
    .select("id, content, created_at, parent_id")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const [{ data: profile }, { data: userData }] = await Promise.all([
    svc.from("user_political_profiles").select("political_type").eq("user_id", user.id).maybeSingle(),
    svc.from("users").select("name, image").eq("id", user.id).single(),
  ]);

  const newComment: CommentItem = {
    id: comment.id,
    content: comment.content,
    created_at: comment.created_at,
    parent_id: comment.parent_id,
    author_name: userData?.name ?? null,
    author_image: userData?.image ?? null,
    author_political_type: profile?.political_type ?? null,
    is_mine: true,
    mentions: {},
    replies: [],
  };

  return NextResponse.json({ comment: newComment }, { status: 201 });
}

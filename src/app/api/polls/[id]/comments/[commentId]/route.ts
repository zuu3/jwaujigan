import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServiceRoleSupabaseClient } from "@/lib/supabase";

type Ctx = { params: Promise<{ id: string; commentId: string }> };

async function getAuthenticatedUserId(email: string): Promise<string | null> {
  const svc = createServiceRoleSupabaseClient();
  const { data } = await svc.from("users").select("id").eq("email", email).single();
  return data?.id ?? null;
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { commentId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  const body = (await req.json()) as { content?: string };
  const content = body.content?.trim() ?? "";
  if (!content || content.length > 500) {
    return NextResponse.json({ error: "댓글은 1자 이상 500자 이하여야 해요." }, { status: 400 });
  }

  const userId = await getAuthenticatedUserId(session.user.email);
  if (!userId) return NextResponse.json({ error: "사용자를 찾을 수 없어요." }, { status: 404 });

  const svc = createServiceRoleSupabaseClient();
  const { data: existing } = await svc
    .from("poll_comments").select("user_id").eq("id", commentId).single();

  if (!existing) return NextResponse.json({ error: "댓글을 찾을 수 없어요." }, { status: 404 });
  if (existing.user_id !== userId) {
    return NextResponse.json({ error: "본인 댓글만 수정할 수 있어요." }, { status: 403 });
  }

  const { data: updated, error } = await svc
    .from("poll_comments")
    .update({ content })
    .eq("id", commentId)
    .select("id, content, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ comment: { ...updated, is_mine: true } });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { commentId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  const userId = await getAuthenticatedUserId(session.user.email);
  if (!userId) return NextResponse.json({ error: "사용자를 찾을 수 없어요." }, { status: 404 });

  const svc = createServiceRoleSupabaseClient();
  const { data: existing } = await svc
    .from("poll_comments").select("user_id").eq("id", commentId).single();

  if (!existing) return NextResponse.json({ error: "댓글을 찾을 수 없어요." }, { status: 404 });
  if (existing.user_id !== userId) {
    return NextResponse.json({ error: "본인 댓글만 삭제할 수 있어요." }, { status: 403 });
  }

  const { error } = await svc.from("poll_comments").delete().eq("id", commentId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}

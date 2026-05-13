"use client";

import styled from "@emotion/styled";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { CommentItem } from "@/app/api/polls/[id]/comments/route";

export type { CommentItem };

function getInitial(name: string | null | undefined): string {
  return (name?.trim()?.[0] ?? "?").toUpperCase();
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "방금 전";
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
}

type TopResponse = { comments: CommentItem[]; nextCursor: string | null };

/* ── Single comment row (shared for top-level & replies) ── */

type CommentRowProps = {
  comment: CommentItem;
  isReply?: boolean;
  onReply: (targetComment: CommentItem, rootId: string) => void;
  onEdit: (id: string, content: string) => void;
  onDelete: (id: string, parentId: string | null) => void;
  editingId: string | null;
  editDraft: string;
  editSaving: boolean;
  setEditDraft: (v: string) => void;
  onEditSave: (id: string) => void;
  onEditCancel: () => void;
};

function CommentRow({
  comment: c,
  isReply = false,
  onReply,
  onEdit,
  onDelete,
  editingId,
  editDraft,
  editSaving,
  setEditDraft,
  onEditSave,
  onEditCancel,
}: CommentRowProps) {
  const isEditing = editingId === c.id;

  return (
    <Row $isReply={isReply}>
      <Avatar $small={isReply}>
        {c.author_image ? (
          <AvatarImg
            src={c.author_image}
            alt=""
            width={isReply ? 28 : 36}
            height={isReply ? 28 : 36}
            unoptimized
          />
        ) : (
          getInitial(c.author_name)
        )}
      </Avatar>

      <RowBody>
        <RowMeta>
          <Author>{c.author_name ?? "사용자"}</Author>
          {c.author_political_type && <PoliticalTag>{c.author_political_type}</PoliticalTag>}
          <Time>{formatRelative(c.created_at)}</Time>
          <RowActions>
            {!isEditing && (
              <ActionBtn onClick={() => onReply(c, c.parent_id ?? c.id)}>답글</ActionBtn>
            )}
            {c.is_mine && !isEditing && (
              <>
                <ActionBtn onClick={() => onEdit(c.id, c.content)}>수정</ActionBtn>
                <ActionBtn $danger onClick={() => onDelete(c.id, c.parent_id)}>삭제</ActionBtn>
              </>
            )}
          </RowActions>
        </RowMeta>

        {isEditing ? (
          <EditForm onSubmit={(e) => { e.preventDefault(); onEditSave(c.id); }}>
            <EditTextarea
              value={editDraft}
              onChange={(e) => setEditDraft(e.target.value)}
              maxLength={500}
              rows={2}
              autoFocus
              disabled={editSaving}
            />
            <EditFooter>
              <CharCount $warn={editDraft.length > 450}>{editDraft.length}/500</CharCount>
              <EditCancelBtn type="button" onClick={onEditCancel} disabled={editSaving}>취소</EditCancelBtn>
              <SaveBtn type="submit" disabled={editSaving || !editDraft.trim()}>
                {editSaving ? "저장 중…" : "저장"}
              </SaveBtn>
            </EditFooter>
          </EditForm>
        ) : (
          <Content>{renderContent(c.content, c.mentions)}</Content>
        )}
      </RowBody>
    </Row>
  );
}

/* ── Main component ────────────────────────────────────────── */

type Props = { endpoint: string };

export function CommentSection({ endpoint }: Props) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [moreLoading, setMoreLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // New comment
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Reply
  const [replyTo, setReplyTo] = useState<{ rootId: string; targetName: string | null } | null>(null);
  const [replyDraft, setReplyDraft] = useState("");
  const [replySubmitting, setReplySubmitting] = useState(false);
  const replyRef = useRef<HTMLTextAreaElement>(null);

  // Edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setLoading(true);
    setFetchError(null);
    fetch(endpoint, { signal: controller.signal })
      .then(async (r) => {
        const json = await r.json() as TopResponse & { error?: string };
        if (!r.ok) throw new Error(json.error ?? `HTTP ${r.status}`);
        if (!active) return;
        setComments(json.comments);
        setNextCursor(json.nextCursor);
      })
      .catch((e: unknown) => {
        if (e instanceof Error && e.name === "AbortError") return;
        if (!active) return;
        setFetchError(e instanceof Error ? e.message : "댓글을 불러오지 못했어요.");
      })
      .finally(() => {
        if (active && !controller.signal.aborted) {
          setLoading(false);
        }
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [endpoint]);

  const loadMore = async () => {
    if (!nextCursor || moreLoading) return;
    setMoreLoading(true);
    try {
      const r = await fetch(`${endpoint}?cursor=${encodeURIComponent(nextCursor)}`);
      const { comments: more, nextCursor: nc } = (await r.json()) as TopResponse;
      setComments((prev) => [...prev, ...more]);
      setNextCursor(nc);
    } finally {
      setMoreLoading(false);
    }
  };

  // Post top-level comment
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = draft.trim();
    if (!content) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const r = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (r.status === 401) { setSubmitError("로그인이 필요해요."); return; }
      if (!r.ok) {
        const body = (await r.json()) as { error?: string };
        setSubmitError(body.error ?? "댓글을 달지 못했어요.");
        return;
      }
      const { comment } = (await r.json()) as { comment: CommentItem };
      setComments((prev) => [{ ...comment, replies: [] }, ...prev]);
      setDraft("");
    } catch {
      setSubmitError("댓글을 달지 못했어요.");
    } finally {
      setSubmitting(false);
    }
  };

  // Open reply form
  const handleOpenReply = (targetComment: CommentItem, rootId: string) => {
    const prefix = targetComment.parent_id !== null ? `@${targetComment.author_name ?? "사용자"} ` : "";
    setReplyTo({ rootId, targetName: targetComment.author_name });
    setReplyDraft(prefix);
    setTimeout(() => {
      replyRef.current?.focus();
      const len = replyRef.current?.value.length ?? 0;
      replyRef.current?.setSelectionRange(len, len);
    }, 50);
  };

  const handleCancelReply = () => {
    setReplyTo(null);
    setReplyDraft("");
  };

  // Submit reply
  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyTo) return;
    const content = replyDraft.trim();
    if (!content) return;
    setReplySubmitting(true);
    try {
      const r = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, parent_id: replyTo.rootId }),
      });
      if (!r.ok) return;
      const { comment } = (await r.json()) as { comment: CommentItem };
      setComments((prev) =>
        prev.map((c) =>
          c.id === replyTo.rootId
            ? { ...c, replies: [...c.replies, comment] }
            : c
        )
      );
      setReplyTo(null);
      setReplyDraft("");
    } finally {
      setReplySubmitting(false);
    }
  };

  // Edit
  const handleEdit = (id: string, content: string) => {
    setEditingId(id);
    setEditDraft(content);
  };

  const handleEditSave = async (id: string) => {
    const content = editDraft.trim();
    if (!content) return;
    setEditSaving(true);
    try {
      const r = await fetch(`${endpoint}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!r.ok) return;
      setComments((prev) =>
        prev.map((c) => {
          if (c.id === id) return { ...c, content };
          return { ...c, replies: c.replies.map((r) => r.id === id ? { ...r, content } : r) };
        })
      );
      setEditingId(null);
    } finally {
      setEditSaving(false);
    }
  };

  const handleEditCancel = () => { setEditingId(null); setEditDraft(""); };

  // Delete
  const handleDelete = async (id: string, parentId: string | null) => {
    if (!confirm("댓글을 삭제할까요?")) return;
    const r = await fetch(`${endpoint}/${id}`, { method: "DELETE" });
    if (r.ok || r.status === 204) {
      if (parentId) {
        setComments((prev) =>
          prev.map((c) =>
            c.id === parentId
              ? { ...c, replies: c.replies.filter((r) => r.id !== id) }
              : c
          )
        );
      } else {
        setComments((prev) => prev.filter((c) => c.id !== id));
      }
    }
  };

  const totalCount = comments.reduce((sum, c) => sum + 1 + c.replies.length, 0);

  const rowProps = {
    onReply: handleOpenReply,
    onEdit: handleEdit,
    onDelete: handleDelete,
    editingId,
    editDraft,
    editSaving,
    setEditDraft,
    onEditSave: handleEditSave,
    onEditCancel: handleEditCancel,
  };

  return (
    <Section aria-busy={loading || moreLoading}>
      <SectionTitle>
        토론{" "}
        {loading ? <CommentCountSkeleton aria-hidden="true" /> : <CommentCount>({totalCount})</CommentCount>}
      </SectionTitle>

      {/* New top-level comment */}
      <Form onSubmit={(e) => void handleSubmit(e)}>
        <Textarea
          ref={textareaRef}
          placeholder="이 투표에 대한 의견을 남겨보세요. (최대 500자)"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={500}
          rows={3}
          disabled={submitting}
        />
        <FormFooter>
          {submitError && <FormError>{submitError}</FormError>}
          <CharCount $warn={draft.length > 450}>{draft.length}/500</CharCount>
          <PostBtn type="submit" disabled={submitting || !draft.trim()}>
            {submitting ? "게시 중…" : "의견 남기기"}
          </PostBtn>
        </FormFooter>
      </Form>

      {fetchError ? (
        <FetchErrorMsg>{fetchError}</FetchErrorMsg>
      ) : loading ? (
        <SkeletonList>
          {[1, 2, 3].map((n) => (
            <SkeletonItem key={n}>
              <SkeletonAvatar />
              <SkeletonContent>
                <SkeletonLine $w="30%" />
                <SkeletonLine $w="80%" />
                <SkeletonLine $w="60%" />
              </SkeletonContent>
            </SkeletonItem>
          ))}
        </SkeletonList>
      ) : comments.length === 0 ? (
        <Empty>첫 번째 의견을 남겨보세요.</Empty>
      ) : (
        <CommentList>
          {comments.map((c) => (
            <CommentThread key={c.id}>
              <CommentRow comment={c} {...rowProps} />

              {/* Replies */}
              {c.replies.length > 0 && (
                <ReplyList>
                  {c.replies.map((reply) => (
                    <CommentRow key={reply.id} comment={reply} isReply {...rowProps} />
                  ))}
                </ReplyList>
              )}

              {/* Reply form (opens under this thread) */}
              {replyTo?.rootId === c.id && (
                <ReplyForm onSubmit={(e) => void handleReplySubmit(e)}>
                  <ReplyTextarea
                    ref={replyRef}
                    value={replyDraft}
                    onChange={(e) => setReplyDraft(e.target.value)}
                    maxLength={500}
                    rows={2}
                    placeholder={`@${replyTo.targetName ?? "사용자"}에게 답글`}
                    disabled={replySubmitting}
                  />
                  <ReplyFooter>
                    <CharCount $warn={replyDraft.length > 450}>{replyDraft.length}/500</CharCount>
                    <EditCancelBtn type="button" onClick={handleCancelReply} disabled={replySubmitting}>
                      취소
                    </EditCancelBtn>
                    <SaveBtn type="submit" disabled={replySubmitting || !replyDraft.trim()}>
                      {replySubmitting ? "게시 중…" : "답글 달기"}
                    </SaveBtn>
                  </ReplyFooter>
                </ReplyForm>
              )}
            </CommentThread>
          ))}

          {nextCursor && (
            moreLoading ? (
              <SkeletonList>
                {[1, 2].map((n) => (
                  <SkeletonItem key={n}>
                    <SkeletonAvatar />
                    <SkeletonContent>
                      <SkeletonLine $w="28%" />
                      <SkeletonLine $w="74%" />
                    </SkeletonContent>
                  </SkeletonItem>
                ))}
              </SkeletonList>
            ) : (
              <LoadMoreButton type="button" onClick={() => void loadMore()}>
                더 보기
              </LoadMoreButton>
            )
          )}
        </CommentList>
      )}
    </Section>

  );
}

/* ── Styled ──────────────────────────────────────────────── */

const Section = styled.section`
  display: grid;
  gap: 20px;
  padding-top: 32px;
  margin-top: 8px;
  border-top: 1px solid #e5e8eb;
`;

const SectionTitle = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #191f28;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const CommentCount = styled.span`
  font-size: 16px;
  font-weight: 400;
  color: #8b95a1;
`;

const Form = styled.form`
  display: grid;
  gap: 8px;
`;

const Textarea = styled.textarea`
  width: 100%;
  resize: vertical;
  min-height: 80px;
  padding: 12px 14px;
  border-radius: 8px;
  border: 1px solid #e5e8eb;
  background: #f9fafb;
  color: #191f28;
  font-size: 14px;
  font-family: inherit;
  line-height: 1.6;
  box-sizing: border-box;
  outline: none;
  transition: border-color 150ms;

  &::placeholder { color: #b0b8c1; }
  &:focus { border-color: #3182f6; background: #ffffff; }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`;

const FormFooter = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const FormError = styled.span`
  flex: 1;
  font-size: 13px;
  color: #f04452;
`;

const CharCount = styled.span<{ $warn: boolean }>`
  margin-left: auto;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  color: ${({ $warn }) => ($warn ? "#fe9800" : "#b0b8c1")};
`;

const PostBtn = styled.button`
  height: 36px;
  padding: 0 16px;
  border-radius: 8px;
  border: none;
  background: #191f28;
  color: #ffffff;
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: opacity 140ms;

  &:hover:not(:disabled) { opacity: 0.85; }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
`;

const CommentList = styled.div`display: grid; gap: 0;`;

const CommentThread = styled.div`
  border-bottom: 1px solid #f2f4f6;
  &:last-of-type { border-bottom: none; }
`;

const Row = styled.div<{ $isReply: boolean }>`
  display: grid;
  grid-template-columns: ${({ $isReply }) => ($isReply ? "28px" : "36px")} minmax(0, 1fr);
  gap: 10px;
  padding: ${({ $isReply }) => ($isReply ? "10px 0" : "16px 0")};
`;

const Avatar = styled.div<{ $small: boolean }>`
  display: inline-flex;
  width: ${({ $small }) => ($small ? "28px" : "36px")};
  height: ${({ $small }) => ($small ? "28px" : "36px")};
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  overflow: hidden;
  background: #191f28;
  color: #ffffff;
  font-size: ${({ $small }) => ($small ? "11px" : "14px")};
  font-weight: 700;
`;

const AvatarImg = styled(Image)`
  object-fit: cover;
  border-radius: 50%;
`;

const RowBody = styled.div`display: grid; gap: 5px;`;

const RowMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
`;

const Author = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: #191f28;
`;

const PoliticalTag = styled.span`
  display: inline-flex;
  padding: 1px 6px;
  border-radius: 4px;
  background: #e8f3ff;
  color: #3182f6;
  font-size: 11px;
  font-weight: 600;
`;

const Time = styled.span`
  font-size: 12px;
  color: #8b95a1;
`;

const RowActions = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 2px;
  margin-left: auto;
`;

const ActionBtn = styled.button<{ $danger?: boolean }>`
  padding: 2px 8px;
  border-radius: 4px;
  border: none;
  background: transparent;
  color: ${({ $danger }) => ($danger ? "#f04452" : "#8b95a1")};
  font-size: 12px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: background 120ms, color 120ms;

  &:hover {
    background: ${({ $danger }) => ($danger ? "#fef2f2" : "#f2f4f6")};
    color: ${({ $danger }) => ($danger ? "#f04452" : "#4e5968")};
  }
`;

function renderContent(text: string, mentions: Record<string, string> = {}) {
  const parts = text.split(/(@[\w가-힣]+)/g);
  return parts.map((part, i) => {
    if (!part.startsWith("@")) return part;
    const name = part.slice(1);
    const userId = mentions[name];
    return userId ? (
      <MentionLink key={i} href={`/u/${userId}`}>{part}</MentionLink>
    ) : (
      <Mention key={i}>{part}</Mention>
    );
  });
}

const Content = styled.p`
  margin: 0;
  font-size: 14px;
  color: #191f28;
  line-height: 1.6;
  word-break: keep-all;
  white-space: pre-wrap;
`;

const mentionStyle = `
  color: #3182f6;
  font-weight: 600;
  font-size: 13px;
`;

const Mention = styled.span`${mentionStyle}`;

const MentionLink = styled(Link)`
  ${mentionStyle}
  &:hover { text-decoration: underline; }
`;

const ReplyList = styled.div`
  padding-left: 46px;
  border-left: 2px solid #f2f4f6;
  margin-left: 18px;
  margin-bottom: 4px;
`;

const ReplyForm = styled.form`
  display: grid;
  gap: 8px;
  padding: 8px 0 12px 46px;
  margin-left: 18px;
`;

const ReplyTextarea = styled(Textarea)`
  min-height: 60px;
  font-size: 13px;
`;

const ReplyFooter = styled(FormFooter)``;

const EditForm = styled.form`display: grid; gap: 8px;`;
const EditTextarea = styled(Textarea)`min-height: 60px; font-size: 14px;`;
const EditFooter = styled(FormFooter)``;

const EditCancelBtn = styled.button`
  height: 32px;
  padding: 0 12px;
  border-radius: 8px;
  border: 1px solid #e5e8eb;
  background: #ffffff;
  color: #6b7684;
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: background 150ms;

  &:hover:not(:disabled) { background: #f2f4f6; }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
`;

const SaveBtn = styled(PostBtn)`height: 32px;`;

const LoadMoreButton = styled.button`
  margin-top: 8px;
  padding: 10px 0;
  width: 100%;
  border: 1px solid #e5e8eb;
  border-radius: 8px;
  background: transparent;
  color: #4e5968;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: background 150ms;

  &:hover { background: #f2f4f6; }
`;

const Empty = styled.p`
  margin: 0;
  padding: 32px 0;
  text-align: center;
  font-size: 14px;
  color: #8b95a1;
`;

const FetchErrorMsg = styled.p`
  margin: 0;
  padding: 20px 0;
  text-align: center;
  font-size: 13px;
  color: #f04452;
`;

/* ── Skeleton ─────────────────────────────────────────────── */

const SkeletonList = styled.div`display: grid; gap: 0;`;

const SkeletonItem = styled.div`
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr);
  gap: 12px;
  padding: 16px 0;
  border-bottom: 1px solid #f2f4f6;
`;

const shimmer = `
  background: linear-gradient(90deg, #f2f4f6 0%, #ffffff 50%, #f2f4f6 100%);
  background-size: 200% 100%;
  animation: shimmer 1.2s infinite;
  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`;

const SkeletonAvatar = styled.div`width: 36px; height: 36px; border-radius: 50%; ${shimmer}`;
const SkeletonContent = styled.div`display: grid; gap: 8px; align-content: start;`;
const SkeletonLine = styled.div<{ $w: string }>`height: 14px; border-radius: 4px; width: ${({ $w }) => $w}; ${shimmer}`;
const CommentCountSkeleton = styled.span`
  width: 34px;
  height: 18px;
  border-radius: 4px;
  ${shimmer}
`;

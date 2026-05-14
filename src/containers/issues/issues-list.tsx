"use client";

import styled from "@emotion/styled";
import { CheckCircle2, Clock, Landmark, User, XCircle } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { AppHeader } from "@/components/app-header";

type IssueItem = {
  id: string;
  title: string;
  summary: string;
  published_at: string | null;
  proposer: string | null;
  committee: string | null;
  bill_status: string | null;
  created_at: string;
};

type IssuesListContainerProps = {
  initialIssues: IssueItem[];
  initialNextCursor: string | null;
};

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge $status={status}>
      {status === "통과" && <CheckCircle2 size={11} />}
      {status === "폐기" && <XCircle size={11} />}
      {status === "계류 중" && <Clock size={11} />}
      {status}
    </Badge>
  );
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`;
}

export function IssuesListContainer({ initialIssues, initialNextCursor }: IssuesListContainerProps) {
  const [issues, setIssues] = useState(initialIssues);
  const [nextCursor, setNextCursor] = useState(initialNextCursor);
  const [isPending, startTransition] = useTransition();

  function loadMore() {
    if (!nextCursor || isPending) return;
    startTransition(async () => {
      const res = await fetch(`/api/issues/list?cursor=${encodeURIComponent(nextCursor)}`);
      if (!res.ok) return;
      const data = await res.json() as { issues: IssueItem[]; nextCursor: string | null };
      setIssues((prev) => [...prev, ...data.issues]);
      setNextCursor(data.nextCursor);
    });
  }

  return (
    <Page>
      <AppHeader />
      <Shell>
        <PageHeader>
          <PageTitle>이슈</PageTitle>
          <PageDesc>국회에서 논의 중이거나 처리된 법안을 모아봤어요.</PageDesc>
        </PageHeader>

        <IssueList>
          {issues.map((issue) => (
            <IssueRow key={issue.id} href={`/issues/${issue.id}`}>
              <IssueMain>
                <IssueTitle>{issue.title}</IssueTitle>
                <IssueSummary>{issue.summary}</IssueSummary>
                <IssueMeta>
                  {issue.bill_status && <StatusBadge status={issue.bill_status} />}
                  {issue.committee && (
                    <MetaChip>
                      <Landmark size={11} />
                      {issue.committee}
                    </MetaChip>
                  )}
                  {issue.proposer && (
                    <MetaChip>
                      <User size={11} />
                      {issue.proposer}
                    </MetaChip>
                  )}
                </IssueMeta>
              </IssueMain>
              <IssueDate>{formatDate(issue.published_at ?? issue.created_at)}</IssueDate>
            </IssueRow>
          ))}
        </IssueList>

        {nextCursor && (
          <LoadMoreButton type="button" onClick={loadMore} disabled={isPending}>
            {isPending ? "불러오는 중..." : "더 보기"}
          </LoadMoreButton>
        )}

        {issues.length === 0 && (
          <Empty>아직 이슈가 없어요. 홈 화면에서 첫 이슈를 불러와보세요.</Empty>
        )}
      </Shell>
    </Page>
  );
}

/* ── Styled ─────────────────────────────────────────────── */

const Page = styled.main`
  min-height: 100vh;
  background: #ffffff;
  padding-bottom: 80px;
`;

const Shell = styled.div`
  width: min(100%, 720px);
  margin: 0 auto;
  padding: 32px 24px 0;

  @media (max-width: 640px) {
    padding: 24px 20px 0;
  }
`;

const PageHeader = styled.div`
  display: grid;
  gap: 6px;
  padding-bottom: 24px;
  border-bottom: 1px solid #f2f4f6;
  margin-bottom: 8px;
`;

const PageTitle = styled.h1`
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #191f28;
  letter-spacing: -0.02em;
`;

const PageDesc = styled.p`
  margin: 0;
  font-size: 14px;
  color: #8b95a1;
`;

const IssueList = styled.div`
  display: grid;
`;

const IssueRow = styled(Link)`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 16px;
  align-items: start;
  padding: 20px 0;
  border-bottom: 1px solid #f2f4f6;
  color: inherit;
  text-decoration: none;

  &:last-of-type {
    border-bottom: 0;
  }

  &:hover h3 {
    color: #3182f6;
  }
`;

const IssueMain = styled.div`
  display: grid;
  gap: 6px;
`;

const IssueTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #191f28;
  line-height: 1.4;
  letter-spacing: -0.02em;
  word-break: keep-all;
  transition: color 140ms;
`;

const IssueSummary = styled.p`
  margin: 0;
  font-size: 14px;
  color: #6b7684;
  line-height: 1.6;
  word-break: keep-all;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const IssueMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-top: 2px;
`;

const Badge = styled.span<{ $status: string }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  background: ${({ $status }) =>
    $status === "통과" ? "#e8f3ff" : $status === "폐기" ? "#fef2f2" : "#fff7e6"};
  color: ${({ $status }) =>
    $status === "통과" ? "#3182f6" : $status === "폐기" ? "#e5484d" : "#fe9800"};
`;

const MetaChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 4px;
  background: #f2f4f6;
  color: #6b7684;
  font-size: 12px;
  font-weight: 500;
`;

const IssueDate = styled.span`
  flex-shrink: 0;
  font-size: 13px;
  color: #8b95a1;
  padding-top: 3px;
  white-space: nowrap;
`;

const LoadMoreButton = styled.button`
  display: block;
  width: 100%;
  margin-top: 24px;
  padding: 14px;
  border-radius: 8px;
  border: 1px solid #e5e8eb;
  background: #ffffff;
  color: #4e5968;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: background 140ms;

  &:hover:not(:disabled) {
    background: #f2f4f6;
  }

  &:disabled {
    opacity: 0.6;
    cursor: default;
  }
`;

const Empty = styled.p`
  margin: 48px 0 0;
  text-align: center;
  font-size: 14px;
  color: #8b95a1;
  line-height: 1.6;
`;

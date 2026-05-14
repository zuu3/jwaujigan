"use client";

import styled from "@emotion/styled";
import { Bell, ArrowRight, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { FollowedPolitician } from "@/types/mypage";
import { usePoliticianBills } from "@/services/politicians/politicians.queries";
import {
  Section,
  SectionHeader,
  SectionKicker,
  SectionDate,
  EmptyState,
  EmptyTitle,
  EmptyText,
  PrimaryLink,
  SkeletonBlock,
} from "./shared-styles";

export interface FollowingSectionProps {
  followedPoliticians: FollowedPolitician[] | null;
}

function BillsPanel({ politicianId }: { politicianId: string }) {
  const { data, isLoading, isError } = usePoliticianBills(politicianId);

  if (isLoading) {
    return (
      <BillsList>
        {[0, 1, 2].map((i) => (
          <BillSkeleton key={i} />
        ))}
      </BillsList>
    );
  }

  if (isError || !data?.length) {
    return (
      <BillsEmpty>
        {isError ? "법안 정보를 불러오지 못했어요." : "발의한 법안이 없어요."}
      </BillsEmpty>
    );
  }

  return (
    <BillsList>
      {data.map((bill, i) => (
        <BillRow key={i}>
          <BillTitle>
            {bill.url ? (
              <BillLink href={bill.url} target="_blank" rel="noopener noreferrer">
                {bill.title}
                <ExternalLink size={11} />
              </BillLink>
            ) : (
              bill.title
            )}
          </BillTitle>
          <BillMeta>
            {bill.proposedAt ? bill.proposedAt.slice(0, 10) : ""}
            {bill.result && <BillResult $passed={bill.result === "통과"}>{bill.result}</BillResult>}
          </BillMeta>
        </BillRow>
      ))}
    </BillsList>
  );
}

function PoliticianRow({ politician }: { politician: FollowedPolitician }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <RowWrapper>
      <RowMain>
        <RowLeft href={`/politicians/${politician.id}`}>
          <Avatar>
            {politician.image ? (
              <AvatarImage src={politician.image} alt="" width={40} height={40} />
            ) : (
              politician.name[0]
            )}
          </Avatar>
          <RowInfo>
            <RowName>{politician.name}</RowName>
            <RowSub>팔로우 중</RowSub>
          </RowInfo>
        </RowLeft>
        <ExpandButton
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-label={expanded ? "법안 접기" : "발의 법안 보기"}
        >
          <span style={{ fontSize: 12, color: "#8b95a1" }}>발의 법안</span>
          {expanded ? <ChevronUp size={14} color="#8b95a1" /> : <ChevronDown size={14} color="#8b95a1" />}
        </ExpandButton>
      </RowMain>
      {expanded && (
        <BillsPanel politicianId={politician.id} />
      )}
    </RowWrapper>
  );
}

export function FollowingSection({ followedPoliticians }: FollowingSectionProps) {
  return (
    <Section>
      <SectionHeader>
        <SectionKicker>
          <Bell size={14} />
          <span>팔로잉</span>
        </SectionKicker>
        {followedPoliticians && followedPoliticians.length > 0 ? (
          <SectionDate>{followedPoliticians.length}명</SectionDate>
        ) : null}
      </SectionHeader>

      {followedPoliticians === null ? (
        <FollowSkeleton>
          <SkeletonBlock $h={56} />
          <SkeletonBlock $h={56} />
        </FollowSkeleton>
      ) : followedPoliticians.length === 0 ? (
        <EmptyState>
          <EmptyTitle>관심 정치인을 추가해 보세요</EmptyTitle>
          <EmptyText>
            팔로우한 정치인이 발의한 법안을 바로 확인할 수 있어요.
          </EmptyText>
          <PrimaryLink href="/home">
            정치인 찾기
            <ArrowRight size={14} />
          </PrimaryLink>
        </EmptyState>
      ) : (
        <RowList>
          {followedPoliticians.map((p) => (
            <PoliticianRow key={p.id} politician={p} />
          ))}
        </RowList>
      )}
    </Section>
  );
}

const FollowSkeleton = styled.div`
  display: grid;
  gap: 8px;
`;

const RowList = styled.div`
  display: grid;
  gap: 0;
`;

const RowWrapper = styled.div`
  border-bottom: 1px solid #f2f4f6;
  &:last-child { border-bottom: none; }
`;

const RowMain = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 12px 0;
`;

const RowLeft = styled(Link)`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
  text-decoration: none;
`;

const Avatar = styled.div`
  display: flex;
  width: 40px;
  height: 40px;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #191f28;
  color: #ffffff;
  font-size: 15px;
  font-weight: 700;
  flex-shrink: 0;
  overflow: hidden;
`;

const AvatarImage = styled(Image)`
  object-fit: cover;
  border-radius: 50%;
`;

const RowInfo = styled.div`
  display: grid;
  gap: 2px;
  min-width: 0;
`;

const RowName = styled.div`
  color: #191f28;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: -0.01em;
`;

const RowSub = styled.div`
  color: #b0b8c1;
  font-size: 12px;
`;

const ExpandButton = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 8px;
  border-radius: 6px;
  border: 1px solid #e5e8eb;
  background: #f9fafb;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 120ms;
  &:hover { background: #e8f3ff; border-color: #3182f6; }
`;

const BillsList = styled.div`
  display: grid;
  gap: 0;
  padding: 0 0 12px 52px;
`;

const BillSkeleton = styled.div`
  height: 44px;
  border-radius: 6px;
  margin-bottom: 4px;
  background: linear-gradient(90deg, #f2f4f6 0%, #ffffff 50%, #f2f4f6 100%);
  background-size: 200% 100%;
  animation: shimmer 1.2s infinite;
  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`;

const BillsEmpty = styled.div`
  padding: 8px 0 12px 52px;
  font-size: 13px;
  color: #8b95a1;
`;

const BillRow = styled.div`
  display: grid;
  gap: 3px;
  padding: 8px 0;
  border-bottom: 1px solid #f9fafb;
  &:last-child { border-bottom: none; }
`;

const BillTitle = styled.div`
  font-size: 13px;
  color: #191f28;
  font-weight: 500;
  word-break: keep-all;
  line-height: 1.5;
`;

const BillLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #3182f6;
  text-decoration: none;
  &:hover { text-decoration: underline; }
`;

const BillMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: #8b95a1;
`;

const BillResult = styled.span<{ $passed: boolean }>`
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  background: ${({ $passed }) => ($passed ? "#dcfce7" : "#f2f4f6")};
  color: ${({ $passed }) => ($passed ? "#03b26c" : "#8b95a1")};
`;

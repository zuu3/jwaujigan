"use client";

import styled from "@emotion/styled";
import { Bell, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { FollowedPolitician } from "@/types/mypage";
import { formatDate } from "@/lib/mypage-utils";
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

export function FollowingSection({
  followedPoliticians,
}: FollowingSectionProps) {
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
          <SkeletonBlock $h={52} />
          <SkeletonBlock $h={52} />
        </FollowSkeleton>
      ) : followedPoliticians.length === 0 ? (
        <EmptyState>
          <EmptyTitle>관심 정치인을 추가해 보세요</EmptyTitle>
          <EmptyText>
            팔로우한 정치인이 관련 이슈에 등장하면 홈 피드에서 바로 확인할 수
            있습니다.
          </EmptyText>
          <PrimaryLink href="/home">
            정치인 검색하기
            <ArrowRight size={14} />
          </PrimaryLink>
        </EmptyState>
      ) : (
        <FollowGrid>
          {followedPoliticians.map((p) => (
            <FollowCard key={p.id} href={`/politicians/${p.id}`}>
              <FollowAvatar aria-hidden="true">
                {p.image ? (
                  <FollowAvatarImage
                    src={p.image}
                    alt=""
                    width={44}
                    height={44}
                  />
                ) : (
                  p.name[0]
                )}
              </FollowAvatar>
              <FollowName>{p.name}</FollowName>
              <FollowDate>{formatDate(p.followed_at)}</FollowDate>
            </FollowCard>
          ))}
        </FollowGrid>
      )}
    </Section>
  );
}

/* ── Styled components ────────────────────────────────── */

const FollowGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;

  @media (max-width: 480px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const FollowCard = styled(Link)`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px 12px 16px;
  border: 1px solid #e5e8eb;
  border-radius: 12px;
  text-align: center;
  transition: background 140ms ease-out;

  &:hover {
    background: #f9fafb;
  }

  &:focus-visible {
    outline: 2px solid #3182f6;
    outline-offset: 2px;
  }
`;

const FollowAvatar = styled.div`
  display: flex;
  width: 44px;
  height: 44px;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #191f28;
  color: #ffffff;
  font-size: 16px;
  font-weight: 700;
  flex-shrink: 0;
`;

const FollowAvatarImage = styled(Image)`
  object-fit: cover;
  border-radius: 50%;
`;

const FollowName = styled.div`
  color: #191f28;
  font-size: 14px;
  font-weight: 600;
  word-break: keep-all;
`;

const FollowDate = styled.div`
  color: #8b95a1;
  font-size: 11px;
  font-weight: 500;
`;

const FollowSkeleton = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
`;

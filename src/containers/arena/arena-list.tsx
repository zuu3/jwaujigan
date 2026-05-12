"use client";

import styled from "@emotion/styled";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import type { HotIssue } from "@/types/issue";

type ArenaIndexProps = {
  issues: HotIssue[];
  isAuthenticated: boolean;
};

export function ArenaIndex({ issues, isAuthenticated }: ArenaIndexProps) {
  return (
    <Page>
      {isAuthenticated ? <AppHeader /> : (
        <GuestNav>
          <Brand href="/home">좌우지간</Brand>
          <GuestNavLink href="/">로그인</GuestNavLink>
        </GuestNav>
      )}
      <Shell>
        {!isAuthenticated ? (
          <LoginBanner>
            <BannerText>
              로그인하면 배틀 결과가 기록되고 나중에 다시 확인할 수 있습니다.
            </BannerText>
            <BannerAction href="/">로그인하기</BannerAction>
          </LoginBanner>
        ) : null}

        <Hero>
          <HeroEyebrow>AI 토론 배틀</HeroEyebrow>
          <HeroTitle>이슈를 고르고 AI 토론을 지켜보세요</HeroTitle>
          <HeroDescription>
            진보 AI와 보수 AI가 3라운드 토론을 벌입니다. 원할 때 내 생각을 보내면 AI가 다음 발언에 반영합니다.
          </HeroDescription>
          <HowItWorks>
            <HowStep>
              <HowNum>1</HowNum>
              <HowText>이슈 선택</HowText>
            </HowStep>
            <HowDivider aria-hidden="true" />
            <HowStep>
              <HowNum>2</HowNum>
              <HowText>편 고르기 또는 구경</HowText>
            </HowStep>
            <HowDivider aria-hidden="true" />
            <HowStep>
              <HowNum>3</HowNum>
              <HowText>AI 토론 + 내 의견 추가</HowText>
            </HowStep>
            <HowDivider aria-hidden="true" />
            <HowStep>
              <HowNum>4</HowNum>
              <HowText>AI 판정 확인</HowText>
            </HowStep>
          </HowItWorks>
        </Hero>

        {issues.length > 0 ? (
          <IssueGrid>
            {issues.map((issue) => {
              const total = issue.vote_counts?.total ?? 0;
              const statusColor =
                issue.bill_status === "통과" ? "#03b26c" :
                issue.bill_status === "폐기" ? "#8b95a1" :
                issue.bill_status ? "#fe9800" : null;

              return (
                <IssueCard key={issue.id} href={`/arena/${issue.id}`}>
                  <IssueCardTop>
                    {issue.bill_status && statusColor ? (
                      <IssueCardBadge $color={statusColor}>{issue.bill_status}</IssueCardBadge>
                    ) : (
                      <IssueCardBadge $color="#8b95a1">토론</IssueCardBadge>
                    )}
                    {total > 0 ? (
                      <IssueCardParticipants>
                        {total.toLocaleString()}명 참여
                      </IssueCardParticipants>
                    ) : null}
                  </IssueCardTop>
                  <IssueCardTitle>{issue.title}</IssueCardTitle>
                  <IssueCardSummary>{issue.summary}</IssueCardSummary>
                  {issue.proposer || issue.committee ? (
                    <IssueCardMeta>
                      {[issue.committee, issue.proposer].filter(Boolean).join(" · ")}
                    </IssueCardMeta>
                  ) : null}
                  <IssueCardFooter>
                    <span>배틀 참여하기</span>
                    <ArrowRight size={16} />
                  </IssueCardFooter>
                </IssueCard>
              );
            })}
          </IssueGrid>
        ) : (
          <EmptyPanel>
            <EmptyTitle>오늘은 배틀 이슈가 없어요</EmptyTitle>
            <EmptyText>매일 새 이슈가 추가돼요. 홈에서 핫이슈를 먼저 확인해 보세요.</EmptyText>
          </EmptyPanel>
        )}
      </Shell>
    </Page>
  );
}

const Page = styled.main`
  min-height: 100vh;
  padding-bottom: 80px;
  color: #191f28;
  background: #ffffff;
  animation: fadeIn 200ms ease-out;

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @media (max-width: 640px) {
    padding-bottom: 64px;
  }
`;

const Shell = styled.div`
  display: grid;
  width: min(100%, 1120px);
  gap: 40px;
  margin: 0 auto;
  padding: 32px 24px 0;

  @media (max-width: 640px) {
    padding: 24px 16px 0;
  }
`;

const GuestNav = styled.nav`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: min(100%, 1160px);
  min-height: 56px;
  margin: 0 auto;
  padding: 0 24px;
  border-bottom: 1px solid #f2f4f6;

  @media (max-width: 640px) {
    padding: 0 20px;
  }
`;

const Brand = styled(Link)`
  color: #191f28;
  font-size: 18px;
  font-weight: 800;
  letter-spacing: -0.04em;
`;

const GuestNavLink = styled(Link)`
  display: inline-flex;
  min-height: 36px;
  align-items: center;
  justify-content: center;
  padding: 0 14px;
  border: 1px solid #e5e8eb;
  border-radius: 6px;
  color: #4e5968;
  font-size: 13px;
  font-weight: 500;
  transition: border-color 120ms, color 120ms;

  &:hover {
    border-color: #b0b8c1;
    color: #191f28;
  }
`;

const LoginBanner = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 20px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;

  @media (max-width: 640px) {
    align-items: stretch;
    flex-direction: column;
  }
`;

const BannerText = styled.p`
  margin: 0;
  color: #4e5968;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.55;
`;

const BannerAction = styled(Link)`
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  padding: 0 16px;
  color: #ffffff;
  background: #3182f6;
  font-size: 14px;
  font-weight: 600;
`;

const Hero = styled.section`
  display: grid;
  gap: 16px;
`;

const HeroEyebrow = styled.div`
  color: #4e5968;
  font-size: 14px;
  font-weight: 600;
`;

const HeroTitle = styled.h1`
  max-width: 780px;
  margin: 0;
  color: #191f28;
  font-size: 32px;
  font-weight: 700;
  line-height: 1.25;
  letter-spacing: -0.02em;
  word-break: keep-all;
`;

const HeroDescription = styled.p`
  max-width: 640px;
  margin: 0;
  color: #4e5968;
  font-size: 16px;
  font-weight: 400;
  line-height: 1.6;
`;

const IssueGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;

  @media (max-width: 980px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const HowItWorks = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 4px;
`;

const HowStep = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const HowNum = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #e8f3ff;
  color: #3182f6;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
`;

const HowText = styled.span`
  color: #4e5968;
  font-size: 13px;
  font-weight: 400;
`;

const HowDivider = styled.span`
  color: #b0b8c1;
  font-size: 12px;

  &::before {
    content: "→";
  }
`;

const IssueCard = styled(Link)`
  display: grid;
  min-height: 200px;
  align-content: start;
  gap: 12px;
  padding: 24px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
  transition: border-color 200ms ease;

  &:hover {
    border-color: #191f28;
  }
`;

const IssueCardTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

const IssueCardBadge = styled.span<{ $color: string }>`
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 4px;
  background: ${({ $color }) => `${$color}18`};
  color: ${({ $color }) => $color};
  font-size: 12px;
  font-weight: 600;
`;

const IssueCardParticipants = styled.span`
  color: #8b95a1;
  font-size: 12px;
  font-weight: 400;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
`;

const IssueCardMeta = styled.div`
  color: #8b95a1;
  font-size: 13px;
  font-weight: 400;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const IssueCardTitle = styled.h2`
  margin: 0;
  color: #191f28;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.4;
  word-break: keep-all;
`;

const IssueCardSummary = styled.p`
  margin: 0;
  color: #4e5968;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.6;
`;

const IssueCardFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid #f2f4f6;
  color: #191f28;
  font-size: 14px;
  font-weight: 600;
`;

const EmptyPanel = styled.div`
  padding: 32px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
`;

const EmptyTitle = styled.h2`
  margin: 0;
  color: #191f28;
  font-size: 18px;
  font-weight: 700;
`;

const EmptyText = styled.p`
  margin: 8px 0 0;
  color: #4e5968;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.6;
`;

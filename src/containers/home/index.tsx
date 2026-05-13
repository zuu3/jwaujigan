"use client";

import styled from "@emotion/styled";
import { ArrowRight, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Session } from "next-auth";
import { AppHeader } from "@/components/app-header";
import { useIssues } from "@/services/issues/issues.queries";
import { useVoteIssue } from "@/services/issues/issues.mutations";
import { useUserProfile } from "@/services/user/user.queries";
import { useLocalPoliticians, usePoliticianDetail, useFollowedPoliticianNames } from "@/services/politicians/politicians.queries";
import { useSearch } from "@/services/search/search.queries";
import { usePollsQuery } from "@/services/community/community.queries";
import type { HotIssue } from "@/types/issue";
import { SearchBar } from "@/components/home/search";
import { PoliticianCard } from "@/components/home/politician-card";
import { IssueCard } from "@/components/home/issue-card";

type HomeContainerProps = {
  session: Session;
};

function getOnboardingCopy({
  needsDistrict,
  needsPoliticalProfile,
}: {
  needsDistrict: boolean;
  needsPoliticalProfile: boolean;
}) {
  if (needsDistrict && needsPoliticalProfile) {
    return {
      label: "지역구와 성향 분석이 필요해요",
      action: "설정 이어가기",
      title: "지역구와 정치 성향을 먼저 정리해 볼까요?",
      description: "지역구와 성향을 저장하면 의원·이슈가 더 정확해져요.",
    };
  }

  if (needsDistrict) {
    return {
      label: "지역구 설정이 필요해요",
      action: "지역구 설정",
      title: "내 지역구를 먼저 설정해 볼까요?",
      description: "지역구를 저장하면 현재 선거구 의원을 바로 볼 수 있어요.",
    };
  }

  return {
    label: "성향 분석을 완료해 주세요",
    action: "성향 분석 이어가기",
    title: "정치 성향 분석을 마무리해 볼까요?",
    description: "성향 분석을 마치면 토론 진입이 더 자연스러워져요.",
  };
}

function getUserLean(issues: HotIssue[]): "progressive" | "conservative" | null {
  const p = issues.filter((i) => i.user_vote === "progressive").length;
  const c = issues.filter((i) => i.user_vote === "conservative").length;
  if (p > c) return "progressive";
  if (c > p) return "conservative";
  return null;
}

export function HomeContainer({ session }: HomeContainerProps) {
  const [expandedPoliticianId, setExpandedPoliticianId] = useState<string | null>(null);
  const [expandedIssueId, setExpandedIssueId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [now] = useState(() => Date.now());
  const [balanceMode, setBalanceMode] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("balance-mode") === "1";
  });
  const searchInputRef = useRef<HTMLInputElement>(null);

  const voteMutation = useVoteIssue();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 350);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const searchResultsQuery = useSearch(debouncedQuery);
  const profileQuery = useUserProfile();
  const issuesQuery = useIssues();

  const displayName = profileQuery.data?.name ?? session.user.name ?? null;
  const displayImage = profileQuery.data?.image ?? session.user.image ?? null;
  const district = profileQuery.data?.district ?? session.user.district ?? null;
  const hasPoliticalProfile =
    profileQuery.data?.hasPoliticalProfile ?? session.user.hasPoliticalProfile;
  const needsDistrict = !district;
  const needsPoliticalProfile = !hasPoliticalProfile;
  const needsOnboarding = needsDistrict || needsPoliticalProfile;
  const onboardingCopy = getOnboardingCopy({
    needsDistrict,
    needsPoliticalProfile,
  });

  const politiciansQuery = useLocalPoliticians({ district, enabled: Boolean(district) });
  const politicianDetailQuery = usePoliticianDetail(expandedPoliticianId);
  const followedNamesQuery = useFollowedPoliticianNames();
  const followedNames = new Set<string>(followedNamesQuery.data ?? []);

  const pollsQuery = usePollsQuery("hot");
  const hotPolls = (pollsQuery.data ?? []).slice(0, 3);

  const politicians = politiciansQuery.data?.politicians ?? [];
  const issues = issuesQuery.data?.issues ?? [];

  const isSearchActive = debouncedQuery.length >= 2 || searchQuery.length > 0;
  const userLean = getUserLean(issues);
  const showConservativeFirst = balanceMode && userLean === "progressive";

  const introTitle = needsOnboarding
    ? onboardingCopy.title
    : "진보·보수 두 입장을 직접 비교하고 AI 토론을 판정해보세요.";
  const introEyebrow = displayName ? `오늘, ${displayName}님` : "오늘";
  const introText = needsOnboarding ? onboardingCopy.description : null;

  const primaryAction = needsOnboarding
    ? { href: "/onboarding", label: onboardingCopy.action }
    : { href: "#hot-issues", label: "이슈 바로 보기" };

  const hasVoted = issues.some((i) => i.user_vote !== null);
  const showFirstRunGuide = !issuesQuery.isLoading && !hasVoted && issues.length > 0;

  return (
    <Page>
      <AppHeader userName={displayName} userImage={displayImage} />

      <Main>
        <MotionIntro>
          <IntroCopy>
            <IntroEyebrow>{introEyebrow}</IntroEyebrow>
            {(() => {
              const streak = profileQuery.data?.streak ?? 0;
              const todayActive = profileQuery.data?.today_active ?? false;
              if (streak >= 2 && todayActive) return <StreakChip>{streak}일 연속 참여 중</StreakChip>;
              if (streak >= 1 && !todayActive) return <StreakChip>오늘 참여하면 {streak + 1}일 연속이에요</StreakChip>;
              return null;
            })()}
            <IntroTitle>{introTitle}</IntroTitle>
            {introText ? <IntroText>{introText}</IntroText> : null}
            <IntroActions>
              {needsOnboarding ? (
                <PrimaryActionLink href={primaryAction.href}>
                  {primaryAction.label}
                  <ArrowRight size={16} />
                </PrimaryActionLink>
              ) : (
                <PrimaryActionScroll
                  onClick={() => {
                    document.getElementById("hot-issues")?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  {primaryAction.label}
                  <ArrowRight size={16} />
                </PrimaryActionScroll>
              )}
            </IntroActions>
          </IntroCopy>
        </MotionIntro>

        <SearchBar
          searchQuery={searchQuery}
          isSearchActive={isSearchActive}
          isLoading={searchResultsQuery.isLoading}
          searchResults={searchResultsQuery.data}
          searchInputRef={searchInputRef}
          onQueryChange={setSearchQuery}
          onClear={() => { setSearchQuery(""); setDebouncedQuery(""); }}
        />

        {district ? (
          <MotionSection id="local-politicians">
            <SectionHeader>
              <SectionMeta>
                <SectionTitleRow>
                  <SectionTitle>내 지역구 의원</SectionTitle>
                  <SectionSubtle>{district}</SectionSubtle>
                </SectionTitleRow>
              </SectionMeta>
            </SectionHeader>

            {politiciansQuery.isLoading ? (
              <PoliticianList aria-busy="true">
                {[0, 1, 2].map((item) => (
                  <PoliticianSkeletonRow key={item}>
                    <SkeletonCircle />
                    <SkeletonStack>
                      <SkeletonLine $w={item === 0 ? "62%" : "48%"} />
                      <SkeletonLine $w={item === 2 ? "44%" : "70%"} $small />
                      <SkeletonLine $w="32%" $small />
                    </SkeletonStack>
                  </PoliticianSkeletonRow>
                ))}
              </PoliticianList>
            ) : politiciansQuery.isError ? (
              <EmptyCard>
                <EmptyCardTitle>의원 정보를 불러오지 못했어요.</EmptyCardTitle>
                <EmptyCardText>
                  잠시 후 다시 시도해 주세요. 계속되면 지역구 설정도 확인해 주세요.
                </EmptyCardText>
                <RetryButton
                  type="button"
                  onClick={() => {
                    void politiciansQuery.refetch();
                  }}
                >
                  다시 시도
                </RetryButton>
              </EmptyCard>
            ) : politicians.length > 0 ? (
              <PoliticianList>
                {politicians.map((politician) => (
                  <PoliticianCard
                    key={politician.id}
                    politician={politician}
                    isExpanded={expandedPoliticianId === politician.id}
                    detail={
                      expandedPoliticianId === politician.id
                        ? politicianDetailQuery.data
                        : undefined
                    }
                    isDetailLoading={
                      expandedPoliticianId === politician.id && politicianDetailQuery.isLoading
                    }
                    isDetailError={
                      expandedPoliticianId === politician.id && politicianDetailQuery.isError
                    }
                    onToggleExpand={(id) =>
                      setExpandedPoliticianId((current) => (current === id ? null : id))
                    }
                  />
                ))}
              </PoliticianList>
            ) : (
              <EmptyCard>
                <EmptyCardTitle>이 지역구로 등록된 의원이 없어요.</EmptyCardTitle>
                <EmptyCardText>온보딩에서 지역구를 다시 설정해 주세요.</EmptyCardText>
              </EmptyCard>
            )}
          </MotionSection>
        ) : null}

        <MotionSection id="hot-issues">
          <SectionHeader>
            <SectionMeta>
              <SectionTitleRow>
                <SectionTitle>오늘의 핫이슈</SectionTitle>
                {!issuesQuery.isLoading && issues.length > 0 ? (
                  <SectionCount>{issues.length}건</SectionCount>
                ) : null}
              </SectionTitleRow>
            </SectionMeta>
            {issues.length > 0 ? (
              <BalanceToggle
                type="button"
                $active={balanceMode}
                onClick={() => {
                  const next = !balanceMode;
                  setBalanceMode(next);
                  localStorage.setItem("balance-mode", next ? "1" : "0");
                }}
                title={balanceMode ? "균형 모드 끄기" : "반대 입장 먼저 보기"}
              >
                <SlidersHorizontal size={13} />
                균형 모드
                {balanceMode && userLean ? (
                  <BalanceBadge>
                    {userLean === "progressive" ? "보수↑" : "진보↑"}
                  </BalanceBadge>
                ) : null}
              </BalanceToggle>
            ) : null}
          </SectionHeader>

          {showFirstRunGuide ? (
            <FirstRunGuide>
              <FirstRunTitle>처음 오셨나요?</FirstRunTitle>
              <FirstRunSteps>
                <FirstRunStep>
                  <FirstRunNum>1</FirstRunNum>
                  <FirstRunText>이슈를 눌러 <strong>진보·보수 입장 비교</strong></FirstRunText>
                </FirstRunStep>
                <FirstRunStep>
                  <FirstRunNum>2</FirstRunNum>
                  <FirstRunText>더 설득력 있는 쪽에 <strong>투표</strong></FirstRunText>
                </FirstRunStep>
                <FirstRunStep>
                  <FirstRunNum>3</FirstRunNum>
                  <FirstRunText><strong>AI 배틀</strong>로 더 깊이 파고들기</FirstRunText>
                </FirstRunStep>
              </FirstRunSteps>
            </FirstRunGuide>
          ) : null}

          <IssueLayout>
            {issuesQuery.isLoading ? (
              <IssueSkeletonList aria-busy="true">
                {[0, 1, 2].map((item) => (
                  <IssueSkeletonCard key={item}>
                    <SkeletonLine $w={item === 0 ? "74%" : "58%"} />
                    <SkeletonLine $w="92%" $small />
                    <SkeletonLine $w="64%" $small />
                    <IssueSkeletonActions>
                      <SkeletonPill />
                      <SkeletonPill />
                      <SkeletonPill />
                    </IssueSkeletonActions>
                  </IssueSkeletonCard>
                ))}
              </IssueSkeletonList>
            ) : issuesQuery.isError ? (
              <EmptyCard>
                <EmptyCardTitle>핫이슈를 불러오지 못했어요.</EmptyCardTitle>
                <EmptyCardText>잠시 후 다시 시도해 주세요.</EmptyCardText>
                <RetryButton
                  type="button"
                  onClick={() => {
                    void issuesQuery.refetch();
                  }}
                >
                  다시 시도
                </RetryButton>
              </EmptyCard>
            ) : issues.length > 0 ? (
              issues.map((issue) => (
                <IssueCard
                  key={issue.id}
                  issue={issue}
                  isExpanded={expandedIssueId === issue.id}
                  showConservativeFirst={showConservativeFirst}
                  followedNames={followedNames}
                  isVoting={
                    voteMutation.isPending &&
                    voteMutation.variables?.issueId === issue.id
                  }
                  onToggleExpand={(id) =>
                    setExpandedIssueId((current) => (current === id ? null : id))
                  }
                  onVote={(issueId, stance) => voteMutation.mutate({ issueId, stance })}
                />
              ))
            ) : (
              <EmptyCard>
                <EmptyCardTitle>오늘은 아직 핫이슈가 없어요.</EmptyCardTitle>
                <EmptyCardText>
                  최신 법안을 수집 중이에요. 잠시 뒤 다시 들러주세요.
                </EmptyCardText>
              </EmptyCard>
            )}
          </IssueLayout>
        </MotionSection>

        <MotionSection id="hot-polls">
          <SectionHeader>
            <SectionMeta>
              <SectionTitleRow>
                <SectionTitle>민심투표</SectionTitle>
              </SectionTitleRow>
            </SectionMeta>
            <SectionMoreLink href="/community">더 보기</SectionMoreLink>
          </SectionHeader>

          {pollsQuery.isLoading ? (
            <PollPreviewList aria-busy="true">
              {[0, 1, 2].map((item) => (
                <PollPreviewSkeleton key={item}>
                  <SkeletonLine $w={item === 1 ? "88%" : "70%"} />
                  <SkeletonLine $w="42%" $small />
                </PollPreviewSkeleton>
              ))}
            </PollPreviewList>
          ) : hotPolls.length === 0 ? (
            <EmptyCard>
              <EmptyCardTitle>아직 진행 중인 투표가 없어요.</EmptyCardTitle>
              <EmptyCardText>커뮤니티에서 첫 번째 투표를 만들어보세요.</EmptyCardText>
            </EmptyCard>
          ) : (
            <PollPreviewList>
              {hotPolls.map((poll) => {
                const expiresAt = new Date(poll.expires_at).getTime();
                const msLeft = expiresAt - now;
                const hoursLeft = Math.max(0, Math.floor(msLeft / 3_600_000));
                const daysLeft = Math.floor(hoursLeft / 24);
                const timeLabel =
                  msLeft <= 0
                    ? "마감"
                    : daysLeft >= 1
                    ? `${daysLeft}일 남음`
                    : `${hoursLeft}시간 남음`;
                const expired = msLeft <= 0;
                return (
                  <PollPreviewCard key={poll.id} href={`/community/polls/${poll.id}`}>
                    <PollPreviewQuestion>{poll.question}</PollPreviewQuestion>
                    <PollPreviewMeta>
                      <PollPreviewVotes>{poll.total_count.toLocaleString("ko-KR")}명 참여</PollPreviewVotes>
                      <PollPreviewTime $expired={expired}>{timeLabel}</PollPreviewTime>
                    </PollPreviewMeta>
                  </PollPreviewCard>
                );
              })}
            </PollPreviewList>
          )}
        </MotionSection>
      </Main>
    </Page>
  );
}

/* ── Shared styled components ───────────────────────────── */

const Page = styled.main`
  min-height: 100vh;
  padding-bottom: 80px;
  background: #ffffff;
  color: #191f28;

  @media (max-width: 768px) {
    padding-bottom: 56px;
  }
`;

const Main = styled.div`
  display: grid;
  width: min(100%, 720px);
  gap: 0;
  margin: 0 auto;
  padding: 32px 24px 0;

  @media (max-width: 768px) {
    padding: 24px 20px 0;
  }
`;

const MotionIntro = styled.div`
  display: grid;
  gap: 0;
  padding-bottom: 40px;
  animation: fadeIn 200ms ease-out both;

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const IntroCopy = styled.div`
  display: grid;
  gap: 8px;
`;

const IntroEyebrow = styled.div`
  color: #8b95a1;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: -0.02em;
`;

const IntroTitle = styled.h1`
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  line-height: 1.4;
  letter-spacing: -0.03em;
  color: #191f28;
  word-break: keep-all;
`;

const IntroText = styled.p`
  margin: 0;
  color: #4e5968;
  font-size: 16px;
  font-weight: 400;
  line-height: 1.6;
  word-break: keep-all;
`;

const IntroActions = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
  margin-top: 8px;
`;

const PrimaryActionLink = styled(Link)`
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0 16px;
  border-radius: 8px;
  color: #ffffff;
  background: #191f28;
  font-size: 14px;
  font-weight: 600;
  transition: opacity 140ms cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    opacity: 0.86;
  }
`;

const PrimaryActionScroll = styled.button`
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0 16px;
  border-radius: 8px;
  color: #ffffff;
  background: #191f28;
  border: 0;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: opacity 140ms cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    opacity: 0.86;
  }
`;

const MotionSection = styled.section`
  display: grid;
  gap: 0;
  padding-top: 40px;
  animation: fadeIn 200ms ease-out both;

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }

  @media (max-width: 768px) {
    padding-top: 32px;
  }
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 0;
  border-top: 1px solid #e5e7eb;
  margin-bottom: 4px;

  @media (max-width: 768px) {
    align-items: flex-start;
    flex-direction: column;
    gap: 8px;
  }
`;

const SectionMeta = styled.div`
  display: grid;
  gap: 4px;
`;

const SectionTitleRow = styled.div`
  display: inline-flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 10px;
`;

const SectionTitle = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.4;
  letter-spacing: -0.03em;
  color: #191f28;
  word-break: keep-all;
`;

const SectionSubtle = styled.span`
  color: #8b95a1;
  font-size: 14px;
  font-weight: 500;
`;

const SectionCount = styled.span`
  color: #4e5968;
  font-size: 14px;
  font-weight: 600;
`;

const PoliticianList = styled.div`
  display: grid;
  gap: 0;
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

const SkeletonCircle = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  ${shimmer}
`;

const SkeletonStack = styled.div`
  display: grid;
  gap: 8px;
  align-content: start;
  min-width: 0;
`;

const SkeletonLine = styled.div<{ $w: string; $small?: boolean }>`
  width: ${({ $w }) => $w};
  height: ${({ $small }) => ($small ? 13 : 16)}px;
  border-radius: 4px;
  ${shimmer}
`;

const PoliticianSkeletonRow = styled.div`
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr);
  gap: 12px;
  align-items: start;
  padding: 16px 0;
  border-bottom: 1px solid #f2f4f6;
`;

const EmptyCard = styled.div`
  display: grid;
  gap: 8px;
  padding: 32px 0;
  color: #8b95a1;
`;

const EmptyCardTitle = styled.div`
  color: #191f28;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: -0.02em;
`;

const EmptyCardText = styled.p`
  margin: 0;
  color: #8b95a1;
  font-size: 14px;
  line-height: 1.7;
  word-break: keep-all;
`;

const RetryButton = styled.button`
  display: inline-flex;
  width: fit-content;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  border-radius: 8px;
  color: #ffffff;
  background: #191f28;
  border: 0;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 8px;
  transition: opacity 140ms cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    opacity: 0.86;
  }
`;

const IssueLayout = styled.div`
  display: grid;
  gap: 0;
`;

const IssueSkeletonList = styled.div`
  display: grid;
  gap: 12px;
`;

const IssueSkeletonCard = styled.div`
  display: grid;
  gap: 10px;
  padding: 18px 0;
  border-bottom: 1px solid #f2f4f6;
`;

const IssueSkeletonActions = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  padding-top: 4px;
`;

const SkeletonPill = styled.div`
  width: 86px;
  height: 34px;
  border-radius: 9999px;
  ${shimmer}
`;

const FirstRunGuide = styled.div`
  display: grid;
  gap: 12px;
  padding: 16px 20px;
  border-radius: 10px;
  background: #f9fafb;
  border: 1px solid #e5e8eb;
  margin-bottom: 4px;
`;

const FirstRunTitle = styled.div`
  color: #8b95a1;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
`;

const FirstRunSteps = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px 20px;
`;

const FirstRunStep = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const FirstRunNum = styled.div`
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #e5e8eb;
  color: #4e5968;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
`;

const FirstRunText = styled.span`
  color: #4e5968;
  font-size: 13px;
  font-weight: 400;

  strong {
    color: #191f28;
    font-weight: 600;
  }
`;

const BalanceToggle = styled.button<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border-radius: 9999px;
  border: 1px solid ${({ $active }) => ($active ? "#3182f6" : "#e5e8eb")};
  background: ${({ $active }) => ($active ? "#e8f3ff" : "transparent")};
  color: ${({ $active }) => ($active ? "#3182f6" : "#8b95a1")};
  font-size: 12px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 150ms;

  &:hover {
    border-color: #3182f6;
    color: #3182f6;
  }
`;

const StreakChip = styled.div`
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 9999px;
  background: #e8f3ff;
  color: #3182f6;
  font-size: 12px;
  font-weight: 600;
  width: fit-content;
`;

const BalanceBadge = styled.span`
  font-size: 10px;
  font-weight: 700;
  background: #3182f6;
  color: #fff;
  border-radius: 4px;
  padding: 1px 4px;
  line-height: 1.4;
`;

const SectionMoreLink = styled(Link)`
  color: #8b95a1;
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap;
  transition: color 150ms;

  &:hover {
    color: #3182f6;
  }
`;

const PollPreviewList = styled.div`
  display: grid;
  gap: 0;
`;

const PollPreviewSkeleton = styled.div`
  display: grid;
  gap: 8px;
  padding: 14px 0;
  border-bottom: 1px solid #f2f4f6;

  &:last-child {
    border-bottom: none;
  }
`;

const PollPreviewCard = styled(Link)`
  display: grid;
  gap: 6px;
  padding: 14px 0;
  border-bottom: 1px solid #f2f4f6;
  text-decoration: none;

  &:last-child {
    border-bottom: none;
  }

  &:hover > * {
    color: #3182f6;
  }
`;

const PollPreviewQuestion = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #191f28;
  word-break: keep-all;
  line-height: 1.5;
  transition: color 150ms;
`;

const PollPreviewMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const PollPreviewVotes = styled.span`
  font-size: 12px;
  color: #8b95a1;
  font-weight: 400;
`;

const PollPreviewTime = styled.span<{ $expired: boolean }>`
  font-size: 12px;
  font-weight: 600;
  color: ${({ $expired }) => ($expired ? "#b0b8c1" : "#3182f6")};
`;

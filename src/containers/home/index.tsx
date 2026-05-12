"use client";

import styled from "@emotion/styled";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, ChevronDown, ExternalLink, MapPin, Search, SlidersHorizontal, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Session } from "next-auth";
import { AppHeader } from "@/components/app-header";
import { useIssues } from "@/hooks/useIssues";
import type { PoliticianDetail } from "@/lib/assembly";
import { getPartyPresentation } from "@/lib/parties";
import type { HotIssue, HotIssuesResponse, IssueVoteStance } from "@/types/issue";
import type { SearchResponse } from "@/app/api/search/route";

type HomeContainerProps = {
  session: Session;
};

type UserProfileResponse = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  district: string | null;
  hasPoliticalProfile: boolean;
};

type LocalPolitician = {
  id: string;
  name: string;
  party: string;
  district: string;
  committee: string | null;
  reelection: string | null;
  office: string | null;
  image: string | null;
};

type LocalPoliticiansResponse = {
  district: string | null;
  politicians: LocalPolitician[];
};

async function fetchJson<T>(url: string) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}`);
  }

  return (await response.json()) as T;
}

function getProfileInitial(name: string | null, email: string | null) {
  return (name?.trim()?.[0] ?? email?.trim()?.[0] ?? "유").toUpperCase();
}

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

function getIssueLink(issue: HotIssue) {
  const searchParams = new URLSearchParams();

  if (issue.id) {
    searchParams.set("issueId", issue.id);
  }

  if (issue.bill_id) {
    searchParams.set("billId", issue.bill_id);
  }

  return `/arena?${searchParams.toString()}`;
}

function getIssueMetaLabel(issue: HotIssue) {
  if (issue.published_at) {
    return new Intl.DateTimeFormat("ko-KR", {
      month: "numeric",
      day: "numeric",
    }).format(new Date(issue.published_at));
  }

  if (issue.bill_id) {
    return issue.bill_id;
  }

  return "국회 발의안";
}

function getPartyTone(party: string) {
  if (party.includes("국민의힘")) {
    return "red";
  }

  if (party.includes("더불어민주") || party.includes("민주")) {
    return "blue";
  }

  return "neutral";
}

type VoteOption = {
  stance: IssueVoteStance;
  label: string;
  barLabel: string;
  color: string;
  tint: string;
};

const VOTE_OPTIONS: VoteOption[] = [
  { stance: "progressive", label: "진보 지지", barLabel: "진보", color: "#3182f6", tint: "#e8f3ff" },
  { stance: "neutral",     label: "모르겠음",  barLabel: "모름", color: "#8b95a1", tint: "#f2f4f6" },
  { stance: "conservative",label: "보수 지지", barLabel: "보수", color: "#e5484d", tint: "#fef2f2" },
];

function getVotePercent(count: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((count / total) * 100);
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
  const [balanceMode, setBalanceMode] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("balance-mode") === "1";
  });
  const searchInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const voteMutation = useMutation({
    mutationFn: async ({ issueId, stance }: { issueId: string; stance: IssueVoteStance }) => {
      const res = await fetch(`/api/issues/${issueId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stance }),
      });
      if (!res.ok) throw new Error("투표에 실패했어요");
      return res.json() as Promise<{ vote_counts: HotIssue["vote_counts"]; user_vote: IssueVoteStance | null }>;
    },
    onMutate: async ({ issueId, stance }) => {
      await queryClient.cancelQueries({ queryKey: ["issues"] });
      const previous = queryClient.getQueryData<HotIssuesResponse>(["issues"]);
      queryClient.setQueryData<HotIssuesResponse>(["issues"], (old) => {
        if (!old) return old;
        return {
          issues: old.issues.map((issue) => {
            if (issue.id !== issueId) return issue;
            const prev = issue.user_vote;
            const isToggle = prev === stance;
            const newVote = isToggle ? null : stance;
            const counts = { ...issue.vote_counts };
            if (prev) counts[prev] = Math.max(0, counts[prev] - 1);
            if (newVote) counts[newVote]++;
            counts.total = counts.progressive + counts.conservative + counts.neutral;
            return { ...issue, user_vote: newVote, vote_counts: counts };
          }),
        };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData<HotIssuesResponse>(["issues"], context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["issues"] });
    },
  });
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 350);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const searchResultsQuery = useQuery({
    queryKey: ["search", debouncedQuery],
    enabled: debouncedQuery.length >= 2,
    queryFn: () => fetchJson<SearchResponse>(`/api/search?q=${encodeURIComponent(debouncedQuery)}`),
  });

  const profileQuery = useQuery({
    queryKey: ["user-profile"],
    queryFn: () => fetchJson<UserProfileResponse>("/api/user/profile"),
    staleTime: 1000 * 60 * 10,
  });
  const issuesQuery = useIssues();

  const displayName = profileQuery.data?.name ?? session.user.name ?? null;
  const displayEmail = profileQuery.data?.email ?? session.user.email ?? null;
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

  const politiciansQuery = useQuery({
    queryKey: ["local-politicians", district],
    enabled: Boolean(district),
    queryFn: () => fetchJson<LocalPoliticiansResponse>("/api/politicians/local"),
    staleTime: 1000 * 60 * 60 * 12,
  });
  const politicianDetailQuery = useQuery({
    queryKey: ["politician-detail", expandedPoliticianId],
    enabled: Boolean(expandedPoliticianId),
    queryFn: () => fetchJson<PoliticianDetail>(`/api/politicians/${expandedPoliticianId}`),
    staleTime: 1000 * 60 * 60 * 12,
  });

  const followedNamesQuery = useQuery({
    queryKey: ["followed-politician-names"],
    queryFn: () => fetchJson<{ names: string[] }>("/api/politicians/follows").then((r) => r.names),
    staleTime: 60_000,
  });
  const followedNames = new Set(followedNamesQuery.data ?? []);

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

        <SearchBar role="search">
          <SearchIcon aria-hidden="true"><Search size={16} /></SearchIcon>
          <SearchInput
            ref={searchInputRef}
            type="search"
            placeholder="이슈 또는 정치인 검색"
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            aria-label="검색"
          />
          {searchQuery ? (
            <SearchClear
              type="button"
              onClick={() => { setSearchQuery(""); setDebouncedQuery(""); }}
              aria-label="검색 초기화"
            >
              <X size={14} />
            </SearchClear>
          ) : null}
        </SearchBar>

        {isSearchActive ? (
          <SearchResults>
            {searchResultsQuery.isLoading ? (
              <SearchEmpty>검색 중...</SearchEmpty>
            ) : (
              <>
                <SearchSection>
                  <SearchSectionTitle>이슈</SearchSectionTitle>
                  {(searchResultsQuery.data?.issues.length ?? 0) === 0 ? (
                    <SearchEmpty>이슈 결과가 없어요.</SearchEmpty>
                  ) : (
                    searchResultsQuery.data?.issues.map((issue) => (
                      <SearchIssueRow key={issue.id} href={`/arena?issueId=${issue.id}`}>
                        <SearchIssueTitle>{issue.title}</SearchIssueTitle>
                        <SearchIssueMeta>{issue.summary}</SearchIssueMeta>
                      </SearchIssueRow>
                    ))
                  )}
                </SearchSection>
                <SearchSection>
                  <SearchSectionTitle>정치인</SearchSectionTitle>
                  {(searchResultsQuery.data?.politicians.length ?? 0) === 0 ? (
                    <SearchEmpty>정치인 결과가 없어요.</SearchEmpty>
                  ) : (
                    searchResultsQuery.data?.politicians.map((p) => (
                      <SearchPoliticianRow key={p.id} href={`/politicians/${p.id}`}>
                        <SearchPoliticianName>{p.name}</SearchPoliticianName>
                        <SearchPoliticianMeta>
                          {[p.party, p.district].filter(Boolean).join(" · ")}
                        </SearchPoliticianMeta>
                      </SearchPoliticianRow>
                    ))
                  )}
                </SearchSection>
              </>
            )}
          </SearchResults>
        ) : null}

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
              <EmptyCard>의원 정보를 불러오는 중이에요.</EmptyCard>
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
                {politicians.map((politician) => {
                  const partyTone = getPartyTone(politician.party);
                  const party = getPartyPresentation(politician.party);

                  return (
                    <PoliticianRow key={politician.id}>
                      <PoliticianImageWrap>
                        {politician.image ? (
                          <PoliticianImage src={politician.image} alt={politician.name} width={32} height={32} />
                        ) : (
                          <PoliticianFallback>
                            {politician.name.slice(0, 1)}
                          </PoliticianFallback>
                        )}
                      </PoliticianImageWrap>

                      <PoliticianBody>
                        <PoliticianInline>
                          <PoliticianName>{politician.name}</PoliticianName>
                          <DotDivider aria-hidden="true">·</DotDivider>
                          <PartyInline>
                            {party.src ? (
                              <PartyLogo
                                src={party.src}
                                alt={party.label}
                                width={40}
                                height={14}
                                unoptimized
                              />
                            ) : (
                              <PartyTextBadge $tone={partyTone}>{party.label}</PartyTextBadge>
                            )}
                          </PartyInline>
                          <DotDivider aria-hidden="true">·</DotDivider>
                          <PoliticianMeta>
                            <MapPin size={14} />
                            <span>{politician.district}</span>
                          </PoliticianMeta>
                          {politician.reelection ? (
                            <>
                              <DotDivider aria-hidden="true">·</DotDivider>
                              <PoliticianTag>{politician.reelection}</PoliticianTag>
                            </>
                          ) : null}
                        </PoliticianInline>

                        {politician.committee ? (
                          <PoliticianSubtext>{politician.committee}</PoliticianSubtext>
                        ) : null}

                        <PoliticianActions>
                          <InlineActionButton
                            type="button"
                            onClick={() => {
                              setExpandedPoliticianId((current) =>
                                current === politician.id ? null : politician.id,
                              );
                            }}
                          >
                            {expandedPoliticianId === politician.id
                              ? "상세 닫기"
                              : "홈에서 바로 보기"}
                            <ArrowRight size={14} />
                          </InlineActionButton>
                          <DetailLink href={`/politicians/${politician.id}`}>
                            상세 페이지
                            <ArrowRight size={14} />
                          </DetailLink>
                        </PoliticianActions>

                        {expandedPoliticianId === politician.id ? (
                          <PoliticianInlineDetail>
                            {politicianDetailQuery.isLoading ? (
                              <InlineDetailText>
                                상세 정보를 불러오는 중이에요.
                              </InlineDetailText>
                            ) : politicianDetailQuery.isError ? (
                              <InlineDetailText>
                                상세 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.
                              </InlineDetailText>
                            ) : politicianDetailQuery.data ? (
                              <>
                                <InlineDetailGrid>
                                  <InlineDetailItem>
                                    <InlineDetailLabel>직책</InlineDetailLabel>
                                    <InlineDetailValue>
                                      {politicianDetailQuery.data.jobTitle ?? "-"}
                                    </InlineDetailValue>
                                  </InlineDetailItem>
                                  <InlineDetailItem>
                                    <InlineDetailLabel>의원회관</InlineDetailLabel>
                                    <InlineDetailValue>
                                      {politicianDetailQuery.data.office ?? "-"}
                                    </InlineDetailValue>
                                  </InlineDetailItem>
                                  <InlineDetailItem>
                                    <InlineDetailLabel>전화</InlineDetailLabel>
                                    <InlineDetailValue>
                                      {politicianDetailQuery.data.phone ?? "-"}
                                    </InlineDetailValue>
                                  </InlineDetailItem>
                                  <InlineDetailItem>
                                    <InlineDetailLabel>이메일</InlineDetailLabel>
                                    <InlineDetailValue>
                                      {politicianDetailQuery.data.email ?? "-"}
                                    </InlineDetailValue>
                                  </InlineDetailItem>
                                </InlineDetailGrid>

                                {politicianDetailQuery.data.homepage ? (
                                  <InlineExternalLink
                                    href={politicianDetailQuery.data.homepage}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    홈페이지 열기
                                    <ExternalLink size={14} />
                                  </InlineExternalLink>
                                ) : null}
                              </>
                            ) : null}
                          </PoliticianInlineDetail>
                        ) : null}
                      </PoliticianBody>
                    </PoliticianRow>
                  );
                })}
              </PoliticianList>
            ) : (
              <EmptyCard>
                <EmptyCardTitle>이 지역구로 등록된 의원이 없어요.</EmptyCardTitle>
                <EmptyCardText>
                  온보딩에서 지역구를 다시 설정해 주세요.
                </EmptyCardText>
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
              <EmptyCard>핫이슈를 불러오는 중이에요.</EmptyCard>
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
              issues.map((issue) => {
                const isExpanded = expandedIssueId === issue.id;

                return (
                  <IssueItem key={issue.id}>
                    <IssueRow>
                      <IssueRowMeta>{getIssueMetaLabel(issue)}</IssueRowMeta>
                      <IssueRowBody>
                        <IssueTitle>{issue.title}</IssueTitle>
                        <IssueSummary>{issue.summary}</IssueSummary>
                        {(issue.committee ?? issue.proposer ?? issue.bill_status) ? (
                          <IssueBodyMeta>
                            {issue.bill_status ? (
                              <BillStatusBadge $status={issue.bill_status}>
                                {issue.bill_status}
                              </BillStatusBadge>
                            ) : null}
                            {issue.committee ? (
                              <IssueMetaChip>{issue.committee}</IssueMetaChip>
                            ) : null}
                            {issue.proposer ? (
                              <IssueMetaChip
                                $dim={!followedNames.has(issue.proposer)}
                                $followed={followedNames.has(issue.proposer)}
                              >
                                {followedNames.has(issue.proposer) ? "★ " : ""}{issue.proposer}
                              </IssueMetaChip>
                            ) : null}
                          </IssueBodyMeta>
                        ) : null}
                      </IssueRowBody>
                      <IssueActions>
                        <IssueToggleButton
                          type="button"
                          onClick={() => {
                            setExpandedIssueId((current) =>
                              current === issue.id ? null : issue.id,
                            );
                          }}
                          aria-expanded={isExpanded}
                        >
                          입장 비교
                          <IssueChevron $expanded={isExpanded}>
                            <ChevronDown size={15} />
                          </IssueChevron>
                        </IssueToggleButton>
                        <IssueTopLink href={getIssueLink(issue)}>
                          AI 배틀
                          <ArrowRight size={15} />
                        </IssueTopLink>
                      </IssueActions>
                    </IssueRow>

                    {isExpanded ? (
                      <IssueExpanded>
                        <IssueComparisonList>
                          {(showConservativeFirst ? [
                            { tone: "red" as const, label: "보수", text: issue.conservative },
                            { tone: "blue" as const, label: "진보", text: issue.progressive },
                          ] : [
                            { tone: "blue" as const, label: "진보", text: issue.progressive },
                            { tone: "red" as const, label: "보수", text: issue.conservative },
                          ]).map(({ tone, label, text }) => (
                            <IssueComparisonRow key={label}>
                              <IssueLabel $tone={tone}>{label}</IssueLabel>
                              <IssueText>{text}</IssueText>
                            </IssueComparisonRow>
                          ))}
                        </IssueComparisonList>
                        <IssueVoteSection>
                          <IssueVoteLabel>이 이슈에 대한 입장은?</IssueVoteLabel>
                          <IssueVoteButtons role="group" aria-label="입장 선택">
                            {VOTE_OPTIONS.map(({ stance, label, color, tint }) => {
                              const isSelected = issue.user_vote === stance;
                              const isThisVoting =
                                voteMutation.isPending &&
                                voteMutation.variables?.issueId === issue.id;
                              return (
                                <VoteButton
                                  key={stance}
                                  type="button"
                                  $color={color}
                                  $tint={tint}
                                  $selected={isSelected}
                                  $loading={isThisVoting}
                                  onClick={() => {
                                    if (!isThisVoting) {
                                      voteMutation.mutate({ issueId: issue.id, stance });
                                    }
                                  }}
                                  disabled={isThisVoting}
                                  aria-pressed={isSelected}
                                >
                                  {label}
                                </VoteButton>
                              );
                            })}
                          </IssueVoteButtons>
                          {issue.vote_counts.total > 0 ? (
                            <IssueVoteBars>
                              {VOTE_OPTIONS.map(({ stance, barLabel, color, tint }) => {
                                const pct = getVotePercent(
                                  issue.vote_counts[stance],
                                  issue.vote_counts.total,
                                );
                                const isMyVote = issue.user_vote === stance;
                                return (
                                  <VoteBarRow key={stance}>
                                    <VoteBarLabel $color={isMyVote ? color : "#b0b8c1"}>
                                      {barLabel}
                                    </VoteBarLabel>
                                    <VoteBarTrack $tint={tint}>
                                      <VoteBarFill $color={color} $pct={pct} />
                                    </VoteBarTrack>
                                    <VoteBarPct $active={isMyVote}>{pct}%</VoteBarPct>
                                  </VoteBarRow>
                                );
                              })}
                              <VoteTotal>
                                총 {issue.vote_counts.total.toLocaleString()}명 참여
                              </VoteTotal>
                            </IssueVoteBars>
                          ) : null}
                          {issue.user_vote ? (
                            <BattleCTA href={`/arena/${issue.id}/battle`}>
                              <BattleCTAIcon aria-hidden="true">⚔</BattleCTAIcon>
                              AI 배틀로 더 깊이 파고들기
                            </BattleCTA>
                          ) : null}
                        </IssueVoteSection>
                      </IssueExpanded>
                    ) : null}
                  </IssueItem>
                );
              })
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

      </Main>
    </Page>
  );
}

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

const PoliticianImageWrap = styled.div`
  width: 32px;
  height: 32px;
  overflow: hidden;
  border-radius: 999px;
  background: #f2f4f6;
  flex-shrink: 0;
`;

const PoliticianImage = styled(Image)`
  object-fit: cover;
  object-position: center top;
`;

const PoliticianFallback = styled.div`
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  color: #4e5968;
  font-size: 14px;
  font-weight: 700;
`;

const PoliticianRow = styled.article`
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr);
  gap: 12px;
  align-items: start;
  padding: 16px 0;
  border-bottom: 1px solid #f2f4f6;

  &:last-of-type {
    border-bottom: 0;
  }
`;

const PoliticianBody = styled.div`
  display: grid;
  gap: 8px;
  min-width: 0;
`;

const PoliticianInline = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
`;

const PoliticianName = styled.div`
  color: #191f28;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: -0.03em;
`;

const DotDivider = styled.span`
  color: #c5cad1;
  font-size: 14px;
  line-height: 1;
`;

const PartyTextBadge = styled.div<{ $tone: "blue" | "red" | "neutral" }>`
  display: inline-flex;
  color: ${({ $tone }) =>
    $tone === "blue" ? "#3182f6" : $tone === "red" ? "#e5484d" : "#8b95a1"};
  font-size: 14px;
  font-weight: 600;
`;

const PartyInline = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
`;

const PartyLogo = styled(Image)`
  display: block;
  width: auto;
  height: 14px;
  flex-shrink: 0;
`;

const PoliticianMeta = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #8b95a1;
  font-size: 14px;
  font-weight: 400;
  min-width: 0;

  svg {
    flex-shrink: 0;
  }
`;

const PoliticianTag = styled.div`
  display: inline-flex;
  color: #8b95a1;
  font-size: 14px;
  font-weight: 400;
`;

const PoliticianSubtext = styled.div`
  color: #8b95a1;
  font-size: 14px;
  line-height: 1.6;
  word-break: keep-all;
`;

const DetailLink = styled(Link)`
  display: inline-flex;
  width: fit-content;
  align-items: center;
  gap: 4px;
  color: #3182f6;
  font-size: 14px;
  font-weight: 500;
  transition: opacity 120ms cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    opacity: 0.72;
  }
`;

const PoliticianActions = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
`;

const InlineActionButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-height: 44px;
  padding: 0 2px;
  border: 0;
  color: #3182f6;
  background: transparent;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 120ms cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    opacity: 0.72;
  }
`;

const PoliticianInlineDetail = styled.div`
  display: grid;
  gap: 16px;
  padding: 16px 0 4px;
  border-top: 1px solid #e5e7eb;
`;

const InlineDetailGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 24px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const InlineDetailItem = styled.div`
  display: grid;
  gap: 4px;
`;

const InlineDetailLabel = styled.div`
  color: #8b95a1;
  font-size: 14px;
  font-weight: 600;
`;

const InlineDetailValue = styled.div`
  color: #191f28;
  font-size: 16px;
  font-weight: 400;
  line-height: 1.5;
  word-break: break-word;
`;

const InlineDetailText = styled.p`
  margin: 0;
  color: #8b95a1;
  font-size: 14px;
  line-height: 1.6;
`;

const InlineExternalLink = styled.a`
  display: inline-flex;
  width: fit-content;
  align-items: center;
  gap: 6px;
  color: #191f28;
  font-size: 14px;
  font-weight: 600;
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

const IssueItem = styled.div`
  display: grid;
  border-bottom: 1px solid #f2f4f6;

  &:last-of-type {
    border-bottom: 0;
  }
`;

const IssueRow = styled.article`
  display: grid;
  grid-template-columns: 80px minmax(0, 1fr) auto;
  gap: 16px;
  align-items: start;
  padding: 16px 0;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 8px;
  }
`;

const IssueRowMeta = styled.div`
  color: #8b95a1;
  font-size: 14px;
  font-weight: 500;
  padding-top: 4px;
`;

const IssueRowBody = styled.div`
  display: grid;
  gap: 6px;
`;

const IssueTitle = styled.h3`
  margin: 0;
  color: #191f28;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: -0.02em;
  word-break: keep-all;
`;

const IssueSummary = styled.p`
  margin: 0;
  color: #4e5968;
  font-size: 14px;
  line-height: 1.7;
  word-break: keep-all;
`;

const IssueBodyMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 2px;
`;

const BillStatusBadge = styled.span<{ $status: string }>`
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  line-height: 18px;
  background: ${({ $status }) =>
    $status === "통과" ? "#e8f3ff" : $status === "폐기" ? "#fef2f2" : "#f2f4f6"};
  color: ${({ $status }) =>
    $status === "통과" ? "#3182f6" : $status === "폐기" ? "#e5484d" : "#6b7684"};
`;

const IssueMetaChip = styled.span<{ $dim?: boolean; $followed?: boolean }>`
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  background: ${({ $followed }) => ($followed ? "#e8f3ff" : "#f2f4f6")};
  color: ${({ $followed, $dim }) => ($followed ? "#3182f6" : $dim ? "#8b95a1" : "#6b7684")};
  font-size: 12px;
  font-weight: ${({ $followed }) => ($followed ? 600 : 500)};
  line-height: 18px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
`;

const IssueActions = styled.div`
  display: grid;
  align-content: start;
  justify-items: end;
  gap: 12px;
  min-width: 108px;

  @media (max-width: 768px) {
    justify-items: start;
    min-width: 0;
    grid-auto-flow: column;
    gap: 16px;
  }
`;

const IssueToggleButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  padding: 0;
  color: #4e5968;
  background: transparent;
  border: 0;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: color 120ms cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    color: #191f28;
  }

  @media (max-width: 768px) {
    justify-content: flex-start;
  }
`;

const IssueChevron = styled.span<{ $expanded: boolean }>`
  display: inline-flex;
  svg {
    transform: rotate(${({ $expanded }) => ($expanded ? "180deg" : "0deg")});
    transition: transform 200ms cubic-bezier(0.16, 1, 0.3, 1);
  }
`;

const IssueTopLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  color: #191f28;
  font-size: 14px;
  font-weight: 600;
  transition: opacity 120ms cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    opacity: 0.6;
  }

  @media (max-width: 768px) {
    justify-content: flex-start;
  }
`;

const IssueComparisonList = styled.div`
  display: grid;
  gap: 0;
`;

const IssueComparisonRow = styled.div`
  display: grid;
  gap: 6px;
  padding: 12px 0;

  &:not(:last-of-type) {
    border-bottom: 1px solid #f2f4f6;
  }
`;

const IssueLabel = styled.div<{ $tone: "blue" | "red" }>`
  color: ${({ $tone }) => ($tone === "blue" ? "#3182f6" : "#e5484d")};
  font-size: 14px;
  font-weight: 700;
  letter-spacing: -0.01em;
`;

const IssueText = styled.p`
  margin: 0;
  color: #191f28;
  font-size: 16px;
  line-height: 1.7;
  word-break: keep-all;
`;

const IssueExpanded = styled.div`
  padding: 12px 0 16px 16px;
  margin-left: 96px;
  border-left: 1px solid #e5e7eb;

  @media (max-width: 768px) {
    margin-left: 0;
  }
`;

const IssueVoteSection = styled.div`
  display: grid;
  gap: 12px;
  padding-top: 16px;
  margin-top: 4px;
  border-top: 1px solid #f2f4f6;
`;

const IssueVoteLabel = styled.div`
  color: #8b95a1;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: -0.01em;
`;

const IssueVoteButtons = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
`;

const VoteButton = styled.button<{
  $color: string;
  $tint: string;
  $selected: boolean;
  $loading: boolean;
}>`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 36px;
  padding: 0 8px;
  border-radius: 8px;
  border: 1.5px solid ${({ $color, $selected }) => ($selected ? "transparent" : $color)};
  background: ${({ $color, $selected }) => ($selected ? $color : "transparent")};
  color: ${({ $color, $selected }) => ($selected ? "#ffffff" : $color)};
  font-size: 13px;
  font-weight: 600;
  letter-spacing: -0.01em;
  cursor: pointer;
  transition:
    background 150ms cubic-bezier(0.4, 0, 0.2, 1),
    color 150ms cubic-bezier(0.4, 0, 0.2, 1),
    border-color 150ms cubic-bezier(0.4, 0, 0.2, 1),
    opacity 150ms cubic-bezier(0.4, 0, 0.2, 1);
  opacity: ${({ $loading }) => ($loading ? 0.55 : 1)};

  &:hover:not(:disabled) {
    background: ${({ $color, $tint, $selected }) => ($selected ? $color : $tint)};
  }

  &:disabled {
    cursor: default;
  }
`;

const IssueVoteBars = styled.div`
  display: grid;
  gap: 8px;
`;

const VoteBarRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const VoteBarLabel = styled.span<{ $color: string }>`
  width: 28px;
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: ${({ $color }) => $color};
  transition: color 150ms cubic-bezier(0.4, 0, 0.2, 1);
`;

const VoteBarTrack = styled.div<{ $tint: string }>`
  flex: 1;
  height: 6px;
  border-radius: 99px;
  background: ${({ $tint }) => $tint};
  position: relative;
  overflow: hidden;
`;

const VoteBarFill = styled.div<{ $color: string; $pct: number }>`
  position: absolute;
  inset: 0;
  border-radius: 99px;
  background: ${({ $color }) => $color};
  transform-origin: left center;
  transform: scaleX(${({ $pct }) => $pct / 100});
  transition: transform 250ms cubic-bezier(0.4, 0, 0.2, 1);
`;

const VoteBarPct = styled.span<{ $active: boolean }>`
  width: 36px;
  flex-shrink: 0;
  text-align: right;
  font-size: 13px;
  font-weight: ${({ $active }) => ($active ? "700" : "400")};
  font-variant-numeric: tabular-nums;
  color: ${({ $active }) => ($active ? "#191f28" : "#8b95a1")};
  letter-spacing: -0.01em;
  transition: color 150ms cubic-bezier(0.4, 0, 0.2, 1);
`;

const VoteTotal = styled.div`
  font-size: 12px;
  font-weight: 400;
  color: #8b95a1;
  font-variant-numeric: tabular-nums;
  text-align: right;
  letter-spacing: -0.01em;
`;

const BattleCTA = styled(Link)`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
  padding: 12px 16px;
  border-radius: 8px;
  background: #191f28;
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  transition: opacity 140ms ease-out;

  &:hover {
    opacity: 0.88;
  }

  &:focus-visible {
    outline: 2px solid #3182f6;
    outline-offset: 2px;
  }
`;

const BattleCTAIcon = styled.span`
  font-size: 15px;
  line-height: 1;
`;

/* ── Search ───────────────────────────────────────────── */

const SearchBar = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  background: #f2f4f6;
  border-radius: 10px;
  padding: 0 14px;
  margin: 16px 0 4px;
  transition: box-shadow 150ms;

  &:focus-within {
    box-shadow: 0 0 0 2px #3182f6;
  }
`;

const SearchIcon = styled.span`
  color: #b0b8c1;
  display: flex;
  align-items: center;
  flex-shrink: 0;
`;

const SearchInput = styled.input`
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  padding: 12px 0;
  font-size: 14px;
  color: #191f28;
  font-family: inherit;

  &::placeholder {
    color: #b0b8c1;
  }

  &::-webkit-search-cancel-button {
    display: none;
  }
`;

const SearchClear = styled.button`
  background: none;
  border: none;
  padding: 12px 8px;
  cursor: pointer;
  color: #b0b8c1;
  display: flex;
  align-items: center;
  border-radius: 4px;

  &:hover {
    color: #6b7684;
  }
`;

const SearchResults = styled.div`
  display: grid;
  gap: 4px;
  padding: 8px 0 16px;
`;

const SearchSection = styled.div`
  display: grid;
`;

const SearchSectionTitle = styled.div`
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: #8b95a1;
  text-transform: uppercase;
  padding: 10px 0 6px;
`;

const SearchEmpty = styled.div`
  font-size: 13px;
  color: #b0b8c1;
  padding: 8px 0;
`;

const SearchIssueRow = styled(Link)`
  display: grid;
  gap: 2px;
  padding: 10px 12px;
  border-radius: 8px;
  text-decoration: none;

  &:hover {
    background: #f2f4f6;
  }
`;

const SearchIssueTitle = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: #191f28;
  word-break: keep-all;
`;

const SearchIssueMeta = styled.div`
  font-size: 12px;
  color: #8b95a1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const SearchPoliticianRow = styled(Link)`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  text-decoration: none;

  &:hover {
    background: #f2f4f6;
  }
`;

const SearchPoliticianName = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: #191f28;
`;

const SearchPoliticianMeta = styled.div`
  font-size: 12px;
  color: #8b95a1;
`;

/* ── Balance Mode ─────────────────────────────────────── */

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

const BalanceBadge = styled.span`
  font-size: 10px;
  font-weight: 700;
  background: #3182f6;
  color: #fff;
  border-radius: 4px;
  padding: 1px 4px;
  line-height: 1.4;
`;

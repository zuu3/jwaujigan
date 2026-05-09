"use client";

import styled from "@emotion/styled";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ChevronDown, ExternalLink, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { Session } from "next-auth";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { useIssues } from "@/hooks/useIssues";
import type { PoliticianDetail } from "@/lib/assembly";
import { getPartyPresentation } from "@/lib/parties";
import type { HotIssue } from "@/types/issue";

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

export function HomeContainer({ session }: HomeContainerProps) {
  const [expandedPoliticianId, setExpandedPoliticianId] = useState<string | null>(null);
  const [expandedIssueId, setExpandedIssueId] = useState<string | null>(null);
  const profileQuery = useQuery({
    queryKey: ["user-profile"],
    queryFn: () => fetchJson<UserProfileResponse>("/api/user/profile"),
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
  });
  const politicianDetailQuery = useQuery({
    queryKey: ["politician-detail", expandedPoliticianId],
    enabled: Boolean(expandedPoliticianId),
    queryFn: () => fetchJson<PoliticianDetail>(`/api/politicians/${expandedPoliticianId}`),
  });

  const politicians = politiciansQuery.data?.politicians ?? [];
  const issues = issuesQuery.data?.issues ?? [];

  const introTitle = needsOnboarding
    ? onboardingCopy.title
    : district
      ? `${district} 의원 정보와 오늘의 쟁점을 정리했어요.`
      : "오늘의 쟁점을 한눈에 정리했어요.";
  const introEyebrow = displayName ? `오늘, ${displayName}님` : "오늘";
  const introText = needsOnboarding ? onboardingCopy.description : null;

  const primaryAction = needsOnboarding
    ? { href: "/onboarding", label: onboardingCopy.action }
    : { href: "/arena", label: "AI 배틀 시작" };
  const secondaryAction = needsDistrict
    ? { href: "/onboarding", label: "지역구 설정" }
    : { href: "#local-politicians", label: "내 의원 보기" };

  return (
    <Page>
      <MotionHeader
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        <Brand href="/">좌우지간</Brand>

        <HeaderNav aria-label="홈 바로가기">
          <HeaderNavLink href="#hot-issues">핫이슈</HeaderNavLink>
          <HeaderNavLink href="#battle-banner">배틀</HeaderNavLink>
          <HeaderNavLink href="#local-politicians">정치인 찾기</HeaderNavLink>
        </HeaderNav>

        <HeaderActions>
          <ProfileInline>
            <Avatar aria-hidden="true">
              {displayImage ? (
                <AvatarImage src={displayImage} alt="" width={32} height={32} />
              ) : (
                getProfileInitial(displayName, displayEmail)
              )}
            </Avatar>
            <ProfileName>{displayName ?? "사용자"}</ProfileName>
          </ProfileInline>

          <MyPageLink href="/mypage">마이페이지</MyPageLink>
          <HeaderSignOutButton callbackUrl="/">로그아웃</HeaderSignOutButton>
        </HeaderActions>
      </MotionHeader>

      <Main>
        <MotionIntro
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <IntroCopy>
            <IntroEyebrow>{introEyebrow}</IntroEyebrow>
            <IntroTitle>{introTitle}</IntroTitle>
            {introText ? <IntroText>{introText}</IntroText> : null}
            <IntroActions>
              <PrimaryActionLink href={primaryAction.href}>
                {primaryAction.label}
                <ArrowRight size={16} />
              </PrimaryActionLink>
              <SecondaryActionLink href={secondaryAction.href}>
                {secondaryAction.label}
              </SecondaryActionLink>
            </IntroActions>
          </IntroCopy>

          <IntroStatsDivider />
          <IntroStats aria-label="홈 상태 요약">
            <StatItem>
              <StatLabel>지역구</StatLabel>
              <StatValue>{district ?? "미설정"}</StatValue>
            </StatItem>
            <StatItem>
              <StatLabel>성향 분석</StatLabel>
              <StatValue>{hasPoliticalProfile ? "완료" : "미완료"}</StatValue>
            </StatItem>
            <StatItem>
              <StatLabel>내 의원</StatLabel>
              <StatValue>
                {district ? `${politicians.length}명` : "설정 필요"}
              </StatValue>
            </StatItem>
            <StatItem>
              <StatLabel>핫이슈</StatLabel>
              <StatValue>{issues.length > 0 ? `${issues.length}건` : "수집 중"}</StatValue>
            </StatItem>
          </IntroStats>
        </MotionIntro>

        <MotionSection
          id="local-politicians"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <SectionHeader>
            <SectionMeta>
              <SectionTitleRow>
                <SectionTitle>내 지역구 의원</SectionTitle>
                <SectionSubtle>
                  {district ? district : "지역구 설정 필요"}
                </SectionSubtle>
              </SectionTitleRow>
            </SectionMeta>
            {needsOnboarding ? (
              <SectionHeaderAside>
                <CompactNoticeAction href="/onboarding">
                  {onboardingCopy.label}
                  <ArrowRight size={14} />
                </CompactNoticeAction>
              </SectionHeaderAside>
            ) : null}
          </SectionHeader>

          {district ? (
            politiciansQuery.isLoading ? (
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
                                onError={(event) => {
                                  event.currentTarget.style.display = "none";
                                }}
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
            )
          ) : (
            <DistrictPromptCard>
              <PromptTitle>{onboardingCopy.title}</PromptTitle>
              <PromptText>{onboardingCopy.description}</PromptText>
              <PromptLink href="/onboarding">지역구 설정</PromptLink>
            </DistrictPromptCard>
          )}
        </MotionSection>

        <MotionSection
          id="hot-issues"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <SectionHeader>
            <SectionMeta>
              <SectionTitleRow>
                <SectionTitle>오늘의 핫이슈</SectionTitle>
                {!issuesQuery.isLoading && issues.length > 0 ? (
                  <SectionCount>{issues.length}건</SectionCount>
                ) : null}
              </SectionTitleRow>
            </SectionMeta>
          </SectionHeader>

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
                          입장 보기
                          <IssueChevron $expanded={isExpanded}>
                            <ChevronDown size={15} />
                          </IssueChevron>
                        </IssueToggleButton>
                        <IssueTopLink href={getIssueLink(issue)}>
                          배틀 보기
                          <ArrowRight size={15} />
                        </IssueTopLink>
                      </IssueActions>
                    </IssueRow>

                    {isExpanded ? (
                      <IssueExpanded>
                        <IssueComparisonList>
                          <IssueComparisonRow>
                            <IssueLabel $tone="blue">진보</IssueLabel>
                            <IssueText>{issue.progressive}</IssueText>
                          </IssueComparisonRow>
                          <IssueComparisonRow>
                            <IssueLabel $tone="red">보수</IssueLabel>
                            <IssueText>{issue.conservative}</IssueText>
                          </IssueComparisonRow>
                        </IssueComparisonList>
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

        <MotionBattleBanner
          id="battle-banner"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <BannerCopy>
            <BannerEyebrow>AI 배틀</BannerEyebrow>
            <BannerTitle>같은 이슈, 두 시각으로 빠르게 비교해 보세요.</BannerTitle>
          </BannerCopy>

          <BannerLink href="/arena">
            배틀 시작하기
            <ArrowRight size={18} />
          </BannerLink>
        </MotionBattleBanner>
      </Main>
    </Page>
  );
}

const Page = styled.main`
  min-height: 100vh;
  padding: 24px 24px 80px;
  background: #ffffff;
  color: #191f28;

  @media (max-width: 768px) {
    padding: 20px 20px 56px;
  }
`;

const MotionHeader = styled(motion.header)`
  display: flex;
  width: min(100%, 1160px);
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin: 0 auto;
  padding-bottom: 16px;
  border-bottom: 1px solid #f2f4f6;

  @media (max-width: 768px) {
    align-items: flex-start;
    flex-direction: column;
  }
`;

const Brand = styled(Link)`
  color: #191f28;
  font-size: 18px;
  font-weight: 800;
  letter-spacing: -0.04em;
`;

const HeaderNav = styled.nav`
  display: inline-flex;
  align-items: center;
  gap: 24px;
  margin-left: auto;
  margin-right: 16px;

  @media (max-width: 960px) {
    display: none;
  }
`;

const HeaderNavLink = styled(Link)`
  color: #4e5968;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: -0.02em;
  transition: color 140ms cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    color: #191f28;
  }
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
`;

const ProfileInline = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 10px;
`;

const Avatar = styled.div`
  display: inline-flex;
  width: 32px;
  height: 32px;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 999px;
  color: #1d4ed8;
  background: rgba(49, 130, 246, 0.12);
  font-size: 14px;
  font-weight: 700;
`;

const AvatarImage = styled(Image)`
  object-fit: cover;
  border-radius: 999px;
`;

const ProfileName = styled.div`
  color: #191f28;
  font-size: 14px;
  font-weight: 600;
`;

const MyPageLink = styled(Link)`
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  color: #4e5968;
  font-size: 14px;
  font-weight: 600;
  transition: color 140ms cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    color: #191f28;
  }
`;

const HeaderSignOutButton = styled(SignOutButton)`
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  color: #8b95a1;
  background: transparent;
  border: 0;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: color 140ms cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    color: #4e5968;
  }
`;

const Main = styled.div`
  display: grid;
  width: min(100%, 720px);
  gap: 0;
  margin: 32px auto 0;
`;

const MotionIntro = styled(motion.div)`
  display: grid;
  gap: 0;
  padding-bottom: 40px;
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

const SecondaryActionLink = styled(Link)`
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  color: #4e5968;
  background: transparent;
  border: 0;
  font-size: 14px;
  font-weight: 600;
  transition: color 140ms cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    color: #191f28;
    text-decoration: underline;
    text-underline-offset: 4px;
  }
`;

const IntroStatsDivider = styled.hr`
  margin: 32px 0 20px;
  height: 1px;
  border: 0;
  background: #e5e7eb;
`;

const IntroStats = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 24px;

  @media (max-width: 540px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 20px 16px;
  }
`;

const StatItem = styled.div`
  display: grid;
  gap: 4px;
`;

const StatLabel = styled.span`
  color: #8b95a1;
  font-size: 14px;
  font-weight: 500;
`;

const StatValue = styled.span`
  color: #191f28;
  font-size: 16px;
  font-weight: 600;
  word-break: keep-all;
`;

const MotionSection = styled(motion.section)`
  display: grid;
  gap: 0;
  padding-top: 40px;

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

const SectionHeaderAside = styled.div`
  display: flex;
  justify-content: flex-end;

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const CompactNoticeAction = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 44px;
  color: #4e5968;
  background: transparent;
  border: 0;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  transition: color 140ms cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    color: #191f28;
  }
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

const PartyLogo = styled.img`
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
  padding: 0;
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

const DistrictPromptCard = styled.div`
  display: grid;
  gap: 12px;
  padding: 24px 0;
  border-bottom: 1px solid #e5e7eb;
`;

const PromptTitle = styled.div`
  color: #191f28;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.4;
  letter-spacing: -0.03em;
  word-break: keep-all;
`;

const PromptText = styled.p`
  margin: 0;
  color: #4e5968;
  font-size: 16px;
  line-height: 1.6;
  word-break: keep-all;
`;

const PromptLink = styled(Link)`
  display: inline-flex;
  width: fit-content;
  min-height: 44px;
  align-items: center;
  justify-content: center;
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

const MotionBattleBanner = styled(motion.section)`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-top: 40px;
  padding-top: 40px;
  border-top: 1px solid #e5e7eb;

  @media (max-width: 768px) {
    align-items: flex-start;
    flex-direction: column;
    margin-top: 32px;
    padding-top: 32px;
  }
`;

const BannerCopy = styled.div`
  display: grid;
  gap: 8px;
  max-width: 480px;
`;

const BannerEyebrow = styled.div`
  color: #8b95a1;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: -0.02em;
`;

const BannerTitle = styled.h2`
  margin: 0;
  color: #191f28;
  font-size: 24px;
  font-weight: 700;
  line-height: 1.4;
  letter-spacing: -0.03em;
  word-break: keep-all;
`;

const BannerLink = styled(Link)`
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0 20px;
  border-radius: 8px;
  color: #ffffff;
  background: #3182f6;
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
  white-space: nowrap;
  transition: background 140ms cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    background: #1b64da;
  }
`;

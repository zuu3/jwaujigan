"use client";

import styled from "@emotion/styled";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ChevronDown, ExternalLink, MapPin, Zap } from "lucide-react";
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
      title: "내 지역구와 성향을 먼저 정리해 보세요",
      description:
        "지역구를 저장하고 성향 분석을 마치면 맞춤 의원 정보와 배틀 진입 흐름이 더 정확해집니다.",
    };
  }

  if (needsDistrict) {
    return {
      label: "지역구 설정이 필요해요",
      action: "지역구 설정하기",
      title: "내 지역구를 먼저 설정해 보세요",
      description:
        "지역구를 저장하면 현재 선거구 기준 의원 정보를 바로 불러올 수 있습니다.",
    };
  }

  return {
    label: "성향 분석을 완료해 주세요",
    action: "성향 분석 이어가기",
    title: "내 정치 성향을 마무리해 보세요",
    description:
      "성향 분석을 마치면 홈에서 더 자연스럽게 토론 주제와 추천 흐름을 이어갈 수 있습니다.",
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
  const politicianCountLabel =
    politicians.length > 0 ? `${politicians.length}명 확인` : "의원 정보 대기 중";
  const issueCountLabel = issues.length > 0 ? `${issues.length}건 반영` : "이슈 수집 중";
  const primaryAction = needsOnboarding
    ? { href: "/onboarding", label: onboardingCopy.action }
    : { href: "/arena", label: "AI 배틀 시작하기" };
  const secondaryAction = needsDistrict
    ? { href: "/onboarding", label: "지역구 설정" }
    : { href: "#local-politicians", label: "의원 보기" };

  return (
    <Page>
      <MotionHeader
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
      >
        <Brand href="/">좌우지간</Brand>

        <HeaderNav aria-label="홈 바로가기">
          <HeaderNavLink href="#hot-issues">핫이슈</HeaderNavLink>
          <HeaderNavLink href="#battle-banner">배틀</HeaderNavLink>
          <HeaderNavLink href="#local-politicians">정치인 찾기</HeaderNavLink>
        </HeaderNav>

        <HeaderActions>
          <ProfileChip>
            <Avatar aria-hidden="true">
              {displayImage ? (
                <AvatarImage src={displayImage} alt="" />
              ) : (
                getProfileInitial(displayName, displayEmail)
              )}
            </Avatar>
            <ProfileMeta>
              <ProfileName>{displayName ?? "사용자"}</ProfileName>
              <ProfileEmail>{displayEmail ?? ""}</ProfileEmail>
            </ProfileMeta>
          </ProfileChip>

          <MyPageLink href="/mypage">마이페이지</MyPageLink>
          <HeaderSignOutButton callbackUrl="/">로그아웃</HeaderSignOutButton>
        </HeaderActions>
      </MotionHeader>

      <Main>
        <MotionIntro
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, delay: 0.04 }}
        >
          <IntroBand>
            <IntroCopy>
              <IntroEyebrow>
                {district ? `${district} 기준 홈 브리핑` : "맞춤 홈 브리핑"}
              </IntroEyebrow>
              <IntroTitle>
                {displayName ? `${displayName}님, ` : ""}
                {needsOnboarding
                  ? onboardingCopy.title
                  : "오늘 확인할 정치 이슈와 지역구 의원을 바로 볼 수 있어요"}
              </IntroTitle>
              <IntroText>{onboardingCopy.description}</IntroText>
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
                <StatLabel>내 지역구 의원</StatLabel>
                <StatValue>{district ? politicianCountLabel : "설정 필요"}</StatValue>
              </StatItem>
              <StatItem>
                <StatLabel>핫이슈</StatLabel>
                <StatValue>{issueCountLabel}</StatValue>
              </StatItem>
            </IntroStats>
          </IntroBand>
        </MotionIntro>

        <MotionSection
          id="local-politicians"
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.34, delay: 0.1 }}
        >
          <SectionHeader>
            <SectionMeta>
              <SectionEyebrow>내 지역구 의원</SectionEyebrow>
              <SectionTitle>
                {district ? district : "지역구를 먼저 설정해 주세요"}
              </SectionTitle>
            </SectionMeta>
            {needsOnboarding ? (
              <SectionHeaderAside>
                <CompactNotice>
                  <CompactNoticeLabel>{onboardingCopy.label}</CompactNoticeLabel>
                  <CompactNoticeAction href="/onboarding">
                    {onboardingCopy.action}
                    <ArrowRight size={15} />
                  </CompactNoticeAction>
                </CompactNotice>
              </SectionHeaderAside>
            ) : null}
          </SectionHeader>

          {district ? (
            politiciansQuery.isLoading ? (
              <EmptyCard>의원 정보를 불러오는 중입니다.</EmptyCard>
            ) : politiciansQuery.isError ? (
              <EmptyCard>
                <EmptyCardTitle>의원 정보를 불러오지 못했습니다.</EmptyCardTitle>
                <EmptyCardText>
                  잠시 후 다시 시도해 주세요. 문제가 계속되면 지역구 설정 상태도 함께
                  확인하는 편이 안전합니다.
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
                          <PoliticianImage src={politician.image} alt={politician.name} />
                        ) : (
                          <PoliticianFallback>
                            {politician.name.slice(0, 1)}
                          </PoliticianFallback>
                        )}
                      </PoliticianImageWrap>

                      <PoliticianBody>
                        <PoliticianInline>
                          <PoliticianName>{politician.name}</PoliticianName>
                          <PoliticianDivider />
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
                          <PoliticianDivider />
                          <PoliticianMeta>
                            <MapPin size={13} />
                            <span>{politician.district}</span>
                          </PoliticianMeta>
                          {politician.reelection ? (
                            <>
                              <PoliticianDivider />
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
                            <ArrowRight size={15} />
                          </InlineActionButton>
                          <DetailLink href={`/politicians/${politician.id}`}>
                            상세 페이지
                            <ArrowRight size={15} />
                          </DetailLink>
                        </PoliticianActions>

                        {expandedPoliticianId === politician.id ? (
                          <PoliticianInlineDetail>
                            {politicianDetailQuery.isLoading ? (
                              <InlineDetailText>
                                상세 정보를 불러오는 중입니다.
                              </InlineDetailText>
                            ) : politicianDetailQuery.isError ? (
                              <InlineDetailText>
                                상세 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
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
                <EmptyCardTitle>등록된 지역구 의원 정보를 찾지 못했습니다.</EmptyCardTitle>
                <EmptyCardText>
                  현재 저장된 지역구와 일치하는 결과가 없습니다. 온보딩에서 지역구를 다시
                  설정한 뒤 다시 확인해 보세요.
                </EmptyCardText>
              </EmptyCard>
            )
          ) : (
            <DistrictPromptCard>
              <PromptTitle>{onboardingCopy.title}</PromptTitle>
              <PromptText>{onboardingCopy.description}</PromptText>
              <PromptLink href="/onboarding">지역구 설정하기</PromptLink>
            </DistrictPromptCard>
          )}
        </MotionSection>

        <MotionSection
          id="hot-issues"
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.34, delay: 0.16 }}
        >
          <SectionHeader>
            <SectionMeta>
              <SectionEyebrow>오늘의 핫이슈</SectionEyebrow>
              <SectionTitle>오늘 나온 쟁점을 빠르게 훑어봅니다</SectionTitle>
            </SectionMeta>
            {!issuesQuery.isLoading && issues.length > 0 ? (
              <IssueSectionBadge>{issues.length}개 이슈</IssueSectionBadge>
            ) : null}
          </SectionHeader>

          <IssueLayout>
            {issuesQuery.isLoading ? (
              <EmptyCard>핫이슈를 불러오는 중입니다.</EmptyCard>
            ) : issuesQuery.isError ? (
              <EmptyCard>
                <EmptyCardTitle>핫이슈를 불러오지 못했습니다.</EmptyCardTitle>
                <EmptyCardText>
                  잠시 후 다시 시도해 주세요. 국회 공공데이터 또는 이슈 생성 과정에서
                  문제가 발생했을 수 있습니다.
                </EmptyCardText>
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
                            <IssueText $tone="blue">{issue.progressive}</IssueText>
                          </IssueComparisonRow>
                          <IssueComparisonRow>
                            <IssueLabel $tone="red">보수</IssueLabel>
                            <IssueText $tone="red">{issue.conservative}</IssueText>
                          </IssueComparisonRow>
                        </IssueComparisonList>
                      </IssueExpanded>
                    ) : null}
                  </IssueItem>
                );
              })
            ) : (
              <EmptyCard>
                <EmptyCardTitle>지금 보여드릴 핫이슈가 없습니다.</EmptyCardTitle>
                <EmptyCardText>
                  국회 최신 법안을 다시 수집해 올 때까지 잠시 기다려 주세요.
                </EmptyCardText>
              </EmptyCard>
            )}
          </IssueLayout>
        </MotionSection>

        <MotionBattleBanner
          id="battle-banner"
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.34, delay: 0.22 }}
        >
          <BannerCopy>
            <BannerEyebrow>
              <Zap size={16} />
              <span>AI 배틀</span>
            </BannerEyebrow>
            <BannerTitle>AI가 대신 싸워드립니다</BannerTitle>
            <BannerText>
              같은 이슈를 진보와 보수 시각으로 번갈아 보면서 내 판단 기준을 빠르게
              잡아보세요.
            </BannerText>
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
  color: #111827;

  @media (max-width: 768px) {
    padding: 16px 16px 56px;
  }
`;

const MotionHeader = styled(motion.header)`
  display: flex;
  width: min(100%, 1160px);
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin: 0 auto;

  @media (max-width: 768px) {
    align-items: flex-start;
    flex-direction: column;
  }
`;

const Brand = styled(Link)`
  color: #191f28;
  font-size: 1.04rem;
  font-weight: 900;
  letter-spacing: -0.04em;
`;

const HeaderNav = styled.nav`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
  margin-right: 12px;

  @media (max-width: 960px) {
    display: none;
  }
`;

const HeaderNavLink = styled(Link)`
  color: #6b7684;
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: -0.02em;

  &:not(:last-of-type)::after {
    content: "|";
    margin-left: 6px;
    color: #c3c6cb;
  }
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`;

const ProfileChip = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 9px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid #ebebeb;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.05);
`;

const Avatar = styled.div`
  display: inline-flex;
  width: 38px;
  height: 38px;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 999px;
  color: #1d4ed8;
  background: rgba(49, 130, 246, 0.12);
  font-size: 0.95rem;
  font-weight: 800;
`;

const AvatarImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const ProfileMeta = styled.div`
  display: grid;
  gap: 2px;
`;

const ProfileName = styled.div`
  font-size: 0.92rem;
  font-weight: 700;
`;

const ProfileEmail = styled.div`
  max-width: 180px;
  overflow: hidden;
  color: #6b7684;
  font-size: 0.82rem;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const MyPageLink = styled(Link)`
  display: inline-flex;
  min-height: 40px;
  align-items: center;
  justify-content: center;
  padding: 0 15px;
  border-radius: 999px;
  color: #1d4ed8;
  background: rgba(49, 130, 246, 0.1);
  border: 1px solid #ebebeb;
  font-size: 0.9rem;
  font-weight: 700;
`;

const HeaderSignOutButton = styled(SignOutButton)`
  display: inline-flex;
  min-height: 40px;
  align-items: center;
  justify-content: center;
  padding: 0 15px;
  border-radius: 999px;
  color: #191f28;
  background: #ffffff;
  border: 1px solid #d7dde5;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
`;

const Main = styled.div`
  display: grid;
  width: min(100%, 720px);
  gap: 0;
  margin: 20px auto 0;
`;

const MotionIntro = styled(motion.div)`
  display: grid;
`;

const IntroBand = styled.section`
  display: grid;
  gap: 14px;
  padding: 28px 24px;
  background: #f8f9fa;
`;

const IntroCopy = styled.div`
  display: grid;
  gap: 10px;
`;

const IntroEyebrow = styled.div`
  color: #9ca3af;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const IntroTitle = styled.h1`
  margin: 0 0 6px;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.4;
  letter-spacing: -0.03em;
  color: #111827;
  word-break: keep-all;
`;

const IntroText = styled.p`
  margin: 0;
  color: #6b7280;
  font-size: 13px;
  font-weight: 400;
  line-height: 1.6;
  word-break: keep-all;
`;

const IntroActions = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 2px;
`;

const PrimaryActionLink = styled(Link)`
  display: inline-flex;
  min-height: 34px;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0 14px;
  border-radius: 6px;
  color: #ffffff;
  background: #111827;
  font-size: 12px;
  font-weight: 600;
`;

const SecondaryActionLink = styled(Link)`
  display: inline-flex;
  min-height: 34px;
  align-items: center;
  justify-content: center;
  padding: 0 14px;
  border-radius: 6px;
  color: #374151;
  background: transparent;
  border: 1px solid #d1d5db;
  font-size: 12px;
  font-weight: 600;
`;

const IntroStats = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0;
  padding-top: 2px;
`;

const StatLabel = styled.span`
  color: #6b7280;
  font-size: 12px;
  font-weight: 400;
`;

const StatValue = styled.span`
  color: #374151;
  font-size: 12px;
  font-weight: 600;
  word-break: keep-all;
`;

const StatItem = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 5px;

  &:not(:last-of-type)::after {
    content: "|";
    margin: 0 8px;
    color: #d1d5db;
    font-weight: 400;
  }
`;

const MotionSection = styled(motion.section)`
  display: grid;
  gap: 0;
  padding-top: 24px;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  padding: 10px 0 12px;
  border-top: 1px solid #e5e7eb;
  margin-bottom: 4px;

  @media (max-width: 768px) {
    align-items: flex-start;
    flex-direction: column;
  }
`;

const SectionMeta = styled.div`
  display: grid;
  gap: 4px;
`;

const SectionEyebrow = styled.div`
  color: #9ca3af;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const SectionTitle = styled.h2`
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.4;
  letter-spacing: -0.02em;
  color: #111827;
  word-break: keep-all;
`;

const SectionHeaderAside = styled.div`
  display: flex;
  justify-content: flex-end;

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const CompactNotice = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 0;
  background: transparent;
  border: 0;

  @media (max-width: 768px) {
    width: 100%;
    justify-content: space-between;
  }
`;

const CompactNoticeLabel = styled.div`
  color: #9a3412;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0;
  white-space: nowrap;
`;

const CompactNoticeAction = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 32px;
  padding: 0 12px;
  border-radius: 999px;
  color: #191f28;
  background: #f3f4f6;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
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
  background: #f3f4f6;
  flex-shrink: 0;
`;

const PoliticianImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center top;
`;

const PoliticianFallback = styled.div`
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  color: #6b7684;
  font-size: 0.84rem;
  font-weight: 800;
`;

const PoliticianRow = styled.article`
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr);
  gap: 10px;
  align-items: start;
  padding: 12px 0;
  border-bottom: 1px solid #f3f4f6;
`;

const PoliticianBody = styled.div`
  display: grid;
  gap: 6px;
  min-width: 0;
`;

const PoliticianInline = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
`;

const PoliticianName = styled.div`
  font-size: 14px;
  font-weight: 600;
  letter-spacing: -0.03em;
`;

const PoliticianDivider = styled.div`
  width: 1px;
  height: 12px;
  background: #d1d5db;
`;

const PartyTextBadge = styled.div<{ $tone: "blue" | "red" | "neutral" }>`
  display: inline-flex;
  color: ${({ $tone }) =>
    $tone === "blue" ? "#3182f6" : $tone === "red" ? "#ef4444" : "#6b7280"};
  font-size: 11px;
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
  height: 12px;
  flex-shrink: 0;
`;

const PoliticianMeta = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #6b7280;
  font-size: 12px;
  font-weight: 400;
  min-width: 0;
`;

const PoliticianTag = styled.div`
  display: inline-flex;
  color: #6b7280;
  font-size: 12px;
  font-weight: 400;
`;

const PoliticianSubtext = styled.div`
  color: #6b7684;
  font-size: 12px;
  line-height: 1.6;
  word-break: keep-all;
`;

const DetailLink = styled(Link)`
  display: inline-flex;
  width: fit-content;
  align-items: center;
  gap: 4px;
  color: #3182f6;
  font-size: 12px;
  font-weight: 500;
`;

const PoliticianActions = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
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
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
`;

const PoliticianInlineDetail = styled.div`
  display: grid;
  gap: 12px;
  padding: 14px 0 2px;
  border-top: 1px solid #e5e7eb;
`;

const InlineDetailGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 18px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const InlineDetailItem = styled.div`
  display: grid;
  gap: 4px;
`;

const InlineDetailLabel = styled.div`
  color: #6b7684;
  font-size: 0.78rem;
  font-weight: 700;
`;

const InlineDetailValue = styled.div`
  color: #191f28;
  font-size: 0.9rem;
  line-height: 1.45;
  word-break: break-word;
`;

const InlineDetailText = styled.p`
  margin: 0;
  color: #6b7684;
  font-size: 0.88rem;
  line-height: 1.55;
`;

const InlineExternalLink = styled.a`
  display: inline-flex;
  width: fit-content;
  align-items: center;
  gap: 6px;
  color: #191f28;
  font-size: 0.86rem;
  font-weight: 700;
`;

const EmptyCard = styled.div`
  display: grid;
  gap: 8px;
  padding: 20px 0;
  color: #6b7280;
`;

const EmptyCardTitle = styled.div`
  color: #111827;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: -0.02em;
`;

const EmptyCardText = styled.p`
  margin: 0;
  color: #6b7684;
  line-height: 1.7;
  word-break: keep-all;
`;

const RetryButton = styled.button`
  display: inline-flex;
  width: fit-content;
  min-height: 34px;
  align-items: center;
  justify-content: center;
  padding: 0 14px;
  border-radius: 6px;
  color: #ffffff;
  background: #111827;
  border: 0;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
`;

const DistrictPromptCard = styled.div`
  display: grid;
  gap: 12px;
  padding: 18px 0;
  border-bottom: 1px solid #e5e7eb;
`;

const PromptTitle = styled.div`
  font-size: 1.18rem;
  font-weight: 800;
  line-height: 1.4;
  letter-spacing: -0.03em;
  word-break: keep-all;
`;

const PromptText = styled.p`
  margin: 0;
  color: #6b7684;
  line-height: 1.7;
  word-break: keep-all;
`;

const PromptLink = styled(Link)`
  display: inline-flex;
  width: fit-content;
  min-height: 34px;
  align-items: center;
  justify-content: center;
  padding: 0 14px;
  border-radius: 6px;
  color: #ffffff;
  background: #111827;
  font-size: 12px;
  font-weight: 600;
`;

const IssueLayout = styled.div`
  display: grid;
  gap: 0;
`;

const IssueItem = styled.div`
  display: grid;
  border-bottom: 1px solid #f3f4f6;

  &:last-of-type {
    border-bottom: 0;
  }
`;

const IssueSectionBadge = styled.div`
  display: inline-flex;
  min-height: 32px;
  align-items: center;
  justify-content: center;
  padding: 0 12px;
  border-radius: 999px;
  color: #4e5968;
  background: #f3f4f6;
  border: 0;
  font-size: 12px;
  font-weight: 600;
`;

const IssueRow = styled.article`
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr) auto;
  gap: 16px;
  align-items: start;
  padding: 14px 0;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 8px;
  }
`;

const IssueRowMeta = styled.div`
  color: #9ca3af;
  font-size: 11px;
  font-weight: 400;
  padding-top: 2px;
`;

const IssueRowBody = styled.div`
  display: grid;
  gap: 6px;
`;

const IssueTitle = styled.h3`
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: -0.02em;
  color: #111827;
  word-break: keep-all;
`;

const IssueSummary = styled.p`
  margin: 0;
  color: #6b7280;
  font-size: 12px;
  line-height: 1.7;
  word-break: keep-all;
`;

const IssueActions = styled.div`
  display: grid;
  align-content: start;
  justify-items: end;
  gap: 8px;
  min-width: 108px;

  @media (max-width: 768px) {
    justify-items: start;
    min-width: 0;
  }
`;

const IssueToggleButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  width: 108px;
  padding: 0;
  color: #6b7684;
  background: transparent;
  border: 0;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;

  @media (max-width: 768px) {
    width: auto;
    justify-content: flex-start;
  }
`;

const IssueChevron = styled.span<{ $expanded: boolean }>`
  display: inline-flex;
  svg {
    transform: rotate(${({ $expanded }) => ($expanded ? "180deg" : "0deg")});
    transition: transform 160ms ease;
  }
`;

const IssueTopLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  width: 108px;
  color: #191f28;
  font-size: 12px;
  font-weight: 600;

  @media (max-width: 768px) {
    justify-content: flex-start;
    width: auto;
  }
`;

const IssueComparisonList = styled.div`
  display: grid;
  gap: 0;
`;

const IssueComparisonRow = styled.div`
  display: grid;
  gap: 4px;
  padding: 8px 0;

  &:not(:last-of-type) {
    border-bottom: 1px solid #f3f4f6;
  }
`;

const IssueLabel = styled.div<{ $tone: "blue" | "red" }>`
  color: ${({ $tone }) => ($tone === "blue" ? "#3182f6" : "#ef4444")};
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0;
`;

const IssueText = styled.p<{ $tone: "blue" | "red" }>`
  margin: 0;
  color: ${({ $tone }) => ($tone === "blue" ? "#3182f6" : "#ef4444")};
  font-size: 12px;
  line-height: 1.6;
  word-break: keep-all;
`;

const IssueExpanded = styled.div`
  padding: 10px 0 12px 16px;
  margin-left: 88px;
  border-left: 2px solid #e5e7eb;

  @media (max-width: 768px) {
    margin-left: 0;
  }
`;

const MotionBattleBanner = styled(motion.section)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-top: 24px;
  padding: 24px;
  border-radius: 12px;
  color: #ffffff;
  background: #111827;

  @media (max-width: 768px) {
    align-items: flex-start;
    flex-direction: column;
  }
`;

const BannerCopy = styled.div`
  display: grid;
  gap: 6px;
`;

const BannerEyebrow = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #9ca3af;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
`;

const BannerTitle = styled.h2`
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  line-height: 1.3;
  letter-spacing: -0.03em;
  color: #ffffff;
  word-break: keep-all;
`;

const BannerText = styled.p`
  margin: 0;
  color: #9ca3af;
  font-size: 13px;
  line-height: 1.6;
  word-break: keep-all;
`;

const BannerLink = styled(Link)`
  display: inline-flex;
  min-height: 40px;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0 18px;
  border-radius: 8px;
  color: #111827;
  background: #ffffff;
  font-size: 13px;
  font-weight: 600;
  flex-shrink: 0;
  white-space: nowrap;
`;

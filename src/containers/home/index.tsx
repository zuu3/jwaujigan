"use client";

import styled from "@emotion/styled";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, MapPin, Zap } from "lucide-react";
import Link from "next/link";
import type { Session } from "next-auth";
import { getPartyPresentation } from "@/lib/parties";

type HomeContainerProps = {
  session: Session;
};

type UserProfileResponse = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  district: string | null;
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

const HOT_ISSUES = [
  {
    id: "issue-1",
    title: "연금개혁 속도와 세대 간 부담",
    progressive: "지속 가능성을 위해 공적 안전망 보강이 우선이라는 시각",
    conservative: "미래 세대 부담을 줄이기 위해 재정 통제가 먼저라는 시각",
  },
  {
    id: "issue-2",
    title: "전세사기 대응과 공공 개입 범위",
    progressive: "피해 복구에 국가가 더 적극적으로 개입해야 한다는 입장",
    conservative: "시장 왜곡을 줄이며 선별 지원해야 한다는 입장",
  },
  {
    id: "issue-3",
    title: "AI 산업 육성과 규제 균형",
    progressive: "기술 확산 전 안전성과 노동 보호 장치가 필요하다는 입장",
    conservative: "규제를 최소화해 빠르게 산업 경쟁력을 확보해야 한다는 입장",
  },
];

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

export function HomeContainer({ session }: HomeContainerProps) {
  const profileQuery = useQuery({
    queryKey: ["user-profile"],
    queryFn: () => fetchJson<UserProfileResponse>("/api/user/profile"),
  });

  const district = profileQuery.data?.district ?? session.user.district ?? null;

  const politiciansQuery = useQuery({
    queryKey: ["local-politicians", district],
    enabled: Boolean(district),
    queryFn: () => fetchJson<LocalPoliticiansResponse>("/api/politicians/local"),
  });

  const politicians = politiciansQuery.data?.politicians ?? [];

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
              {session.user.image ? (
                <AvatarImage src={session.user.image} alt="" />
              ) : (
                getProfileInitial(session.user.name ?? null, session.user.email ?? null)
              )}
            </Avatar>
            <ProfileMeta>
              <ProfileName>{session.user.name ?? "사용자"}</ProfileName>
              <ProfileEmail>{session.user.email ?? ""}</ProfileEmail>
            </ProfileMeta>
          </ProfileChip>

          <MyPageLink href="/mypage">마이페이지</MyPageLink>
        </HeaderActions>
      </MotionHeader>

      <Main>
        <MotionIntro
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, delay: 0.04 }}
        >
          <IntroText>
            {session.user.name ? `${session.user.name}님, ` : ""}
            {district ? `${district} 기준으로` : "지역구 설정 후"} 오늘 볼 내용을 정리했습니다.
          </IntroText>
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
          </SectionHeader>

          {district ? (
            politiciansQuery.isLoading ? (
              <EmptyCard>의원 정보를 불러오는 중입니다.</EmptyCard>
            ) : politicians.length > 0 ? (
              <PoliticianList>
                {politicians.map((politician) => {
                  const partyLogo = getPartyPresentation(politician.party);

                  return (
                    <PoliticianCard key={politician.id}>
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
                        <PoliticianTop>
                          <PoliticianName>{politician.name}</PoliticianName>
                          <PartyBadge>
                            {partyLogo.src ? (
                              <PartyLogo
                                src={partyLogo.src}
                                alt={partyLogo.label}
                                onError={(event) => {
                                  event.currentTarget.style.display = "none";
                                  const fallback =
                                    event.currentTarget.nextElementSibling;
                                  if (fallback instanceof HTMLElement) {
                                    fallback.style.display = "inline-flex";
                                  }
                                }}
                              />
                            ) : null}
                            <PartyFallback
                              style={{
                                display: partyLogo.src ? "none" : "inline-flex",
                              }}
                            >
                              {partyLogo.label}
                            </PartyFallback>
                          </PartyBadge>
                        </PoliticianTop>

                        <PoliticianMetaRow>
                          <PoliticianMeta>
                            <MapPin size={14} />
                            <span>{politician.district}</span>
                          </PoliticianMeta>
                          {politician.reelection ? (
                            <PoliticianTag>{politician.reelection}</PoliticianTag>
                          ) : null}
                        </PoliticianMetaRow>

                        {politician.committee ? (
                          <PoliticianSubtext>{politician.committee}</PoliticianSubtext>
                        ) : null}

                        <DetailLink href={`/politicians/${politician.id}`}>
                          자세히 보기
                          <ArrowRight size={16} />
                        </DetailLink>
                      </PoliticianBody>
                    </PoliticianCard>
                  );
                })}
              </PoliticianList>
            ) : (
              <EmptyCard>
                현재 지역구와 일치하는 의원 정보를 찾지 못했습니다. 온보딩에서 지역구를 다시
                설정해 보세요.
              </EmptyCard>
            )
          ) : (
            <DistrictPromptCard>
              <PromptTitle>
                내 지역구를 설정하면 우리 동네 의원을 바로 볼 수 있어요
              </PromptTitle>
              <PromptText>
                먼저 지역구를 저장하면 현재 선거구 기준 의원 정보를 바로 불러옵니다.
              </PromptText>
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
              <SectionTitle>입장 차이를 짧게 보고 바로 배틀로 들어갑니다</SectionTitle>
            </SectionMeta>
          </SectionHeader>

          <IssueLayout>
            {HOT_ISSUES.map((issue, index) => (
              <IssueCard key={issue.id} $featured={index === 0}>
                <IssueTitle $featured={index === 0}>{issue.title}</IssueTitle>
                <IssuePoint>
                  <IssueLabel $tone="blue">진보</IssueLabel>
                  <IssueText>{issue.progressive}</IssueText>
                </IssuePoint>
                <IssuePoint>
                  <IssueLabel $tone="red">보수</IssueLabel>
                  <IssueText>{issue.conservative}</IssueText>
                </IssuePoint>
                <IssueFooter>
                  <IssueLink href="/arena">
                    배틀 보기
                    <ArrowRight size={15} />
                  </IssueLink>
                </IssueFooter>
              </IssueCard>
            ))}
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
  padding: 26px 24px 64px;
  background: #f8f8f6;
  color: #191f28;

  @media (max-width: 768px) {
    padding: 18px 16px 44px;
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

const Main = styled.div`
  display: grid;
  width: min(100%, 1160px);
  gap: 20px;
  margin: 18px auto 0;
`;

const MotionIntro = styled(motion.div)`
  display: flex;
  align-items: center;
  min-height: 48px;
  padding: 0 2px;
`;

const IntroText = styled.p`
  margin: 0;
  color: #4e5968;
  font-size: 0.98rem;
  font-weight: 600;
  line-height: 1.6;
  word-break: keep-all;
`;

const MotionSection = styled(motion.section)`
  display: grid;
  gap: 14px;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
`;

const SectionMeta = styled.div`
  display: grid;
  gap: 6px;
`;

const SectionEyebrow = styled.div`
  color: #3182f6;
  font-size: 0.84rem;
  font-weight: 700;
`;

const SectionTitle = styled.h2`
  margin: 0;
  font-size: clamp(1.35rem, 3vw, 1.9rem);
  font-weight: 800;
  line-height: 1.24;
  letter-spacing: -0.05em;
  word-break: keep-all;
`;

const PoliticianList = styled.div`
  display: grid;
  gap: 12px;
`;

const PoliticianCard = styled.article`
  display: grid;
  grid-template-columns: 108px minmax(0, 1fr);
  gap: 16px;
  align-items: center;
  padding: 14px;
  border-radius: 24px;
  background: #ffffff;
  border: 1px solid #ebebeb;
  box-shadow: 0 14px 36px rgba(15, 23, 42, 0.05);
  transition:
    transform 180ms ease,
    box-shadow 180ms ease,
    border-color 180ms ease;

  &:hover {
    transform: translateY(-3px);
    border-color: #222222;
    box-shadow: 0 22px 44px rgba(15, 23, 42, 0.08);
  }

  @media (max-width: 768px) {
    grid-template-columns: 92px minmax(0, 1fr);
    gap: 14px;
    padding: 12px;
  }
`;

const PoliticianImageWrap = styled.div`
  width: 100%;
  height: 128px;
  overflow: hidden;
  border-radius: 18px;
  background: #eef3f8;

  @media (max-width: 768px) {
    height: 116px;
  }
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
  font-size: 1.8rem;
  font-weight: 800;
`;

const PoliticianBody = styled.div`
  display: grid;
  gap: 10px;
  min-width: 0;
`;

const PoliticianTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  @media (max-width: 640px) {
    align-items: flex-start;
    flex-direction: column;
  }
`;

const PoliticianName = styled.div`
  font-size: 1.14rem;
  font-weight: 800;
  letter-spacing: -0.03em;
`;

const PartyBadge = styled.div`
  display: inline-flex;
  align-items: center;
  min-height: 20px;
`;

const PartyLogo = styled.img`
  display: block;
  width: auto;
  height: 20px;
`;

const PartyFallback = styled.div`
  display: inline-flex;
  color: #1d4ed8;
  font-size: 0.88rem;
  font-weight: 700;
`;

const PoliticianMetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
`;

const PoliticianMeta = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #4e5968;
  font-size: 0.9rem;
  font-weight: 600;
  min-width: 0;
`;

const PoliticianTag = styled.div`
  display: inline-flex;
  align-items: center;
  min-height: 26px;
  padding: 0 10px;
  border-radius: 999px;
  color: #4e5968;
  background: #f3f6fa;
  font-size: 0.82rem;
  font-weight: 700;
`;

const PoliticianSubtext = styled.div`
  color: #6b7684;
  font-size: 0.9rem;
  line-height: 1.58;
  word-break: keep-all;
`;

const DetailLink = styled(Link)`
  display: inline-flex;
  width: fit-content;
  align-items: center;
  gap: 6px;
  color: #191f28;
  font-size: 0.92rem;
  font-weight: 700;
`;

const EmptyCard = styled.div`
  padding: 20px 22px;
  border-radius: 22px;
  color: #6b7684;
  background: #ffffff;
  border: 1px solid #ebebeb;
  box-shadow: 0 16px 38px rgba(15, 23, 42, 0.05);
`;

const DistrictPromptCard = styled.div`
  display: grid;
  gap: 12px;
  padding: 24px;
  border-radius: 24px;
  background: linear-gradient(135deg, #ffffff 0%, #f3f8ff 100%);
  border: 1px solid #ebebeb;
  box-shadow: 0 18px 42px rgba(15, 23, 42, 0.05);
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
  min-height: 44px;
  align-items: center;
  justify-content: center;
  padding: 0 18px;
  border-radius: 14px;
  color: #ffffff;
  background: #3182f6;
  font-size: 0.94rem;
  font-weight: 700;
`;

const IssueLayout = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(280px, 0.75fr);
  gap: 14px;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const IssueCard = styled.article<{ $featured: boolean }>`
  display: grid;
  gap: ${({ $featured }) => ($featured ? "10px" : "12px")};
  padding: ${({ $featured }) => ($featured ? "20px 22px 16px" : "18px 20px 16px")};
  border-radius: 24px;
  background: #ffffff;
  border: 1px solid #ebebeb;
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.05);
  grid-row: ${({ $featured }) => ($featured ? "span 2" : "span 1")};

  @media (max-width: 1024px) {
    grid-row: auto;
  }
`;

const IssueTitle = styled.h3<{ $featured: boolean }>`
  margin: 0;
  font-size: ${({ $featured }) => ($featured ? "1.5rem" : "1.08rem")};
  font-weight: 800;
  line-height: 1.42;
  letter-spacing: -0.04em;
  word-break: keep-all;
`;

const IssuePoint = styled.div`
  display: grid;
  gap: 4px;
`;

const IssueLabel = styled.div<{ $tone: "blue" | "red" }>`
  color: ${({ $tone }) => ($tone === "blue" ? "#4da2ff" : "#ef4444")};
  font-size: 0.84rem;
  font-weight: 700;
`;

const IssueText = styled.p`
  margin: 0;
  color: #4e5968;
  line-height: 1.68;
  word-break: keep-all;
`;

const IssueLink = styled(Link)`
  display: inline-flex;
  width: fit-content;
  align-items: center;
  gap: 6px;
  color: #191f28;
  font-size: 0.92rem;
  font-weight: 700;
`;

const IssueFooter = styled.div`
  display: flex;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #ebebeb;
  margin-top: 2px;
`;

const MotionBattleBanner = styled(motion.section)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 22px;
  margin-top: 6px;
  padding: 30px 28px;
  border-radius: 30px;
  color: #ffffff;
  background: #111111;

  @media (max-width: 768px) {
    align-items: flex-start;
    flex-direction: column;
    padding: 24px;
  }
`;

const BannerCopy = styled.div`
  display: grid;
  gap: 8px;
`;

const BannerEyebrow = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: rgba(255, 255, 255, 0.88);
  font-size: 0.86rem;
  font-weight: 700;
`;

const BannerTitle = styled.h2`
  margin: 0;
  font-size: clamp(1.85rem, 4vw, 2.4rem);
  font-weight: 800;
  line-height: 1.18;
  letter-spacing: -0.06em;
  word-break: keep-all;
`;

const BannerText = styled.p`
  max-width: 620px;
  margin: 0;
  color: rgba(255, 255, 255, 0.86);
  line-height: 1.7;
  word-break: keep-all;
`;

const BannerLink = styled(Link)`
  display: inline-flex;
  min-height: 50px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 18px;
  border-radius: 16px;
  color: #111111;
  background: #ffffff;
  font-size: 0.96rem;
  font-weight: 800;
  flex-shrink: 0;
`;

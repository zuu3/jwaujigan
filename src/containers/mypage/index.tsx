"use client";

import styled from "@emotion/styled";
import { ArrowRight, BarChart3, MapPin, RotateCcw, Swords } from "lucide-react";
import Link from "next/link";
import { SignOutButton } from "@/components/auth/sign-out-button";

export type MyPageProfile = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  district: string | null;
  created_at: string | null;
};

export type PoliticalProfile = {
  economic_score: number;
  social_score: number;
  security_score: number;
  political_type: string;
  completed_at: string | null;
};

export type BattleLogItem = {
  id: string;
  topic: string;
  result: string | null;
  created_at: string;
};

type MyPageContainerProps = {
  profile: MyPageProfile;
  politicalProfile: PoliticalProfile | null;
  battleLogs: BattleLogItem[];
};

function getInitial(name: string | null, email: string) {
  return (name?.trim()?.[0] ?? email.trim()[0] ?? "유").toUpperCase();
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

function getResultLabel(result: string | null) {
  if (result === "win") {
    return "승리";
  }

  if (result === "lose") {
    return "패배";
  }

  if (result === "draw") {
    return "무승부";
  }

  return "기록 없음";
}

function getResultTone(result: string | null) {
  if (result === "win") {
    return "#3182f6";
  }

  if (result === "lose") {
    return "#ef4444";
  }

  return "var(--adaptiveGrey600)";
}

function getBattleStats(battleLogs: BattleLogItem[]) {
  return battleLogs.reduce(
    (stats, log) => {
      if (log.result === "win") {
        return { ...stats, win: stats.win + 1 };
      }

      if (log.result === "lose") {
        return { ...stats, lose: stats.lose + 1 };
      }

      if (log.result === "draw") {
        return { ...stats, draw: stats.draw + 1 };
      }

      return stats;
    },
    { win: 0, lose: 0, draw: 0 },
  );
}

function clampScore(score: number) {
  return Math.max(-100, Math.min(100, score));
}

export function MyPageContainer({
  profile,
  politicalProfile,
  battleLogs,
}: MyPageContainerProps) {
  const stats = getBattleStats(battleLogs);
  const recentBattleLogs = battleLogs.slice(0, 5);
  const completedAt = politicalProfile?.completed_at ?? null;

  return (
    <Page>
      <Shell>
        <Header>
          <Brand href="/">좌우지간</Brand>
          <HeaderActions>
            <HeaderLink href="/home">홈</HeaderLink>
            <HeaderSignOutButton callbackUrl="/">로그아웃</HeaderSignOutButton>
          </HeaderActions>
        </Header>

        <Hero>
          <HeroEyebrow>마이페이지</HeroEyebrow>
          <HeroTitle>내 정치 성향과 토론 기록을 확인하세요</HeroTitle>
          <HeroDescription>
            지역구, 성향 분석, AI 배틀 기록을 한 곳에서 관리할 수 있습니다.
          </HeroDescription>
        </Hero>

        <ProfileSection>
          <Avatar aria-hidden="true">
            {profile.image ? (
              <AvatarImage src={profile.image} alt="" />
            ) : (
              getInitial(profile.name, profile.email)
            )}
          </Avatar>
          <ProfileContent>
            <ProfileName>{profile.name ?? "사용자"}</ProfileName>
            <ProfileEmail>{profile.email}</ProfileEmail>
            <DistrictLine>
              <MapPin size={16} />
              <span>{profile.district ?? "지역구 미설정"}</span>
            </DistrictLine>
          </ProfileContent>
          <ProfileAction href="/onboarding">
            <RotateCcw size={16} />
            <span>온보딩 다시 하기</span>
          </ProfileAction>
        </ProfileSection>

        <ContentGrid>
          <Section>
            <SectionHeader>
              <SectionKicker>
                <BarChart3 size={16} />
                <span>정치 성향</span>
              </SectionKicker>
              {completedAt ? (
                <SectionDate>{formatDate(completedAt)} 완료</SectionDate>
              ) : null}
            </SectionHeader>

            {politicalProfile ? (
              <>
                <PoliticalType>{politicalProfile.political_type}</PoliticalType>
                <PoliticalMap profile={politicalProfile} />
                <SecurityBar score={politicalProfile.security_score} />
              </>
            ) : (
              <EmptyState>
                <EmptyTitle>정치 성향 분석이 아직 없습니다</EmptyTitle>
                <EmptyText>
                  테스트를 완료하면 정치 타입과 3축 점수가 여기에 표시됩니다.
                </EmptyText>
                <PrimaryLink href="/onboarding">
                  성향 테스트 시작하기
                  <ArrowRight size={16} />
                </PrimaryLink>
              </EmptyState>
            )}
          </Section>

          <Section>
            <SectionHeader>
              <SectionKicker>
                <Swords size={16} />
                <span>배틀 전적</span>
              </SectionKicker>
              <SectionDate>전체 {battleLogs.length}전</SectionDate>
            </SectionHeader>

            <StatsGrid>
              <StatCard $tone="#3182f6">
                <StatLabel>승리</StatLabel>
                <StatValue $tone="#3182f6">{stats.win}</StatValue>
              </StatCard>
              <StatCard $tone="#ef4444">
                <StatLabel>패배</StatLabel>
                <StatValue $tone="#ef4444">{stats.lose}</StatValue>
              </StatCard>
              <StatCard $tone="var(--adaptiveGrey600)">
                <StatLabel>무승부</StatLabel>
                <StatValue $tone="var(--adaptiveGrey600)">{stats.draw}</StatValue>
              </StatCard>
            </StatsGrid>

            {recentBattleLogs.length > 0 ? (
              <BattleList>
                {recentBattleLogs.map((log) => (
                  <BattleItem key={log.id}>
                    <BattleTopic>{log.topic}</BattleTopic>
                    <BattleMeta>
                      <ResultBadge $tone={getResultTone(log.result)}>
                        {getResultLabel(log.result)}
                      </ResultBadge>
                      <span>{formatDate(log.created_at)}</span>
                    </BattleMeta>
                  </BattleItem>
                ))}
              </BattleList>
            ) : (
              <EmptyState>
                <EmptyTitle>아직 배틀 기록이 없습니다</EmptyTitle>
                <EmptyText>
                  AI 토론 배틀을 완료하면 승패 기록이 이곳에 쌓입니다.
                </EmptyText>
                <PrimaryLink href="/arena">
                  배틀 시작하기
                  <ArrowRight size={16} />
                </PrimaryLink>
              </EmptyState>
            )}
          </Section>
        </ContentGrid>
      </Shell>
    </Page>
  );
}

function getScoreDirection({
  score,
  positiveLabel,
  negativeLabel,
}: {
  score: number;
  positiveLabel: string;
  negativeLabel: string;
}) {
  const clampedScore = clampScore(score);

  if (Math.abs(clampedScore) < 5) {
    return "중립";
  }

  return `${clampedScore > 0 ? positiveLabel : negativeLabel} ${Math.abs(clampedScore)}`;
}

const CHART_SIZE = 280;
const CHART_CENTER = CHART_SIZE / 2;
const CHART_PADDING = 32;
const CHART_RANGE = CHART_CENTER - CHART_PADDING;

function PoliticalMap({ profile }: { profile: PoliticalProfile }) {
  const economicScore = clampScore(profile.economic_score);
  const socialScore = clampScore(profile.social_score);
  const x = CHART_CENTER - (economicScore / 100) * CHART_RANGE;
  const y = CHART_CENTER - (socialScore / 100) * CHART_RANGE;

  return (
    <MapPanel>
      <MapHeader>
        <MapTitle>정치 좌표</MapTitle>
        <MapSummary>
          {getScoreDirection({
            score: economicScore,
            positiveLabel: "경제 진보",
            negativeLabel: "경제 보수",
          })}
          {" · "}
          {getScoreDirection({
            score: socialScore,
            positiveLabel: "사회 개방",
            negativeLabel: "사회 전통",
          })}
        </MapSummary>
      </MapHeader>
      <ChartFrame>
        <svg
          width="100%"
          viewBox={`0 0 ${CHART_SIZE} ${CHART_SIZE}`}
          role="img"
          aria-label="정치 좌표 그래프"
        >
          <rect
            x={CHART_PADDING}
            y={CHART_PADDING}
            width={CHART_RANGE}
            height={CHART_RANGE}
            fill="#DBEAFE"
          />
          <rect
            x={CHART_CENTER}
            y={CHART_PADDING}
            width={CHART_RANGE}
            height={CHART_RANGE}
            fill="#FEE2E2"
          />
          <rect
            x={CHART_PADDING}
            y={CHART_CENTER}
            width={CHART_RANGE}
            height={CHART_RANGE}
            fill="#EFF6FF"
          />
          <rect
            x={CHART_CENTER}
            y={CHART_CENTER}
            width={CHART_RANGE}
            height={CHART_RANGE}
            fill="#FEF2F2"
          />

          <text
            x={CHART_PADDING + CHART_RANGE / 2}
            y={CHART_PADDING + CHART_RANGE / 2}
            fontSize={9}
            fill="var(--adaptiveGrey500)"
            textAnchor="middle"
          >
            진보·개방
          </text>
          <text
            x={CHART_CENTER + CHART_RANGE / 2}
            y={CHART_PADDING + CHART_RANGE / 2}
            fontSize={9}
            fill="var(--adaptiveGrey500)"
            textAnchor="middle"
          >
            보수·개방
          </text>
          <text
            x={CHART_PADDING + CHART_RANGE / 2}
            y={CHART_CENTER + CHART_RANGE / 2}
            fontSize={9}
            fill="var(--adaptiveGrey500)"
            textAnchor="middle"
          >
            진보·전통
          </text>
          <text
            x={CHART_CENTER + CHART_RANGE / 2}
            y={CHART_CENTER + CHART_RANGE / 2}
            fontSize={9}
            fill="var(--adaptiveGrey500)"
            textAnchor="middle"
          >
            보수·전통
          </text>

          <line
            x1={CHART_PADDING}
            y1={CHART_CENTER}
            x2={CHART_SIZE - CHART_PADDING}
            y2={CHART_CENTER}
            stroke="var(--adaptiveGrey400)"
            strokeWidth={1.5}
          />
          <line
            x1={CHART_CENTER}
            y1={CHART_PADDING}
            x2={CHART_CENTER}
            y2={CHART_SIZE - CHART_PADDING}
            stroke="var(--adaptiveGrey400)"
            strokeWidth={1.5}
          />
          <circle cx={CHART_PADDING} cy={CHART_CENTER} r={2} fill="var(--adaptiveGrey400)" />
          <circle cx={CHART_SIZE - CHART_PADDING} cy={CHART_CENTER} r={2} fill="var(--adaptiveGrey400)" />
          <circle cx={CHART_CENTER} cy={CHART_PADDING} r={2} fill="var(--adaptiveGrey400)" />
          <circle cx={CHART_CENTER} cy={CHART_SIZE - CHART_PADDING} r={2} fill="var(--adaptiveGrey400)" />

          <text x={CHART_PADDING + 4} y={CHART_CENTER - 6} fontSize={10} fill="var(--adaptiveGrey500)">
            진보
          </text>
          <text
            x={CHART_SIZE - CHART_PADDING - 4}
            y={CHART_CENTER - 6}
            fontSize={10}
            fill="var(--adaptiveGrey500)"
            textAnchor="end"
          >
            보수
          </text>
          <text x={CHART_CENTER + 4} y={CHART_PADDING + 12} fontSize={10} fill="var(--adaptiveGrey500)">
            개방
          </text>
          <text x={CHART_CENTER + 4} y={CHART_SIZE - CHART_PADDING - 4} fontSize={10} fill="var(--adaptiveGrey500)">
            전통
          </text>

          <circle cx={x} cy={y} r={12} fill="#3182f6" stroke="#ffffff" strokeWidth={3} />
          <text
            x={x}
            y={y + 4}
            fontSize={11}
            fill="#ffffff"
            textAnchor="middle"
            fontWeight={900}
          >
            나
          </text>
        </svg>
      </ChartFrame>
    </MapPanel>
  );
}

function SecurityBar({ score }: { score: number }) {
  const clampedScore = clampScore(score);
  const isPositive = clampedScore >= 0;
  const fillRatio = Math.abs(clampedScore) / 100;
  const fillWidth = `${fillRatio * 50}%`;
  const fillLeft = isPositive ? `${50 - fillRatio * 50}%` : "50%";
  const fillColor = isPositive ? "#3182f6" : "#ef4444";

  return (
    <AxisItem>
      <AxisHeader>
        <AxisTitle>안보 축</AxisTitle>
        <AxisScore>{clampedScore > 0 ? `+${clampedScore}` : clampedScore}</AxisScore>
      </AxisHeader>
      <AxisTrack>
        <AxisFill $color={fillColor} $left={fillLeft} $width={fillWidth} />
        <AxisCenter />
      </AxisTrack>
      <AxisLabels>
        <span>대화</span>
        <span>안보</span>
      </AxisLabels>
    </AxisItem>
  );
}

const Page = styled.main`
  min-height: 100vh;
  padding: 28px 24px 72px;
  color: var(--adaptiveGrey900);
  background: var(--adaptiveBackground);

  @media (max-width: 640px) {
    padding: 20px 16px 56px;
  }
`;

const Shell = styled.div`
  display: grid;
  width: min(100%, 1080px);
  gap: 22px;
  margin: 0 auto;
`;

const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;

  @media (max-width: 640px) {
    align-items: flex-start;
    flex-direction: column;
  }
`;

const Brand = styled(Link)`
  color: var(--adaptiveGrey900);
  font-size: 1.05rem;
  font-weight: 900;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
`;

const HeaderLink = styled(Link)`
  display: inline-flex;
  min-height: 40px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--adaptiveHairlineBorder);
  border-radius: var(--radius-control);
  padding: 0 14px;
  color: var(--adaptiveGrey700);
  background: var(--adaptiveLayeredBackground);
  font-size: 0.9rem;
  font-weight: 800;
`;

const HeaderSignOutButton = styled(SignOutButton)`
  display: inline-flex;
  min-height: 40px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--adaptiveHairlineBorder);
  border-radius: var(--radius-control);
  padding: 0 14px;
  color: var(--adaptiveGrey700);
  background: var(--adaptiveLayeredBackground);
  font-size: 0.9rem;
  font-weight: 800;
  cursor: pointer;
`;

const Hero = styled.section`
  display: grid;
  gap: 12px;
  padding: 34px 0 8px;
`;

const HeroEyebrow = styled.div`
  color: var(--adaptiveBlue600);
  font-size: 0.92rem;
  font-weight: 900;
`;

const HeroTitle = styled.h1`
  max-width: 780px;
  margin: 0;
  color: var(--adaptiveGrey900);
  font-size: clamp(2rem, 5vw, 3.6rem);
  font-weight: 900;
  line-height: 1.14;
  word-break: keep-all;
`;

const HeroDescription = styled.p`
  max-width: 640px;
  margin: 0;
  color: var(--adaptiveGrey600);
  font-size: 1rem;
  font-weight: 650;
  line-height: 1.7;
`;

const ProfileSection = styled.section`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 18px;
  padding: 22px;
  border: 1px solid var(--adaptiveHairlineBorder);
  border-radius: var(--radius-card);
  background: var(--adaptiveLayeredBackground);
  box-shadow: var(--shadow-card);

  @media (max-width: 720px) {
    grid-template-columns: auto minmax(0, 1fr);
  }
`;

const Avatar = styled.div`
  display: inline-flex;
  width: 72px;
  height: 72px;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 50%;
  color: var(--white);
  background: var(--adaptiveBlue500);
  font-size: 1.6rem;
  font-weight: 900;
`;

const AvatarImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const ProfileContent = styled.div`
  display: grid;
  min-width: 0;
  gap: 5px;
`;

const ProfileName = styled.h2`
  margin: 0;
  color: var(--adaptiveGrey900);
  font-size: 1.45rem;
  font-weight: 900;
`;

const ProfileEmail = styled.div`
  overflow: hidden;
  color: var(--adaptiveGrey600);
  font-size: 0.95rem;
  font-weight: 700;
  text-overflow: ellipsis;
`;

const DistrictLine = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--adaptiveGrey800);
  font-size: 0.94rem;
  font-weight: 800;
`;

const ProfileAction = styled(Link)`
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border-radius: var(--radius-control);
  padding: 0 15px;
  color: var(--white);
  background: var(--adaptiveBlue500);
  font-size: 0.92rem;
  font-weight: 900;

  @media (max-width: 720px) {
    grid-column: 1 / -1;
  }
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
  gap: 16px;

  @media (max-width: 940px) {
    grid-template-columns: 1fr;
  }
`;

const Section = styled.section`
  display: grid;
  align-content: start;
  gap: 18px;
  padding: 22px;
  border: 1px solid var(--adaptiveHairlineBorder);
  border-radius: var(--radius-card);
  background: var(--adaptiveLayeredBackground);
  box-shadow: var(--shadow-card);
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const SectionKicker = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: var(--adaptiveGrey900);
  font-size: 0.95rem;
  font-weight: 900;
`;

const SectionDate = styled.div`
  color: var(--adaptiveGrey500);
  font-size: 0.84rem;
  font-weight: 800;
`;

const PoliticalType = styled.div`
  color: var(--adaptiveGrey900);
  font-size: clamp(1.7rem, 4vw, 2.45rem);
  font-weight: 900;
  line-height: 1.18;
  word-break: keep-all;
`;

const MapPanel = styled.div`
  display: grid;
  gap: 14px;
  padding: 18px;
  border-radius: var(--radius-control);
  background: var(--adaptiveGreyBackground);
`;

const MapHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  @media (max-width: 560px) {
    align-items: flex-start;
    flex-direction: column;
  }
`;

const MapTitle = styled.div`
  color: var(--adaptiveGrey900);
  font-size: 0.96rem;
  font-weight: 900;
`;

const MapSummary = styled.div`
  color: var(--adaptiveGrey600);
  font-size: 0.84rem;
  font-weight: 850;
`;

const ChartFrame = styled.div`
  width: 100%;
  max-width: 360px;
  margin: 0 auto;
  border: 1px solid var(--adaptiveHairlineBorder);
  border-radius: var(--radius-control);
  background: var(--adaptiveLayeredBackground);
  overflow: hidden;

  & > svg {
    display: block;
  }
`;

const AxisItem = styled.div`
  display: grid;
  gap: 9px;
`;

const AxisHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const AxisTitle = styled.div`
  color: var(--adaptiveGrey800);
  font-size: 0.92rem;
  font-weight: 900;
`;

const AxisScore = styled.div`
  color: var(--adaptiveGrey600);
  font-size: 0.86rem;
  font-weight: 900;
`;

const AxisTrack = styled.div`
  position: relative;
  height: 14px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--adaptiveGreyBackground);
`;

const AxisCenter = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  width: 2px;
  background: var(--adaptiveHairlineBorder);
`;

const AxisFill = styled("div", {
  shouldForwardProp: (prop) =>
    prop !== "$color" && prop !== "$left" && prop !== "$width",
})<{ $color: string; $left: string; $width: string }>`
  position: absolute;
  top: 0;
  bottom: 0;
  left: ${({ $left }) => $left};
  width: ${({ $width }) => $width};
  border-radius: 999px;
  background: ${({ $color }) => $color};
`;

const AxisLabels = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--adaptiveGrey500);
  font-size: 0.8rem;
  font-weight: 800;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
`;

const StatLabel = styled.div`
  color: var(--adaptiveGrey600);
  font-size: 0.82rem;
  font-weight: 900;
`;

const StatValue = styled("div", {
  shouldForwardProp: (prop) => prop !== "$tone",
})<{ $tone: string }>`
  color: ${({ $tone }) => $tone};
  font-size: 1.85rem;
  font-weight: 900;
  line-height: 1;
`;

const StatCard = styled("div", {
  shouldForwardProp: (prop) => prop !== "$tone",
})<{ $tone: string }>`
  display: grid;
  gap: 8px;
  padding: 16px;
  border-radius: var(--radius-control);
  background: var(--adaptiveGreyBackground);
  box-shadow: inset 0 0 0 1px var(--adaptiveHairlineBorder);
`;

const BattleList = styled.div`
  display: grid;
  gap: 10px;
`;

const BattleItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 0;
  border-bottom: 1px solid var(--adaptiveHairlineBorder);

  &:last-of-type {
    border-bottom: 0;
  }

  @media (max-width: 560px) {
    align-items: flex-start;
    flex-direction: column;
  }
`;

const BattleTopic = styled.div`
  color: var(--adaptiveGrey900);
  font-size: 0.96rem;
  font-weight: 850;
  line-height: 1.45;
  word-break: keep-all;
`;

const BattleMeta = styled.div`
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 9px;
  color: var(--adaptiveGrey500);
  font-size: 0.82rem;
  font-weight: 800;
`;

const ResultBadge = styled("span", {
  shouldForwardProp: (prop) => prop !== "$tone",
})<{ $tone: string }>`
  display: inline-flex;
  min-height: 26px;
  align-items: center;
  border-radius: 999px;
  padding: 0 9px;
  color: ${({ $tone }) => $tone};
  background: var(--adaptiveGreyBackground);
  font-size: 0.78rem;
  font-weight: 900;
`;

const EmptyState = styled.div`
  display: grid;
  gap: 10px;
  padding: 20px;
  border-radius: var(--radius-control);
  background: var(--adaptiveGreyBackground);
`;

const EmptyTitle = styled.h3`
  margin: 0;
  color: var(--adaptiveGrey900);
  font-size: 1.08rem;
  font-weight: 900;
`;

const EmptyText = styled.p`
  margin: 0;
  color: var(--adaptiveGrey600);
  font-size: 0.92rem;
  font-weight: 650;
  line-height: 1.6;
`;

const PrimaryLink = styled(Link)`
  display: inline-flex;
  width: fit-content;
  min-height: 42px;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border-radius: var(--radius-control);
  padding: 0 14px;
  color: var(--white);
  background: var(--adaptiveBlue500);
  font-size: 0.9rem;
  font-weight: 900;
`;

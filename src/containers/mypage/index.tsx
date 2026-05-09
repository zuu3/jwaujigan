"use client";

import styled from "@emotion/styled";
import { ArrowRight, BarChart3, MapPin, RotateCcw, Swords } from "lucide-react";
import Image from "next/image";
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
    return "#3182F6";
  }

  if (result === "lose") {
    return "#E5484D";
  }

  return "#8B95A1";
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
          <HeroTitle>내 정치 성향과 토론 기록</HeroTitle>
          <HeroDescription>
            지역구, 성향 분석, AI 배틀 기록을 한 곳에서 관리하세요.
          </HeroDescription>
        </Hero>

        <ProfileSection>
          <Avatar aria-hidden="true">
            {profile.image ? (
              <AvatarImage src={profile.image} alt="" width={56} height={56} />
            ) : (
              getInitial(profile.name, profile.email)
            )}
          </Avatar>
          <ProfileContent>
            <ProfileName>{profile.name ?? "사용자"}</ProfileName>
            <ProfileEmail>{profile.email}</ProfileEmail>
            <DistrictLine>
              <MapPin size={14} />
              <span>{profile.district ?? "지역구 미설정"}</span>
            </DistrictLine>
          </ProfileContent>
          <ProfileAction href="/onboarding">
            <RotateCcw size={14} />
            <span>온보딩 다시 하기</span>
          </ProfileAction>
        </ProfileSection>

        <Section>
          <SectionHeader>
            <SectionKicker>
              <BarChart3 size={14} />
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
                <ArrowRight size={14} />
              </PrimaryLink>
            </EmptyState>
          )}
        </Section>

        <Section>
          <SectionHeader>
            <SectionKicker>
              <Swords size={14} />
              <span>배틀 전적</span>
            </SectionKicker>
            <SectionDate>전체 {battleLogs.length}전</SectionDate>
          </SectionHeader>

          <StatsGrid>
            <StatCard>
              <StatLabel>승리</StatLabel>
              <StatValue $tone="#3182F6">{stats.win}</StatValue>
            </StatCard>
            <StatCard>
              <StatLabel>패배</StatLabel>
              <StatValue $tone="#E5484D">{stats.lose}</StatValue>
            </StatCard>
            <StatCard>
              <StatLabel>무승부</StatLabel>
              <StatValue $tone="#8B95A1">{stats.draw}</StatValue>
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
                <ArrowRight size={14} />
              </PrimaryLink>
            </EmptyState>
          )}
        </Section>
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
          <line
            x1={CHART_PADDING}
            y1={CHART_CENTER}
            x2={CHART_SIZE - CHART_PADDING}
            y2={CHART_CENTER}
            stroke="#E5E7EB"
            strokeWidth={1}
          />
          <line
            x1={CHART_CENTER}
            y1={CHART_PADDING}
            x2={CHART_CENTER}
            y2={CHART_SIZE - CHART_PADDING}
            stroke="#E5E7EB"
            strokeWidth={1}
          />

          <text x={CHART_PADDING + 4} y={CHART_CENTER - 6} fontSize={11} fill="#8B95A1">
            진보
          </text>
          <text
            x={CHART_SIZE - CHART_PADDING - 4}
            y={CHART_CENTER - 6}
            fontSize={11}
            fill="#8B95A1"
            textAnchor="end"
          >
            보수
          </text>
          <text x={CHART_CENTER + 4} y={CHART_PADDING + 12} fontSize={11} fill="#8B95A1">
            개방
          </text>
          <text x={CHART_CENTER + 4} y={CHART_SIZE - CHART_PADDING - 4} fontSize={11} fill="#8B95A1">
            전통
          </text>

          <circle cx={x} cy={y} r={10} fill="#3182F6" />
          <text
            x={x}
            y={y + 4}
            fontSize={11}
            fill="#FFFFFF"
            textAnchor="middle"
            fontWeight={700}
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
  const fillColor = isPositive ? "#3182F6" : "#E5484D";

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
  padding: 32px 24px 80px;
  color: #191F28;
  background: #FFFFFF;
  animation: fadeIn 200ms ease-out;

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @media (max-width: 640px) {
    padding: 24px 16px 64px;
  }
`;

const Shell = styled.div`
  display: flex;
  flex-direction: column;
  width: min(100%, 880px);
  gap: 40px;
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
  color: #191F28;
  font-size: 18px;
  font-weight: 700;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const HeaderLink = styled(Link)`
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  padding: 0 14px;
  color: #4E5968;
  background: #FFFFFF;
  font-size: 14px;
  font-weight: 600;
  transition: background 140ms ease-out;

  &:hover {
    background: #F2F4F6;
  }
`;

const HeaderSignOutButton = styled(SignOutButton)`
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  padding: 0 14px;
  color: #4E5968;
  background: #FFFFFF;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 140ms ease-out;

  &:hover {
    background: #F2F4F6;
  }
`;

const Hero = styled.section`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const HeroEyebrow = styled.div`
  color: #4E5968;
  font-size: 14px;
  font-weight: 600;
`;

const HeroTitle = styled.h1`
  margin: 0;
  color: #191F28;
  font-size: 32px;
  font-weight: 700;
  line-height: 1.25;
  word-break: keep-all;
`;

const HeroDescription = styled.p`
  margin: 0;
  color: #4E5968;
  font-size: 16px;
  font-weight: 400;
  line-height: 1.6;
`;

const ProfileSection = styled.section`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 16px;
  padding: 24px 0;
  border-top: 1px solid #E5E7EB;
  border-bottom: 1px solid #E5E7EB;

  @media (max-width: 720px) {
    grid-template-columns: auto minmax(0, 1fr);
  }
`;

const Avatar = styled.div`
  display: inline-flex;
  width: 56px;
  height: 56px;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 50%;
  color: #FFFFFF;
  background: #191F28;
  font-size: 18px;
  font-weight: 700;
`;

const AvatarImage = styled(Image)`
  object-fit: cover;
  border-radius: 50%;
`;

const ProfileContent = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 4px;
`;

const ProfileName = styled.h2`
  margin: 0;
  color: #191F28;
  font-size: 18px;
  font-weight: 700;
`;

const ProfileEmail = styled.div`
  overflow: hidden;
  color: #8B95A1;
  font-size: 14px;
  font-weight: 400;
  text-overflow: ellipsis;
`;

const DistrictLine = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #4E5968;
  font-size: 14px;
  font-weight: 500;
`;

const ProfileAction = styled(Link)`
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border-radius: 8px;
  padding: 0 16px;
  color: #FFFFFF;
  background: #191F28;
  font-size: 14px;
  font-weight: 600;
  transition: opacity 140ms ease-out;

  &:hover {
    opacity: 0.88;
  }

  @media (max-width: 720px) {
    grid-column: 1 / -1;
  }
`;

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 16px;
  border-bottom: 1px solid #E5E7EB;
`;

const SectionKicker = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #191F28;
  font-size: 18px;
  font-weight: 700;
`;

const SectionDate = styled.div`
  color: #8B95A1;
  font-size: 14px;
  font-weight: 500;
`;

const PoliticalType = styled.div`
  color: #191F28;
  font-size: 24px;
  font-weight: 700;
  line-height: 1.3;
  word-break: keep-all;
`;

const MapPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
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
  color: #191F28;
  font-size: 16px;
  font-weight: 600;
`;

const MapSummary = styled.div`
  color: #4E5968;
  font-size: 14px;
  font-weight: 500;
`;

const ChartFrame = styled.div`
  width: 100%;
  max-width: 360px;
  margin: 0 auto;

  & > svg {
    display: block;
  }
`;

const AxisItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const AxisHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const AxisTitle = styled.div`
  color: #191F28;
  font-size: 16px;
  font-weight: 600;
`;

const AxisScore = styled.div`
  color: #4E5968;
  font-size: 14px;
  font-weight: 600;
`;

const AxisTrack = styled.div`
  position: relative;
  height: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: #F2F4F6;
`;

const AxisCenter = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  width: 1px;
  background: #E5E7EB;
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
  color: #8B95A1;
  font-size: 14px;
  font-weight: 500;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0;
  border-top: 1px solid #E5E7EB;
  border-bottom: 1px solid #E5E7EB;
`;

const StatCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 20px 16px;
  border-right: 1px solid #E5E7EB;

  &:last-of-type {
    border-right: 0;
  }
`;

const StatLabel = styled.div`
  color: #8B95A1;
  font-size: 14px;
  font-weight: 500;
`;

const StatValue = styled("div", {
  shouldForwardProp: (prop) => prop !== "$tone",
})<{ $tone: string }>`
  color: ${({ $tone }) => $tone};
  font-size: 24px;
  font-weight: 700;
  line-height: 1;
`;

const BattleList = styled.div`
  display: flex;
  flex-direction: column;
`;

const BattleItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 0;
  border-bottom: 1px solid #F2F4F6;

  &:last-of-type {
    border-bottom: 0;
  }

  @media (max-width: 560px) {
    align-items: flex-start;
    flex-direction: column;
  }
`;

const BattleTopic = styled.div`
  color: #191F28;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.5;
  word-break: keep-all;
`;

const BattleMeta = styled.div`
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 12px;
  color: #8B95A1;
  font-size: 14px;
  font-weight: 500;
`;

const ResultBadge = styled("span", {
  shouldForwardProp: (prop) => prop !== "$tone",
})<{ $tone: string }>`
  color: ${({ $tone }) => $tone};
  font-size: 14px;
  font-weight: 600;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 32px 0;
  border-top: 1px solid #E5E7EB;
`;

const EmptyTitle = styled.h3`
  margin: 0;
  color: #191F28;
  font-size: 18px;
  font-weight: 700;
`;

const EmptyText = styled.p`
  margin: 0;
  color: #4E5968;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.6;
`;

const PrimaryLink = styled(Link)`
  display: inline-flex;
  width: fit-content;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border-radius: 8px;
  padding: 0 16px;
  color: #FFFFFF;
  background: #191F28;
  font-size: 14px;
  font-weight: 600;
  transition: opacity 140ms ease-out;

  &:hover {
    opacity: 0.88;
  }
`;

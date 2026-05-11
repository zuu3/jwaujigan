"use client";

import styled from "@emotion/styled";
import { Activity, ArrowRight, BarChart3, Bell, MapPin, RotateCcw, Swords } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
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

type FollowedPolitician = {
  id: string;
  name: string;
  image: string | null;
  followed_at: string;
};

type ActivityItem = {
  type: "issue_vote" | "battle_vote" | "orientation_test";
  label: string;
  created_at: string;
};

type ActivitySummary = {
  total_issues: number;
  vote_ratio: { progressive: number; conservative: number; neutral: number };
  last_orientation: { type: string; date: string } | null;
};

type ActivityResponse = {
  summary: ActivitySummary;
  activities: ActivityItem[];
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

function getActivityTypeLabel(type: ActivityItem["type"]) {
  if (type === "issue_vote") return "이슈 투표";
  if (type === "battle_vote") return "배틀 판정";
  return "성향 분석";
}

function getActivityTypeTone(type: ActivityItem["type"]) {
  if (type === "issue_vote") return "#3182f6";
  if (type === "battle_vote") return "#e5484d";
  return "#03b26c";
}

export function MyPageContainer({
  profile,
  politicalProfile,
  battleLogs,
}: MyPageContainerProps) {
  const stats = getBattleStats(battleLogs);
  const recentBattleLogs = battleLogs.slice(0, 5);
  const completedAt = politicalProfile?.completed_at ?? null;
  const [activityData, setActivityData] = useState<ActivityResponse | null>(null);
  const [followedPoliticians, setFollowedPoliticians] = useState<FollowedPolitician[] | null>(null);
  const [politicalDetailOpen, setPoliticalDetailOpen] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/politicians/follows", { signal: controller.signal })
      .then((r) => r.json() as Promise<{ follows: FollowedPolitician[] }>)
      .then(({ follows }) => setFollowedPoliticians(follows))
      .catch(() => null);
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/me/activity", { signal: controller.signal })
      .then((r) => r.json() as Promise<ActivityResponse>)
      .then(setActivityData)
      .catch(() => null);
    return () => controller.abort();
  }, []);

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
              <PoliticalTypeHero>
                <PoliticalTypeBadge>나의 정치 성향</PoliticalTypeBadge>
                <PoliticalType>{politicalProfile.political_type}</PoliticalType>
              </PoliticalTypeHero>
              <PoliticalDetail>
                <PoliticalDetailToggle
                  type="button"
                  onClick={() => setPoliticalDetailOpen((o) => !o)}
                  aria-expanded={politicalDetailOpen}
                >
                  {politicalDetailOpen ? "상세 좌표 접기" : "상세 좌표 보기"}
                </PoliticalDetailToggle>
                {politicalDetailOpen ? (
                  <>
                    <PoliticalMap profile={politicalProfile} />
                    <SecurityBar score={politicalProfile.security_score} />
                  </>
                ) : null}
              </PoliticalDetail>
            </>
          ) : (
            <EmptyState>
              <EmptyTitle>나의 정치 성향이 궁금하지 않으세요?</EmptyTitle>
              <EmptyText>
                12문항에 답하면 경제·사회·안보 3축으로 분석한 나만의 성향 타입이 나옵니다.
              </EmptyText>
              <PrimaryLink href="/onboarding">
                3분 성향 테스트 시작하기
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

          {recentBattleLogs.length > 0 ? (
            <>
              <StatsRow>
                <StatItem>
                  <StatItemLabel>승리</StatItemLabel>
                  <StatItemValue $tone="#3182F6">{stats.win}</StatItemValue>
                </StatItem>
                <StatSep aria-hidden="true">·</StatSep>
                <StatItem>
                  <StatItemLabel>패배</StatItemLabel>
                  <StatItemValue $tone="#E5484D">{stats.lose}</StatItemValue>
                </StatItem>
                <StatSep aria-hidden="true">·</StatSep>
                <StatItem>
                  <StatItemLabel>무승부</StatItemLabel>
                  <StatItemValue $tone="#8B95A1">{stats.draw}</StatItemValue>
                </StatItem>
              </StatsRow>
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
            </>
          ) : (
            <EmptyState>
              <EmptyTitle>아직 배틀 기록이 없습니다</EmptyTitle>
              <EmptyText>
                이슈에 투표한 뒤 진보 AI와 보수 AI의 논쟁을 직접 판정해 보세요.
              </EmptyText>
              <PrimaryLink href="/home">
                이슈 보러 가기
                <ArrowRight size={14} />
              </PrimaryLink>
            </EmptyState>
          )}
        </Section>

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
                팔로우한 정치인이 관련 이슈에 등장하면 홈 피드에서 바로 확인할 수 있습니다.
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

        <Section>
          <SectionHeader>
            <SectionKicker>
              <Activity size={14} />
              <span>내 활동</span>
            </SectionKicker>
            {activityData ? (
              <SectionDate>총 {activityData.summary.total_issues}개 이슈 참여</SectionDate>
            ) : null}
          </SectionHeader>

          {activityData ? (
            activityData.summary.total_issues === 0 ? (
              <EmptyState>
                <EmptyTitle>아직 참여한 이슈가 없습니다</EmptyTitle>
                <EmptyText>
                  이슈에 투표하거나 배틀을 완료하면 나의 정치 활동 흐름이 여기에 쌓입니다.
                </EmptyText>
                <PrimaryLink href="/home">
                  오늘의 핫이슈 보기
                  <ArrowRight size={14} />
                </PrimaryLink>
              </EmptyState>
            ) : (
              <>
                <ActivitySummaryCard>
                  <SummaryBlock>
                    <SummaryLabel>이슈 참여</SummaryLabel>
                    <SummaryValue>{activityData.summary.total_issues}</SummaryValue>
                  </SummaryBlock>
                  <SummaryDivider />
                  <SummaryBlock>
                    <SummaryLabel>투표 성향</SummaryLabel>
                    <VoteRatioBar ratio={activityData.summary.vote_ratio} />
                  </SummaryBlock>
                  {activityData.summary.last_orientation ? (
                    <>
                      <SummaryDivider />
                      <SummaryBlock>
                        <SummaryLabel>마지막 성향</SummaryLabel>
                        <SummaryOrientationType>
                          {activityData.summary.last_orientation.type}
                        </SummaryOrientationType>
                        <SummaryDate>
                          {formatDate(activityData.summary.last_orientation.date)}
                        </SummaryDate>
                      </SummaryBlock>
                    </>
                  ) : null}
                </ActivitySummaryCard>

                <Timeline as="ul">
                  {activityData.activities.map((item, i) => (
                    <TimelineItem as="li" key={`${item.type}-${item.created_at}-${i}`}>
                      <TimelineDot $tone={getActivityTypeTone(item.type)} aria-hidden="true" />
                      <TimelineContent>
                        <TimelineTypeBadge $tone={getActivityTypeTone(item.type)}>
                          {getActivityTypeLabel(item.type)}
                        </TimelineTypeBadge>
                        <TimelineLabel>{item.label}</TimelineLabel>
                        <TimelineDate>{formatDate(item.created_at)}</TimelineDate>
                      </TimelineContent>
                    </TimelineItem>
                  ))}
                </Timeline>
              </>
            )
          ) : (
            <ActivitySkeleton>
              <SkeletonBlock $h={80} />
              <SkeletonBlock $h={52} />
              <SkeletonBlock $h={52} />
              <SkeletonBlock $h={52} />
            </ActivitySkeleton>
          )}
        </Section>
      </Shell>
    </Page>
  );
}

function VoteRatioBar({
  ratio,
}: {
  ratio: { progressive: number; conservative: number; neutral: number };
}) {
  const total = ratio.progressive + ratio.conservative + ratio.neutral;
  if (total === 0) return <SummaryValue style={{ fontSize: 14, color: "#8b95a1" }}>투표 없음</SummaryValue>;
  const pPct = Math.round((ratio.progressive / total) * 100);
  const cPct = Math.round((ratio.conservative / total) * 100);
  const nPct = 100 - pPct - cPct;

  return (
    <VoteRatioWrap>
      <VoteRatioTrack>
        {pPct > 0 && <VoteRatioSegment $color="#3182f6" $pct={pPct} />}
        {nPct > 0 && <VoteRatioSegment $color="#b0b8c1" $pct={nPct} />}
        {cPct > 0 && <VoteRatioSegment $color="#e5484d" $pct={cPct} />}
      </VoteRatioTrack>
      <VoteRatioLegend>
        <VoteRatioLegendItem $color="#3182f6">진보 {pPct}%</VoteRatioLegendItem>
        <VoteRatioLegendItem $color="#b0b8c1">중립 {nPct}%</VoteRatioLegendItem>
        <VoteRatioLegendItem $color="#e5484d">보수 {cPct}%</VoteRatioLegendItem>
      </VoteRatioLegend>
    </VoteRatioWrap>
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

  @media (prefers-reduced-motion: reduce) {
    animation: none;
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

const PoliticalTypeHero = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 24px 0 8px;
`;

const PoliticalTypeBadge = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: #8b95a1;
  text-transform: uppercase;
  letter-spacing: 0.06em;
`;

const PoliticalDetail = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const PoliticalDetailToggle = styled.button`
  align-self: flex-start;
  padding: 6px 12px;
  border: 1px solid #e5e8eb;
  border-radius: 9999px;
  background: transparent;
  color: #6b7684;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 140ms ease-out;

  &:hover {
    background: #f2f4f6;
  }

  &:focus-visible {
    outline: 2px solid #3182f6;
    outline-offset: 2px;
  }
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

const StatsRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 0;
  border-top: 1px solid #E5E7EB;
  border-bottom: 1px solid #E5E7EB;

  @media (max-width: 480px) {
    gap: 12px;
  }
`;

const StatItem = styled.div`
  display: flex;
  align-items: baseline;
  gap: 6px;
`;

const StatItemLabel = styled.span`
  color: #8B95A1;
  font-size: 14px;
  font-weight: 500;
`;

const StatItemValue = styled("span", {
  shouldForwardProp: (prop) => prop !== "$tone",
})<{ $tone: string }>`
  color: ${({ $tone }) => $tone};
  font-size: 20px;
  font-weight: 700;
  line-height: 1;
  font-variant-numeric: tabular-nums;
`;

const StatSep = styled.span`
  color: #E5E7EB;
  font-size: 16px;
  font-weight: 400;
  user-select: none;
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

/* ── Activity Section ─────────────────────────────────── */

const ActivitySummaryCard = styled.div`
  display: flex;
  gap: 0;
  border: 1px solid #e5e8eb;
  border-radius: 12px;
  overflow: hidden;

  @media (max-width: 560px) {
    flex-direction: column;
  }
`;

const SummaryBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  padding: 20px;
`;

const SummaryDivider = styled.div`
  width: 1px;
  background: #e5e8eb;
  flex-shrink: 0;

  @media (max-width: 560px) {
    width: auto;
    height: 1px;
  }
`;

const SummaryLabel = styled.div`
  color: #8b95a1;
  font-size: 12px;
  font-weight: 600;
`;

const SummaryValue = styled.div`
  color: #191f28;
  font-size: 28px;
  font-weight: 700;
  line-height: 1;
  font-variant-numeric: tabular-nums;
`;

const SummaryOrientationType = styled.div`
  color: #191f28;
  font-size: 15px;
  font-weight: 700;
  word-break: keep-all;
`;

const SummaryDate = styled.div`
  color: #8b95a1;
  font-size: 12px;
  font-weight: 500;
`;

const VoteRatioWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const VoteRatioTrack = styled.div`
  display: flex;
  height: 8px;
  border-radius: 9999px;
  overflow: hidden;
  gap: 2px;
`;

const VoteRatioSegment = styled.div<{ $color: string; $pct: number }>`
  flex: ${({ $pct }) => $pct};
  background: ${({ $color }) => $color};
`;

const VoteRatioLegend = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
`;

const VoteRatioLegendItem = styled.span<{ $color: string }>`
  font-size: 11px;
  font-weight: 600;
  color: ${({ $color }) => $color};
  font-variant-numeric: tabular-nums;
`;

const Timeline = styled.div`
  display: flex;
  flex-direction: column;
  padding-left: 0;
  list-style: none;
  margin: 0;
  padding: 0;
`;

const TimelineItem = styled.div`
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 14px 0;

  &:not(:last-of-type) {
    border-bottom: 1px solid #f2f4f6;
  }
`;

const TimelineDot = styled.div<{ $tone: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ $tone }) => $tone};
  flex-shrink: 0;
  margin-top: 6px;
`;

const TimelineContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
`;

const TimelineTypeBadge = styled.span<{ $tone: string }>`
  display: inline-block;
  width: fit-content;
  padding: 2px 7px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  background: ${({ $tone }) => $tone}18;
  color: ${({ $tone }) => $tone};
`;

const TimelineLabel = styled.div`
  color: #191f28;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.5;
  word-break: keep-all;
`;

const TimelineDate = styled.div`
  color: #8b95a1;
  font-size: 12px;
  font-weight: 500;
`;

/* ── Follow Section ───────────────────────────────────── */

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

const ActivitySkeleton = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const SkeletonBlock = styled.div<{ $h: number }>`
  height: ${({ $h }) => $h}px;
  border-radius: 8px;
  background: #f2f4f6;
  animation: shimmer 1.2s linear infinite;

  @keyframes shimmer {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

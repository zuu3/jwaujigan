"use client";

import styled from "@/lib/styled";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Lock, MapPin } from "lucide-react";
import type { PublicProfile } from "@/app/api/u/[userId]/route";
import { getLevel } from "@/services/points/points";
import { StreakCalendar } from "@/components/mypage/StreakCalendar";
import { BadgesSection } from "@/components/mypage/BadgesSection";
import { getInitial } from "@/lib/mypage-utils";

type Props =
  | { profile: PublicProfile; isPrivate: false }
  | { profile: null; isPrivate: true };

export function PublicProfileContainer(props: Props) {
  if (props.isPrivate) {
    return (
      <Page>
        <Shell>
          <TopBar>
            <BackLink href="/home">
              <ArrowLeft size={16} />
              <span>홈으로</span>
            </BackLink>
          </TopBar>
          <PrivateWrap>
            <LockBox><Lock size={24} /></LockBox>
            <PrivateTitle>비공개 프로필이에요.</PrivateTitle>
            <PrivateSub>이 사용자는 프로필을 공개하지 않았어요.</PrivateSub>
          </PrivateWrap>
        </Shell>
      </Page>
    );
  }

  const { profile } = props;
  const level = getLevel(profile.points);

  return (
    <Page>
      <Shell>
        <TopBar>
          <BackLink href="/home">
            <ArrowLeft size={16} />
            <span>홈으로</span>
          </BackLink>
        </TopBar>

        <ProfileSection>
          <Avatar>
            {profile.image ? (
              <AvatarImage src={profile.image} alt="" width={56} height={56} unoptimized />
            ) : (
              getInitial(profile.name, "")
            )}
          </Avatar>
          <ProfileContent>
            <ProfileName>{profile.name ?? "사용자"}</ProfileName>
            {profile.district && (
              <DistrictLine>
                <MapPin size={14} />
                <span>{profile.district}</span>
              </DistrictLine>
            )}
            {profile.political_type && (
              <PoliticalTag>{profile.political_type}</PoliticalTag>
            )}
            <LevelRow>
              <LevelTitle>{level.title}</LevelTitle>
              <LevelSep aria-hidden>•</LevelSep>
              <LevelPoints>{profile.points.toLocaleString("ko-KR")}점</LevelPoints>
            </LevelRow>
            <ProgressTrack>
              <ProgressFill style={{ width: `${level.progress}%` }} />
            </ProgressTrack>
          </ProfileContent>
        </ProfileSection>

        <StreakCalendar
          activeDates={profile.active_dates}
          streak={profile.streak}
          todayActive={profile.today_active}
        />

        {profile.battle_stats.total > 0 && (
          <StatsCard>
            <StatsTitle>배틀 전적</StatsTitle>
            <StatsRow>
              <StatTotal>{profile.battle_stats.total}전</StatTotal>
              <StatSep aria-hidden>·</StatSep>
              <StatWin>승 {profile.battle_stats.win}</StatWin>
              <StatSep aria-hidden>·</StatSep>
              <StatDraw>무 {profile.battle_stats.draw}</StatDraw>
              <StatSep aria-hidden>·</StatSep>
              <StatLose>패 {profile.battle_stats.lose}</StatLose>
            </StatsRow>
          </StatsCard>
        )}

        {(() => {
          const { progressive, conservative, neutral } = profile.vote_ratio;
          const total = progressive + conservative + neutral;
          if (total === 0) return null;
          const pPct = Math.round((progressive / total) * 100);
          const cPct = Math.round((conservative / total) * 100);
          const nPct = 100 - pPct - cPct;
          return (
            <StatsCard>
              <StatsTitle>투표 성향</StatsTitle>
              <VoteBar>
                {pPct > 0 && <VoteSegment style={{ width: `${pPct}%`, background: "#3182f6" }} />}
                {nPct > 0 && <VoteSegment style={{ width: `${nPct}%`, background: "#b0b8c1" }} />}
                {cPct > 0 && <VoteSegment style={{ width: `${cPct}%`, background: "#e5484d" }} />}
              </VoteBar>
              <VoteLegend>
                <VoteLegendItem><VoteDot style={{ background: "#3182f6" }} />진보 <VotePct>{pPct}%</VotePct></VoteLegendItem>
                <VoteLegendItem><VoteDot style={{ background: "#b0b8c1" }} />중립 <VotePct>{nPct}%</VotePct></VoteLegendItem>
                <VoteLegendItem><VoteDot style={{ background: "#e5484d" }} />보수 <VotePct>{cPct}%</VotePct></VoteLegendItem>
              </VoteLegend>
            </StatsCard>
          );
        })()}

        <BadgesSection badges={profile.badges} />
      </Shell>
    </Page>
  );
}

/* ── Styled ──────────────────────────────────────────────── */

const Page = styled.main`
  min-height: 100vh;
  padding-bottom: 80px;
  background: #ffffff;
  color: #191f28;
  animation: fadeIn 200ms ease-out;
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
`;

const Shell = styled.div`
  display: flex;
  flex-direction: column;
  width: min(100%, 880px);
  gap: 40px;
  margin: 0 auto;
  padding: 32px 24px 0;
  @media (max-width: 640px) { padding: 24px 20px 0; }
`;

const TopBar = styled.div`
  display: flex;
  align-items: center;
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #4e5968;
  font-size: 14px;
  font-weight: 600;
  &:hover { color: #191f28; }
`;

const PrivateWrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 80px 0;
  text-align: center;
`;

const LockBox = styled.div`
  display: grid;
  width: 56px;
  height: 56px;
  place-items: center;
  border-radius: 16px;
  background: #f2f4f6;
  color: #8b95a1;
`;

const PrivateTitle = styled.h1`
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #191f28;
`;

const PrivateSub = styled.p`
  margin: 0;
  font-size: 14px;
  color: #8b95a1;
`;

const ProfileSection = styled.section`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 16px;
  padding: 24px 0;
  border-top: 1px solid #e5e8eb;
  border-bottom: 1px solid #e5e8eb;
`;

const Avatar = styled.div`
  display: inline-flex;
  width: 56px;
  height: 56px;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 50%;
  background: #191f28;
  color: #ffffff;
  font-size: 18px;
  font-weight: 700;
  flex-shrink: 0;
`;

const AvatarImage = styled(Image)`
  object-fit: cover;
  border-radius: 50%;
`;

const ProfileContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
`;

const ProfileName = styled.h1`
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #191f28;
`;

const DistrictLine = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #4e5968;
  font-size: 14px;
  font-weight: 500;
`;

const PoliticalTag = styled.span`
  display: inline-flex;
  padding: 2px 8px;
  border-radius: 4px;
  background: #e8f3ff;
  color: #3182f6;
  font-size: 12px;
  font-weight: 600;
  width: fit-content;
`;

const LevelRow = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #3182f6;
  font-size: 13px;
  font-weight: 600;
  margin-top: 2px;
`;

const LevelTitle = styled.span``;
const LevelSep = styled.span`color: #b0b8c1; font-weight: 400;`;
const LevelPoints = styled.span``;

const ProgressTrack = styled.div`
  width: 96px;
  height: 4px;
  border-radius: 2px;
  background: #e5e8eb;
  overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  border-radius: 2px;
  background: #3182f6;
`;

const StatsCard = styled.section`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 20px 0;
  border-top: 1px solid #e5e8eb;
`;

const StatsTitle = styled.h2`
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #4e5968;
`;

const StatsRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-variant-numeric: tabular-nums;
`;

const StatTotal = styled.span`
  font-size: 16px;
  font-weight: 700;
  color: #191f28;
`;

const StatSep = styled.span`
  color: #b0b8c1;
  font-weight: 400;
`;

const StatWin = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: #3182f6;
`;

const StatDraw = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: #8b95a1;
`;

const StatLose = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: #e5484d;
`;

const VoteBar = styled.div`
  display: flex;
  width: 100%;
  height: 8px;
  border-radius: 4px;
  overflow: hidden;
  gap: 2px;
`;

const VoteSegment = styled.div`
  height: 100%;
  border-radius: 4px;
`;

const VoteLegend = styled.div`
  display: flex;
  gap: 16px;
`;

const VoteLegendItem = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 400;
  color: #6b7684;
`;

const VoteDot = styled.span`
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
`;

const VotePct = styled.span`
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: #191f28;
`;

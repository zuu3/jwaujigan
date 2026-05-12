"use client";

import styled from "@emotion/styled";
import { MapPin, RotateCcw } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/app-header";
import type {
  MyPageProfile,
  PoliticalProfile,
  BattleLogItem,
  FollowedPolitician,
  ActivityResponse,
} from "@/types/mypage";
import { getInitial } from "@/lib/mypage-utils";
import { PoliticalProfileSection } from "@/components/mypage/PoliticalProfileSection";
import { BattleSection } from "@/components/mypage/BattleSection";
import { FollowingSection } from "@/components/mypage/FollowingSection";
import { ActivitySection } from "@/components/mypage/ActivitySection";
import { BadgesSection } from "@/components/mypage/BadgesSection";
import { StreakCalendar } from "@/components/mypage/StreakCalendar";
import { getLevel } from "@/services/points/points";
import { useUserProfile } from "@/services/user/user.queries";

export type { MyPageProfile, PoliticalProfile, BattleLogItem } from "@/types/mypage";

type MyPageContainerProps = {
  profile: MyPageProfile;
  politicalProfile: PoliticalProfile | null;
  battleLogs: BattleLogItem[];
};

export function MyPageContainer({
  profile,
  politicalProfile,
  battleLogs,
}: MyPageContainerProps) {
  const [activityData, setActivityData] = useState<ActivityResponse | null>(null);
  const [followedPoliticians, setFollowedPoliticians] = useState<FollowedPolitician[] | null>(null);
  const profileQuery = useUserProfile();

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
      <AppHeader userName={profile.name} userImage={profile.image} />
      <Shell>
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
            <PointsBadge points={profileQuery.data?.points ?? profile.points} />
          </ProfileContent>
          <ProfileAction href="/onboarding">
            <RotateCcw size={14} />
            <span>온보딩 다시 하기</span>
          </ProfileAction>
        </ProfileSection>

        <PoliticalProfileSection politicalProfile={politicalProfile} />
        {activityData && (
          <>
            <StreakCalendar
              activeDates={activityData.active_dates}
              streak={activityData.streak}
              todayActive={activityData.today_active}
            />
            <BadgesSection badges={activityData.badges} />
          </>
        )}
        <BattleSection battleLogs={battleLogs} />
        <FollowingSection followedPoliticians={followedPoliticians} />
        <ActivitySection activityData={activityData} />
      </Shell>
    </Page>
  );
}

/* ── Styled components ────────────────────────────────── */

const Page = styled.main`
  min-height: 100vh;
  padding-bottom: 80px;
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
    padding-bottom: 64px;
  }
`;

const Shell = styled.div`
  display: flex;
  flex-direction: column;
  width: min(100%, 880px);
  gap: 40px;
  margin: 0 auto;
  padding: 32px 24px 0;

  @media (max-width: 640px) {
    padding: 24px 16px 0;
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

/* ── PointsBadge ────────────────────────────────────────── */

function PointsBadge({ points }: { points: number }) {
  const level = getLevel(points);
  return (
    <PointsBadgeRoot>
      <PointsRow>
        <span>{level.title}</span>
        <PointsSep aria-hidden="true">•</PointsSep>
        <span>{points.toLocaleString("ko-KR")}점</span>
      </PointsRow>
      <ProgressRow>
        <ProgressTrack>
          <ProgressFill style={{ width: `${level.progress}%` }} />
        </ProgressTrack>
        {level.next !== null ? (
          <ProgressLabel>다음 등급까지 {(level.next - points).toLocaleString("ko-KR")}점</ProgressLabel>
        ) : (
          <ProgressLabel>최고 등급</ProgressLabel>
        )}
      </ProgressRow>
    </PointsBadgeRoot>
  );
}

const PointsBadgeRoot = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 4px;
`;

const PointsRow = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #3182f6;
  font-size: 13px;
  font-weight: 600;
`;

const PointsSep = styled.span`
  color: #b0b8c1;
  font-weight: 400;
`;

const ProgressRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ProgressTrack = styled.div`
  width: 96px;
  height: 4px;
  border-radius: 2px;
  background: #e5e8eb;
  overflow: hidden;
  flex-shrink: 0;
`;

const ProgressFill = styled.div`
  height: 100%;
  border-radius: 2px;
  background: #3182f6;
  transition: width 250ms cubic-bezier(0.4, 0, 0.2, 1);
`;

const ProgressLabel = styled.span`
  color: #8b95a1;
  font-size: 12px;
  font-weight: 400;
`;

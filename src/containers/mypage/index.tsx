"use client";

import styled from "@/lib/styled";
import { Gift, Globe, Info, Link2, Lock, MapPin, RotateCcw } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { showToast } from "@/lib/toast";
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
import { DeleteAccountButton } from "@/components/mypage/DeleteAccountButton";
import { getDailyBattleLimit, getLevel, LEVELS_INFO } from "@/services/points/points";
import { useUserProfile } from "@/services/user/user.queries";
import { useQueryClient } from "@tanstack/react-query";

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
  const [copied, setCopied] = useState(false);
  const [referralCount, setReferralCount] = useState<number | null>(null);
  const [referralTodayCount, setReferralTodayCount] = useState<number | null>(null);
  const [visibilityLoading, setVisibilityLoading] = useState(false);
  const profileQuery = useUserProfile();
  const queryClient = useQueryClient();
  const isPublic = profileQuery.data?.is_public ?? true;
  const userId = profileQuery.data?.id ?? null;

  const handleVisibilityToggle = async () => {
    if (visibilityLoading) return;
    setVisibilityLoading(true);
    const next = !isPublic;
    await fetch("/api/me/visibility", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_public: next }),
    });
    await queryClient.invalidateQueries({ queryKey: ["user-profile"] });
    setVisibilityLoading(false);
  };

  const handleCopyLink = async () => {
    if (!userId) return;
    await navigator.clipboard.writeText(`${window.location.origin}/u/${userId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fetchReferralInfo = async () => {
    const res = await fetch("/api/me/referral");
    if (!res.ok) return;
    const data = await res.json() as { code: string; referralUrl: string; count: number; todayCount: number };
    setReferralCount(data.count);
    setReferralTodayCount(data.todayCount);
    return data;
  };

  const handleInvite = async () => {
    if (referralTodayCount !== null && referralTodayCount >= 3) {
      showToast("오늘 초대 한도(3명)에 도달했어요. 내일 다시 시도하세요.", "error");
      return;
    }
    const data = await fetchReferralInfo();
    if (!data) {
      showToast("초대 링크를 불러오지 못했어요.", "error");
      return;
    }
    const shareData = { title: "좌우지간 — 선동 없는 정치 정보", url: data.referralUrl };
    if (navigator.share && navigator.canShare?.(shareData)) {
      await navigator.share(shareData);
    } else {
      await navigator.clipboard.writeText(data.referralUrl);
      showToast("초대 링크가 복사됐어요.");
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchReferralInfo();
  }, []);

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
        <ProfileSection>
          <ProfileTop>
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
                <MapPin size={13} />
                <span>{profile.district ?? "지역구 미설정"}</span>
              </DistrictLine>
              <PointsBadge
                points={profileQuery.data?.points ?? profile.points}
                battleLogs={battleLogs}
              />
            </ProfileContent>
          </ProfileTop>

          <ProfileActionBar>
            <VisibilityRow>
              <VisibilityLabel>
                {isPublic ? <Globe size={13} /> : <Lock size={13} />}
                <span>{isPublic ? "공개" : "비공개"}</span>
              </VisibilityLabel>
              <Toggle
                type="button"
                $on={isPublic}
                $loading={visibilityLoading}
                onClick={() => void handleVisibilityToggle()}
                disabled={visibilityLoading}
                aria-label={isPublic ? "프로필 비공개로 전환" : "프로필 공개로 전환"}
              >
                <ToggleThumb $on={isPublic} $loading={visibilityLoading} />
              </Toggle>
            </VisibilityRow>

            <ActionDivider aria-hidden="true" />

            {isPublic && userId && (
              <ChipButton type="button" onClick={() => void handleCopyLink()}>
                <Link2 size={14} />
                <span>{copied ? "복사됨" : "링크 복사"}</span>
              </ChipButton>
            )}
            <ChipButton
              type="button"
              onClick={() => void handleInvite()}
              disabled={referralTodayCount !== null && referralTodayCount >= 3}
            >
              <Gift size={14} />
              <span>
                친구 초대
                {referralTodayCount !== null
                  ? ` · 오늘 ${referralTodayCount}/3명`
                  : referralCount !== null && referralCount > 0
                    ? ` · ${referralCount}명`
                    : ""}
              </span>
            </ChipButton>

            <ResetLink href="/onboarding">
              <RotateCcw size={13} />
              <span>성향 재검사</span>
            </ResetLink>
          </ProfileActionBar>
        </ProfileSection>

        <PoliticalProfileSection politicalProfile={politicalProfile} />
        <ActivitySection activityData={activityData} />
        <BattleSection battleLogs={battleLogs} />
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
        <FollowingSection followedPoliticians={followedPoliticians} />
        <Footer>
          <DeleteAccountButton />
        </Footer>
      </Shell>
    </Page>
  );
}

/* ── Styled components ────────────────────────────────── */

const Page = styled.main`
  min-height: 100vh;
  padding-bottom: 80px;
  color: #191f28;
  background: #ffffff;
  animation: fadeIn 350ms cubic-bezier(0.0, 0.0, 0.2, 1);

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
    padding: 24px 20px 0;
  }
`;

const ProfileSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 24px 0;
  border-top: 1px solid #e5e8eb;
  border-bottom: 1px solid #e5e8eb;
`;

const ProfileTop = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const Avatar = styled.div`
  display: inline-flex;
  width: 56px;
  height: 56px;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 50%;
  color: #ffffff;
  background: #191f28;
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
  color: #191f28;
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

const ProfileActionBar = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const ActionDivider = styled.div`
  width: 1px;
  height: 16px;
  background: #e5e8eb;
  flex-shrink: 0;
`;

const ResetLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-left: auto;
  color: #8b95a1;
  font-size: 13px;
  font-weight: 500;
  text-decoration: none;
  transition: color 150ms;

  &:hover {
    color: #4e5968;
  }

  @media (max-width: 480px) {
    margin-left: 0;
  }
`;

const VisibilityRow = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
`;

const VisibilityLabel = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #4e5968;
  font-size: 13px;
  font-weight: 500;
`;

const Toggle = styled.button<{ $on: boolean; $loading?: boolean }>`
  position: relative;
  width: 44px;
  height: 24px;
  border-radius: 9999px;
  border: none;
  cursor: ${({ $loading }) => ($loading ? "not-allowed" : "pointer")};
  background: ${({ $on }) => ($on ? "#3182f6" : "#e5e8eb")};
  transition: background 150ms;
  flex-shrink: 0;
  opacity: ${({ $loading }) => ($loading ? 0.6 : 1)};
`;

const ToggleThumb = styled.span<{ $on: boolean; $loading?: boolean }>`
  position: absolute;
  top: 3px;
  left: ${({ $on }) => ($on ? "23px" : "3px")};
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #ffffff;
  transition: left 150ms;
  ${({ $loading }) =>
    $loading &&
    `
    animation: thumbPulse 0.8s ease-in-out infinite;
    @keyframes thumbPulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }
  `}
`;

const ChipButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  padding: 0 14px;
  border-radius: 8px;
  border: 1px solid #e5e8eb;
  background: #ffffff;
  color: #4e5968;
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: border-color 150ms, color 150ms;

  &:hover:not(:disabled) {
    border-color: #3182f6;
    color: #3182f6;
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;

/* ── PointsBadge ────────────────────────────────────────── */

function todayKST(): string {
  return new Date(Date.now() + 9 * 3_600_000).toISOString().slice(0, 10);
}

function PointsBadge({ points, battleLogs }: { points: number; battleLogs: BattleLogItem[] }) {
  const [showInfo, setShowInfo] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const level = getLevel(points);
  const dailyLimit = getDailyBattleLimit(points);
  const todayStr = todayKST();
  const todayCount = battleLogs.filter((b) =>
    new Date(new Date(b.created_at).getTime() + 9 * 3_600_000).toISOString().slice(0, 10) === todayStr
  ).length;
  const limitText = dailyLimit === Infinity ? "무제한" : `${dailyLimit}`;
  const currentLevelIndex = LEVELS_INFO.findIndex((l) => l.title === level.title);

  useEffect(() => {
    if (!showInfo) return;
    const handler = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        !btnRef.current?.contains(e.target as Node)
      ) {
        setShowInfo(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showInfo]);

  return (
    <PointsBadgeRoot>
      <PointsRow>
        <span>{level.title}</span>
        <PointsSep aria-hidden="true">•</PointsSep>
        <span>{points.toLocaleString("ko-KR")}점</span>
        <LevelInfoBtn
          ref={btnRef}
          type="button"
          onClick={() => setShowInfo((v) => !v)}
          aria-label="등급 안내"
          aria-expanded={showInfo}
        >
          <Info size={13} />
        </LevelInfoBtn>
        {showInfo && (
          <LevelPopover ref={popoverRef} role="tooltip">
            <LevelPopoverTitle>등급 안내</LevelPopoverTitle>
            <LevelTable>
              <thead>
                <tr>
                  <LevelTh>등급</LevelTh>
                  <LevelTh>점수</LevelTh>
                  <LevelTh>배틀 한도</LevelTh>
                </tr>
              </thead>
              <tbody>
                {LEVELS_INFO.map((l, i) => (
                  <LevelTr key={l.title} $active={i === currentLevelIndex}>
                    <LevelTd>{l.title}</LevelTd>
                    <LevelTd>{l.range}</LevelTd>
                    <LevelTd>{l.battleLimit}/일</LevelTd>
                  </LevelTr>
                ))}
              </tbody>
            </LevelTable>
            <LevelPopoverNote>배틀 참여, 이슈 투표 등 활동으로 점수가 쌓입니다.</LevelPopoverNote>
          </LevelPopover>
        )}
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
      <BattleCountRow>
        <BattleCountLabel>오늘 배틀</BattleCountLabel>
        <BattleCountValue>
          <BattleUsed>{todayCount}</BattleUsed>
          <BattleSlash>/</BattleSlash>
          <span>{limitText}회</span>
        </BattleCountValue>
      </BattleCountRow>
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
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 4px;
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

const LevelInfoBtn = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: #b0b8c1;
  cursor: pointer;
  flex-shrink: 0;
  padding: 0;
  outline: none;
  -webkit-appearance: none;
  appearance: none;
  transition: color 150ms;

  &:hover {
    color: #3182f6;
  }
`;

const LevelPopover = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  z-index: 40;
  min-width: 260px;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid #e5e8eb;
  background: #ffffff;
  box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.12);
`;

const LevelPopoverTitle = styled.div`
  color: #191f28;
  font-size: 13px;
  font-weight: 700;
  margin-bottom: 10px;
`;

const LevelTable = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const LevelTh = styled.th`
  color: #8b95a1;
  font-size: 12px;
  font-weight: 600;
  text-align: left;
  padding: 0 8px 6px 0;
  border-bottom: 1px solid #f2f4f6;

  &:last-child {
    padding-right: 0;
  }
`;

const LevelTr = styled.tr<{ $active: boolean }>`
  background: ${({ $active }) => ($active ? "#e8f3ff" : "transparent")};
`;

const LevelTd = styled.td`
  color: #191f28;
  font-size: 12px;
  font-weight: 400;
  padding: 6px 8px 6px 0;
  font-variant-numeric: tabular-nums;

  &:last-child {
    padding-right: 0;
  }
`;

const LevelPopoverNote = styled.div`
  margin-top: 10px;
  color: #8b95a1;
  font-size: 12px;
  font-weight: 400;
  line-height: 18px;
`;

const BattleCountRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 2px;
`;

const BattleCountLabel = styled.span`
  color: #8b95a1;
  font-size: 12px;
  font-weight: 400;
`;

const BattleCountValue = styled.span`
  display: inline-flex;
  align-items: baseline;
  gap: 2px;
  color: #4e5968;
  font-size: 12px;
  font-weight: 400;
  font-variant-numeric: tabular-nums;
`;

const BattleUsed = styled.span`
  color: #3182f6;
  font-weight: 700;
  font-size: 13px;
`;

const BattleSlash = styled.span`
  color: #b0b8c1;
`;

const Footer = styled.div`
  padding: 24px 0 8px;
  border-top: 1px solid #f2f4f6;
  display: flex;
  justify-content: center;
`;

"use client";

import styled from "@emotion/styled";
import {
  CheckCircle2,
  Flame,
  Zap,
  Trophy,
  Compass,
  CalendarCheck,
  Star,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Section, SectionHeader, SectionKicker } from "./shared-styles";
import type { BadgeStatus } from "@/types/mypage";

const BADGE_ICONS: Record<string, LucideIcon> = {
  first_vote:   CheckCircle2,
  vote_10:      Flame,
  first_battle: Zap,
  battle_10:    Trophy,
  first_follow: Compass,
  streak_3:     CalendarCheck,
  streak_7:     Star,
};

type Props = {
  badges: BadgeStatus[];
};

export function BadgesSection({ badges }: Props) {
  const earned = badges.filter((b) => b.earned).length;

  return (
    <Section>
      <SectionHeader>
        <SectionKicker>
          뱃지
          <BadgeCount>{earned}/{badges.length}</BadgeCount>
        </SectionKicker>
      </SectionHeader>

      <Grid>
        {badges.map((badge) => {
          const Icon = BADGE_ICONS[badge.id] ?? Star;
          return (
            <BadgeCard key={badge.id} $earned={badge.earned}>
              <IconBox $earned={badge.earned}>
                <Icon size={20} strokeWidth={badge.earned ? 2 : 1.5} />
              </IconBox>
              <BadgeTitle $earned={badge.earned}>{badge.title}</BadgeTitle>
              <BadgeDesc $earned={badge.earned}>{badge.desc}</BadgeDesc>
              {badge.earned && <EarnedDot aria-label="달성" />}
            </BadgeCard>
          );
        })}
      </Grid>
    </Section>
  );
}

/* ── Styled ─────────────────────────────────────────────── */

const BadgeCount = styled.span`
  color: #8b95a1;
  font-size: 14px;
  font-weight: 500;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;

  @media (min-width: 480px) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (min-width: 720px) {
    grid-template-columns: repeat(4, 1fr);
  }
`;

const BadgeCard = styled.div<{ $earned: boolean }>`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  padding: 16px 14px;
  border-radius: 12px;
  border: 1px solid ${({ $earned }) => ($earned ? "#c7dffe" : "#e5e8eb")};
  background: ${({ $earned }) => ($earned ? "#f0f7ff" : "#fafafa")};
  transition: border-color 150ms;
`;

const IconBox = styled.div<{ $earned: boolean }>`
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: ${({ $earned }) => ($earned ? "#3182f6" : "#e5e8eb")};
  color: ${({ $earned }) => ($earned ? "#ffffff" : "#b0b8c1")};
  flex-shrink: 0;
`;

const BadgeTitle = styled.div<{ $earned: boolean }>`
  color: ${({ $earned }) => ($earned ? "#191f28" : "#6b7684")};
  font-size: 13px;
  font-weight: 700;
  line-height: 1.3;
  word-break: keep-all;
`;

const BadgeDesc = styled.div<{ $earned: boolean }>`
  color: ${({ $earned }) => ($earned ? "#4e5968" : "#b0b8c1")};
  font-size: 11px;
  font-weight: 400;
  line-height: 1.4;
  word-break: keep-all;
`;

const EarnedDot = styled.div`
  position: absolute;
  top: 12px;
  right: 12px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #3182f6;
`;

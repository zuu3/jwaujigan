"use client";

import styled from "@/lib/styled";
import Link from "next/link";
import {
  CheckCircle2,
  Flame,
  Zap,
  Trophy,
  Compass,
  CalendarCheck,
  Star,
  Check,
  Award,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Section, SectionHeader, SectionKicker } from "./shared-styles";
import type { BadgeStatus } from "@/types/mypage";

type BadgeMeta = {
  icon: LucideIcon;
  color: string;
  bg: string;
};

const BADGE_META: Record<string, BadgeMeta> = {
  first_vote:   { icon: CheckCircle2, color: "#03b26c", bg: "#e6f7f0" },
  vote_10:      { icon: Flame,        color: "#fe9800", bg: "#fff7e6" },
  first_battle: { icon: Zap,          color: "#3182f6", bg: "#e8f3ff" },
  battle_10:    { icon: Trophy,       color: "#fe9800", bg: "#fff7e6" },
  first_follow: { icon: Compass,      color: "#18a5a5", bg: "#e6f6f6" },
  streak_3:     { icon: CalendarCheck,color: "#3182f6", bg: "#e8f3ff" },
  streak_7:     { icon: Star,         color: "#fe9800", bg: "#fff7e6" },
};

const FALLBACK: BadgeMeta = { icon: Star, color: "#8b95a1", bg: "#f2f4f6" };

const BADGE_CTA: Record<string, string> = {
  first_vote:   "/home",
  vote_10:      "/home",
  first_battle: "/arena",
  battle_10:    "/arena",
  first_follow: "/home",
  streak_3:     "/home",
  streak_7:     "/home",
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
          <Award size={14} />
          뱃지
          <BadgeCount>{earned}/{badges.length}</BadgeCount>
        </SectionKicker>
      </SectionHeader>

      <List>
        {badges.map((badge) => {
          const meta = BADGE_META[badge.id] ?? FALLBACK;
          const Icon = meta.icon;
          const inner = (
            <>
              <IconCircle $color={badge.earned ? meta.color : "#b0b8c1"} $bg={badge.earned ? meta.bg : "#f2f4f6"}>
                <Icon size={16} strokeWidth={badge.earned ? 2 : 1.5} />
              </IconCircle>
              <RowBody>
                <RowTitle $earned={badge.earned}>{badge.title}</RowTitle>
                <RowDesc>{badge.desc}</RowDesc>
              </RowBody>
              {badge.earned ? (
                <EarnedMark aria-label="달성"><Check size={13} strokeWidth={2.5} /></EarnedMark>
              ) : (
                <LockedMark aria-hidden="true">미달성</LockedMark>
              )}
            </>
          );
          return badge.earned ? (
            <Row key={badge.id}>{inner}</Row>
          ) : (
            <RowLink key={badge.id} href={BADGE_CTA[badge.id] ?? "/home"} aria-label={`${badge.title} 달성하러 가기`}>
              {inner}
            </RowLink>
          );
        })}
      </List>
    </Section>
  );
}

/* ── Styled ─────────────────────────────────────────────── */

const BadgeCount = styled.span`
  color: #8b95a1;
  font-size: 14px;
  font-weight: 500;
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
`;

const rowBase = `
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 0;
  border-bottom: 1px solid #f2f4f6;

  &:last-of-type {
    border-bottom: 0;
  }
`;

const Row = styled.div`
  ${rowBase}
`;

const RowLink = styled(Link)`
  ${rowBase}
  text-decoration: none;
  cursor: pointer;

  &:hover {
    background: #f9fafb;
    margin: 0 -20px;
    padding-left: 20px;
    padding-right: 20px;
  }
`;

const IconCircle = styled.div<{ $color: string; $bg: string }>`
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: ${({ $bg }) => $bg};
  color: ${({ $color }) => $color};
  flex-shrink: 0;
`;

const RowBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
`;

const RowTitle = styled.span<{ $earned: boolean }>`
  color: ${({ $earned }) => ($earned ? "#191f28" : "#8b95a1")};
  font-size: 14px;
  font-weight: 600;
  line-height: 1.3;
`;

const RowDesc = styled.span`
  color: #8b95a1;
  font-size: 12px;
  font-weight: 400;
  line-height: 1.4;
`;

const EarnedMark = styled.div`
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #e8f3ff;
  color: #3182f6;
  flex-shrink: 0;
`;

const LockedMark = styled.span`
  color: #b0b8c1;
  font-size: 11px;
  font-weight: 500;
  flex-shrink: 0;
  white-space: nowrap;
`;

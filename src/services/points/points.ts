export const POINTS = {
  VOTE: 10,
  BATTLE: 30,
  FOLLOW: 5,
  ONBOARDING: 20,
} as const;

export const DAILY_BONUS = 5;

type Level = {
  title: string;
  next: number | null;
  progress: number;
};

const LEVELS = [
  { min: 0, max: 99, title: "정치 입문자" },
  { min: 100, max: 299, title: "관심 유권자" },
  { min: 300, max: 599, title: "정치 논객" },
  { min: 600, max: Infinity, title: "여론 선도자" },
] as const;

const LEVEL_BATTLE_LIMITS = [3, 5, 8, Infinity] as const;

export function getLevel(points: number): Level {
  const index = LEVELS.findIndex((l) => points <= l.max);
  const level = index === -1 ? LEVELS[LEVELS.length - 1] : LEVELS[index];
  const isMax = level.max === Infinity;

  const prev = index > 0 ? LEVELS[index - 1].max + 1 : 0;
  const rangeSize = isMax ? 1 : level.max - prev + 1;
  const progress = isMax ? 100 : Math.round(((points - prev) / rangeSize) * 100);

  return {
    title: level.title,
    next: isMax ? null : level.max + 1,
    progress,
  };
}

function getLevelIndex(points: number): number {
  const idx = LEVELS.findIndex((l) => points <= l.max);
  return idx === -1 ? LEVELS.length - 1 : idx;
}

export function getDailyBattleLimit(points: number): number {
  return LEVEL_BATTLE_LIMITS[getLevelIndex(points)] as number;
}

/* ── Badges ───────────────────────────────────────────────── */

export type BadgeId =
  | "first_vote"
  | "vote_10"
  | "first_battle"
  | "battle_10"
  | "first_follow"
  | "streak_3"
  | "streak_7";

export type BadgeDef = {
  id: BadgeId;
  title: string;
  desc: string;
};

export const BADGE_DEFS: readonly BadgeDef[] = [
  { id: "first_vote",   title: "첫 발걸음",   desc: "첫 이슈 투표" },
  { id: "vote_10",      title: "열정 유권자",  desc: "이슈 10개 투표" },
  { id: "first_battle", title: "배틀 입문",    desc: "첫 AI 배틀" },
  { id: "battle_10",    title: "배틀 마스터",  desc: "AI 배틀 10회" },
  { id: "first_follow", title: "정치 탐험가",  desc: "정치인 팔로우 1명" },
  { id: "streak_3",     title: "단골 유권자",  desc: "3일 연속 참여" },
  { id: "streak_7",     title: "정치 주의자",  desc: "7일 연속 참여" },
];

type BadgeStats = {
  issueVotes: number;
  battles: number;
  follows: number;
  streak: number;
};

export function computeEarnedBadgeIds(stats: BadgeStats): BadgeId[] {
  const earned: BadgeId[] = [];
  if (stats.issueVotes >= 1)  earned.push("first_vote");
  if (stats.issueVotes >= 10) earned.push("vote_10");
  if (stats.battles >= 1)     earned.push("first_battle");
  if (stats.battles >= 10)    earned.push("battle_10");
  if (stats.follows >= 1)     earned.push("first_follow");
  if (stats.streak >= 3)      earned.push("streak_3");
  if (stats.streak >= 7)      earned.push("streak_7");
  return earned;
}

/* ── Streak ───────────────────────────────────────────────── */

function toKSTDate(iso: string): string {
  return new Date(new Date(iso).getTime() + 9 * 3_600_000)
    .toISOString()
    .slice(0, 10);
}

function subtractDay(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function calcStreak(isoDates: string[]): number {
  const unique = [...new Set(isoDates.map(toKSTDate))].sort().reverse();
  if (unique.length === 0) return 0;

  const kstNow = new Date(Date.now() + 9 * 3_600_000);
  const todayStr = kstNow.toISOString().slice(0, 10);
  const yesterdayStr = subtractDay(todayStr);

  if (unique[0] !== todayStr && unique[0] !== yesterdayStr) return 0;

  let streak = 0;
  let cursor = unique[0];
  for (const d of unique) {
    if (d === cursor) {
      streak++;
      cursor = subtractDay(cursor);
    } else {
      break;
    }
  }
  return streak;
}

export function kstTodayStartISO(): string {
  const kstNow = new Date(Date.now() + 9 * 3_600_000);
  kstNow.setUTCHours(0, 0, 0, 0);
  return new Date(kstNow.getTime() - 9 * 3_600_000).toISOString();
}

export const POINTS = {
  VOTE: 10,
  BATTLE: 30,
  FOLLOW: 5,
  ONBOARDING: 20,
} as const;

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

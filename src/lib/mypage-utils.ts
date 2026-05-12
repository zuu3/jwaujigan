import type { ActivityItem, BattleLogItem } from "@/types/mypage";

export function getInitial(name: string | null, email: string) {
  return (name?.trim()?.[0] ?? email.trim()[0] ?? "유").toUpperCase();
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

export function getResultLabel(result: string | null) {
  if (result === "win") return "승리";
  if (result === "lose") return "패배";
  if (result === "draw") return "무승부";
  return "기록 없음";
}

export function getResultTone(result: string | null) {
  if (result === "win") return "#3182F6";
  if (result === "lose") return "#E5484D";
  return "#8B95A1";
}

export function getBattleStats(battleLogs: BattleLogItem[]) {
  return battleLogs.reduce(
    (stats, log) => {
      if (log.result === "win") return { ...stats, win: stats.win + 1 };
      if (log.result === "lose") return { ...stats, lose: stats.lose + 1 };
      if (log.result === "draw") return { ...stats, draw: stats.draw + 1 };
      return stats;
    },
    { win: 0, lose: 0, draw: 0 },
  );
}

export function clampScore(score: number) {
  return Math.max(-100, Math.min(100, score));
}

export function getActivityTypeLabel(type: ActivityItem["type"]) {
  if (type === "issue_vote") return "이슈 투표";
  if (type === "battle_vote") return "배틀 판정";
  return "성향 분석";
}

export function getActivityTypeTone(type: ActivityItem["type"]) {
  if (type === "issue_vote") return "#3182f6";
  if (type === "battle_vote") return "#e5484d";
  return "#03b26c";
}

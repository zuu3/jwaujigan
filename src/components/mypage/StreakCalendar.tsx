"use client";

import styled from "@/lib/styled";
import { Section, SectionHeader, SectionKicker } from "./shared-styles";

type Props = {
  activeDates: string[];
  streak: number;
  todayActive: boolean;
};

const WEEKS = 14;
const CELL = 12;
const GAP = 3;
const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];
const SHOW_DAY_ROWS = [0, 2, 4]; // 일, 화, 목

function buildCalendar(activeDates: string[]): { weeks: string[][]; monthLabels: { col: number; label: string }[] } {
  const activeSet = new Set(activeDates);

  // KST 오늘
  const kstNow = new Date(Date.now() + 9 * 3_600_000);
  kstNow.setUTCHours(0, 0, 0, 0);
  const todayStr = kstNow.toISOString().slice(0, 10);

  // 시작일: 오늘 기준 WEEKS주 전 일요일
  const start = new Date(kstNow.getTime() - (WEEKS * 7 - 1) * 86_400_000);
  const startDow = start.getUTCDay();
  start.setUTCDate(start.getUTCDate() - startDow); // 해당 주 일요일

  const weeks: string[][] = [];
  const monthLabels: { col: number; label: string }[] = [];
  let cursor = new Date(start);
  let lastMonth = -1;

  while (cursor <= kstNow) {
    const week: string[] = [];
    for (let d = 0; d < 7; d++) {
      const iso = cursor.toISOString().slice(0, 10);
      week.push(iso <= todayStr ? iso : "future");
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    const colMonth = new Date(week[0] + "T00:00:00Z").getUTCMonth();
    if (colMonth !== lastMonth && week[0] !== "future") {
      monthLabels.push({
        col: weeks.length,
        label: `${colMonth + 1}월`,
      });
      lastMonth = colMonth;
    }
    weeks.push(week);
  }

  return { weeks, monthLabels };
}

export function StreakCalendar({ activeDates, streak, todayActive }: Props) {
  const activeSet = new Set(activeDates);
  const { weeks, monthLabels } = buildCalendar(activeDates);

  const totalWidth = weeks.length * (CELL + GAP) - GAP;

  return (
    <Section>
      <SectionHeader>
        <SectionKicker>
          참여 기록
          <span style={{ color: '#8b95a1', fontSize: '13px', fontWeight: 400 }}>최근 14주</span>
        </SectionKicker>
        <StreakPill $active={streak > 0}>
          {streak > 0
            ? todayActive
              ? `${streak}일 연속`
              : `${streak}일 — 오늘 참여하면 ${streak + 1}일`
            : "아직 연속 기록이 없어요"}
        </StreakPill>
      </SectionHeader>

      <CalendarOuter>
        <DayAxis>
          {DAY_LABELS.map((label, i) => (
            <DayLabel key={i} $show={SHOW_DAY_ROWS.includes(i)}>
              {label}
            </DayLabel>
          ))}
        </DayAxis>

        <CalendarScroll>
          <CalendarSvg
            role="img"
            aria-label={`최근 14주 중 활동 기록`}
            width={totalWidth}
            height={7 * (CELL + GAP) - GAP + 18}
          >
            {/* 월 레이블 */}
            {monthLabels.map(({ col, label }) => (
              <text
                key={label + col}
                x={col * (CELL + GAP)}
                y={12}
                fontSize={10}
                fill="#8b95a1"
                fontFamily="Pretendard, sans-serif"
                fontWeight={500}
              >
                {label}
              </text>
            ))}

            {/* 셀 */}
            {weeks.map((week, wi) =>
              week.map((date, di) => {
                const x = wi * (CELL + GAP);
                const y = 18 + di * (CELL + GAP);
                if (date === "future") {
                  return (
                    <rect
                      key={`${wi}-${di}`}
                      x={x} y={y}
                      width={CELL} height={CELL}
                      rx={3}
                      fill="transparent"
                    />
                  );
                }
                const active = activeSet.has(date);
                return (
                  <rect
                    key={date}
                    x={x} y={y}
                    width={CELL} height={CELL}
                    rx={3}
                    fill={active ? "#3182f6" : "#f2f4f6"}
                    opacity={active ? 1 : 1}
                  >
                    <title>{date}</title>
                  </rect>
                );
              })
            )}
          </CalendarSvg>
        </CalendarScroll>
      </CalendarOuter>
    </Section>
  );
}

/* ── Styled ─────────────────────────────────────────────── */

const StreakPill = styled.div<{ $active: boolean }>`
  padding: 3px 10px;
  border-radius: 9999px;
  background: ${({ $active }) => ($active ? "#e8f3ff" : "#f2f4f6")};
  color: ${({ $active }) => ($active ? "#3182f6" : "#8b95a1")};
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
`;

const CalendarOuter = styled.div`
  display: flex;
  gap: 6px;
  align-items: flex-start;
`;

const DayAxis = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${GAP}px;
  padding-top: 18px;
  flex-shrink: 0;
`;

const DayLabel = styled.div<{ $show: boolean }>`
  height: ${CELL}px;
  line-height: ${CELL}px;
  font-size: 10px;
  font-weight: 500;
  color: ${({ $show }) => ($show ? "#8b95a1" : "transparent")};
  user-select: none;
`;

const CalendarScroll = styled.div`
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const CalendarSvg = styled.svg`
  display: block;
  overflow: visible;
`;

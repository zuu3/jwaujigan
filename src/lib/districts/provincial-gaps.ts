/**
 * 시도의원(광역의원) 선거구 미매핑 행정동.
 * 공직선거법 별표2와 기초의원 조례의 행정동 체계 불일치로
 * 광역의원 선거구를 표시할 수 없는 동 목록.
 * 상세 사유: src/lib/districts/PROVINCIAL_GAPS.md
 */
export const PROVINCIAL_GAP_DONGS = [
  "부천동",
  "신중동",
  "대산동",
  "범안동",
  "석수3동",
  "풍산동",
] as const;

export function isProvincialGapDong(dong: string | null | undefined): boolean {
  if (!dong) return false;
  return (PROVINCIAL_GAP_DONGS as readonly string[]).includes(dong);
}

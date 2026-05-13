"use client";

import { useEffect, useState } from "react";
import styled from "@emotion/styled";

type TendencyStanceCounts = {
  progressive: number;
  conservative: number;
  neutral: number;
};

type TendencyData = {
  stance_by_type: Record<string, TendencyStanceCounts>;
  total_with_profile: number;
};

type RowData = {
  type: string;
  total: number;
  progressive: number;
  conservative: number;
  neutral: number;
  pct: { progressive: number; conservative: number; neutral: number };
};

const TYPE_LABEL: Record<string, string> = {
  progressive: "진보 성향",
  moderate_progressive: "중도진보 성향",
  moderate: "중도 성향",
  moderate_conservative: "중도보수 성향",
  conservative: "보수 성향",
};

function getTypeLabel(type: string): string {
  return TYPE_LABEL[type] ?? type;
}

function buildRows(data: TendencyData): RowData[] {
  return Object.entries(data.stance_by_type)
    .map(([type, counts]) => {
      const total = counts.progressive + counts.conservative + counts.neutral;
      const pct = {
        progressive: total > 0 ? Math.round((counts.progressive / total) * 100) : 0,
        conservative: total > 0 ? Math.round((counts.conservative / total) * 100) : 0,
        neutral: total > 0 ? Math.round((counts.neutral / total) * 100) : 0,
      };
      return { type, total, ...counts, pct };
    })
    .sort((a, b) => {
      // 진보 → 중도진보 → 중도 → 중도보수 → 보수 순 정렬
      const order = Object.keys(TYPE_LABEL);
      const ai = order.indexOf(a.type);
      const bi = order.indexOf(b.type);
      if (ai === -1 && bi === -1) return a.type.localeCompare(b.type);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
}

type TendencySectionProps = {
  issueId: string;
};

export function TendencySection({ issueId }: TendencySectionProps) {
  const [data, setData] = useState<TendencyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);

    fetch(`/api/issues/${issueId}/tendency`)
      .then(async (res) => {
        if (!res.ok) throw new Error("fetch failed");
        return res.json() as Promise<TendencyData>;
      })
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [issueId]);

  const rows = data ? buildRows(data) : [];
  const hasData = rows.length > 0;

  return (
    <Section>
      <SectionTitle>성향별 투표 분포</SectionTitle>

      {loading && (
        <SkeletonList>
          {[1, 2, 3].map((i) => (
            <SkeletonRow key={i} />
          ))}
        </SkeletonList>
      )}

      {!loading && error && (
        <EmptyText>성향 데이터를 불러오지 못했어요.</EmptyText>
      )}

      {!loading && !error && !hasData && (
        <EmptyText>아직 성향 데이터가 부족해요.</EmptyText>
      )}

      {!loading && !error && hasData && (
        <RowList>
          {rows.map((row) => (
            <TypeRow key={row.type}>
              <RowHeader>
                <TypeLabel>{getTypeLabel(row.type)}</TypeLabel>
                <TypeCount>{row.total.toLocaleString()}명</TypeCount>
              </RowHeader>
              <BarTrack>
                {row.pct.progressive > 0 && (
                  <BarSegment
                    $color="#3182f6"
                    $width={row.pct.progressive}
                    title={`진보 ${row.pct.progressive}%`}
                  />
                )}
                {row.pct.neutral > 0 && (
                  <BarSegment
                    $color="#8b95a1"
                    $width={row.pct.neutral}
                    title={`중립 ${row.pct.neutral}%`}
                  />
                )}
                {row.pct.conservative > 0 && (
                  <BarSegment
                    $color="#e5484d"
                    $width={row.pct.conservative}
                    title={`보수 ${row.pct.conservative}%`}
                  />
                )}
              </BarTrack>
              <Legend>
                {row.pct.progressive > 0 && (
                  <LegendItem>
                    <LegendDot $color="#3182f6" />
                    <LegendText>진보 {row.pct.progressive}%</LegendText>
                  </LegendItem>
                )}
                {row.pct.neutral > 0 && (
                  <LegendItem>
                    <LegendDot $color="#8b95a1" />
                    <LegendText>중립 {row.pct.neutral}%</LegendText>
                  </LegendItem>
                )}
                {row.pct.conservative > 0 && (
                  <LegendItem>
                    <LegendDot $color="#e5484d" />
                    <LegendText>보수 {row.pct.conservative}%</LegendText>
                  </LegendItem>
                )}
              </Legend>
            </TypeRow>
          ))}
        </RowList>
      )}

      {!loading && !error && data && data.total_with_profile > 0 && (
        <FootNote>성향 분석 완료 사용자 {data.total_with_profile.toLocaleString()}명 기준</FootNote>
      )}
    </Section>
  );
}

/* ── Styles ──────────────────────────────────────────────── */

const Section = styled.div`
  padding: 20px;
  border: 1px solid #e5e8eb;
  border-radius: 12px;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const SectionTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #191f28;
`;

const SkeletonList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const SkeletonRow = styled.div`
  height: 56px;
  border-radius: 8px;
  background: #f2f4f6;
  animation: shimmer 1.2s linear infinite;

  @keyframes shimmer {
    0% { opacity: 1; }
    50% { opacity: 0.6; }
    100% { opacity: 1; }
  }
`;

const EmptyText = styled.p`
  margin: 0;
  font-size: 14px;
  font-weight: 400;
  color: #6b7684;
`;

const RowList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const TypeRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const RowHeader = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
`;

const TypeLabel = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: #4e5968;
`;

const TypeCount = styled.span`
  font-size: 12px;
  font-weight: 400;
  color: #8b95a1;
  font-variant-numeric: tabular-nums;
`;

const BarTrack = styled.div`
  display: flex;
  height: 8px;
  border-radius: 4px;
  overflow: hidden;
  background: #f2f4f6;
`;

const BarSegment = styled.div<{ $color: string; $width: number }>`
  height: 100%;
  width: ${({ $width }) => $width}%;
  background: ${({ $color }) => $color};
  transition: width 250ms cubic-bezier(0.4, 0, 0.2, 1);
`;

const Legend = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const LegendDot = styled.div<{ $color: string }>`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  flex-shrink: 0;
`;

const LegendText = styled.span`
  font-size: 12px;
  font-weight: 400;
  color: #6b7684;
  font-variant-numeric: tabular-nums;
`;

const FootNote = styled.p`
  margin: 0;
  font-size: 12px;
  font-weight: 400;
  color: #b0b8c1;
`;

"use client";

import styled from "@/lib/styled";
import { ArrowRight, ExternalLink, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { PoliticianDetail } from "@/lib/assembly";
import { getPartyPresentation } from "@/lib/parties";

type LocalPolitician = {
  id: string;
  name: string;
  party: string;
  district: string;
  committee: string | null;
  reelection: string | null;
  office: string | null;
  image: string | null;
};

type PoliticianCardProps = {
  politician: LocalPolitician;
  isExpanded: boolean;
  detail: PoliticianDetail | undefined;
  isDetailLoading: boolean;
  isDetailError: boolean;
  onToggleExpand: (id: string) => void;
};

function getPartyTone(party: string) {
  if (party.includes("국민의힘")) {
    return "red";
  }

  if (party.includes("더불어민주") || party.includes("민주")) {
    return "blue";
  }

  return "neutral";
}

export function PoliticianCard({
  politician,
  isExpanded,
  detail,
  isDetailLoading,
  isDetailError,
  onToggleExpand,
}: PoliticianCardProps) {
  const partyTone = getPartyTone(politician.party);
  const party = getPartyPresentation(politician.party);

  return (
    <PoliticianRow>
      <PoliticianImageWrap>
        {politician.image ? (
          <PoliticianImage src={politician.image} alt={politician.name} width={32} height={32} />
        ) : (
          <PoliticianFallback>
            {politician.name.slice(0, 1)}
          </PoliticianFallback>
        )}
      </PoliticianImageWrap>

      <PoliticianBody>
        <PoliticianInline>
          <PoliticianName>{politician.name}</PoliticianName>
          <DotDivider aria-hidden="true">·</DotDivider>
          <PartyInline>
            {party.src ? (
              <PartyLogo
                src={party.src}
                alt={party.label}
                width={40}
                height={14}
                unoptimized
              />
            ) : (
              <PartyTextBadge $tone={partyTone as "blue" | "red" | "neutral"}>{party.label}</PartyTextBadge>
            )}
          </PartyInline>
          <DotDivider aria-hidden="true">·</DotDivider>
          <PoliticianMeta>
            <MapPin size={14} />
            <span>{politician.district}</span>
          </PoliticianMeta>
          {politician.reelection ? (
            <>
              <DotDivider aria-hidden="true">·</DotDivider>
              <PoliticianTag>{politician.reelection}</PoliticianTag>
            </>
          ) : null}
        </PoliticianInline>

        {politician.committee ? (
          <PoliticianSubtext>{politician.committee}</PoliticianSubtext>
        ) : null}

        <PoliticianActions>
          <InlineActionButton
            type="button"
            onClick={() => onToggleExpand(politician.id)}
          >
            {isExpanded ? "상세 닫기" : "홈에서 바로 보기"}
            <ArrowRight size={14} />
          </InlineActionButton>
          <DetailLink href={`/politicians/${politician.id}`}>
            상세 페이지
            <ArrowRight size={14} />
          </DetailLink>
        </PoliticianActions>

        {isExpanded ? (
          <PoliticianInlineDetail>
            {isDetailLoading ? (
              <InlineDetailSkeleton>
                {[0, 1, 2, 3].map((item) => (
                  <InlineDetailSkeletonItem key={item}>
                    <InlineDetailSkeletonLine $w="32%" />
                    <InlineDetailSkeletonLine $w={item % 2 === 0 ? "72%" : "54%"} />
                  </InlineDetailSkeletonItem>
                ))}
              </InlineDetailSkeleton>
            ) : isDetailError ? (
              <InlineDetailText>
                상세 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.
              </InlineDetailText>
            ) : detail ? (
              <>
                <InlineDetailGrid>
                  <InlineDetailItem>
                    <InlineDetailLabel>직책</InlineDetailLabel>
                    <InlineDetailValue>
                      {detail.jobTitle ?? "-"}
                    </InlineDetailValue>
                  </InlineDetailItem>
                  <InlineDetailItem>
                    <InlineDetailLabel>의원회관</InlineDetailLabel>
                    <InlineDetailValue>
                      {detail.office ?? "-"}
                    </InlineDetailValue>
                  </InlineDetailItem>
                  <InlineDetailItem>
                    <InlineDetailLabel>전화</InlineDetailLabel>
                    <InlineDetailValue>
                      {detail.phone ?? "-"}
                    </InlineDetailValue>
                  </InlineDetailItem>
                  <InlineDetailItem>
                    <InlineDetailLabel>이메일</InlineDetailLabel>
                    <InlineDetailValue>
                      {detail.email ?? "-"}
                    </InlineDetailValue>
                  </InlineDetailItem>
                </InlineDetailGrid>

                {detail.homepage ? (
                  <InlineExternalLink
                    href={detail.homepage}
                    target="_blank"
                    rel="noreferrer"
                  >
                    홈페이지 열기
                    <ExternalLink size={14} />
                  </InlineExternalLink>
                ) : null}
              </>
            ) : null}
          </PoliticianInlineDetail>
        ) : null}
      </PoliticianBody>
    </PoliticianRow>
  );
}

/* ── Styled components ──────────────────────────────────── */

const PoliticianRow = styled.article`
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr);
  gap: 12px;
  align-items: start;
  padding: 16px 0;
  border-bottom: 1px solid #f2f4f6;

  &:last-of-type {
    border-bottom: 0;
  }
`;

const PoliticianImageWrap = styled.div`
  width: 32px;
  height: 32px;
  overflow: hidden;
  border-radius: 999px;
  background: #f2f4f6;
  flex-shrink: 0;
`;

const PoliticianImage = styled(Image)`
  object-fit: cover;
  object-position: center top;
`;

const PoliticianFallback = styled.div`
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  color: #4e5968;
  font-size: 14px;
  font-weight: 700;
`;

const PoliticianBody = styled.div`
  display: grid;
  gap: 8px;
  min-width: 0;
`;

const PoliticianInline = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
`;

const PoliticianName = styled.div`
  color: #191f28;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: -0.03em;
`;

const DotDivider = styled.span`
  color: #b0b8c1;
  font-size: 14px;
  line-height: 1;
`;

const PartyTextBadge = styled.div<{ $tone: "blue" | "red" | "neutral" }>`
  display: inline-flex;
  color: ${({ $tone }) =>
    $tone === "blue" ? "#3182f6" : $tone === "red" ? "#e5484d" : "#8b95a1"};
  font-size: 14px;
  font-weight: 600;
`;

const PartyInline = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
`;

const PartyLogo = styled(Image)`
  display: block;
  width: auto;
  height: 14px;
  flex-shrink: 0;
`;

const PoliticianMeta = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #8b95a1;
  font-size: 14px;
  font-weight: 400;
  min-width: 0;

  svg {
    flex-shrink: 0;
  }
`;

const PoliticianTag = styled.div`
  display: inline-flex;
  color: #8b95a1;
  font-size: 14px;
  font-weight: 400;
`;

const PoliticianSubtext = styled.div`
  color: #8b95a1;
  font-size: 14px;
  line-height: 1.6;
  word-break: keep-all;
`;

const DetailLink = styled(Link)`
  display: inline-flex;
  width: fit-content;
  align-items: center;
  gap: 4px;
  color: #3182f6;
  font-size: 14px;
  font-weight: 500;
  transition: opacity 120ms cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    opacity: 0.72;
  }
`;

const PoliticianActions = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
`;

const InlineActionButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-height: 44px;
  padding: 0 2px;
  border: 0;
  color: #3182f6;
  background: transparent;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 120ms cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    opacity: 0.72;
  }
`;

const PoliticianInlineDetail = styled.div`
  display: grid;
  gap: 16px;
  padding: 16px 0 4px;
  border-top: 1px solid #e5e7eb;
`;

const InlineDetailGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 24px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const InlineDetailItem = styled.div`
  display: grid;
  gap: 4px;
`;

const InlineDetailLabel = styled.div`
  color: #8b95a1;
  font-size: 14px;
  font-weight: 600;
`;

const InlineDetailValue = styled.div`
  color: #191f28;
  font-size: 16px;
  font-weight: 400;
  line-height: 1.5;
  word-break: break-word;
`;

const InlineDetailText = styled.p`
  margin: 0;
  color: #8b95a1;
  font-size: 14px;
  line-height: 1.6;
`;

const shimmer = `
  background: linear-gradient(90deg, #f2f4f6 0%, #ffffff 50%, #f2f4f6 100%);
  background-size: 200% 100%;
  animation: shimmer 1.2s infinite;
  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`;

const InlineDetailSkeleton = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 24px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const InlineDetailSkeletonItem = styled.div`
  display: grid;
  gap: 8px;
`;

const InlineDetailSkeletonLine = styled.div<{ $w: string }>`
  width: ${({ $w }) => $w};
  height: 14px;
  border-radius: 4px;
  ${shimmer}
`;

const InlineExternalLink = styled.a`
  display: inline-flex;
  width: fit-content;
  align-items: center;
  gap: 6px;
  color: #191f28;
  font-size: 14px;
  font-weight: 600;
`;

"use client";

import styled from "@/lib/styled";
import Image from "next/image";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { HelpCircle } from "lucide-react";
import { useLocalElection } from "@/services/local-election/local-election.queries";
import { ELECTION_TYPE_LABELS } from "@/lib/local-election.types";
import type { ElectionType, LocalElectionWinner, LocalElectionCandidate } from "@/lib/local-election.types";
import { getPartyPresentation } from "@/lib/parties";
import { PROVINCIAL_GAP_DONGS, isProvincialGapDong } from "@/lib/districts/provincial-gaps";

type Tab = "winners" | "candidates";

const TABS: Tab[] = ["candidates", "winners"];

const ELECTION_TYPE_ORDER: ElectionType[] = [
  "governor",
  "superintendent",
  "mayor",
  "provincial",
  "provincialPr",
  "local",
  "localPr",
];


function partyLean(jdName: string): "progressive" | "conservative" | "neutral" {
  if (jdName.includes("민주") || jdName.includes("조국")) return "progressive";
  if (jdName.includes("국민의힘") || jdName.includes("국민의 힘")) return "conservative";
  return "neutral";
}

function PartyBadge({ jdName }: { jdName: string }) {
  const { label, src } = getPartyPresentation(jdName);
  const lean = partyLean(jdName);
  if (src) {
    return (
      <PartyLogoWrap $lean={lean}>
        <Image src={src} alt={label} width={16} height={16} style={{ objectFit: "contain" }} />
        <span>{label}</span>
      </PartyLogoWrap>
    );
  }
  return <PartyTag $lean={lean}>{label}</PartyTag>;
}

function formatDugyul(dugyul: string): string {
  const n = parseFloat(dugyul);
  if (isNaN(n)) return dugyul;
  return `${n.toFixed(1)}%`;
}

// ─── Winner card ────────────────────────────────────────────────────────────

function WinnerCard({ winner }: { winner: LocalElectionWinner }) {
  const href = `/local-politicians/${winner.huboid}?type=${winner.electionType}&tab=winners`;
  return (
    <PersonCardLink href={href}>
      <PersonTop>
        {winner.photoUrl && (
          <PersonPhoto
            src={winner.photoUrl}
            alt={winner.name}
            width={48}
            height={60}
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
        )}
        <PersonLeft>
          <PersonName>{winner.name}</PersonName>
          {winner.job && <JobLabel>{winner.job}</JobLabel>}
          <PersonRow>
            <PartyBadge jdName={winner.jdName} />
            {winner.dugyul && <MetaChip>{formatDugyul(winner.dugyul)} 득표</MetaChip>}
          </PersonRow>
        </PersonLeft>
      </PersonTop>
      {(winner.career1 || winner.career2) && (
        <CareerList>
          {winner.career1 && <CareerItem>{winner.career1}</CareerItem>}
          {winner.career2 && <CareerItem>{winner.career2}</CareerItem>}
        </CareerList>
      )}
    </PersonCardLink>
  );
}

// ─── Candidate card ─────────────────────────────────────────────────────────

function CandidateCard({ candidate }: { candidate: LocalElectionCandidate }) {
  const href = `/local-politicians/${candidate.huboid}?type=${candidate.electionType}&tab=candidates`;
  return (
    <PersonCardLink href={href}>
      <PersonTop>
        {candidate.photoUrl && (
          <PersonPhoto
            src={candidate.photoUrl}
            alt={candidate.name}
            width={48}
            height={60}
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
        )}
        <PersonLeft>
          <NameRow>
            <GihoChip>기호 {candidate.giho}</GihoChip>
            <PersonName>{candidate.name}</PersonName>
          </NameRow>
          {candidate.job && <JobLabel>{candidate.job}</JobLabel>}
          <PartyBadge jdName={candidate.jdName} />
        </PersonLeft>
      </PersonTop>
      {(candidate.career1 || candidate.career2) && (
        <CareerList>
          {candidate.career1 && <CareerItem>{candidate.career1}</CareerItem>}
          {candidate.career2 && <CareerItem>{candidate.career2}</CareerItem>}
        </CareerList>
      )}
    </PersonCardLink>
  );
}

// ─── Collapsible list ────────────────────────────────────────────────────────

const COLLAPSE_AT = 5;

function CollapsibleList({
  tab,
  type,
  winners,
  candidates,
}: {
  tab: Tab;
  type: ElectionType;
  winners: LocalElectionWinner[];
  candidates: LocalElectionCandidate[];
}) {
  const [expanded, setExpanded] = useState(false);
  const items = tab === "winners" ? winners : candidates;
  const visible = expanded ? items : items.slice(0, COLLAPSE_AT);
  const hidden = items.length - COLLAPSE_AT;

  return (
    <PersonGrid>
      {tab === "winners"
        ? (visible as LocalElectionWinner[]).map((w) => (
            <WinnerCard key={`${w.huboid}-${w.sggName}`} winner={w} />
          ))
        : (visible as LocalElectionCandidate[]).map((c) => (
            <CandidateCard key={`${c.huboid}-${c.sggName}`} candidate={c} />
          ))}
      {items.length > COLLAPSE_AT && (
        <ExpandButton type="button" onClick={() => setExpanded((v) => !v)}>
          {expanded ? "접기" : `나머지 ${hidden}명 보기`}
        </ExpandButton>
      )}
    </PersonGrid>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <SkeletonWrapper>
      {[0, 1, 2].map((i) => (
        <SkeletonCard key={i}>
          <SkeletonLine $w="40%" />
          <SkeletonLine $w="60%" $small />
          <SkeletonLine $w="80%" $small />
        </SkeletonCard>
      ))}
    </SkeletonWrapper>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export function LocalElectionSection({ district }: { district: string | null }) {
  const [activeTab, setActiveTab] = useState<Tab>("candidates");
  const [typeIndex, setTypeIndex] = useState(0);
  const [showGapHelp, setShowGapHelp] = useState(false);
  const helpRef = useRef<HTMLDivElement>(null);
  const query = useLocalElection(district);
  const touchStartX = useRef<number | null>(null);

  const isGapDong = district && isProvincialGapDong(district);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (helpRef.current && !helpRef.current.contains(e.target as Node)) setShowGapHelp(false);
    }
    if (showGapHelp) document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showGapHelp]);

  if (!district) return null;

  const hasAnyWinners = query.data
    ? ELECTION_TYPE_ORDER.some((t) => (query.data.winners[t]?.length ?? 0) > 0)
    : false;

  const hasAnyCandidates = query.data
    ? ELECTION_TYPE_ORDER.some((t) => (query.data.candidates[t]?.length ?? 0) > 0)
    : false;

  const hasAny = hasAnyWinners || hasAnyCandidates;

  if (!query.isLoading && !query.isError && !hasAny) return null;

  // Only types that have data for current tab
  const activeTypes = query.data
    ? ELECTION_TYPE_ORDER.filter((t) => {
        const list = activeTab === "winners" ? query.data.winners[t] : query.data.candidates[t];
        return (list?.length ?? 0) > 0;
      })
    : [];

  const clampedIndex = Math.min(typeIndex, Math.max(0, activeTypes.length - 1));
  const currentType = activeTypes[clampedIndex] ?? null;

  function handleTabChange(tab: Tab) {
    setActiveTab(tab);
    setTypeIndex(0);
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < 50) return;
    if (dx < 0) setTypeIndex((i) => Math.min(i + 1, activeTypes.length - 1));
    else setTypeIndex((i) => Math.max(i - 1, 0));
  }

  const wiwLabel = query.data?.wiwNames?.join(" · ") ?? "";

  return (
    <SectionWrapper>
      <SectionHeaderRow>
        <SectionTitleGroup>
          <SectionTitle>내 지역 대표</SectionTitle>
          {isGapDong && (
            <HelpPopover ref={helpRef}>
              <HelpButton
                type="button"
                onClick={() => setShowGapHelp(!showGapHelp)}
                aria-label="도움말"
              >
                <HelpCircle size={16} />
              </HelpButton>
              {showGapHelp && (
                <HelpTooltip>
                  <HelpTitle>이 지역 정보를 표시할 수 없어요</HelpTitle>
                  <HelpText>
                    행정동 체계 변경으로 법령 데이터와 맞지 않습니다. 자세한 내용은{" "}
                    <a href="https://github.com/zuu3/jwaujigan/blob/main/src/lib/districts/PROVINCIAL_GAPS.md" target="_blank" rel="noopener noreferrer">
                      여기
                    </a>
                    를 참고해주세요.
                  </HelpText>
                </HelpTooltip>
              )}
            </HelpPopover>
          )}
          {wiwLabel && <SectionSubtle>{wiwLabel}</SectionSubtle>}
        </SectionTitleGroup>
        <BallotPreviewLink href="/ballot-preview">내 투표용지 미리보기</BallotPreviewLink>
      </SectionHeaderRow>

      <TabRow>
        <TabButton
          type="button"
          $active={activeTab === "candidates"}
          onClick={() => handleTabChange("candidates")}
        >
          이번 선거 후보자
          <TabSub>9회 · 2026.6.3</TabSub>
        </TabButton>
        <TabButton
          type="button"
          $active={activeTab === "winners"}
          onClick={() => handleTabChange("winners")}
        >
          현직
          <TabSub>8회 · 2022</TabSub>
        </TabButton>
      </TabRow>

      {query.isLoading ? (
        <LoadingSkeleton />
      ) : query.isError ? (
        <ErrorCard>
          <ErrorTitle>선거 정보를 불러오지 못했어요.</ErrorTitle>
          <ErrorText>잠시 후 다시 시도해 주세요.</ErrorText>
          <RetryButton type="button" onClick={() => void query.refetch()}>
            다시 시도
          </RetryButton>
        </ErrorCard>
      ) : activeTypes.length === 0 ? (
        <EmptyText>이 지역 정보가 없어요.</EmptyText>
      ) : (
        <>
          <TypeNavRow>
            <NavArrow
              type="button"
              onClick={() => setTypeIndex((i) => Math.max(i - 1, 0))}
              disabled={clampedIndex === 0}
            >
              ‹
            </NavArrow>
            <TypeNavLabel>
              {ELECTION_TYPE_LABELS[currentType!]}
              <TypeNavCount>{clampedIndex + 1} / {activeTypes.length}</TypeNavCount>
            </TypeNavLabel>
            <NavArrow
              type="button"
              onClick={() => setTypeIndex((i) => Math.min(i + 1, activeTypes.length - 1))}
              disabled={clampedIndex === activeTypes.length - 1}
            >
              ›
            </NavArrow>
          </TypeNavRow>

          <SwipeDots>
            {activeTypes.map((_, i) => (
              <Dot key={i} $active={i === clampedIndex} onClick={() => setTypeIndex(i)} />
            ))}
          </SwipeDots>

          <ContentArea onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
            {currentType && (
              <CollapsibleList
                key={`${activeTab}-${currentType}`}
                tab={activeTab}
                type={currentType}
                winners={query.data?.winners[currentType] ?? []}
                candidates={query.data?.candidates[currentType] ?? []}
              />
            )}
          </ContentArea>
        </>
      )}
    </SectionWrapper>
  );
}

// ─── Styled components ───────────────────────────────────────────────────────

const SectionWrapper = styled.div`
  display: grid;
  gap: 0;
  padding-top: 40px;
`;

const SectionHeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`;

const BallotPreviewLink = styled(Link)`
  font-size: 12px;
  font-weight: 600;
  color: #3182f6;
  text-decoration: none;
  padding: 4px 10px;
  border: 1px solid #3182f6;
  border-radius: 9999px;
  background: #e8f3ff;
  white-space: nowrap;
  flex-shrink: 0;
  transition: background 150ms;

  &:hover {
    background: #d0e9ff;
  }
`;

const SectionTitleGroup = styled.div`
  display: flex;
  align-items: baseline;
  gap: 8px;
`;

const SectionTitle = styled.h2`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #191f28;
`;

const SectionSubtle = styled.span`
  font-size: 13px;
  color: #8b95a1;
`;

const TabRow = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
`;

const TabButton = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: 1px solid ${({ $active }) => ($active ? "#3182f6" : "#e5e8eb")};
  border-radius: 9999px;
  background: ${({ $active }) => ($active ? "#e8f3ff" : "#ffffff")};
  color: ${({ $active }) => ($active ? "#3182f6" : "#6b7684")};
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 150ms;

  &:hover {
    border-color: #3182f6;
    color: #3182f6;
  }
`;

const TabSub = styled.span`
  font-size: 11px;
  font-weight: 400;
  opacity: 0.8;
`;

const ContentArea = styled.div`
  display: grid;
  gap: 8px;
`;

const TypeNavRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
`;

const NavArrow = styled.button`
  width: 28px;
  height: 28px;
  border: 1px solid #e5e8eb;
  border-radius: 8px;
  background: #ffffff;
  color: #4e5968;
  font-size: 18px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 150ms;

  &:disabled {
    opacity: 0.3;
    cursor: default;
  }

  &:not(:disabled):hover {
    border-color: #3182f6;
    color: #3182f6;
  }
`;

const TypeNavLabel = styled.div`
  flex: 1;
  font-size: 14px;
  font-weight: 600;
  color: #191f28;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const TypeNavCount = styled.span`
  font-size: 12px;
  font-weight: 400;
  color: #8b95a1;
`;

const SwipeDots = styled.div`
  display: flex;
  gap: 5px;
  justify-content: center;
  margin-bottom: 12px;
`;

const Dot = styled.button<{ $active: boolean }>`
  width: ${({ $active }) => ($active ? "16px" : "6px")};
  height: 6px;
  border-radius: 3px;
  border: none;
  background: ${({ $active }) => ($active ? "#3182f6" : "#e5e8eb")};
  padding: 0;
  cursor: pointer;
  transition: all 250ms;
`;

const PersonGrid = styled.div`
  display: grid;
  gap: 8px;
`;

const ExpandButton = styled.button`
  padding: 10px;
  border: 1px dashed #e5e8eb;
  border-radius: 10px;
  background: #f9fafb;
  color: #3182f6;
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  text-align: center;
  transition: all 150ms;

  &:hover {
    background: #e8f3ff;
    border-color: #3182f6;
  }
`;

const PersonCard = styled.div`
  padding: 14px 16px;
  border: 1px solid #e5e8eb;
  border-radius: 12px;
  background: #ffffff;
  display: grid;
  gap: 6px;
`;

const PersonCardLink = styled(Link)`
  padding: 14px 16px;
  border: 1px solid #e5e8eb;
  border-radius: 12px;
  background: #ffffff;
  display: grid;
  gap: 6px;
  text-decoration: none;
  color: inherit;
  transition: border-color 150ms;

  &:hover {
    border-color: #b0b8c1;
  }
`;

const PersonTop = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
`;

const PersonRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
`;

const PersonLeft = styled.div`
  flex: 1;
  display: grid;
  gap: 4px;
  min-width: 0;
`;

const PersonPhoto = styled(Image)`
  flex-shrink: 0;
  border-radius: 6px;
  object-fit: cover;
  object-position: top;
`;


const PersonName = styled.span`
  font-size: 15px;
  font-weight: 700;
  color: #191f28;
`;

const JobLabel = styled.span`
  font-size: 12px;
  color: #8b95a1;
`;

const NameRow = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const GihoChip = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: #8b95a1;
  margin-right: 4px;
`;

const PartyLogoWrap = styled.span<{ $lean: "progressive" | "conservative" | "neutral" }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px 2px 4px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  width: fit-content;
  background: ${({ $lean }) =>
    $lean === "progressive"
      ? "#e8f3ff"
      : $lean === "conservative"
        ? "#fef2f2"
        : "#f2f4f6"};
  color: ${({ $lean }) =>
    $lean === "progressive"
      ? "#3182f6"
      : $lean === "conservative"
        ? "#e5484d"
        : "#6b7684"};
`;

const PartyTag = styled.span<{ $lean: "progressive" | "conservative" | "neutral" }>`
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  width: fit-content;
  background: ${({ $lean }) =>
    $lean === "progressive"
      ? "#e8f3ff"
      : $lean === "conservative"
        ? "#fef2f2"
        : "#f2f4f6"};
  color: ${({ $lean }) =>
    $lean === "progressive"
      ? "#3182f6"
      : $lean === "conservative"
        ? "#e5484d"
        : "#6b7684"};
`;

const PersonDistrict = styled.div`
  font-size: 13px;
  color: #6b7684;
`;

const PersonMeta = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
`;

const MetaChip = styled.span`
  font-size: 12px;
  color: #8b95a1;
  background: #f9fafb;
  padding: 2px 7px;
  border-radius: 4px;
`;

const CareerList = styled.div`
  display: grid;
  gap: 2px;
  padding-top: 2px;
`;

const CareerItem = styled.div`
  font-size: 12px;
  color: #6b7684;
  line-height: 1.5;
`;

const SkeletonWrapper = styled.div`
  display: grid;
  gap: 8px;
`;

const SkeletonCard = styled.div`
  padding: 14px 16px;
  border: 1px solid #e5e8eb;
  border-radius: 12px;
  display: grid;
  gap: 8px;
`;

const SkeletonLine = styled.div<{ $w: string; $small?: boolean }>`
  height: ${({ $small }) => ($small ? "12px" : "15px")};
  width: ${({ $w }) => $w};
  border-radius: 4px;
  background: linear-gradient(90deg, #f2f4f6 0%, #fafafa 50%, #f2f4f6 100%);
  background-size: 200% 100%;
  animation: shimmer 1.2s ease-in-out infinite;

  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    background: #f2f4f6;
  }
`;

const ErrorCard = styled.div`
  padding: 20px;
  border: 1px solid #e5e8eb;
  border-radius: 12px;
  background: #ffffff;
  display: grid;
  gap: 8px;
`;

const ErrorTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #191f28;
`;

const ErrorText = styled.div`
  font-size: 13px;
  color: #6b7684;
`;

const RetryButton = styled.button`
  align-self: flex-start;
  padding: 8px 14px;
  border: 1px solid #e5e8eb;
  border-radius: 8px;
  background: #ffffff;
  color: #3182f6;
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;

  &:hover {
    background: #f9fafb;
  }
`;

const EmptyText = styled.div`
  font-size: 14px;
  color: #8b95a1;
  padding: 16px 0;
`;

const HelpPopover = styled.div`
  position: relative;
`;

const HelpButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  padding: 0;
  border: none;
  background: transparent;
  color: #8b95a1;
  cursor: pointer;
  transition: color 150ms;

  &:hover {
    color: #3182f6;
  }
`;

const HelpTooltip = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 50;
  background: #191f28;
  color: #ffffff;
  padding: 12px 14px;
  border-radius: 8px;
  font-size: 12px;
  max-width: 240px;
  box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.15);

  a {
    color: #3182f6;
    text-decoration: underline;

    &:hover {
      color: #2272eb;
    }
  }
`;

const HelpTitle = styled.div`
  font-weight: 600;
  margin-bottom: 4px;
`;

const HelpText = styled.div`
  line-height: 1.5;
  opacity: 0.9;
`;

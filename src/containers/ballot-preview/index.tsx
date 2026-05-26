"use client";

import styled from "@/lib/styled";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocalElection } from "@/services/local-election/local-election.queries";
import { useUserProfile } from "@/services/user/user.queries";
import { ELECTION_TYPE_LABELS } from "@/lib/local-election.types";
import type { ElectionType, LocalElectionCandidate } from "@/lib/local-election.types";
import { getPartyPresentation } from "@/lib/parties";
import type { ElectionPledge } from "@/app/api/election-pledge/route";

// ─── Constants ────────────────────────────────────────────────────────────────

const BALLOT_ORDER: ElectionType[] = [
  "governor",
  "mayor",
  "provincial",
  "provincialPr",
  "local",
  "localPr",
  "superintendent",
];

type BallotTheme = { bodyBg: string; colHeaderBg: string; rowBorder: string; accentColor: string };

const BALLOT_THEME: Record<ElectionType, BallotTheme> = {
  governor:       { bodyBg: "#fce4ec", colHeaderBg: "#f8bbd9", rowBorder: "#f5c6d0", accentColor: "#c62828" },
  mayor:          { bodyBg: "#fce4ec", colHeaderBg: "#f8bbd9", rowBorder: "#f5c6d0", accentColor: "#880e4f" },
  provincial:     { bodyBg: "#fff3e0", colHeaderBg: "#ffe0b2", rowBorder: "#ffd180", accentColor: "#e65100" },
  provincialPr:   { bodyBg: "#e3f2fd", colHeaderBg: "#bbdefb", rowBorder: "#90caf9", accentColor: "#1565c0" },
  local:          { bodyBg: "#f9fbe7", colHeaderBg: "#f0f4c3", rowBorder: "#dce775", accentColor: "#558b2f" },
  localPr:        { bodyBg: "#e0f2f1", colHeaderBg: "#b2dfdb", rowBorder: "#80cbc4", accentColor: "#00695c" },
  superintendent: { bodyBg: "#e8f5e9", colHeaderBg: "#c8e6c9", rowBorder: "#a5d6a7", accentColor: "#2e7d32" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sortedByGiho(candidates: LocalElectionCandidate[]) {
  return [...candidates].sort((a, b) => {
    const na = parseInt(a.giho, 10) || 999;
    const nb = parseInt(b.giho, 10) || 999;
    return na - nb;
  });
}

function getPrParties(candidates: LocalElectionCandidate[]): { giho: string; jdName: string }[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const c of sortedByGiho(candidates)) {
    const party = c.jdName?.trim() || "무소속";
    if (!seen.has(party)) {
      seen.add(party);
      result.push(party);
    }
  }
  return result.map((jdName, i) => ({ giho: String(i + 1), jdName }));
}

function getBallotTitle(type: ElectionType, sdName: string, regionLabel: string): string {
  if (type === "governor") {
    return sdName.endsWith("도") ? `${sdName}지사 선거` : `${sdName}장 선거`;
  }
  if (type === "superintendent") {
    return `${sdName} 교육감 선거`;
  }
  return `${regionLabel} ${ELECTION_TYPE_LABELS[type]} 선거`;
}

function getDistrictSubtitle(type: ElectionType, candidates: LocalElectionCandidate[]): string | null {
  if (type !== "provincial" && type !== "local") return null;
  const wiwNames = [...new Set(candidates.map((c) => c.wiwName).filter(Boolean))];
  if (wiwNames.length === 1) return wiwNames[0];
  return null;
}

// ─── Layout: PR ballot ────────────────────────────────────────────────────────

function PrBallotBody({ candidates, theme }: { candidates: LocalElectionCandidate[]; theme: BallotTheme }) {
  const parties = getPrParties(candidates);
  return (
    <PrBody>
      <PrColHeader $bg={theme.colHeaderBg}>
        <PrColGiho>기호</PrColGiho>
        <PrColParty>정당명</PrColParty>
        <PrColStamp>기표란</PrColStamp>
      </PrColHeader>
      {parties.map(({ giho, jdName }) => (
        <PrRow key={jdName} $border={theme.rowBorder} $bg="#ffffff">
          <PrGiho $color={theme.accentColor}>{giho}</PrGiho>
          <PrParty>{jdName}</PrParty>
          <PrVoteBox />
        </PrRow>
      ))}
    </PrBody>
  );
}

// ─── Layout: Superintendent (horizontal scroll) ───────────────────────────────

function SuperintendentBallotBody({
  candidates,
  theme,
  type,
  onSelect,
  selectedHuboids,
}: {
  candidates: LocalElectionCandidate[];
  theme: BallotTheme;
  type: ElectionType;
  onSelect?: (huboid: string, type: ElectionType, name: string) => void;
  selectedHuboids?: Set<string>;
}) {
  const sorted = sortedByGiho(candidates);
  return (
    <SupBody $bg={theme.bodyBg}>
      <SupScroll>
        {sorted.map((c) => {
          const isSelected = selectedHuboids?.has(c.huboid) ?? false;
          return (
            <SupCandidate
              key={c.huboid}
              $border={isSelected ? "#3182f6" : theme.rowBorder}
              $selected={isSelected}
              onClick={() => onSelect?.(c.huboid, type, c.name)}
            >
              <SupPhoto>
                {c.photoUrl ? (
                  <Image
                    src={c.photoUrl}
                    alt={c.name}
                    width={48}
                    height={60}
                    style={{ objectFit: "cover", objectPosition: "top", borderRadius: 2 }}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                  />
                ) : null}
              </SupPhoto>
              <SupGiho $color={theme.accentColor}>{c.giho}</SupGiho>
              <SupName>{c.name}</SupName>
              <SupVoteBox />
            </SupCandidate>
          );
        })}
      </SupScroll>
    </SupBody>
  );
}

// ─── Layout: Regular ballot ───────────────────────────────────────────────────

function RegularBallotBody({
  type,
  candidates,
  theme,
  onSelect,
  selectedHuboids,
}: {
  type: ElectionType;
  candidates: LocalElectionCandidate[];
  theme: BallotTheme;
  onSelect?: (huboid: string, type: ElectionType, name: string) => void;
  selectedHuboids?: Set<string>;
}) {
  const sorted = sortedByGiho(candidates);
  return (
    <RegBody>
      <RegColHeader $bg={theme.colHeaderBg}>
        <RegColGiho>기호</RegColGiho>
        <RegColParty>정당</RegColParty>
        <RegColName>성명</RegColName>
        <RegColPhoto />
        <RegColStamp>기표란</RegColStamp>
      </RegColHeader>
      {sorted.map((c) => {
        const isSelected = selectedHuboids?.has(c.huboid) ?? false;
        return (
          <RegRow
            key={c.huboid}
            $border={theme.rowBorder}
            $bg="#ffffff"
            $selected={isSelected}
            onClick={() => onSelect?.(c.huboid, type, c.name)}
          >
            <RegGiho $color={theme.accentColor}>{c.giho}</RegGiho>
            <RegParty>{c.jdName?.trim() || "무소속"}</RegParty>
            <RegName>{c.name}</RegName>
            <RegPhotoCell>
              {c.photoUrl ? (
                <Image
                  src={c.photoUrl}
                  alt={c.name}
                  width={26}
                  height={32}
                  style={{ objectFit: "cover", objectPosition: "top", borderRadius: 2 }}
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                />
              ) : null}
            </RegPhotoCell>
            <RegVoteCircle />
          </RegRow>
        );
      })}
    </RegBody>
  );
}

// ─── BallotCard ───────────────────────────────────────────────────────────────

function BallotCard({
  type,
  candidates,
  sdName,
  regionLabel,
  onSelect,
  selectedHuboids,
}: {
  type: ElectionType;
  candidates: LocalElectionCandidate[];
  sdName: string;
  regionLabel: string;
  onSelect?: (huboid: string, type: ElectionType, name: string) => void;
  selectedHuboids?: Set<string>;
}) {
  const theme = BALLOT_THEME[type];
  const isPr = type === "provincialPr" || type === "localPr";
  const isSuperintendent = type === "superintendent";
  const title = getBallotTitle(type, sdName, regionLabel);
  const subtitle = getDistrictSubtitle(type, candidates);

  return (
    <BallotWrap $accent={theme.accentColor}>
      <BallotHeader $bg={theme.accentColor}>
        <BallotElectionLabel>제9회 전국동시지방선거</BallotElectionLabel>
        <BallotTitle>{title}</BallotTitle>
        {subtitle && <BallotSubtitle>({subtitle})</BallotSubtitle>}
      </BallotHeader>

      {isPr && <PrBallotBody candidates={candidates} theme={theme} />}
      {isSuperintendent && (
        <SuperintendentBallotBody
          candidates={candidates}
          theme={theme}
          type={type}
          onSelect={onSelect}
          selectedHuboids={selectedHuboids}
        />
      )}
      {!isPr && !isSuperintendent && (
        <RegularBallotBody
          type={type}
          candidates={candidates}
          theme={theme}
          onSelect={onSelect}
          selectedHuboids={selectedHuboids}
        />
      )}
    </BallotWrap>
  );
}

// ─── Sidebar: pledge hook + candidate card ────────────────────────────────────

const PLEDGE_SG_TYPES: Partial<Record<ElectionType, number>> = {
  governor: 3,
  mayor: 4,
  superintendent: 11,
};

function usePledges(huboid: string, electionType: ElectionType) {
  const [pledges, setPledges] = useState<ElectionPledge[] | null>(null);
  const sgTypecode = PLEDGE_SG_TYPES[electionType];
  useEffect(() => {
    setPledges(null);
    if (!sgTypecode) { setPledges([]); return; }
    fetch(`/api/election-pledge?huboid=${huboid}&sgTypecode=${sgTypecode}`)
      .then((r) => r.json())
      .then((d) => setPledges(d.pledges ?? []))
      .catch(() => setPledges([]));
  }, [huboid, sgTypecode]);
  return pledges;
}

function partyLean(jdName: string): "progressive" | "conservative" | "neutral" {
  if (jdName.includes("민주") || jdName.includes("조국")) return "progressive";
  if (jdName.includes("국민의힘") || jdName.includes("국민의 힘")) return "conservative";
  return "neutral";
}

function CandidateSideCard({
  candidate,
  onDeselect,
}: {
  candidate: LocalElectionCandidate;
  onDeselect: () => void;
}) {
  const pledges = usePledges(candidate.huboid, candidate.electionType);
  const { label, src: logoSrc } = getPartyPresentation(candidate.jdName);
  const lean = partyLean(candidate.jdName);

  return (
    <SideCard>
      <SideCardHeader>
        <SideCardHeaderLeft>
          {candidate.photoUrl && (
            <Image
              src={candidate.photoUrl}
              alt={candidate.name}
              width={40}
              height={50}
              style={{ objectFit: "cover", objectPosition: "top", borderRadius: 4, flexShrink: 0 }}
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
            />
          )}
          <SideCardInfo>
            {candidate.giho && <SideGiho>기호 {candidate.giho}</SideGiho>}
            <SideName>{candidate.name}</SideName>
            <SidePartyChip $lean={lean}>
              {logoSrc && (
                <Image src={logoSrc} alt={label} width={14} height={14} style={{ objectFit: "contain", flexShrink: 0 }} />
              )}
              {label}
            </SidePartyChip>
          </SideCardInfo>
        </SideCardHeaderLeft>
        <SideDeselectBtn type="button" onClick={onDeselect}>×</SideDeselectBtn>
      </SideCardHeader>

      {(candidate.job || candidate.age || candidate.edu) && (
        <SideInfoGrid>
          {candidate.job && <SideInfoRow><SideInfoLabel>직업</SideInfoLabel><SideInfoVal>{candidate.job}</SideInfoVal></SideInfoRow>}
          {candidate.age && <SideInfoRow><SideInfoLabel>나이</SideInfoLabel><SideInfoVal>{candidate.age}세</SideInfoVal></SideInfoRow>}
          {candidate.edu && <SideInfoRow><SideInfoLabel>학력</SideInfoLabel><SideInfoVal>{candidate.edu}</SideInfoVal></SideInfoRow>}
        </SideInfoGrid>
      )}

      {(candidate.career1 || candidate.career2) && (
        <SideCareerList>
          {candidate.career1 && <SideCareerItem>{candidate.career1}</SideCareerItem>}
          {candidate.career2 && <SideCareerItem>{candidate.career2}</SideCareerItem>}
        </SideCareerList>
      )}

      {pledges === null && PLEDGE_SG_TYPES[candidate.electionType] && (
        <SidePledgeLoading>공약 불러오는 중...</SidePledgeLoading>
      )}
      {pledges && pledges.length > 0 && (
        <SidePledgeList>
          {pledges.map((p, i) => (
            <SidePledgeItem key={i}>
              {p.realm && <SidePledgeRealm>{p.realm}</SidePledgeRealm>}
              <SidePledgeTitle>{p.title}</SidePledgeTitle>
            </SidePledgeItem>
          ))}
        </SidePledgeList>
      )}
    </SideCard>
  );
}

// ─── Share button ─────────────────────────────────────────────────────────────

function ShareButton({ district, count }: { district: string; count: number }) {
  const [copied, setCopied] = useState(false);

  function handleShare() {
    const text = `6.3 지방선거, 나는 ${district}에서 투표용지 ${count}장을 받아요.\n내 투표용지 미리보기 👉 jwj.zuu3.kr`;
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <ShareBtn type="button" onClick={handleShare}>
      {copied ? "복사됨" : "공유하기"}
    </ShareBtn>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function BallotPreview() {
  const router = useRouter();
  const profileQuery = useUserProfile();
  const district = profileQuery.data?.district ?? null;
  const query = useLocalElection(district);

  const [compareA, setCompareA] = useState<{ huboid: string; type: ElectionType; name: string } | null>(null);
  const [compareB, setCompareB] = useState<{ huboid: string; type: ElectionType; name: string } | null>(null);

  function handleCandidateSelect(huboid: string, type: ElectionType, name: string) {
    if (type === "provincialPr" || type === "localPr") return;
    if (compareA?.huboid === huboid) { setCompareA(null); setCompareB(null); return; }
    if (compareB?.huboid === huboid) { setCompareB(null); return; }
    if (!compareA) { setCompareA({ huboid, type, name }); return; }
    if (compareA.type === type) { setCompareB({ huboid, type, name }); return; }
    setCompareA({ huboid, type, name });
    setCompareB(null);
  }

  const selectedHuboids = new Set([compareA?.huboid, compareB?.huboid].filter(Boolean) as string[]);

  if (!district) {
    return (
      <Page>
        <Shell>
          <EmptyState>
            <EmptyTitle>지역구 설정이 필요해요</EmptyTitle>
            <EmptyText>마이페이지에서 지역구를 설정하면 투표용지를 미리볼 수 있어요.</EmptyText>
            <SetupLink href="/mypage">지역구 설정하기</SetupLink>
          </EmptyState>
        </Shell>
      </Page>
    );
  }

  if (query.isLoading) {
    return (
      <Page>
        <Shell>
          <PageHeader>
            <BackLink href="/">← 홈</BackLink>
            <PageTitle>내 투표용지 미리보기</PageTitle>
            <PageDesc>불러오는 중...</PageDesc>
          </PageHeader>
          <SkeletonList>
            {[0, 1, 2].map((i) => <SkeletonCard key={i} />)}
          </SkeletonList>
        </Shell>
      </Page>
    );
  }

  if (query.isError || !query.data) {
    return (
      <Page>
        <Shell>
          <PageHeader>
            <BackLink href="/">← 홈</BackLink>
            <PageTitle>내 투표용지 미리보기</PageTitle>
          </PageHeader>
          <ErrorCard>
            <EmptyTitle>선거 정보를 불러오지 못했어요.</EmptyTitle>
            <EmptyText>잠시 후 다시 시도해 주세요.</EmptyText>
            <RetryButton type="button" onClick={() => void query.refetch()}>다시 시도</RetryButton>
          </ErrorCard>
        </Shell>
      </Page>
    );
  }

  const { candidates, sdName, wiwNames } = query.data;
  const regionLabel = wiwNames[0] ?? sdName;

  const activeBallots = BALLOT_ORDER.filter(
    (type) => (candidates[type]?.length ?? 0) > 0,
  );

  const fullA = compareA ? (candidates[compareA.type] ?? []).find((c) => c.huboid === compareA.huboid) ?? null : null;
  const fullB = compareB ? (candidates[compareB.type] ?? []).find((c) => c.huboid === compareB.huboid) ?? null : null;

  const hasSideContent = !!compareA;

  return (
    <Page>
      <Shell>
        <PageHeader>
          <BackLink href="/">← 홈</BackLink>
          <PageTitle>내 투표용지 미리보기</PageTitle>
          <PageDesc>{district} · 투표용지 {activeBallots.length}장</PageDesc>
          <PageNotice>
            6.3 제9회 전국동시지방선거 후보 등록 기준 정보입니다. 실제 투표용지와 다를 수 있어요.
          </PageNotice>
        </PageHeader>

        <BallotList>
          {activeBallots.map((type) => (
            <BallotCard
              key={type}
              type={type}
              candidates={candidates[type] ?? []}
              sdName={sdName}
              regionLabel={regionLabel}
              onSelect={handleCandidateSelect}
              selectedHuboids={selectedHuboids}
            />
          ))}
        </BallotList>

        {activeBallots.length > 0 && (
          <ShareArea>
            <ShareButton district={district} count={activeBallots.length} />
          </ShareArea>
        )}
      </Shell>

      {/* 데스크탑 사이드 패널 — absolute로 ballot 위치 영향 없음 */}
      {hasSideContent && (
        <SidePanel>
          <SidePanelInner>
            {!compareA && (
              <SideHint>후보를 선택하면 정보가 여기 표시돼요</SideHint>
            )}
            {fullA && (
              <CandidateSideCard
                candidate={fullA}
                onDeselect={() => { setCompareA(null); setCompareB(null); }}
              />
            )}
            {fullA && !compareB && (
              <SideHint style={{ marginTop: 8 }}>같은 선거에서 후보를 한 명 더 선택하면 비교할 수 있어요</SideHint>
            )}
            {fullB && (
              <>
                <SideVsDivider>vs</SideVsDivider>
                <CandidateSideCard
                  candidate={fullB}
                  onDeselect={() => setCompareB(null)}
                />
              </>
            )}
          </SidePanelInner>
        </SidePanel>
      )}

      {/* 모바일 전용 하단 바 */}
      {compareA && (
        <CompareBar>
          <CompareNames>
            <CompareName $active>{compareA.name}</CompareName>
            <CompareVs>vs</CompareVs>
            <CompareName $active={!!compareB}>{compareB ? compareB.name : "후보 선택"}</CompareName>
          </CompareNames>
          <CompareActions>
            {compareB && (
              <CompareBtn
                type="button"
                onClick={() => router.push(`/ballot-preview/compare?a=${compareA.huboid}&aType=${compareA.type}&b=${compareB.huboid}&bType=${compareB.type}`)}
              >
                비교
              </CompareBtn>
            )}
            <CompareClearBtn type="button" onClick={() => { setCompareA(null); setCompareB(null); }}>×</CompareClearBtn>
          </CompareActions>
        </CompareBar>
      )}
    </Page>
  );
}

// ─── Page layout ──────────────────────────────────────────────────────────────

const Page = styled.main`
  min-height: 100vh;
  background: #f2f4f6;
  padding-bottom: 80px;
  position: relative;
`;

const Shell = styled.div`
  width: min(100%, 480px);
  margin: 0 auto;
  padding: 24px 20px 0;
  display: grid;
  gap: 20px;
`;

const SidePanel = styled.div`
  position: absolute;
  left: calc(50% + 260px);
  top: 0;
  width: 320px;
  padding-top: 24px;

  @media (max-width: 900px) {
    display: none;
  }
`;

const SidePanelInner = styled.div`
  position: sticky;
  top: 20px;
  max-height: calc(100vh - 40px);
  overflow-y: auto;
  display: grid;
  gap: 0;
`;

const SideHint = styled.div`
  font-size: 13px;
  color: #b0b8c1;
  line-height: 1.6;
  padding: 16px;
  text-align: center;
`;

const SideVsDivider = styled.div`
  text-align: center;
  font-size: 11px;
  font-weight: 700;
  color: #b0b8c1;
  padding: 8px 0;
`;

const SideCard = styled.div`
  background: #ffffff;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid #e5e8eb;
  display: grid;
  gap: 10px;
`;

const SideCardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
`;

const SideCardHeaderLeft = styled.div`
  display: flex;
  gap: 10px;
  align-items: flex-start;
  flex: 1;
  min-width: 0;
`;

const SideCardInfo = styled.div`
  display: grid;
  gap: 3px;
  flex: 1;
  min-width: 0;
`;

const SideGiho = styled.div`
  font-size: 11px;
  color: #8b95a1;
  font-weight: 600;
`;

const SideName = styled.div`
  font-size: 17px;
  font-weight: 700;
  color: #191f28;
`;

const SidePartyChip = styled.span<{ $lean: "progressive" | "conservative" | "neutral" }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  width: fit-content;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  background: ${({ $lean }) =>
    $lean === "progressive" ? "#e8f3ff" : $lean === "conservative" ? "#fef2f2" : "#f2f4f6"};
  color: ${({ $lean }) =>
    $lean === "progressive" ? "#3182f6" : $lean === "conservative" ? "#e5484d" : "#6b7684"};
`;

const SideDeselectBtn = styled.button`
  background: none;
  border: none;
  font-size: 18px;
  color: #b0b8c1;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  flex-shrink: 0;
`;

const SideInfoGrid = styled.div`
  display: grid;
  gap: 6px;
`;

const SideInfoRow = styled.div`
  display: flex;
  gap: 10px;
  align-items: baseline;
`;

const SideInfoLabel = styled.span`
  font-size: 11px;
  color: #b0b8c1;
  font-weight: 600;
  width: 32px;
  flex-shrink: 0;
`;

const SideInfoVal = styled.span`
  font-size: 12px;
  color: #4e5968;
  line-height: 1.5;
`;

const SideCareerList = styled.div`
  display: grid;
  gap: 4px;
  border-top: 1px solid #f2f4f6;
  padding-top: 8px;
`;

const SideCareerItem = styled.div`
  font-size: 12px;
  color: #6b7684;
  line-height: 1.5;
  padding-left: 8px;
  border-left: 2px solid #e5e8eb;
`;

const SidePledgeLoading = styled.div`
  font-size: 12px;
  color: #b0b8c1;
  border-top: 1px solid #f2f4f6;
  padding-top: 8px;
`;

const SidePledgeList = styled.div`
  display: grid;
  gap: 8px;
  border-top: 1px solid #f2f4f6;
  padding-top: 8px;
`;

const SidePledgeItem = styled.div`
  display: grid;
  gap: 2px;
`;

const SidePledgeRealm = styled.div`
  font-size: 10px;
  font-weight: 600;
  color: #3182f6;
`;

const SidePledgeTitle = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: #191f28;
  line-height: 1.5;
`;

const PageHeader = styled.div`
  display: grid;
  gap: 6px;
`;

const BackLink = styled(Link)`
  font-size: 13px;
  color: #8b95a1;
  text-decoration: none;
  margin-bottom: 4px;
`;

const PageTitle = styled.h1`
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #191f28;
  letter-spacing: -0.02em;
`;

const PageDesc = styled.p`
  margin: 0;
  font-size: 14px;
  color: #4e5968;
`;

const PageNotice = styled.p`
  margin: 0;
  font-size: 12px;
  color: #8b95a1;
  line-height: 1.5;
`;

const BallotList = styled.div`
  display: grid;
  gap: 12px;
`;

// ─── Ballot card shell ────────────────────────────────────────────────────────

const BallotWrap = styled.div<{ $accent: string }>`
  border: 2px solid ${({ $accent }) => $accent};
  border-radius: 0;
  overflow: hidden;
  font-family: "Pretendard", "Apple SD Gothic Neo", sans-serif;
  background: #ffffff;
`;


const BallotHeader = styled.div<{ $bg: string }>`
  background: ${({ $bg }) => $bg};
  padding: 8px 14px 10px;
  text-align: center;
  display: grid;
  gap: 2px;
`;

const BallotElectionLabel = styled.div`
  font-size: 9px;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.85);
  letter-spacing: 0.08em;
`;

const BallotTitle = styled.div`
  font-size: 15px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: 0.02em;
  word-break: keep-all;
`;

const BallotSubtitle = styled.div`
  font-size: 11px;
  color: rgba(255, 255, 255, 0.85);
`;

// ─── PR layout ────────────────────────────────────────────────────────────────

const PrBody = styled.div``;

const PrColHeader = styled.div<{ $bg: string }>`
  display: grid;
  grid-template-columns: 36px 1fr 40px;
  padding: 5px 10px;
  background: #f2f4f6;
  border-bottom: 1.5px solid rgba(0,0,0,0.15);
`;

const PrColGiho = styled.span`
  font-size: 9px;
  font-weight: 700;
  color: #333;
  text-align: center;
`;

const PrColParty = styled.span`
  font-size: 9px;
  font-weight: 700;
  color: #333;
`;

const PrColStamp = styled.span`
  font-size: 9px;
  font-weight: 700;
  color: #333;
  text-align: center;
`;

const PrRow = styled.div<{ $border: string; $bg: string }>`
  display: grid;
  grid-template-columns: 36px 1fr 40px;
  align-items: center;
  padding: 9px 10px;
  border-bottom: 1px solid rgba(0,0,0,0.1);
  background: #ffffff;

  &:last-child {
    border-bottom: none;
  }
`;

const PrGiho = styled.div<{ $color: string }>`
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 1.5px solid ${({ $color }) => $color};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  color: ${({ $color }) => $color};
  font-variant-numeric: tabular-nums;
  margin: 0 auto;
`;

const PrParty = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: #111;
`;

const PrVoteBox = styled.div`
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 2px solid #222;
  margin: 0 auto;
`;

// ─── Superintendent layout ────────────────────────────────────────────────────

const SupBody = styled.div<{ $bg: string }>`
  background: #f9fafb;
  padding: 12px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  border-top: 1px solid rgba(0,0,0,0.08);
`;

const SupScroll = styled.div`
  display: flex;
  gap: 6px;
  min-width: max-content;
`;

const SupCandidate = styled.div<{ $border: string; $selected?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  width: 68px;
  padding: 8px 4px;
  border: ${({ $selected }) => $selected ? "2px solid #3182f6" : "1px solid #bbb"};
  border-radius: 0;
  background: ${({ $selected }) => $selected ? "#e8f3ff" : "#ffffff"};
  cursor: pointer;
`;

const SupPhoto = styled.div`
  width: 48px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const SupPhotoBox = styled.div`
  width: 48px;
  height: 60px;
  background: #e0e0e0;
  border-radius: 1px;
`;

const SupGiho = styled.div<{ $color: string }>`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1.5px solid ${({ $color }) => $color};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  font-weight: 700;
  color: ${({ $color }) => $color};
  font-variant-numeric: tabular-nums;
`;

const SupName = styled.div`
  font-size: 12px;
  font-weight: 700;
  color: #111;
  text-align: center;
  word-break: keep-all;
  letter-spacing: -0.01em;
`;

const SupVoteBox = styled.div`
  width: 28px;
  height: 28px;
  border: 2px solid #222;
  border-radius: 50%;
  margin-top: 2px;
`;

// ─── Regular layout ───────────────────────────────────────────────────────────

const RegBody = styled.div``;

const RegColHeader = styled.div<{ $bg: string }>`
  display: grid;
  grid-template-columns: 36px minmax(0, 100px) 1fr 28px 38px;
  padding: 5px 10px;
  background: #f2f4f6;
  border-bottom: 1.5px solid rgba(0,0,0,0.15);
`;

const RegColGiho = styled.span`
  font-size: 9px;
  font-weight: 700;
  color: #333;
  text-align: center;
`;

const RegColParty = styled.span`
  font-size: 9px;
  font-weight: 700;
  color: #333;
`;

const RegColName = styled.span`
  font-size: 9px;
  font-weight: 700;
  color: #333;
  text-align: center;
`;

const RegColPhoto = styled.span``;

const RegColStamp = styled.span`
  font-size: 9px;
  font-weight: 700;
  color: #333;
  text-align: center;
`;

const RegRow = styled.div<{ $border: string; $bg: string; $selected?: boolean }>`
  display: grid;
  grid-template-columns: 36px minmax(0, 100px) 1fr 28px 38px;
  align-items: center;
  padding: 8px 10px;
  border-bottom: 1px solid rgba(0,0,0,0.1);
  border-left: ${({ $selected }) => $selected ? "3px solid #3182f6" : "none"};
  background: ${({ $selected }) => $selected ? "#e8f3ff" : "#ffffff"};
  cursor: pointer;

  &:last-child {
    border-bottom: none;
  }
`;

const RegGiho = styled.div<{ $color: string }>`
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 1.5px solid ${({ $color }) => $color};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  color: ${({ $color }) => $color};
  font-variant-numeric: tabular-nums;
  margin: 0 auto;
`;

const RegParty = styled.div`
  font-size: 11px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding-right: 4px;
`;

const RegName = styled.div`
  font-size: 15px;
  font-weight: 700;
  color: #111;
  text-align: center;
  letter-spacing: -0.02em;
`;

const RegPhotoCell = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;

const RegPhotoBox = styled.div`
  width: 24px;
  height: 30px;
  background: #d8d8d8;
  border-radius: 1px;
`;

const RegVoteCircle = styled.div`
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 2px solid #222;
  margin: 0 auto;
`;

// ─── Share ────────────────────────────────────────────────────────────────────

const ShareArea = styled.div`
  padding-bottom: 8px;
`;

const ShareBtn = styled.button`
  width: 100%;
  height: 52px;
  border-radius: 12px;
  border: none;
  background: #191f28;
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: opacity 150ms;

  &:hover {
    opacity: 0.85;
  }
`;

// ─── States ───────────────────────────────────────────────────────────────────

const EmptyState = styled.div`
  padding: 40px 0;
  display: grid;
  gap: 8px;
`;

const EmptyTitle = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #191f28;
`;

const EmptyText = styled.p`
  margin: 0;
  font-size: 14px;
  color: #4e5968;
  line-height: 1.6;
`;

const SetupLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-top: 8px;
  padding: 10px 20px;
  border-radius: 8px;
  background: #e8f3ff;
  color: #3182f6;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  width: fit-content;
`;

const RetryButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-top: 8px;
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  background: #e8f3ff;
  color: #3182f6;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  width: fit-content;
`;

const ErrorCard = styled.div`
  padding: 24px;
  border: 1px solid #e5e8eb;
  border-radius: 12px;
  background: #ffffff;
  display: grid;
  gap: 8px;
`;

const SkeletonList = styled.div`
  display: grid;
  gap: 12px;
`;

const SkeletonCard = styled.div`
  height: 180px;
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

// ─── Compare bar ──────────────────────────────────────────────────────────────

const CompareBar = styled.div`
  position: fixed;
  bottom: 60px;
  left: 50%;
  transform: translateX(-50%);
  width: min(calc(100% - 40px), 440px);
  background: #191f28;
  border-radius: 14px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  z-index: 100;

  @media (min-width: 901px) {
    display: none;
  }
`;

const CompareNames = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
`;

const CompareName = styled.span<{ $active: boolean }>`
  font-size: 14px;
  font-weight: 600;
  color: ${({ $active }) => $active ? "#ffffff" : "#6b7684"};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100px;
`;

const CompareVs = styled.span`
  font-size: 11px;
  font-weight: 600;
  color: #8b95a1;
  flex-shrink: 0;
`;

const CompareActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
`;

const CompareBtn = styled.button`
  padding: 8px 14px;
  background: #3182f6;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  flex-shrink: 0;
`;

const CompareClearBtn = styled.button`
  width: 28px;
  height: 28px;
  background: rgba(255,255,255,0.12);
  color: #ffffff;
  border: none;
  border-radius: 50%;
  font-size: 16px;
  font-family: inherit;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

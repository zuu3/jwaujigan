"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styled from "@/lib/styled";
import { getPartyPresentation } from "@/lib/parties";
import { ELECTION_TYPE_LABELS } from "@/lib/local-election.types";
import type { ElectionType, LocalElectionCandidate } from "@/lib/local-election.types";
import type { ElectionPledge } from "@/app/api/election-pledge/route";

const PLEDGE_SG_TYPES: Partial<Record<ElectionType, number>> = {
  governor: 3,
  mayor: 4,
  superintendent: 11,
};

function usePledges(huboid: string, electionType: ElectionType) {
  const [pledges, setPledges] = useState<ElectionPledge[] | null>(null);
  const sgTypecode = PLEDGE_SG_TYPES[electionType];

  useEffect(() => {
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

type Props = {
  personA: LocalElectionCandidate;
  personB: LocalElectionCandidate;
};

export function BallotCompare({ personA, personB }: Props) {
  const router = useRouter();
  const pledgesA = usePledges(personA.huboid, personA.electionType);
  const pledgesB = usePledges(personB.huboid, personB.electionType);

  const hasPledges = !!PLEDGE_SG_TYPES[personA.electionType];

  return (
    <PageWrapper>
      <TopBar>
        <BackButton type="button" onClick={() => router.back()}>← 뒤로</BackButton>
        <TopLabel>{ELECTION_TYPE_LABELS[personA.electionType]} 비교</TopLabel>
      </TopBar>

      <CandidateHeader>
        <CandidateCol>
          <CandidateHeaderInner>
            {personA.photoUrl && (
              <Image src={personA.photoUrl} alt={personA.name} width={48} height={60}
                style={{ objectFit: "cover", objectPosition: "top", borderRadius: 4 }}
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
              />
            )}
            <CandidateInfo>
              {personA.giho && <GihoText>기호 {personA.giho}</GihoText>}
              <CandidateName>{personA.name}</CandidateName>
              <PartyChip $lean={partyLean(personA.jdName)}>{getPartyPresentation(personA.jdName).label}</PartyChip>
            </CandidateInfo>
          </CandidateHeaderInner>
        </CandidateCol>
        <VsDivider>vs</VsDivider>
        <CandidateCol>
          <CandidateHeaderInner>
            {personB.photoUrl && (
              <Image src={personB.photoUrl} alt={personB.name} width={48} height={60}
                style={{ objectFit: "cover", objectPosition: "top", borderRadius: 4 }}
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
              />
            )}
            <CandidateInfo>
              {personB.giho && <GihoText>기호 {personB.giho}</GihoText>}
              <CandidateName>{personB.name}</CandidateName>
              <PartyChip $lean={partyLean(personB.jdName)}>{getPartyPresentation(personB.jdName).label}</PartyChip>
            </CandidateInfo>
          </CandidateHeaderInner>
        </CandidateCol>
      </CandidateHeader>

      <Divider />

      <Section>
        <SectionTitle>기본 정보</SectionTitle>
        <CompareTable>
          {(personA.job || personB.job) && (
            <CompareRow>
              <CompareLabel>직업</CompareLabel>
              <CompareVal>{personA.job || "—"}</CompareVal>
              <CompareVal>{personB.job || "—"}</CompareVal>
            </CompareRow>
          )}
          {(personA.age || personB.age) && (
            <CompareRow>
              <CompareLabel>나이</CompareLabel>
              <CompareVal>{personA.age ? `${personA.age}세` : "—"}</CompareVal>
              <CompareVal>{personB.age ? `${personB.age}세` : "—"}</CompareVal>
            </CompareRow>
          )}
          {(personA.edu || personB.edu) && (
            <CompareRow>
              <CompareLabel>학력</CompareLabel>
              <CompareVal>{personA.edu || "—"}</CompareVal>
              <CompareVal>{personB.edu || "—"}</CompareVal>
            </CompareRow>
          )}
          {(personA.addr || personB.addr) && (
            <CompareRow>
              <CompareLabel>거주지</CompareLabel>
              <CompareVal>{personA.addr || "—"}</CompareVal>
              <CompareVal>{personB.addr || "—"}</CompareVal>
            </CompareRow>
          )}
        </CompareTable>
      </Section>

      {(personA.career1 || personA.career2 || personB.career1 || personB.career2) && (
        <>
          <Divider />
          <Section>
            <SectionTitle>주요 경력</SectionTitle>
            <CareerCompareRow>
              <CareerCol>
                {personA.career1 && <CareerItem>{personA.career1}</CareerItem>}
                {personA.career2 && <CareerItem>{personA.career2}</CareerItem>}
                {!personA.career1 && !personA.career2 && <EmptyCareer>—</EmptyCareer>}
              </CareerCol>
              <CareerDivider />
              <CareerCol>
                {personB.career1 && <CareerItem>{personB.career1}</CareerItem>}
                {personB.career2 && <CareerItem>{personB.career2}</CareerItem>}
                {!personB.career1 && !personB.career2 && <EmptyCareer>—</EmptyCareer>}
              </CareerCol>
            </CareerCompareRow>
          </Section>
        </>
      )}

      {hasPledges && (
        <>
          <Divider />
          <Section>
            <SectionTitle>선거 공약</SectionTitle>
            {(pledgesA === null || pledgesB === null) && (
              <PledgeLoading>공약 불러오는 중...</PledgeLoading>
            )}
            {pledgesA !== null && pledgesB !== null && pledgesA.length === 0 && pledgesB.length === 0 && (
              <PledgeEmpty>등록된 공약이 없어요.</PledgeEmpty>
            )}
            {pledgesA !== null && pledgesB !== null && (pledgesA.length > 0 || pledgesB.length > 0) && (
              <PledgeCompareList>
                {Array.from({ length: Math.max(pledgesA.length, pledgesB.length) }, (_, i) => {
                  const pa = pledgesA[i];
                  const pb = pledgesB[i];
                  return (
                    <PledgeCompareItem key={i}>
                      <PledgeItemHeader>
                        <PledgeItemNum>{i + 1}</PledgeItemNum>
                        {(pa?.realm || pb?.realm) && (
                          <PledgeItemRealm>{pa?.realm || pb?.realm}</PledgeItemRealm>
                        )}
                      </PledgeItemHeader>
                      <PledgeSideRow>
                        <PledgeSide>
                          {pa ? <PledgeTitle>{pa.title}</PledgeTitle> : <PledgeNone>—</PledgeNone>}
                        </PledgeSide>
                        <PledgeSideDivider />
                        <PledgeSide>
                          {pb ? <PledgeTitle>{pb.title}</PledgeTitle> : <PledgeNone>—</PledgeNone>}
                        </PledgeSide>
                      </PledgeSideRow>
                    </PledgeCompareItem>
                  );
                })}
              </PledgeCompareList>
            )}
          </Section>
        </>
      )}
    </PageWrapper>
  );
}

// ─── Styled components ────────────────────────────────────────────────────────

const PageWrapper = styled.div`
  max-width: 480px;
  margin: 0 auto;
  padding: 0 20px calc(80px + env(safe-area-inset-bottom, 0px));
`;

const TopBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0 8px;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  color: #3182f6;
  cursor: pointer;
  padding: 8px 0;
  min-height: 44px;
`;

const TopLabel = styled.span`
  font-size: 12px;
  color: #8b95a1;
`;

const CandidateHeader = styled.div`
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: start;
  gap: 8px;
  padding: 16px 0;
`;

const CandidateCol = styled.div`
  display: flex;
  flex-direction: column;
`;

const CandidateHeaderInner = styled.div`
  display: flex;
  gap: 8px;
  align-items: flex-start;
`;

const CandidateInfo = styled.div`
  display: grid;
  gap: 4px;
`;

const GihoText = styled.div`
  font-size: 11px;
  color: #8b95a1;
  font-weight: 600;
`;

const CandidateName = styled.div`
  font-size: 18px;
  font-weight: 700;
  color: #191f28;
  letter-spacing: -0.01em;
`;

const PartyChip = styled.span<{ $lean: "progressive" | "conservative" | "neutral" }>`
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  background: ${({ $lean }) =>
    $lean === "progressive" ? "#e8f3ff" : $lean === "conservative" ? "#fef2f2" : "#f2f4f6"};
  color: ${({ $lean }) =>
    $lean === "progressive" ? "#3182f6" : $lean === "conservative" ? "#e5484d" : "#6b7684"};
`;

const VsDivider = styled.div`
  font-size: 11px;
  font-weight: 700;
  color: #b0b8c1;
  padding-top: 20px;
`;

const Divider = styled.div`
  height: 1px;
  background: #f2f4f6;
  margin: 4px 0;
`;

const Section = styled.div`
  padding: 20px 0;
  display: grid;
  gap: 12px;
`;

const SectionTitle = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: #8b95a1;
`;

const CompareTable = styled.div`
  display: grid;
  gap: 8px;
`;

const CompareRow = styled.div`
  display: grid;
  grid-template-columns: 40px 1fr 1fr;
  gap: 8px;
  align-items: baseline;
`;

const CompareLabel = styled.div`
  font-size: 12px;
  color: #b0b8c1;
  font-weight: 600;
`;

const CompareVal = styled.div`
  font-size: 13px;
  color: #4e5968;
  line-height: 1.5;
`;

const CareerCompareRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1px 1fr;
  gap: 12px;
`;

const CareerCol = styled.div`
  display: grid;
  gap: 6px;
`;

const CareerDivider = styled.div`
  background: #f2f4f6;
`;

const CareerItem = styled.div`
  font-size: 12px;
  color: #6b7684;
  line-height: 1.6;
`;

const EmptyCareer = styled.div`
  font-size: 13px;
  color: #b0b8c1;
`;

const PledgeLoading = styled.div`
  font-size: 13px;
  color: #b0b8c1;
`;

const PledgeEmpty = styled.div`
  font-size: 13px;
  color: #b0b8c1;
`;

const PledgeCompareList = styled.div`
  display: grid;
  gap: 20px;
`;

const PledgeCompareItem = styled.div`
  display: grid;
  gap: 8px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f2f4f6;
  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
`;

const PledgeItemHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const PledgeItemNum = styled.div`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #f2f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  color: #6b7684;
  flex-shrink: 0;
`;

const PledgeItemRealm = styled.div`
  font-size: 11px;
  font-weight: 600;
  color: #3182f6;
`;

const PledgeSideRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1px 1fr;
  gap: 12px;
`;

const PledgeSide = styled.div`
  display: grid;
  gap: 4px;
`;

const PledgeSideDivider = styled.div`
  background: #f2f4f6;
`;

const PledgeTitle = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: #191f28;
  line-height: 1.5;
`;

const PledgeNone = styled.div`
  font-size: 13px;
  color: #b0b8c1;
`;

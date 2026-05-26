"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import styled from "@/lib/styled";
import { getPartyPresentation } from "@/lib/parties";
import { ELECTION_TYPE_LABELS } from "@/lib/local-election.types";
import type { ElectionType, LocalElectionWinner, LocalElectionCandidate } from "@/lib/local-election.types";
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
    if (!sgTypecode) {
      setPledges([]);
      return;
    }
    fetch(`/api/election-pledge?huboid=${huboid}&sgTypecode=${sgTypecode}`)
      .then((r) => r.json())
      .then((d) => setPledges(d.pledges ?? []))
      .catch(() => setPledges([]));
  }, [huboid, sgTypecode]);

  return pledges;
}

type PledgeBlock =
  | { type: "section"; text: string }
  | { type: "bullet"; text: string; subs: string[] };

function parsePledgeContent(raw: string): PledgeBlock[] {
  const decoded = raw
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");

  const blocks: PledgeBlock[] = [];
  // Split on □ markers (section headers)
  const sections = decoded.split(/(?=□)/).filter(Boolean);

  for (const sec of sections) {
    const headerMatch = sec.match(/^□\s*(.+?)(?:\n|$)([\s\S]*)/);
    if (!headerMatch) continue;

    const headerText = headerMatch[1].trim();
    const body = headerMatch[2] ?? "";

    blocks.push({ type: "section", text: headerText });

    // Split body on ○ bullet markers
    const bulletChunks = body.split(/(?=○)/).filter((s) => s.trim());
    for (const chunk of bulletChunks) {
      const bulletMatch = chunk.match(/^○\s*(.+?)(?:\n|$)([\s\S]*)/);
      if (!bulletMatch) continue;

      const bulletText = bulletMatch[1].trim();
      const subBody = bulletMatch[2] ?? "";

      // Sub-items: lines starting with - or ·
      const subs = subBody
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.startsWith("-") || l.startsWith("·"))
        .map((l) => l.replace(/^[-·]\s*/, "").trim())
        .filter(Boolean);

      blocks.push({ type: "bullet", text: bulletText, subs });
    }
  }

  return blocks;
}

function PledgeContentBody({ content }: { content: string }) {
  const blocks = parsePledgeContent(content);
  if (!blocks.length) return <PledgeRawText>{content}</PledgeRawText>;

  return (
    <PledgeBlocks>
      {blocks.map((b, i) => {
        if (b.type === "section") {
          return <PledgeSectionHeader key={i}>{b.text}</PledgeSectionHeader>;
        }
        return (
          <PledgeBulletGroup key={i}>
            <PledgeBulletRow>
              <PledgeBulletDot />
              <PledgeBulletText>{b.text}</PledgeBulletText>
            </PledgeBulletRow>
            {b.subs.length > 0 && (
              <PledgeSubList>
                {b.subs.map((s, j) => (
                  <PledgeSubItem key={j}>{s}</PledgeSubItem>
                ))}
              </PledgeSubList>
            )}
          </PledgeBulletGroup>
        );
      })}
    </PledgeBlocks>
  );
}

function partyLean(jdName: string): "progressive" | "conservative" | "neutral" {
  if (jdName.includes("민주") || jdName.includes("조국")) return "progressive";
  if (jdName.includes("국민의힘") || jdName.includes("국민의 힘")) return "conservative";
  return "neutral";
}

function formatDugyul(dugyul: string): string {
  const n = parseFloat(dugyul);
  return isNaN(n) ? dugyul : `${n.toFixed(1)}%`;
}

function formatDugsu(dugsu: string): string {
  const n = parseInt(dugsu, 10);
  return isNaN(n) ? dugsu : n.toLocaleString("ko-KR") + "표";
}

type Props = {
  person: LocalElectionWinner | LocalElectionCandidate;
  tab: "winners" | "candidates";
};

export function LocalPoliticianDetail({ person, tab }: Props) {
  const router = useRouter();
  const { label, src } = getPartyPresentation(person.jdName);
  const lean = partyLean(person.jdName);
  const isWinner = tab === "winners";
  const winner = isWinner ? (person as LocalElectionWinner) : null;
  const candidate = !isWinner ? (person as LocalElectionCandidate) : null;
  const pledges = usePledges(person.huboid, person.electionType);

  return (
    <PageWrapper>
      <TopBar>
        <BackButton type="button" onClick={() => router.back()}>
          ← 뒤로
        </BackButton>
        <TopLabel>{ELECTION_TYPE_LABELS[person.electionType]}</TopLabel>
      </TopBar>

      <Header>
        <HeaderInner>
          <HeaderLeft>
            <NameRow>
              {person.giho && <GihoChip>기호 {person.giho}</GihoChip>}
              <Name>{person.name}</Name>
              {isWinner && <WinnerBadge>현직</WinnerBadge>}
            </NameRow>
            <PartyRow>
              {src ? (
                <PartyLogoWrap $lean={lean}>
                  <Image src={src} alt={label} width={18} height={18} style={{ objectFit: "contain" }} />
                  <span>{label}</span>
                </PartyLogoWrap>
              ) : (
                <PartyTag $lean={lean}>{label}</PartyTag>
              )}
            </PartyRow>
            <RegionText>
              {person.sdName}
              {person.wiwName && person.wiwName !== person.sdName && ` ${person.wiwName}`}
              {person.sggName && person.sggName !== person.sdName && ` · ${person.sggName}`}
            </RegionText>
          </HeaderLeft>
          {person.photoUrl && (
            <DetailPhoto
              src={person.photoUrl}
              alt={person.name}
              width={72}
              height={88}
              style={{ objectFit: "cover", objectPosition: "top", borderRadius: 8 }}
            />
          )}
        </HeaderInner>
      </Header>

      <Divider />

      <Section>
        <SectionTitle>기본 정보</SectionTitle>
        <InfoGrid>
          {person.job && <InfoRow><InfoLabel>직업</InfoLabel><InfoValue>{person.job}</InfoValue></InfoRow>}
          {person.age && person.birthday
            ? <InfoRow><InfoLabel>나이</InfoLabel><InfoValue>{person.age}세 ({person.birthday.slice(0, 4)}년생)</InfoValue></InfoRow>
            : person.age
              ? <InfoRow><InfoLabel>나이</InfoLabel><InfoValue>{person.age}세</InfoValue></InfoRow>
              : null}
          {person.addr && <InfoRow><InfoLabel>거주지</InfoLabel><InfoValue>{person.addr}</InfoValue></InfoRow>}
          {person.edu && <InfoRow><InfoLabel>학력</InfoLabel><InfoValue>{person.edu}</InfoValue></InfoRow>}
        </InfoGrid>
      </Section>

      {(person.career1 || person.career2) && (
        <>
          <Divider />
          <Section>
            <SectionTitle>주요 경력</SectionTitle>
            <CareerList>
              {person.career1 && <CareerItem>{person.career1}</CareerItem>}
              {person.career2 && <CareerItem>{person.career2}</CareerItem>}
            </CareerList>
          </Section>
        </>
      )}

      {winner && (winner.dugsu || winner.dugyul) && (
        <>
          <Divider />
          <Section>
            <SectionTitle>2022년 선거 결과</SectionTitle>
            <InfoGrid>
              {winner.dugyul && (
                <InfoRow>
                  <InfoLabel>득표율</InfoLabel>
                  <InfoValue $accent>{formatDugyul(winner.dugyul)}</InfoValue>
                </InfoRow>
              )}
              {winner.dugsu && (
                <InfoRow>
                  <InfoLabel>득표수</InfoLabel>
                  <InfoValue>{formatDugsu(winner.dugsu)}</InfoValue>
                </InfoRow>
              )}
            </InfoGrid>
          </Section>
        </>
      )}

      {pledges === null && PLEDGE_SG_TYPES[person.electionType] && (
        <>
          <Divider />
          <Section>
            <SectionTitle>선거 공약</SectionTitle>
            <PledgeLoading>공약 불러오는 중...</PledgeLoading>
          </Section>
        </>
      )}

      {pledges && pledges.length > 0 && (
        <>
          <Divider />
          <Section>
            <SectionTitle>선거 공약</SectionTitle>
            <PledgeList>
              {pledges.map((p, i) => (
                <PledgeItem key={i}>
                  {p.realm && <PledgeRealm>{p.realm}</PledgeRealm>}
                  <PledgeTitle>{p.title}</PledgeTitle>
                  {p.content && <PledgeContentBody content={p.content} />}
                </PledgeItem>
              ))}
            </PledgeList>
          </Section>
        </>
      )}
    </PageWrapper>
  );
}

// ─── Styled components ───────────────────────────────────────────────────────

const PageWrapper = styled.div`
  max-width: 480px;
  margin: 0 auto;
  padding: 0 20px 48px;
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
  padding: 0;
`;

const TopLabel = styled.span`
  font-size: 12px;
  color: #8b95a1;
`;

const Header = styled.div`
  padding: 20px 0 24px;
`;

const HeaderInner = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
`;

const HeaderLeft = styled.div`
  flex: 1;
  display: grid;
  gap: 8px;
  min-width: 0;
`;

const DetailPhoto = styled(Image)`
  flex-shrink: 0;
  border-radius: 8px;
`;

const NameRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const GihoChip = styled.span`
  font-size: 13px;
  color: #8b95a1;
  font-weight: 600;
`;

const Name = styled.h1`
  margin: 0;
  font-size: 26px;
  font-weight: 700;
  color: #191f28;
`;

const WinnerBadge = styled.span`
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  background: #e8f3ff;
  color: #3182f6;
`;

const PartyRow = styled.div`
  display: flex;
`;

const PartyLogoWrap = styled.span<{ $lean: "progressive" | "conservative" | "neutral" }>`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px 4px 6px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 600;
  background: ${({ $lean }) =>
    $lean === "progressive" ? "#e8f3ff" : $lean === "conservative" ? "#fef2f2" : "#f2f4f6"};
  color: ${({ $lean }) =>
    $lean === "progressive" ? "#3182f6" : $lean === "conservative" ? "#e5484d" : "#6b7684"};
`;

const PartyTag = styled.span<{ $lean: "progressive" | "conservative" | "neutral" }>`
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 600;
  background: ${({ $lean }) =>
    $lean === "progressive" ? "#e8f3ff" : $lean === "conservative" ? "#fef2f2" : "#f2f4f6"};
  color: ${({ $lean }) =>
    $lean === "progressive" ? "#3182f6" : $lean === "conservative" ? "#e5484d" : "#6b7684"};
`;

const RegionText = styled.div`
  font-size: 14px;
  color: #6b7684;
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

const InfoGrid = styled.div`
  display: grid;
  gap: 10px;
`;

const InfoRow = styled.div`
  display: flex;
  align-items: baseline;
  gap: 12px;
`;

const InfoLabel = styled.span`
  font-size: 13px;
  color: #8b95a1;
  flex-shrink: 0;
  width: 40px;
`;

const InfoValue = styled.span<{ $accent?: boolean }>`
  font-size: 14px;
  font-weight: ${({ $accent }) => ($accent ? "700" : "400")};
  color: ${({ $accent }) => ($accent ? "#191f28" : "#6b7684")};
`;

const CareerList = styled.div`
  display: grid;
  gap: 8px;
`;

const CareerItem = styled.div`
  font-size: 14px;
  color: #6b7684;
  line-height: 1.6;
  padding-left: 12px;
  border-left: 2px solid #e5e8eb;
`;

const PledgeLoading = styled.div`
  font-size: 13px;
  color: #b0b8c1;
`;

const PledgeList = styled.div`
  display: grid;
  gap: 16px;
`;

const PledgeItem = styled.div`
  display: grid;
  gap: 4px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f2f4f6;
  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
`;

const PledgeRealm = styled.div`
  font-size: 11px;
  font-weight: 600;
  color: #3182f6;
  letter-spacing: 0.02em;
`;

const PledgeTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #191f28;
  line-height: 1.5;
`;

const PledgeBlocks = styled.div`
  display: grid;
  gap: 6px;
  margin-top: 6px;
`;

const PledgeSectionHeader = styled.div`
  font-size: 11px;
  font-weight: 700;
  color: #8b95a1;
  letter-spacing: 0.03em;
  margin-top: 10px;
  padding-bottom: 4px;
  border-bottom: 1px solid #f2f4f6;
  &:first-child {
    margin-top: 0;
  }
`;

const PledgeBulletGroup = styled.div`
  display: grid;
  gap: 4px;
`;

const PledgeBulletRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: flex-start;
`;

const PledgeBulletDot = styled.div`
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #b0b8c1;
  margin-top: 7px;
  flex-shrink: 0;
`;

const PledgeBulletText = styled.div`
  font-size: 13px;
  color: #4e5968;
  line-height: 1.6;
`;

const PledgeSubList = styled.div`
  padding-left: 12px;
  display: grid;
  gap: 3px;
`;

const PledgeSubItem = styled.div`
  font-size: 12px;
  color: #8b95a1;
  line-height: 1.6;
  padding-left: 10px;
  border-left: 1px solid #e5e8eb;
`;

const PledgeRawText = styled.div`
  font-size: 13px;
  color: #6b7684;
  line-height: 1.7;
  white-space: pre-wrap;
  margin-top: 4px;
`;

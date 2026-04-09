"use client";

import styled from "@emotion/styled";
import { ArrowLeft, ExternalLink, Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import type { PoliticianDetail } from "@/lib/assembly";
import { getPartyPresentation } from "@/lib/parties";

type PoliticianDetailContainerProps = {
  politician: PoliticianDetail;
};

function formatBiography(value: string | null) {
  if (!value) {
    return [];
  }

  return value
    .split(/\r?\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function PoliticianDetailContainer({
  politician,
}: PoliticianDetailContainerProps) {
  const biographyLines = formatBiography(politician.biography);
  const party = getPartyPresentation(politician.party);

  return (
    <Page>
      <Shell>
        <TopBar>
          <BackLink href="/home">
            <ArrowLeft size={16} />
            <span>홈으로 돌아가기</span>
          </BackLink>
        </TopBar>

        <HeroCard>
          <HeroImageWrap>
            {politician.image ? (
              <HeroImage src={politician.image} alt={politician.name} />
            ) : (
              <HeroFallback>{politician.name.slice(0, 1)}</HeroFallback>
            )}
          </HeroImageWrap>

          <HeroBody>
            <HeroMeta>국회의원 상세</HeroMeta>
            <HeroTitleRow>
              <HeroTitle>{politician.name}</HeroTitle>
              <PartyBox>
                {party.src ? <PartyLogo src={party.src} alt={party.label} /> : null}
                {!party.src ? <PartyFallback>{party.label}</PartyFallback> : null}
              </PartyBox>
            </HeroTitleRow>

            <SubTitleRow>
              {politician.nameHanja ? <SubText>{politician.nameHanja}</SubText> : null}
              {politician.nameEnglish ? (
                <SubText>{politician.nameEnglish}</SubText>
              ) : null}
            </SubTitleRow>

            <HeroTags>
              <InfoTag>
                <MapPin size={14} />
                <span>{politician.district}</span>
              </InfoTag>
              {politician.reelection ? <SimpleTag>{politician.reelection}</SimpleTag> : null}
              {politician.electionType ? (
                <SimpleTag>{politician.electionType}</SimpleTag>
              ) : null}
            </HeroTags>

            <HeroDescription>
              {politician.committee ?? "현재 위원회 정보가 등록되지 않았습니다."}
            </HeroDescription>
          </HeroBody>
        </HeroCard>

        <ContentGrid>
          <MainSection>
            <SectionCard>
              <SectionTitle>기본 정보</SectionTitle>
              <InfoGrid>
                <InfoItem>
                  <InfoLabel>직책</InfoLabel>
                  <InfoValue>{politician.jobTitle ?? "-"}</InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>소속 정당</InfoLabel>
                  <InfoValue>{party.label}</InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>출생일</InfoLabel>
                  <InfoValue>{politician.birthDate ?? "-"}</InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>성별</InfoLabel>
                  <InfoValue>{politician.gender ?? "-"}</InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>당선 대수</InfoLabel>
                  <InfoValue>{politician.terms ?? "-"}</InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>의원회관</InfoLabel>
                  <InfoValue>{politician.office ?? "-"}</InfoValue>
                </InfoItem>
              </InfoGrid>
            </SectionCard>

            <SectionCard>
              <SectionTitle>약력</SectionTitle>
              {biographyLines.length > 0 ? (
                <BiographyList>
                  {biographyLines.map((line) => (
                    <BiographyItem key={line}>{line}</BiographyItem>
                  ))}
                </BiographyList>
              ) : (
                <EmptyText>공개된 약력 정보가 없습니다.</EmptyText>
              )}
            </SectionCard>
          </MainSection>

          <AsideSection>
            <SectionCard>
              <SectionTitle>연락처</SectionTitle>
              <ContactList>
                <ContactItem>
                  <ContactIcon>
                    <Phone size={15} />
                  </ContactIcon>
                  <ContactContent>
                    <InfoLabel>전화</InfoLabel>
                    <InfoValue>{politician.phone ?? "-"}</InfoValue>
                  </ContactContent>
                </ContactItem>
                <ContactItem>
                  <ContactIcon>
                    <Mail size={15} />
                  </ContactIcon>
                  <ContactContent>
                    <InfoLabel>이메일</InfoLabel>
                    <InfoValue>{politician.email ?? "-"}</InfoValue>
                  </ContactContent>
                </ContactItem>
                <ContactItem>
                  <ContactIcon>
                    <ExternalLink size={15} />
                  </ContactIcon>
                  <ContactContent>
                    <InfoLabel>홈페이지</InfoLabel>
                    {politician.homepage ? (
                      <ExternalAnchor
                        href={politician.homepage}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {politician.homepage}
                      </ExternalAnchor>
                    ) : (
                      <InfoValue>-</InfoValue>
                    )}
                  </ContactContent>
                </ContactItem>
              </ContactList>
            </SectionCard>
          </AsideSection>
        </ContentGrid>
      </Shell>
    </Page>
  );
}

const Page = styled.main`
  min-height: 100vh;
  padding: 28px 24px 56px;
  background: #f8f8f6;
  color: #191f28;

  @media (max-width: 768px) {
    padding: 20px 16px 40px;
  }
`;

const Shell = styled.div`
  display: grid;
  width: min(100%, 1160px);
  gap: 18px;
  margin: 0 auto;
`;

const TopBar = styled.div`
  display: flex;
  align-items: center;
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #4e5968;
  font-size: 0.92rem;
  font-weight: 700;
`;

const HeroCard = styled.section`
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: 24px;
  padding: 22px;
  border: 1px solid #ebebeb;
  border-radius: 30px;
  background: #ffffff;
  box-shadow: 0 18px 44px rgba(15, 23, 42, 0.05);

  @media (max-width: 860px) {
    grid-template-columns: 1fr;
  }
`;

const HeroImageWrap = styled.div`
  overflow: hidden;
  height: 280px;
  border-radius: 24px;
  background: #eef3f8;

  @media (max-width: 860px) {
    height: 320px;
  }

  @media (max-width: 640px) {
    height: 260px;
  }
`;

const HeroImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const HeroFallback = styled.div`
  display: grid;
  width: 100%;
  height: 100%;
  place-items: center;
  color: #5b6b7f;
  font-size: 3rem;
  font-weight: 800;
`;

const HeroBody = styled.div`
  display: grid;
  align-content: center;
  gap: 14px;
  min-width: 0;
`;

const HeroMeta = styled.span`
  color: #6b7684;
  font-size: 0.85rem;
  font-weight: 700;
`;

const HeroTitleRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
`;

const HeroTitle = styled.h1`
  margin: 0;
  color: #111827;
  font-size: clamp(2rem, 3vw, 2.8rem);
  font-weight: 900;
  letter-spacing: -0.04em;
`;

const PartyBox = styled.div`
  display: inline-flex;
  align-items: center;
`;

const PartyLogo = styled.img`
  width: auto;
  height: 22px;
  object-fit: contain;
`;

const PartyFallback = styled.span`
  display: inline-flex;
  padding: 7px 12px;
  border-radius: 999px;
  background: #f3f4f6;
  color: #374151;
  font-size: 0.84rem;
  font-weight: 700;
`;

const SubTitleRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`;

const SubText = styled.span`
  color: #6b7280;
  font-size: 0.95rem;
`;

const HeroTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`;

const InfoTag = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 12px;
  border-radius: 999px;
  background: #f8fafc;
  color: #334155;
  font-size: 0.88rem;
  font-weight: 700;
`;

const SimpleTag = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 9px 12px;
  border-radius: 999px;
  background: #f3f4f6;
  color: #4b5563;
  font-size: 0.86rem;
  font-weight: 700;
`;

const HeroDescription = styled.p`
  margin: 0;
  color: #4b5563;
  font-size: 1rem;
  line-height: 1.65;
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 18px;
  align-items: start;

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`;

const MainSection = styled.div`
  display: grid;
  gap: 18px;
`;

const AsideSection = styled.aside`
  display: grid;
`;

const SectionCard = styled.section`
  display: grid;
  gap: 18px;
  padding: 24px;
  border: 1px solid #ebebeb;
  border-radius: 28px;
  background: #ffffff;

  @media (max-width: 768px) {
    padding: 20px;
  }
`;

const SectionTitle = styled.h2`
  margin: 0;
  color: #111827;
  font-size: 1.1rem;
  font-weight: 800;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const InfoItem = styled.div`
  display: grid;
  gap: 6px;
  padding: 14px 16px;
  border-radius: 18px;
  background: #f8fafc;
`;

const InfoLabel = styled.span`
  color: #6b7280;
  font-size: 0.82rem;
  font-weight: 700;
`;

const InfoValue = styled.span`
  color: #111827;
  font-size: 0.96rem;
  line-height: 1.55;
  word-break: break-word;
`;

const BiographyList = styled.ul`
  display: grid;
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
`;

const BiographyItem = styled.li`
  position: relative;
  padding-left: 16px;
  color: #374151;
  font-size: 0.98rem;
  line-height: 1.7;

  &::before {
    content: "";
    position: absolute;
    top: 11px;
    left: 0;
    width: 6px;
    height: 6px;
    border-radius: 999px;
    background: #d1d5db;
  }
`;

const EmptyText = styled.p`
  margin: 0;
  color: #6b7280;
  font-size: 0.95rem;
`;

const ContactList = styled.div`
  display: grid;
  gap: 14px;
`;

const ContactItem = styled.div`
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr);
  gap: 12px;
  align-items: start;
`;

const ContactIcon = styled.div`
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border-radius: 12px;
  background: #f3f4f6;
  color: #4b5563;
`;

const ContactContent = styled.div`
  display: grid;
  gap: 5px;
  min-width: 0;
`;

const ExternalAnchor = styled.a`
  color: #2563eb;
  font-size: 0.94rem;
  line-height: 1.6;
  word-break: break-all;
`;

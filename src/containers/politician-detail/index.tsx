"use client";

import styled from "@emotion/styled";
import { ArrowLeft, ExternalLink, Mail, MapPin, Phone } from "lucide-react";
import Image from "next/image";
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

        <Hero>
          <HeroImageWrap>
            {politician.image ? (
              <Image
                src={politician.image}
                alt={politician.name}
                fill
                sizes="(max-width: 860px) 100vw, 220px"
                style={{ objectFit: "cover" }}
                priority
              />
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
        </Hero>

        <ContentGrid>
          <MainSection>
            <Section>
              <SectionTitle>기본 정보</SectionTitle>
              <InfoList>
                <InfoRow>
                  <InfoLabel>직책</InfoLabel>
                  <InfoValue>{politician.jobTitle ?? "-"}</InfoValue>
                </InfoRow>
                <InfoRow>
                  <InfoLabel>소속 정당</InfoLabel>
                  <InfoValue>{party.label}</InfoValue>
                </InfoRow>
                <InfoRow>
                  <InfoLabel>출생일</InfoLabel>
                  <InfoValue>{politician.birthDate ?? "-"}</InfoValue>
                </InfoRow>
                <InfoRow>
                  <InfoLabel>성별</InfoLabel>
                  <InfoValue>{politician.gender ?? "-"}</InfoValue>
                </InfoRow>
                <InfoRow>
                  <InfoLabel>당선 대수</InfoLabel>
                  <InfoValue>{politician.terms ?? "-"}</InfoValue>
                </InfoRow>
                <InfoRow>
                  <InfoLabel>의원회관</InfoLabel>
                  <InfoValue>{politician.office ?? "-"}</InfoValue>
                </InfoRow>
              </InfoList>
            </Section>

            <Section>
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
            </Section>
          </MainSection>

          <AsideSection>
            <Section>
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
            </Section>
          </AsideSection>
        </ContentGrid>
      </Shell>
    </Page>
  );
}

const Page = styled.main`
  min-height: 100vh;
  padding: 32px 24px 64px;
  background: #ffffff;
  color: #191f28;
  animation: fade 200ms ease-out;

  @keyframes fade {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @media (max-width: 768px) {
    padding: 24px 16px 48px;
  }
`;

const Shell = styled.div`
  display: grid;
  width: min(100%, 1080px);
  gap: 40px;
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
  font-size: 14px;
  font-weight: 600;

  &:hover {
    color: #191f28;
  }
`;

const Hero = styled.section`
  display: grid;
  grid-template-columns: 160px minmax(0, 1fr);
  gap: 24px;
  padding-bottom: 40px;
  border-bottom: 1px solid #f2f4f6;

  @media (max-width: 860px) {
    grid-template-columns: 1fr;
  }
`;

const HeroImageWrap = styled.div`
  position: relative;
  overflow: hidden;
  width: 160px;
  height: 160px;
  border-radius: 8px;
  background: #f2f4f6;

  @media (max-width: 860px) {
    width: 120px;
    height: 120px;
  }
`;

const HeroFallback = styled.div`
  display: grid;
  width: 100%;
  height: 100%;
  place-items: center;
  color: #8b95a1;
  font-size: 32px;
  font-weight: 700;
`;

const HeroBody = styled.div`
  display: grid;
  align-content: center;
  gap: 12px;
  min-width: 0;
`;

const HeroMeta = styled.span`
  color: #8b95a1;
  font-size: 14px;
  font-weight: 500;
`;

const HeroTitleRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
`;

const HeroTitle = styled.h1`
  margin: 0;
  color: #191f28;
  font-size: 32px;
  font-weight: 700;
  letter-spacing: -0.02em;
`;

const PartyBox = styled.div`
  display: inline-flex;
  align-items: center;
`;

const PartyLogo = styled.img`
  width: auto;
  height: 20px;
  object-fit: contain;
`;

const PartyFallback = styled.span`
  display: inline-flex;
  padding: 4px 10px;
  border-radius: 8px;
  background: #f2f4f6;
  color: #4e5968;
  font-size: 14px;
  font-weight: 600;
`;

const SubTitleRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
`;

const SubText = styled.span`
  color: #8b95a1;
  font-size: 14px;
`;

const HeroTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const InfoTag = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 8px;
  background: #f2f4f6;
  color: #4e5968;
  font-size: 14px;
  font-weight: 500;
`;

const SimpleTag = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: 8px;
  background: #f2f4f6;
  color: #4e5968;
  font-size: 14px;
  font-weight: 500;
`;

const HeroDescription = styled.p`
  margin: 0;
  color: #4e5968;
  font-size: 16px;
  line-height: 1.6;
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 40px;
  align-items: start;

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
    gap: 40px;
  }
`;

const MainSection = styled.div`
  display: grid;
  gap: 40px;
`;

const AsideSection = styled.aside`
  display: grid;
`;

const Section = styled.section`
  display: grid;
  gap: 16px;
`;

const SectionTitle = styled.h2`
  margin: 0;
  color: #191f28;
  font-size: 18px;
  font-weight: 700;
`;

const InfoList = styled.div`
  display: grid;
  border-top: 1px solid #f2f4f6;
`;

const InfoRow = styled.div`
  display: grid;
  grid-template-columns: 120px minmax(0, 1fr);
  gap: 16px;
  padding: 14px 0;
  border-bottom: 1px solid #f2f4f6;

  @media (max-width: 480px) {
    grid-template-columns: 96px minmax(0, 1fr);
  }
`;

const InfoLabel = styled.span`
  color: #8b95a1;
  font-size: 14px;
  font-weight: 500;
`;

const InfoValue = styled.span`
  color: #191f28;
  font-size: 16px;
  line-height: 1.5;
  word-break: break-word;
`;

const BiographyList = styled.ul`
  display: grid;
  margin: 0;
  padding: 0;
  list-style: none;
  border-top: 1px solid #f2f4f6;
`;

const BiographyItem = styled.li`
  padding: 14px 0;
  border-bottom: 1px solid #f2f4f6;
  color: #191f28;
  font-size: 16px;
  line-height: 1.6;
`;

const EmptyText = styled.p`
  margin: 0;
  color: #8b95a1;
  font-size: 14px;
`;

const ContactList = styled.div`
  display: grid;
  border-top: 1px solid #f2f4f6;
`;

const ContactItem = styled.div`
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr);
  gap: 12px;
  align-items: start;
  padding: 14px 0;
  border-bottom: 1px solid #f2f4f6;
`;

const ContactIcon = styled.div`
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  color: #8b95a1;
`;

const ContactContent = styled.div`
  display: grid;
  gap: 4px;
  min-width: 0;
`;

const ExternalAnchor = styled.a`
  color: #3182f6;
  font-size: 16px;
  line-height: 1.5;
  word-break: break-all;

  &:hover {
    text-decoration: underline;
  }
`;

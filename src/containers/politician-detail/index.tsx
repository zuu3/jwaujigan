"use client";

import styled from "@emotion/styled";
import { ArrowLeft, Bell, BellOff, ExternalLink, Mail, MapPin, Phone, FileText, Lock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { PoliticianDetail } from "@/lib/assembly";
import { getPartyPresentation } from "@/lib/parties";
import { useQueryClient } from "@tanstack/react-query";
import type { ReportData, ReportResponse } from "@/app/api/politicians/[id]/report/route";
import { POINTS } from "@/services/points/points";
import { useUserProfile } from "@/services/user/user.queries";

type PoliticianDetailContainerProps = {
  politician: PoliticianDetail;
};

const HTML_ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&middot;": "·",
  "&nbsp;": " ",
  "&lsquo;": "'",
  "&rsquo;": "'",
  "&ldquo;": '"',
  "&rdquo;": '"',
  "&ndash;": "–",
  "&mdash;": "—",
};

function decodeHtmlEntities(text: string) {
  return text
    .replace(/&[a-z]+;|&#\d+;/gi, (entity) => HTML_ENTITIES[entity] ?? entity);
}

function formatBiography(value: string | null) {
  if (!value) {
    return [];
  }

  return value
    .split(/\r?\n+/)
    .map((line) => decodeHtmlEntities(line.trim()))
    .filter(Boolean);
}

export function PoliticianDetailContainer({
  politician,
}: PoliticianDetailContainerProps) {
  const biographyLines = formatBiography(politician.biography);
  const party = getPartyPresentation(politician.party);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [report, setReport] = useState<ReportData | null>(null);
  const [reportCreatedAt, setReportCreatedAt] = useState<string | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportChecked, setReportChecked] = useState(false);
  const profileQuery = useUserProfile();
  const queryClient = useQueryClient();

  useEffect(() => {
    fetch(`/api/politicians/${politician.id}/follow`)
      .then((r) => r.json() as Promise<{ following: boolean }>)
      .then(({ following: f }) => setFollowing(f))
      .catch(() => null);
  }, [politician.id]);

  useEffect(() => {
    fetch(`/api/politicians/${politician.id}/report`)
      .then((r) => r.json() as Promise<{ report: ReportData | null } | ReportResponse>)
      .then((data) => {
        if ("report" in data && data.report) {
          setReport(data.report);
          if ("created_at" in data) setReportCreatedAt(data.created_at);
        }
      })
      .catch(() => null)
      .finally(() => setReportChecked(true));
  }, [politician.id]);

  const handleGenerateReport = async () => {
    if (reportLoading) return;
    setReportLoading(true);
    try {
      const res = await fetch(`/api/politicians/${politician.id}/report`, { method: "POST" });
      if (res.status === 402) {
        alert(`포인트가 부족해요. 심층 분석에는 ${POINTS.REPORT}pt가 필요해요.`);
        return;
      }
      if (!res.ok) {
        alert("분석 생성에 실패했어요. 잠시 후 다시 시도해주세요.");
        return;
      }
      const data = await res.json() as ReportResponse;
      setReport(data.report);
      setReportCreatedAt(data.created_at);
      if (!data.is_cached) {
        void queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      }
    } finally {
      setReportLoading(false);
    }
  };

  const handleFollow = async () => {
    if (followLoading) return;
    setFollowLoading(true);
    try {
      const res = await fetch(`/api/politicians/${politician.id}/follow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: politician.name, image: politician.image }),
      });
      if (res.status === 401) {
        window.location.href = "/";
        return;
      }
      const data = (await res.json()) as { following: boolean };
      setFollowing(data.following);
    } finally {
      setFollowLoading(false);
    }
  };

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

            <FollowButton
              type="button"
              $following={following}
              disabled={followLoading}
              onClick={() => void handleFollow()}
            >
              {following ? <BellOff size={15} /> : <Bell size={15} />}
              <span>{following ? "팔로우 중" : "팔로우"}</span>
            </FollowButton>
          </HeroBody>
        </Hero>

        <ContentGrid>
          <MainSection>
            <Section>
              <ReportSectionTitle>
                <FileText size={18} />
                <span>발의 법안 심층 분석</span>
              </ReportSectionTitle>

              {report ? (
                <ReportCard>
                  <ReportStats>
                    <StatBox>
                      <StatNum>{report.bill_count}</StatNum>
                      <StatLabel>총 발의</StatLabel>
                    </StatBox>
                    <StatBox>
                      <StatNum $color="#03b26c">{report.pass_count}</StatNum>
                      <StatLabel>가결</StatLabel>
                    </StatBox>
                    <StatBox>
                      <StatNum $color="#8b95a1">{report.pending_count}</StatNum>
                      <StatLabel>계류</StatLabel>
                    </StatBox>
                    <StatBox>
                      <StatNum $color="#f04452">{report.fail_count}</StatNum>
                      <StatLabel>폐기</StatLabel>
                    </StatBox>
                  </ReportStats>

                  {report.categories.length > 0 && (
                    <ReportBlock>
                      <ReportBlockTitle>주요 분야</ReportBlockTitle>
                      <CategoryList>
                        {report.categories.map((c) => (
                          <CategoryChip key={c.name}>
                            {c.name} <CategoryCount>{c.count}건</CategoryCount>
                          </CategoryChip>
                        ))}
                      </CategoryList>
                    </ReportBlock>
                  )}

                  <ReportBlock>
                    <ReportBlockTitle>AI 분석</ReportBlockTitle>
                    <ReportSummary>{report.summary}</ReportSummary>
                  </ReportBlock>

                  {report.notable_bills.length > 0 && (
                    <ReportBlock>
                      <ReportBlockTitle>주요 가결 법안</ReportBlockTitle>
                      <NotableBillList>
                        {report.notable_bills.map((b) => (
                          <NotableBillItem key={b.title}>
                            {b.url ? (
                              <a href={b.url} target="_blank" rel="noreferrer">{b.title}</a>
                            ) : (
                              <span>{b.title}</span>
                            )}
                            {b.date && <BillDate>{b.date.slice(0, 10)}</BillDate>}
                          </NotableBillItem>
                        ))}
                      </NotableBillList>
                    </ReportBlock>
                  )}

                  {reportCreatedAt && (
                    <ReportFooter>
                      {new Date(reportCreatedAt).toLocaleDateString("ko-KR")} 기준 · 22대 국회 데이터
                    </ReportFooter>
                  )}
                </ReportCard>
              ) : reportChecked ? (
                <ReportGate>
                  <ReportGateIcon>
                    <Lock size={20} />
                  </ReportGateIcon>
                  <ReportGateText>
                    {politician.name} 의원의 발의 법안을 AI가 분석해드려요.
                  </ReportGateText>
                  <ReportGateSub>한 번 생성하면 무료로 다시 볼 수 있어요.</ReportGateSub>
                  <ReportButton
                    type="button"
                    disabled={reportLoading}
                    onClick={() => void handleGenerateReport()}
                  >
                    {reportLoading ? "분석 중..." : `분석 생성 · ${POINTS.REPORT}pt`}
                  </ReportButton>
                  {profileQuery.data && (
                    <UserPoints>보유 포인트: {(profileQuery.data.points).toLocaleString("ko-KR")}pt</UserPoints>
                  )}
                </ReportGate>
              ) : (
                <ReportSkeleton />
              )}
            </Section>

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

const FollowButton = styled.button<{ $following: boolean }>`
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  gap: 6px;
  padding: 0 16px;
  height: 40px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 150ms;
  border: 1.5px solid ${({ $following }) => ($following ? "#e5e8eb" : "#3182f6")};
  background: ${({ $following }) => ($following ? "transparent" : "#3182f6")};
  color: ${({ $following }) => ($following ? "#6b7684" : "#ffffff")};

  &:hover:not(:disabled) {
    border-color: ${({ $following }) => ($following ? "#f04452" : "#2272eb")};
    background: ${({ $following }) => ($following ? "#fef2f2" : "#2272eb")};
    color: ${({ $following }) => ($following ? "#f04452" : "#ffffff")};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
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

/* ── Report Section ──────────────────────────────────────── */

const ReportSectionTitle = styled.h2`
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  color: #191f28;
  font-size: 18px;
  font-weight: 700;
`;

const ReportCard = styled.div`
  display: grid;
  gap: 24px;
  padding: 24px;
  border: 1px solid #e5e8eb;
  border-radius: 12px;
`;

const ReportStats = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
`;

const StatBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 16px 8px;
  border-radius: 8px;
  background: #f9fafb;
`;

const StatNum = styled.span<{ $color?: string }>`
  font-size: 24px;
  font-weight: 700;
  color: ${({ $color }) => $color ?? "#191f28"};
  font-variant-numeric: tabular-nums;
`;

const StatLabel = styled.span`
  font-size: 12px;
  color: #8b95a1;
  font-weight: 500;
`;

const ReportBlock = styled.div`
  display: grid;
  gap: 12px;
`;

const ReportBlockTitle = styled.h3`
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #4e5968;
`;

const CategoryList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const CategoryChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 12px;
  border-radius: 9999px;
  background: #e8f3ff;
  color: #3182f6;
  font-size: 13px;
  font-weight: 600;
`;

const CategoryCount = styled.span`
  color: #8b95a1;
  font-weight: 400;
`;

const ReportSummary = styled.p`
  margin: 0;
  font-size: 15px;
  line-height: 1.7;
  color: #333d4b;
  word-break: keep-all;
  overflow-wrap: break-word;
`;

const NotableBillList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 8px;
  border-top: 1px solid #f2f4f6;
`;

const NotableBillItem = styled.li`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid #f2f4f6;
  font-size: 14px;
  color: #191f28;

  a {
    color: #3182f6;
    text-decoration: none;
    &:hover { text-decoration: underline; }
  }
`;

const BillDate = styled.span`
  flex-shrink: 0;
  font-size: 12px;
  color: #8b95a1;
`;

const ReportFooter = styled.p`
  margin: 0;
  font-size: 12px;
  color: #b0b8c1;
`;

const ReportGate = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 40px 24px;
  border: 1px solid #e5e8eb;
  border-radius: 12px;
  text-align: center;
`;

const ReportGateIcon = styled.div`
  display: grid;
  width: 48px;
  height: 48px;
  place-items: center;
  border-radius: 12px;
  background: #f2f4f6;
  color: #8b95a1;
`;

const ReportGateText = styled.p`
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #191f28;
`;

const ReportGateSub = styled.p`
  margin: 0;
  font-size: 13px;
  color: #8b95a1;
`;

const ReportButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 44px;
  padding: 0 24px;
  border: none;
  border-radius: 8px;
  background: #191f28;
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: opacity 150ms;

  &:hover:not(:disabled) { opacity: 0.85; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const UserPoints = styled.span`
  font-size: 12px;
  color: #8b95a1;
`;

const ReportSkeleton = styled.div`
  height: 200px;
  border-radius: 12px;
  background: linear-gradient(90deg, #f2f4f6 25%, #e5e8eb 50%, #f2f4f6 75%);
  background-size: 200% 100%;
  animation: shimmer 1.2s infinite;

  @keyframes shimmer {
    from { background-position: 200% 0; }
    to   { background-position: -200% 0; }
  }
`;

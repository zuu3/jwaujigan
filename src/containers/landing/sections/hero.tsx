import styled from "@/lib/styled";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { Container, fadeUp } from "../shared";

type HeroSectionProps = {
  isAuthenticated: boolean;
};

export function HeroSection({ isAuthenticated }: HeroSectionProps) {
  return (
    <Hero>
      <HeroInner>
        <HeroCopy
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: {
              transition: { staggerChildren: 0.06 },
            },
          }}
        >
          <Eyebrow variants={fadeUp}>우리 동네 정치를 더 쉽게</Eyebrow>

          <HeroTitle variants={fadeUp}>
            정치인을 알고, 이슈를 비교하고, 판단을 만들어요
          </HeroTitle>

          <HeroText variants={fadeUp}>
            지역 정치인 정보와 이슈 요약, AI 토론을 한 흐름으로 보여줘요.
          </HeroText>

          <HeroActions variants={fadeUp}>
            {isAuthenticated ? (
              <PrimaryLinkCta href="/home">
                서비스 이어서 보기
                <ArrowRight size={16} />
              </PrimaryLinkCta>
            ) : (
              <PrimaryButtonCta callbackUrl="/onboarding">
                Google로 시작하기
                <ArrowRight size={16} />
              </PrimaryButtonCta>
            )}
            <SecondaryCta href="#arena">AI 토론 보기</SecondaryCta>
          </HeroActions>
          {!isAuthenticated && (
            <ConsentNote>
              시작하기 버튼 클릭 시{" "}
              <ConsentLink href="/terms">이용약관</ConsentLink> 및{" "}
              <ConsentLink href="/privacy">개인정보처리방침</ConsentLink>에 동의하게 됩니다.
            </ConsentNote>
          )}
        </HeroCopy>

        <HeroPanel
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <PanelTop>
            <PanelEyebrow>미리보기</PanelEyebrow>
            <PanelTitle>정치는 멀리서 보지 않게</PanelTitle>
          </PanelTop>

          <PreviewBlock>
            <PreviewKicker>우리 동네</PreviewKicker>
            <PoliticianMini>
              <MiniAvatar aria-hidden="true">김</MiniAvatar>
              <MiniBody>
                <MiniLine>
                  <MiniName>김도읍</MiniName>
                  <PartyDot $tone="red" aria-hidden="true" />
                  <MiniMuted>국민의힘</MiniMuted>
                </MiniLine>
                <MiniMuted>부산 강서구 · 4선</MiniMuted>
              </MiniBody>
              <ReelectionDots aria-label="4선">
                <Dot />
                <Dot />
                <Dot />
                <Dot />
              </ReelectionDots>
            </PoliticianMini>
          </PreviewBlock>

          <PreviewBlock>
            <PreviewKicker>오늘의 이슈</PreviewKicker>
            <IssueTitleMini>2026년도 본예산 1차 표결</IssueTitleMini>
            <VoteBarStack aria-hidden="true">
              <VoteBarSeg $color="#3182f6" $pct={54} />
              <VoteBarSeg $color="#b0b8c1" $pct={8} />
              <VoteBarSeg $color="#e5484d" $pct={38} />
            </VoteBarStack>
            <VoteLegend>
              <LegendItem>
                <LegendDot $color="#3182f6" />
                <LegendLabel>진보</LegendLabel>
                <LegendPct>54%</LegendPct>
              </LegendItem>
              <LegendItem>
                <LegendDot $color="#b0b8c1" />
                <LegendLabel>모름</LegendLabel>
                <LegendPct>8%</LegendPct>
              </LegendItem>
              <LegendItem>
                <LegendDot $color="#e5484d" />
                <LegendLabel>보수</LegendLabel>
                <LegendPct>38%</LegendPct>
              </LegendItem>
            </VoteLegend>
          </PreviewBlock>

          <PreviewBlock>
            <PreviewKicker>국회 발의안</PreviewKicker>
            <ChipRow>
              <StatusChip $tone="pass">통과 8</StatusChip>
              <StatusChip $tone="pending">계류 12</StatusChip>
              <StatusChip $tone="reject">폐기 3</StatusChip>
            </ChipRow>
          </PreviewBlock>
        </HeroPanel>
      </HeroInner>
    </Hero>
  );
}

const Hero = styled.section`
  padding: 80px 24px 0;

  @media (max-width: 640px) {
    padding: 56px 20px 0;
  }
`;

const HeroInner = styled(Container)`
  display: grid;
  align-items: center;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 420px);
  gap: 40px;

  @media (max-width: 1100px) {
    grid-template-columns: 1fr;
  }

  @media (max-width: 640px) {
    gap: 24px;
  }
`;

const HeroCopy = styled(motion.div)`
  max-width: 700px;
  min-width: 0;
`;

const Eyebrow = styled(motion.div)`
  color: var(--muted);
  font-size: 14px;
  font-weight: 600;
  letter-spacing: -0.01em;
`;

const HeroTitle = styled(motion.h1)`
  margin: 12px 0 0;
  color: var(--text);
  font-size: 32px;
  font-weight: 700;
  line-height: 1.3;
  letter-spacing: -0.03em;
  word-break: keep-all;
  text-wrap: balance;
`;

const HeroText = styled(motion.p)`
  max-width: 620px;
  margin: 16px 0 0;
  color: var(--sub);
  font-size: 16px;
  font-weight: 400;
  line-height: 1.6;
  letter-spacing: -0.01em;
  word-break: keep-all;
  text-wrap: pretty;
`;

const HeroActions = styled(motion.div)`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 24px;
`;

const primaryCtaStyles = `
  display: inline-flex;
  min-height: 48px;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0 20px;
  border-radius: 8px;
  color: #ffffff;
  background: #191f28;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: -0.01em;
  border: 0;
  cursor: pointer;
  transition: opacity 140ms ease;

  &:hover {
    opacity: 0.9;
  }

  @media (max-width: 640px) {
    width: 100%;
  }
`;

const PrimaryLinkCta = styled(Link)`
  ${primaryCtaStyles}
`;

const PrimaryButtonCta = styled(GoogleSignInButton)`
  ${primaryCtaStyles}
`;

const SecondaryCta = styled(Link)`
  display: inline-flex;
  min-height: 48px;
  align-items: center;
  justify-content: center;
  padding: 0 20px;
  border: 1px solid var(--line);
  border-radius: 8px;
  color: var(--text);
  background: #ffffff;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: -0.01em;
  transition: background 140ms ease;

  &:hover {
    background: var(--line-soft);
  }

  @media (max-width: 640px) {
    width: 100%;
  }
`;

const HeroPanel = styled(motion.aside)`
  padding: 24px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #ffffff;

  @media (max-width: 640px) {
    padding: 20px;
  }
`;

const PanelTop = styled.div`
  padding-bottom: 16px;
  border-bottom: 1px solid var(--line-soft);
`;

const PanelEyebrow = styled.div`
  color: var(--muted);
  font-size: 14px;
  font-weight: 600;
  letter-spacing: -0.01em;
`;

const PanelTitle = styled.h2`
  margin: 8px 0 0;
  color: var(--text);
  font-size: 18px;
  font-weight: 700;
  line-height: 1.4;
  letter-spacing: -0.02em;
  word-break: keep-all;
`;

const PreviewBlock = styled.div`
  padding: 16px 0;
  border-bottom: 1px solid var(--line-soft);

  &:last-of-type {
    padding-bottom: 0;
    border-bottom: none;
  }
`;

const PreviewKicker = styled.div`
  color: var(--muted);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: -0.01em;
  margin-bottom: 10px;
`;

const PoliticianMini = styled.div`
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
`;

const MiniAvatar = styled.div`
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: var(--line-soft);
  color: var(--sub);
  font-size: 15px;
  font-weight: 700;
  letter-spacing: -0.02em;
`;

const MiniBody = styled.div`
  display: grid;
  gap: 2px;
  min-width: 0;
`;

const MiniLine = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
`;

const MiniName = styled.span`
  color: var(--text);
  font-size: 15px;
  font-weight: 700;
  letter-spacing: -0.02em;
`;

const PartyDot = styled.span<{ $tone: "blue" | "red" }>`
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: ${({ $tone }) => ($tone === "blue" ? "#3182f6" : "#e5484d")};
`;

const MiniMuted = styled.span`
  color: var(--muted);
  font-size: 13px;
  font-weight: 500;
  letter-spacing: -0.01em;
`;

const ReelectionDots = styled.div`
  display: inline-flex;
  gap: 3px;
`;

const Dot = styled.span`
  display: inline-block;
  width: 5px;
  height: 5px;
  border-radius: 999px;
  background: #4e5968;
`;

const IssueTitleMini = styled.div`
  color: var(--text);
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.02em;
  margin-bottom: 12px;
  word-break: keep-all;
`;

const VoteBarStack = styled.div`
  display: flex;
  width: 100%;
  height: 8px;
  border-radius: 999px;
  overflow: hidden;
  background: var(--line-soft);
`;

const VoteBarSeg = styled.div<{ $color: string; $pct: number }>`
  height: 100%;
  background: ${({ $color }) => $color};
  width: ${({ $pct }) => $pct}%;
`;

const VoteLegend = styled.div`
  display: flex;
  gap: 16px;
  margin-top: 10px;
  flex-wrap: wrap;
`;

const LegendItem = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
`;

const LegendDot = styled.span<{ $color: string }>`
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 2px;
  background: ${({ $color }) => $color};
`;

const LegendLabel = styled.span`
  color: var(--sub);
  font-size: 12px;
  font-weight: 500;
  letter-spacing: -0.01em;
`;

const LegendPct = styled.span`
  color: var(--text);
  font-size: 12px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.01em;
`;

const ConsentNote = styled.p`
  margin: 0;
  color: #b0b8c1;
  font-size: 12px;
  font-weight: 400;
  line-height: 1.6;
`;

const ConsentLink = styled(Link)`
  color: #8b95a1;
  text-decoration: underline;
  text-underline-offset: 2px;

  &:hover {
    color: #6b7684;
  }
`;

const ChipRow = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
`;

const StatusChip = styled.span<{ $tone: "pass" | "pending" | "reject" }>`
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.01em;
  background: ${({ $tone }) =>
    $tone === "pass" ? "#e8f3ff" : $tone === "reject" ? "#fef2f2" : "#f2f4f6"};
  color: ${({ $tone }) =>
    $tone === "pass" ? "#3182f6" : $tone === "reject" ? "#e5484d" : "#6b7684"};
`;

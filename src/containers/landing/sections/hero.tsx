import styled from "@emotion/styled";
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
            정치인을 알고, 이슈를 비교하고, 판단을 만듭니다
          </HeroTitle>

          <HeroText variants={fadeUp}>
            지역 정치인 정보와 이슈 요약, AI 토론을 한 흐름으로 보여줍니다.
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
        </HeroCopy>

        <HeroPanel
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <PanelTop>
            <PanelEyebrow>오늘의 흐름</PanelEyebrow>
            <PanelTitle>정치는 멀리서 보지 않게</PanelTitle>
          </PanelTop>

          <PanelList>
            <PanelListItem>
              <PanelLabel>1</PanelLabel>
              <PanelContent>
                <PanelItemTitle>우리 동네 정치인 찾기</PanelItemTitle>
                <PanelItemText>
                  지역구 기준으로 누가 어떤 활동을 하는지 봅니다.
                </PanelItemText>
              </PanelContent>
            </PanelListItem>

            <PanelListItem>
              <PanelLabel>2</PanelLabel>
              <PanelContent>
                <PanelItemTitle>같은 이슈를 양쪽 관점으로 보기</PanelItemTitle>
                <PanelItemText>
                  핵심 차이를 나란히 확인합니다.
                </PanelItemText>
              </PanelContent>
            </PanelListItem>

            <PanelListItem>
              <PanelLabel>3</PanelLabel>
              <PanelContent>
                <PanelItemTitle>짧게 이해하고 직접 참여하기</PanelItemTitle>
                <PanelItemText>
                  요약을 보고, 투표하고, 의견을 남깁니다.
                </PanelItemText>
              </PanelContent>
            </PanelListItem>
          </PanelList>
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

const PanelList = styled.div`
  display: grid;
`;

const PanelListItem = styled.div`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 12px;
  padding: 16px 0;
  border-bottom: 1px solid var(--line-soft);

  &:last-child {
    padding-bottom: 0;
    border-bottom: none;
  }
`;

const PanelLabel = styled.div`
  display: grid;
  width: 24px;
  height: 24px;
  place-items: center;
  border-radius: 999px;
  color: var(--sub);
  background: var(--line-soft);
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
`;

const PanelContent = styled.div`
  min-width: 0;
`;

const PanelItemTitle = styled.div`
  color: var(--text);
  font-size: 16px;
  font-weight: 600;
  letter-spacing: -0.02em;
  word-break: keep-all;
`;

const PanelItemText = styled.p`
  margin: 4px 0 0;
  color: var(--sub);
  font-size: 14px;
  font-weight: 400;
  line-height: 1.55;
  letter-spacing: -0.01em;
  word-break: keep-all;
`;

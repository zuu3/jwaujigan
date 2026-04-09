import styled from "@emotion/styled";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Container, fadeUp } from "../shared";

export function HeroSection() {
  return (
    <Hero>
      <HeroBackground />

      <HeroInner>
        <HeroCopy
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: {
              transition: { staggerChildren: 0.08 },
            },
          }}
        >
          <Badge variants={fadeUp}>우리 동네 정치를 더 쉽게 보는 방법</Badge>

          <HeroTitle variants={fadeUp}>
            정치인을 알고 이슈를 비교하고 내 판단을 만들어갑니다
          </HeroTitle>

          <HeroText variants={fadeUp}>
            좌우지간은 우리 지역 정치인 정보와 AI 토론, 이슈 요약을 한 흐름으로
            보여주는 서비스입니다. 어렵고 멀게 느껴졌던 정치를 더 쉽게, 더 균형
            있게 이해하도록 돕습니다.
          </HeroText>

          <HeroActions variants={fadeUp}>
            <PrimaryCta href="#local-info">
              우리 동네 정치인 보기
              <ArrowRight size={18} />
            </PrimaryCta>
            <SecondaryCta href="#arena">AI 토론 보기</SecondaryCta>
          </HeroActions>
        </HeroCopy>

        <HeroPanel
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.18 }}
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
                  지역구 기준으로 누가 어떤 활동을 하는지 먼저 봅니다.
                </PanelItemText>
              </PanelContent>
            </PanelListItem>

            <PanelListItem>
              <PanelLabel>2</PanelLabel>
              <PanelContent>
                <PanelItemTitle>같은 이슈를 양쪽 관점으로 보기</PanelItemTitle>
                <PanelItemText>
                  한쪽 주장만 보지 않고 핵심 차이를 나란히 확인합니다.
                </PanelItemText>
              </PanelContent>
            </PanelListItem>

            <PanelListItem>
              <PanelLabel>3</PanelLabel>
              <PanelContent>
                <PanelItemTitle>짧게 이해하고 직접 참여하기</PanelItemTitle>
                <PanelItemText>
                  요약을 보고, 투표하고, 의견을 남기며 내 판단을 만듭니다.
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
  position: relative;
  overflow: hidden;
  padding: 72px 24px 56px;

  @media (max-width: 1024px) {
    padding-top: 56px;
  }

  @media (max-width: 640px) {
    padding: 44px 20px 32px;
  }
`;

const HeroBackground = styled.div`
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 20% 20%, rgba(49, 130, 246, 0.1), transparent 28%),
    radial-gradient(circle at 80% 20%, rgba(255, 152, 0, 0.09), transparent 24%),
    linear-gradient(180deg, #ffffff 0%, #fbfcfe 100%);
`;

const HeroInner = styled(Container)`
  position: relative;
  display: grid;
  align-items: center;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 420px);
  gap: 48px;

  @media (max-width: 1180px) {
    gap: 36px;
    grid-template-columns: minmax(0, 1fr) minmax(300px, 380px);
  }

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

const Badge = styled(motion.div)`
  display: inline-flex;
  width: fit-content;
  padding: 10px 14px;
  border-radius: 999px;
  color: var(--blue);
  background: rgba(49, 130, 246, 0.08);
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: -0.02em;

  @media (max-width: 640px) {
    font-size: 0.84rem;
  }
`;

const HeroTitle = styled(motion.h1)`
  max-width: 11ch;
  margin: 22px 0 0;
  color: var(--text);
  font-size: clamp(2.6rem, 6vw, 4.8rem);
  font-weight: 800;
  line-height: 1.08;
  letter-spacing: -0.07em;
  word-break: keep-all;
  text-wrap: balance;

  @media (max-width: 1100px) {
    max-width: 12ch;
  }

  @media (max-width: 640px) {
    max-width: none;
    margin-top: 18px;
    font-size: 2.45rem;
    line-height: 1.14;
  }
`;

const HeroText = styled(motion.p)`
  max-width: 620px;
  margin: 24px 0 0;
  color: var(--muted);
  font-size: 1.04rem;
  font-weight: 500;
  line-height: 1.72;
  letter-spacing: -0.02em;
  word-break: keep-all;
  text-wrap: pretty;

  @media (max-width: 640px) {
    margin-top: 18px;
    font-size: 0.98rem;
  }
`;

const HeroActions = styled(motion.div)`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 32px;

  @media (max-width: 640px) {
    margin-top: 24px;
  }
`;

const PrimaryCta = styled(Link)`
  display: inline-flex;
  min-height: 54px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 22px;
  border-radius: 16px;
  color: #fff;
  background: var(--blue);
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: -0.03em;

  @media (max-width: 640px) {
    width: 100%;
    min-height: 50px;
    font-size: 0.96rem;
  }
`;

const SecondaryCta = styled(Link)`
  display: inline-flex;
  min-height: 54px;
  align-items: center;
  justify-content: center;
  padding: 0 22px;
  border: 1px solid var(--line);
  border-radius: 16px;
  color: var(--text);
  background: #fff;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: -0.03em;

  @media (max-width: 640px) {
    width: 100%;
    min-height: 50px;
    font-size: 0.96rem;
  }
`;

const HeroPanel = styled(motion.aside)`
  padding: 28px;
  border: 1px solid var(--line);
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.06);

  @media (max-width: 640px) {
    padding: 22px;
    border-radius: 22px;
  }
`;

const PanelTop = styled.div`
  padding-bottom: 18px;
  border-bottom: 1px solid var(--line);
`;

const PanelEyebrow = styled.div`
  color: var(--muted);
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: -0.02em;
`;

const PanelTitle = styled.h2`
  margin: 10px 0 0;
  color: var(--text);
  font-size: 1.38rem;
  font-weight: 700;
  line-height: 1.3;
  letter-spacing: -0.04em;
  word-break: keep-all;
`;

const PanelList = styled.div`
  display: grid;
  margin-top: 12px;
`;

const PanelListItem = styled.div`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 14px;
  padding: 18px 0;
  border-bottom: 1px solid var(--line);

  &:last-child {
    padding-bottom: 0;
    border-bottom: none;
  }
`;

const PanelLabel = styled.div`
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  border-radius: 999px;
  color: var(--blue);
  background: rgba(49, 130, 246, 0.08);
  font-size: 0.86rem;
  font-weight: 700;
  flex-shrink: 0;
`;

const PanelContent = styled.div`
  min-width: 0;
`;

const PanelItemTitle = styled.div`
  color: var(--text);
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: -0.03em;
  word-break: keep-all;
`;

const PanelItemText = styled.p`
  margin: 8px 0 0;
  color: var(--muted);
  font-size: 0.94rem;
  font-weight: 500;
  line-height: 1.6;
  letter-spacing: -0.02em;
  word-break: keep-all;
`;

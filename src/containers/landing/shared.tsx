import styled from "@emotion/styled";
import { motion, type Variants } from "framer-motion";

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

export const Page = styled.main`
  min-height: 100vh;
  color: #191f28;
  background: #fff;
  --text: #191f28;
  --muted: #6b7684;
  --line: #e5e8eb;
  --surface: #f8fafb;
  --surface-soft: #fbfcfd;
  --blue: #3182f6;
  --red: #ef6253;
`;

export const Container = styled.div`
  width: min(100%, 1120px);
  margin: 0 auto;
`;

export const Section = styled.section`
  padding: 96px 24px 0;
  scroll-margin-top: 84px;

  @media (max-width: 1024px) {
    padding-top: 80px;
  }

  @media (max-width: 640px) {
    padding: 64px 20px 0;
  }
`;

export const TintedSection = styled(Section)`
  background: #fcfdff;
`;

export const SlimSection = styled.section`
  padding: 96px 24px;

  @media (max-width: 1024px) {
    padding: 80px 24px;
  }

  @media (max-width: 640px) {
    padding: 64px 20px;
  }
`;

export const SectionHeader = styled(motion.div)`
  max-width: 720px;
`;

export const SectionEyebrow = styled.div`
  color: var(--blue);
  font-size: 0.92rem;
  font-weight: 700;
  letter-spacing: -0.02em;
`;

export const SectionTitle = styled.h2`
  margin: 14px 0 0;
  color: var(--text);
  font-size: clamp(2rem, 4.5vw, 3.2rem);
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: -0.06em;
  word-break: keep-all;
  text-wrap: balance;

  @media (max-width: 640px) {
    font-size: 2rem;
  }
`;

export const SectionText = styled.p`
  margin: 18px 0 0;
  color: var(--muted);
  font-size: 1rem;
  font-weight: 500;
  line-height: 1.72;
  letter-spacing: -0.02em;
  word-break: keep-all;
  text-wrap: pretty;
`;

export const FeatureLayout = styled.div`
  display: grid;
  align-items: start;
  grid-template-columns: minmax(0, 1fr) minmax(300px, 440px);
  gap: 48px;

  @media (max-width: 1180px) {
    gap: 36px;
  }

  @media (max-width: 1100px) {
    grid-template-columns: 1fr;
  }

  @media (max-width: 640px) {
    gap: 24px;
  }
`;

export const FeatureCopy = styled(motion.div)`
  max-width: 680px;
  min-width: 0;
`;

export const SimpleList = styled.div`
  display: grid;
  margin-top: 28px;
  border-top: 1px solid var(--line);
`;

export const SimpleListItem = styled.div`
  position: relative;
  padding: 18px 0 18px 18px;
  border-bottom: 1px solid var(--line);
  color: var(--text);
  font-size: 0.98rem;
  font-weight: 600;
  line-height: 1.6;
  letter-spacing: -0.02em;
  word-break: keep-all;

  &::before {
    content: "";
    position: absolute;
    top: 26px;
    left: 0;
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: var(--blue);
  }

  @media (max-width: 640px) {
    padding: 16px 0 16px 16px;
    font-size: 0.95rem;
  }
`;

export const PreviewPanel = styled(motion.aside)`
  padding: 28px;
  border: 1px solid var(--line);
  border-radius: 28px;
  background: #fff;

  @media (max-width: 640px) {
    padding: 22px;
    border-radius: 22px;
  }
`;

export const PreviewHeader = styled.div`
  padding-bottom: 16px;
  border-bottom: 1px solid var(--line);
`;

export const PreviewTag = styled.div`
  color: var(--blue);
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: -0.02em;
`;

export const PreviewHeadline = styled.h3`
  margin: 10px 0 0;
  color: var(--text);
  font-size: 1.32rem;
  font-weight: 700;
  line-height: 1.3;
  letter-spacing: -0.04em;
  word-break: keep-all;
  text-wrap: balance;

  @media (max-width: 640px) {
    font-size: 1.18rem;
  }
`;

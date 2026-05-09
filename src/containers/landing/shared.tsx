import styled from "@emotion/styled";
import { motion, type Variants } from "framer-motion";

export const fadeUp: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  },
};

export const Page = styled.main`
  min-height: 100vh;
  color: #191f28;
  background: #ffffff;
  --text: #191f28;
  --sub: #4e5968;
  --muted: #8b95a1;
  --line: #e5e7eb;
  --line-soft: #f2f4f6;
  --surface: #f2f4f6;
  --blue: #3182f6;
  --red: #e5484d;
`;

export const Container = styled.div`
  width: min(100%, 1120px);
  margin: 0 auto;
`;

export const Section = styled.section`
  padding: 80px 24px 0;
  scroll-margin-top: 64px;

  @media (max-width: 640px) {
    padding: 56px 20px 0;
  }
`;

export const TintedSection = styled(Section)`
  background: #ffffff;
  border-top: 1px solid var(--line-soft);
`;

export const SlimSection = styled.section`
  padding: 80px 24px;

  @media (max-width: 640px) {
    padding: 56px 20px;
  }
`;

export const SectionHeader = styled(motion.div)`
  max-width: 720px;
`;

export const SectionEyebrow = styled.div`
  color: var(--muted);
  font-size: 14px;
  font-weight: 600;
  letter-spacing: -0.01em;
`;

export const SectionTitle = styled.h2`
  margin: 12px 0 0;
  color: var(--text);
  font-size: 24px;
  font-weight: 700;
  line-height: 1.35;
  letter-spacing: -0.03em;
  word-break: keep-all;
  text-wrap: balance;
`;

export const SectionText = styled.p`
  margin: 16px 0 0;
  color: var(--sub);
  font-size: 16px;
  font-weight: 400;
  line-height: 1.6;
  letter-spacing: -0.01em;
  word-break: keep-all;
  text-wrap: pretty;
`;

export const FeatureLayout = styled.div`
  display: grid;
  align-items: start;
  grid-template-columns: minmax(0, 1fr) minmax(300px, 440px);
  gap: 40px;

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
  margin-top: 24px;
  border-top: 1px solid var(--line);
`;

export const SimpleListItem = styled.div`
  padding: 16px 0;
  border-bottom: 1px solid var(--line);
  color: var(--text);
  font-size: 16px;
  font-weight: 500;
  line-height: 1.6;
  letter-spacing: -0.01em;
  word-break: keep-all;
`;

export const PreviewPanel = styled(motion.aside)`
  padding: 24px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #ffffff;

  @media (max-width: 640px) {
    padding: 20px;
  }
`;

export const PreviewHeader = styled.div`
  padding-bottom: 16px;
  border-bottom: 1px solid var(--line-soft);
`;

export const PreviewTag = styled.div`
  color: var(--muted);
  font-size: 14px;
  font-weight: 600;
  letter-spacing: -0.01em;
`;

export const PreviewHeadline = styled.h3`
  margin: 8px 0 0;
  color: var(--text);
  font-size: 18px;
  font-weight: 700;
  line-height: 1.4;
  letter-spacing: -0.02em;
  word-break: keep-all;
  text-wrap: balance;
`;

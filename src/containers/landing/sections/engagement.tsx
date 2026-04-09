import styled from "@emotion/styled";
import { motion } from "framer-motion";
import { engagementItems } from "../data";
import {
  Container,
  SectionEyebrow,
  SectionHeader,
  SectionTitle,
  SlimSection,
  fadeUp,
} from "../shared";

export function EngagementSection() {
  return (
    <SlimSection>
      <Container>
        <SectionHeader
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.35 }}
          variants={fadeUp}
        >
          <SectionEyebrow>Engagement</SectionEyebrow>
          <SectionTitle>보고 끝나는 서비스가 아니라, 함께 판단하는 서비스</SectionTitle>
        </SectionHeader>

        <EngagementRow>
          {engagementItems.map((item) => {
            const Icon = item.icon;

            return (
              <EngagementItem
                key={item.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                variants={fadeUp}
              >
                <EngagementIcon>
                  <Icon size={18} />
                </EngagementIcon>
                <EngagementTitle>{item.title}</EngagementTitle>
                <EngagementText>{item.description}</EngagementText>
              </EngagementItem>
            );
          })}
        </EngagementRow>
      </Container>
    </SlimSection>
  );
}

const EngagementRow = styled.div`
  display: grid;
  margin-top: 36px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`;

const EngagementItem = styled(motion.div)`
  padding: 28px 24px;
  border-radius: 24px;
  background: var(--surface-soft);

  @media (max-width: 960px) {
    padding: 22px 20px;
  }
`;

const EngagementIcon = styled.div`
  display: grid;
  width: 40px;
  height: 40px;
  place-items: center;
  border-radius: 14px;
  color: var(--blue);
  background: rgba(49, 130, 246, 0.08);
`;

const EngagementTitle = styled.h3`
  margin: 18px 0 0;
  color: var(--text);
  font-size: 1.06rem;
  font-weight: 700;
  letter-spacing: -0.03em;
`;

const EngagementText = styled.p`
  margin: 10px 0 0;
  color: var(--muted);
  font-size: 0.95rem;
  font-weight: 500;
  line-height: 1.6;
  letter-spacing: -0.02em;
  word-break: keep-all;
`;

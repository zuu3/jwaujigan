import styled from "@/lib/styled";
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
          <SectionEyebrow>참여</SectionEyebrow>
          <SectionTitle>보고 끝나지 않고 함께 판단해요</SectionTitle>
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
  margin-top: 32px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0;
  border-top: 1px solid var(--line);
  border-bottom: 1px solid var(--line);

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`;

const EngagementItem = styled(motion.div)`
  padding: 24px 20px;
  border-right: 1px solid var(--line);

  &:last-child {
    border-right: none;
  }

  @media (max-width: 960px) {
    border-right: none;
    border-bottom: 1px solid var(--line);

    &:last-child {
      border-bottom: none;
    }
  }
`;

const EngagementIcon = styled.div`
  display: grid;
  width: 32px;
  height: 32px;
  place-items: center;
  color: var(--sub);
`;

const EngagementTitle = styled.h3`
  margin: 12px 0 0;
  color: var(--text);
  font-size: 16px;
  font-weight: 600;
  letter-spacing: -0.02em;
`;

const EngagementText = styled.p`
  margin: 6px 0 0;
  color: var(--sub);
  font-size: 14px;
  font-weight: 400;
  line-height: 1.55;
  letter-spacing: -0.01em;
  word-break: keep-all;
`;

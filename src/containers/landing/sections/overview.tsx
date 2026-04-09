import styled from "@emotion/styled";
import { motion } from "framer-motion";
import { values } from "../data";
import {
  Container,
  Section,
  SectionEyebrow,
  SectionHeader,
  SectionText,
  SectionTitle,
  fadeUp,
} from "../shared";

export function OverviewSection() {
  return (
    <Section id="overview">
      <Container>
        <SectionHeader
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.35 }}
          variants={fadeUp}
        >
          <SectionEyebrow>Why Jwaujigan</SectionEyebrow>
          <SectionTitle>정치를 어렵지 않게 시작하도록 만드는 서비스</SectionTitle>
          <SectionText>
            서비스가 해야 할 일은 많아 보이는 기능을 나열하는 게 아니라,
            사용자가 바로 이해할 수 있는 흐름을 만드는 것입니다.
          </SectionText>
        </SectionHeader>

        <ValueRow>
          {values.map((item) => {
            const Icon = item.icon;

            return (
              <ValueItem
                key={item.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.25 }}
                variants={fadeUp}
              >
                <ValueIcon>
                  <Icon size={18} />
                </ValueIcon>
                <ValueTextGroup>
                  <ValueTitle>{item.title}</ValueTitle>
                  <ValueDescription>{item.description}</ValueDescription>
                </ValueTextGroup>
              </ValueItem>
            );
          })}
        </ValueRow>
      </Container>
    </Section>
  );
}

const ValueRow = styled.div`
  display: grid;
  margin-top: 42px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`;

const ValueItem = styled(motion.div)`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 16px;
  padding: 26px 24px;
  border-radius: 24px;
  background: var(--surface-soft);

  @media (max-width: 960px) {
    padding: 22px 20px;
  }
`;

const ValueIcon = styled.div`
  display: grid;
  width: 40px;
  height: 40px;
  place-items: center;
  border-radius: 14px;
  color: var(--blue);
  background: rgba(49, 130, 246, 0.08);
`;

const ValueTextGroup = styled.div`
  min-width: 0;
`;

const ValueTitle = styled.h3`
  margin: 0;
  color: var(--text);
  font-size: 1.08rem;
  font-weight: 700;
  letter-spacing: -0.03em;
`;

const ValueDescription = styled.p`
  margin: 10px 0 0;
  color: var(--muted);
  font-size: 0.95rem;
  font-weight: 500;
  line-height: 1.6;
  letter-spacing: -0.02em;
  word-break: keep-all;
`;

import styled from "@/lib/styled";
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
          <SectionEyebrow>서비스 소개</SectionEyebrow>
          <SectionTitle>정치를 어렵지 않게 시작해요</SectionTitle>
          <SectionText>
            많은 기능을 나열하지 않고, 바로 이해할 수 있는 흐름을 만듭니다.
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
  margin-top: 40px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0;
  border-top: 1px solid var(--line);
  border-bottom: 1px solid var(--line);

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`;

const ValueItem = styled(motion.div)`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 12px;
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

const ValueIcon = styled.div`
  display: grid;
  width: 32px;
  height: 32px;
  place-items: center;
  color: var(--sub);
`;

const ValueTextGroup = styled.div`
  min-width: 0;
`;

const ValueTitle = styled.h3`
  margin: 0;
  color: var(--text);
  font-size: 16px;
  font-weight: 600;
  letter-spacing: -0.02em;
`;

const ValueDescription = styled.p`
  margin: 6px 0 0;
  color: var(--sub);
  font-size: 14px;
  font-weight: 400;
  line-height: 1.55;
  letter-spacing: -0.01em;
  word-break: keep-all;
`;

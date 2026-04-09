import styled from "@emotion/styled";
import { Swords } from "lucide-react";
import { arenaPoints } from "../data";
import {
  Container,
  FeatureCopy,
  FeatureLayout,
  PreviewHeadline,
  PreviewPanel,
  PreviewTag,
  SectionEyebrow,
  SectionText,
  SectionTitle,
  TintedSection,
  fadeUp,
} from "../shared";

export function ArenaSection() {
  return (
    <TintedSection id="arena">
      <Container>
        <FeatureLayout>
          <FeatureCopy
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.28 }}
            variants={fadeUp}
          >
            <SectionEyebrow>AI Arena</SectionEyebrow>
            <SectionTitle>같은 이슈를 두 관점으로 비교합니다</SectionTitle>
            <SectionText>
              누가 더 크게 말하는지가 아니라, 어디서 생각이 갈리는지를 보는
              경험이 필요합니다. AI 아레나는 서로 다른 입장을 한 화면에서 읽게
              만들어줍니다.
            </SectionText>

            <PointStack>
              {arenaPoints.map((item, index) => (
                <PointCard key={item}>
                  <PointIndex>{index + 1}</PointIndex>
                  <PointText>{item}</PointText>
                </PointCard>
              ))}
            </PointStack>
          </FeatureCopy>

          <DebatePanel
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.55 }}
          >
            <DebateHeader>
              <PreviewTag>AI 토론</PreviewTag>
              <PreviewHeadline>복지 확대, 어디까지 필요할까?</PreviewHeadline>
            </DebateHeader>

            <DebateColumns>
              <DebateColumn $tone="blue">
                <DebateLabel>진보 관점</DebateLabel>
                <DebateText>
                  지금 필요한 건 체감되는 변화입니다. 복지는 삶을 버티게 하는
                  안전망이 될 수 있습니다.
                </DebateText>
              </DebateColumn>

              <DebateColumn $tone="red">
                <DebateLabel>보수 관점</DebateLabel>
                <DebateText>
                  좋은 제도도 오래 갈 수 있어야 합니다. 재원과 지속 가능성을 함께
                  봐야 합니다.
                </DebateText>
              </DebateColumn>
            </DebateColumns>

            <DebateHint>
              <Swords size={16} />
              한쪽 주장만 보여주지 않고 핵심 차이를 나란히 읽게 합니다.
            </DebateHint>
          </DebatePanel>
        </FeatureLayout>
      </Container>
    </TintedSection>
  );
}

const DebatePanel = styled(PreviewPanel)`
  background:
    linear-gradient(180deg, rgba(49, 130, 246, 0.03), rgba(255, 255, 255, 0)),
    #fff;
`;

const DebateHeader = styled.div`
  margin-bottom: 18px;
`;

const DebateColumns = styled.div`
  display: grid;
  gap: 12px;
`;

const DebateColumn = styled.div<{ $tone: "blue" | "red" }>`
  padding: 18px;
  border-radius: 22px;
  background: ${({ $tone }) =>
    $tone === "blue" ? "rgba(49, 130, 246, 0.06)" : "rgba(239, 98, 83, 0.06)"};
`;

const DebateLabel = styled.div`
  color: var(--muted);
  font-size: 0.84rem;
  font-weight: 700;
  letter-spacing: -0.02em;
`;

const DebateText = styled.p`
  margin: 10px 0 0;
  color: var(--text);
  font-size: 0.96rem;
  font-weight: 600;
  line-height: 1.65;
  letter-spacing: -0.02em;
  word-break: keep-all;
`;

const DebateHint = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 18px;
  padding: 12px 14px;
  border-radius: 999px;
  background: rgba(49, 130, 246, 0.08);
  color: var(--muted);
  font-size: 0.92rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  word-break: keep-all;
`;

const PointStack = styled.div`
  display: grid;
  gap: 12px;
  margin-top: 28px;
`;

const PointCard = styled.div`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: start;
  gap: 14px;
  padding: 18px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.78);
`;

const PointIndex = styled.div`
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  border-radius: 999px;
  color: var(--blue);
  background: rgba(49, 130, 246, 0.1);
  font-size: 0.86rem;
  font-weight: 700;
`;

const PointText = styled.div`
  color: var(--text);
  font-size: 0.98rem;
  font-weight: 600;
  line-height: 1.6;
  letter-spacing: -0.02em;
  word-break: keep-all;
`;

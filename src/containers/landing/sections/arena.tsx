import styled from "@/lib/styled";
import { arenaPoints } from "../data";
import {
  Container,
  FeatureCopy,
  FeatureLayout,
  PreviewHeadline,
  PreviewPanel,
  PreviewTag,
  TintedSection,
  fadeUp,
  SectionEyebrow,
  SectionText,
  SectionTitle,
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
            <SectionEyebrow>AI 아레나</SectionEyebrow>
            <SectionTitle>같은 이슈를 두 관점으로 비교해요</SectionTitle>
            <SectionText>
              서로 다른 입장을 한 화면에서 나란히 읽습니다.
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

          <PreviewPanel
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.4 }}
          >
            <DebateHeader>
              <PreviewTag>AI 토론</PreviewTag>
              <PreviewHeadline>복지 확대, 어디까지 필요할까?</PreviewHeadline>
            </DebateHeader>

            <DebateColumns>
              <DebateColumn>
                <DebateLabel $tone="blue">진보</DebateLabel>
                <DebateText>
                  지금 필요한 건 체감되는 변화입니다. 복지는 안전망이 됩니다.
                </DebateText>
              </DebateColumn>

              <DebateColumn>
                <DebateLabel $tone="red">보수</DebateLabel>
                <DebateText>
                  좋은 제도도 오래 갈 수 있어야 합니다. 재원과 지속 가능성을 함께 봅니다.
                </DebateText>
              </DebateColumn>
            </DebateColumns>

            <DebateHint>
              한쪽 주장만 보여주지 않고 핵심 차이를 나란히 읽을 수 있어요.
            </DebateHint>
          </PreviewPanel>
        </FeatureLayout>
      </Container>
    </TintedSection>
  );
}

const DebateHeader = styled.div`
  margin-bottom: 16px;
`;

const DebateColumns = styled.div`
  display: grid;
  gap: 0;
  border-top: 1px solid var(--line-soft);
`;

const DebateColumn = styled.div`
  padding: 16px 0;
  border-bottom: 1px solid var(--line-soft);

  &:last-child {
    border-bottom: none;
  }
`;

const DebateLabel = styled.div<{ $tone: "blue" | "red" }>`
  color: ${({ $tone }) => ($tone === "blue" ? "#3182f6" : "#e5484d")};
  font-size: 14px;
  font-weight: 600;
  letter-spacing: -0.01em;
`;

const DebateText = styled.p`
  margin: 4px 0 0;
  color: var(--text);
  font-size: 16px;
  font-weight: 500;
  line-height: 1.55;
  letter-spacing: -0.01em;
  word-break: keep-all;
`;

const DebateHint = styled.div`
  margin-top: 16px;
  color: var(--muted);
  font-size: 14px;
  font-weight: 400;
  line-height: 1.55;
  letter-spacing: -0.01em;
  word-break: keep-all;
`;

const PointStack = styled.div`
  display: grid;
  margin-top: 24px;
  border-top: 1px solid var(--line);
`;

const PointCard = styled.div`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: start;
  gap: 12px;
  padding: 16px 0;
  border-bottom: 1px solid var(--line);
`;

const PointIndex = styled.div`
  color: var(--muted);
  font-size: 14px;
  font-weight: 600;
  min-width: 20px;
`;

const PointText = styled.div`
  color: var(--text);
  font-size: 16px;
  font-weight: 500;
  line-height: 1.55;
  letter-spacing: -0.01em;
  word-break: keep-all;
`;

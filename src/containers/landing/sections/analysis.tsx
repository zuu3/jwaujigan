import styled from "@/lib/styled";
import { analysisPoints } from "../data";
import {
  Container,
  FeatureCopy,
  FeatureLayout,
  PreviewHeader,
  PreviewHeadline,
  PreviewPanel,
  PreviewTag,
  Section,
  SectionEyebrow,
  SectionText,
  SectionTitle,
  fadeUp,
} from "../shared";

export function AnalysisSection() {
  return (
    <Section id="analysis">
      <Container>
        <FeatureLayout>
          <FeatureCopy
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.28 }}
            variants={fadeUp}
          >
            <SectionEyebrow>이슈 분석</SectionEyebrow>
            <SectionTitle>복잡한 정책도 짧고 분명하게 정리해요</SectionTitle>
            <SectionText>
              한 문장 요약으로 먼저 파악하고, 진보·보수 관점 차이를 나란히 확인해요.
            </SectionText>

            <StepGrid>
              {analysisPoints.map((item, index) => (
                <StepCard key={item}>
                  <StepNumber>0{index + 1}</StepNumber>
                  <StepText>{item}</StepText>
                </StepCard>
              ))}
            </StepGrid>
          </FeatureCopy>

          <PreviewPanel
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.4 }}
          >
            <PreviewHeader>
              <PreviewTag>이슈 분석</PreviewTag>
              <PreviewHeadline>청년 주거 지원 확대</PreviewHeadline>
            </PreviewHeader>

            <SummaryBox>
              <SummaryTitle>한 줄 요약</SummaryTitle>
              <SummaryText>
                청년층의 주거 부담을 줄이기 위해 공공 지원을 확대하는 법안입니다.
              </SummaryText>
            </SummaryBox>

            <CompareRows>
              <CompareRow>
                <CompareLabel $tone="blue">진보</CompareLabel>
                <CompareText>
                  지금 필요한 지원을 더 넓게, 더 빠르게 제공해야 한다
                </CompareText>
              </CompareRow>
              <CompareRow>
                <CompareLabel $tone="red">보수</CompareLabel>
                <CompareText>
                  지원 기준과 재원 구조를 더 정교하게 설계해야 한다
                </CompareText>
              </CompareRow>
              <CompareRow>
                <CompareLabel>상세</CompareLabel>
                <CompareText>
                  배경·조항·영향·쟁점을 4문단으로 정리한 법안 상세 내용을 확인한다
                </CompareText>
              </CompareRow>
            </CompareRows>
          </PreviewPanel>
        </FeatureLayout>
      </Container>
    </Section>
  );
}

const SummaryBox = styled.div`
  margin-top: 16px;
  padding: 16px 0;
  border-bottom: 1px solid var(--line-soft);
`;

const SummaryTitle = styled.div`
  color: var(--muted);
  font-size: 14px;
  font-weight: 600;
  letter-spacing: -0.01em;
`;

const SummaryText = styled.p`
  margin: 4px 0 0;
  color: var(--text);
  font-size: 16px;
  font-weight: 500;
  line-height: 1.6;
  letter-spacing: -0.01em;
  word-break: keep-all;
`;

const CompareRows = styled.div`
  display: grid;
`;

const CompareRow = styled.div`
  padding: 16px 0;
  border-bottom: 1px solid var(--line-soft);

  &:last-child {
    border-bottom: none;
  }
`;

const CompareLabel = styled.div<{ $tone?: "blue" | "red" }>`
  color: ${({ $tone }) =>
    $tone === "blue" ? "#3182f6" : $tone === "red" ? "#e5484d" : "var(--muted)"};
  font-size: 14px;
  font-weight: 600;
  letter-spacing: -0.01em;
`;

const CompareText = styled.div`
  margin-top: 4px;
  color: var(--text);
  font-size: 16px;
  font-weight: 500;
  line-height: 1.55;
  letter-spacing: -0.01em;
  word-break: keep-all;
`;

const StepGrid = styled.div`
  display: grid;
  margin-top: 24px;
  border-top: 1px solid var(--line);
`;

const StepCard = styled.div`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 12px;
  padding: 16px 0;
  border-bottom: 1px solid var(--line);
`;

const StepNumber = styled.div`
  color: var(--muted);
  font-size: 14px;
  font-weight: 600;
  letter-spacing: -0.01em;
  min-width: 24px;
`;

const StepText = styled.div`
  color: var(--text);
  font-size: 16px;
  font-weight: 500;
  line-height: 1.55;
  letter-spacing: -0.01em;
  word-break: keep-all;
`;

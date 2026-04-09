import styled from "@emotion/styled";
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
            <SectionEyebrow>Balance Analysis</SectionEyebrow>
            <SectionTitle>복잡한 정책도 짧고 분명하게 정리합니다</SectionTitle>
            <SectionText>
              긴 기사와 어려운 문서를 처음부터 다 읽지 않아도 됩니다. 먼저 핵심을
              짧게 파악하고, 그 다음에 관점 차이와 사실관계를 확인하면 됩니다.
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

          <AnalysisPanel
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.55 }}
          >
            <PreviewHeader>
              <PreviewTag>이슈 분석</PreviewTag>
              <PreviewHeadline>청년 주거 지원 확대</PreviewHeadline>
            </PreviewHeader>

            <SummaryBox>
              <SummaryTitle>3줄 요약</SummaryTitle>
              <SummaryText>
                청년층의 주거 부담을 줄이기 위한 지원 확대 정책입니다. 재정
                부담과 대상 기준이 핵심 쟁점입니다. 체감 효과와 지속 가능성을
                함께 봐야 합니다.
              </SummaryText>
            </SummaryBox>

            <CompareRows>
              <CompareRow>
                <CompareLabel>진보</CompareLabel>
                <CompareText>
                  지금 필요한 지원을 더 넓게, 더 빠르게 제공해야 한다
                </CompareText>
              </CompareRow>
              <CompareRow>
                <CompareLabel>보수</CompareLabel>
                <CompareText>
                  지원 기준과 재원 구조를 더 정교하게 설계해야 한다
                </CompareText>
              </CompareRow>
              <CompareRow>
                <CompareLabel>팩트</CompareLabel>
                <CompareText>
                  예산 규모, 수혜 대상, 법적 근거를 함께 확인해야 한다
                </CompareText>
              </CompareRow>
            </CompareRows>
          </AnalysisPanel>
        </FeatureLayout>
      </Container>
    </Section>
  );
}

const AnalysisPanel = styled(PreviewPanel)`
  background: var(--surface);
`;

const SummaryBox = styled.div`
  margin-top: 18px;
  padding: 18px;
  border-radius: 20px;
  background: #fff;
`;

const SummaryTitle = styled.div`
  color: var(--blue);
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: -0.02em;
`;

const SummaryText = styled.p`
  margin: 10px 0 0;
  color: var(--text);
  font-size: 0.96rem;
  font-weight: 600;
  line-height: 1.68;
  letter-spacing: -0.02em;
  word-break: keep-all;
`;

const CompareRows = styled.div`
  display: grid;
  gap: 10px;
  margin-top: 12px;
`;

const CompareRow = styled.div`
  padding: 16px 18px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.82);
`;

const CompareLabel = styled.div`
  color: var(--muted);
  font-size: 0.84rem;
  font-weight: 700;
  letter-spacing: -0.02em;
`;

const CompareText = styled.div`
  margin-top: 8px;
  color: var(--text);
  font-size: 0.96rem;
  font-weight: 600;
  line-height: 1.62;
  letter-spacing: -0.02em;
  word-break: keep-all;
`;

const StepGrid = styled.div`
  display: grid;
  gap: 12px;
  margin-top: 28px;
`;

const StepCard = styled.div`
  padding: 18px 20px;
  border-radius: 20px;
  background: linear-gradient(180deg, #f8fafc 0%, #f4f7fb 100%);
`;

const StepNumber = styled.div`
  color: var(--blue);
  font-size: 0.84rem;
  font-weight: 700;
  letter-spacing: -0.02em;
`;

const StepText = styled.div`
  margin-top: 8px;
  color: var(--text);
  font-size: 0.98rem;
  font-weight: 600;
  line-height: 1.58;
  letter-spacing: -0.02em;
  word-break: keep-all;
`;

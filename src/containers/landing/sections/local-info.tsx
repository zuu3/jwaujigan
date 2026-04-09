import styled from "@emotion/styled";
import { Bookmark } from "lucide-react";
import { localInfoItems } from "../data";
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

export function LocalInfoSection() {
  return (
    <Section id="local-info">
      <Container>
        <FeatureLayout>
          <FeatureCopy
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.28 }}
            variants={fadeUp}
          >
            <SectionEyebrow>Local Info</SectionEyebrow>
            <SectionTitle>우리 동네 정치인을 먼저 보여줍니다</SectionTitle>
            <SectionText>
              정치가 어렵게 느껴지는 가장 큰 이유는 내 삶과 연결되는 출발점이 없기
              때문입니다. 좌우지간은 지역구를 기준으로 정치인을 찾고, 어떤
              사람인지 금방 이해할 수 있게 정리합니다.
            </SectionText>

            <Checklist>
              {localInfoItems.map((item) => (
                <ChecklistItem key={item}>{item}</ChecklistItem>
              ))}
            </Checklist>
          </FeatureCopy>

          <PreviewPanel
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.55 }}
          >
            <PreviewHeader>
              <PreviewTag>정치인 탐색</PreviewTag>
              <PreviewHeadline>서울 마포구 갑</PreviewHeadline>
            </PreviewHeader>

            <PreviewRows>
              <PreviewRow>
                <PreviewRowLabel>대표 의원</PreviewRowLabel>
                <PreviewRowValue>사진, 정당, 약력, 위원회 정보</PreviewRowValue>
              </PreviewRow>
              <PreviewRow>
                <PreviewRowLabel>최근 활동</PreviewRowLabel>
                <PreviewRowValue>발의 법안, 뉴스 언급, 공약 이행 흐름</PreviewRowValue>
              </PreviewRow>
              <PreviewRow>
                <PreviewRowLabel>한눈에 보기</PreviewRowLabel>
                <PreviewRowValue>
                  어떤 분야에 강한지, 얼마나 성실한지 쉽게 확인
                </PreviewRowValue>
              </PreviewRow>
            </PreviewRows>

            <PreviewFooter>
              <Bookmark size={16} />
              관심 정치인은 저장해두고 다시 볼 수 있습니다.
            </PreviewFooter>
          </PreviewPanel>
        </FeatureLayout>
      </Container>
    </Section>
  );
}

const PreviewRows = styled.div`
  display: grid;
  gap: 10px;
  margin-top: 18px;
`;

const PreviewRow = styled.div`
  padding: 18px;
  border-radius: 18px;
  background: var(--surface);
`;

const PreviewRowLabel = styled.div`
  color: var(--muted);
  font-size: 0.84rem;
  font-weight: 700;
  letter-spacing: -0.02em;
`;

const PreviewRowValue = styled.div`
  margin-top: 8px;
  color: var(--text);
  font-size: 0.98rem;
  font-weight: 600;
  line-height: 1.6;
  letter-spacing: -0.02em;
  word-break: keep-all;
`;

const PreviewFooter = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 18px;
  color: var(--muted);
  font-size: 0.92rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  word-break: keep-all;
`;

const Checklist = styled.div`
  display: grid;
  gap: 12px;
  margin-top: 28px;
`;

const ChecklistItem = styled.div`
  position: relative;
  padding: 18px 20px 18px 42px;
  border-radius: 18px;
  background: var(--surface-soft);
  color: var(--text);
  font-size: 0.98rem;
  font-weight: 600;
  line-height: 1.6;
  letter-spacing: -0.02em;
  word-break: keep-all;

  &::before {
    content: "";
    position: absolute;
    top: 24px;
    left: 20px;
    width: 10px;
    height: 10px;
    border-radius: 999px;
    background: var(--blue);
  }

  @media (max-width: 640px) {
    padding: 16px 18px 16px 38px;
    font-size: 0.95rem;
  }
`;

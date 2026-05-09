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
            <SectionEyebrow>정치인 탐색</SectionEyebrow>
            <SectionTitle>우리 동네 정치인을 먼저 보여줍니다</SectionTitle>
            <SectionText>
              지역구를 기준으로 정치인을 찾고, 어떤 사람인지 짧게 정리합니다.
            </SectionText>

            <Checklist>
              {localInfoItems.map((item) => (
                <ChecklistItem key={item}>{item}</ChecklistItem>
              ))}
            </Checklist>
          </FeatureCopy>

          <PreviewPanel
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.4 }}
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
                <PreviewRowValue>발의 법안, 뉴스 언급, 공약 이행</PreviewRowValue>
              </PreviewRow>
              <PreviewRow>
                <PreviewRowLabel>한눈에 보기</PreviewRowLabel>
                <PreviewRowValue>강점 분야와 활동 빈도를 정리</PreviewRowValue>
              </PreviewRow>
            </PreviewRows>

            <PreviewFooter>
              <Bookmark size={14} />
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
  margin-top: 16px;
  border-top: 1px solid var(--line-soft);
`;

const PreviewRow = styled.div`
  padding: 16px 0;
  border-bottom: 1px solid var(--line-soft);

  &:last-child {
    border-bottom: none;
  }
`;

const PreviewRowLabel = styled.div`
  color: var(--muted);
  font-size: 14px;
  font-weight: 500;
  letter-spacing: -0.01em;
`;

const PreviewRowValue = styled.div`
  margin-top: 4px;
  color: var(--text);
  font-size: 16px;
  font-weight: 500;
  line-height: 1.55;
  letter-spacing: -0.01em;
  word-break: keep-all;
`;

const PreviewFooter = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 16px;
  color: var(--muted);
  font-size: 14px;
  font-weight: 500;
  letter-spacing: -0.01em;
  word-break: keep-all;
`;

const Checklist = styled.div`
  display: grid;
  margin-top: 24px;
  border-top: 1px solid var(--line);
`;

const ChecklistItem = styled.div`
  padding: 16px 0;
  border-bottom: 1px solid var(--line);
  color: var(--text);
  font-size: 16px;
  font-weight: 500;
  line-height: 1.55;
  letter-spacing: -0.01em;
  word-break: keep-all;
`;

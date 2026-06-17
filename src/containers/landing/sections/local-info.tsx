import styled from "@/lib/styled";
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
              지역구를 기준으로 정치인을 찾고, 어떤 사람인지 짧게 정리해요.
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
                <PreviewRowLabel>발의 법안</PreviewRowLabel>
                <PreviewRowValue>최근 발의 법안과 처리 결과를 국회 원문 링크와 함께 확인</PreviewRowValue>
              </PreviewRow>
              <PreviewRow>
                <PreviewRowLabel>팔로우</PreviewRowLabel>
                <PreviewRowValue>팔로우하면 새 법안이 홈 피드에 바로 표시</PreviewRowValue>
              </PreviewRow>
            </PreviewRows>

            <PreviewFooter>
              <Bookmark size={14} />
              팔로우한 의원의 법안은 홈 피드에서 바로 확인됩니다.
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

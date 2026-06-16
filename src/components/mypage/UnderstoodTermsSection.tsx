"use client";

import { useEffect, useState } from "react";
import styled from "@/lib/styled";
import { GLOSSARY } from "@/lib/glossary";
import { BookOpen, RotateCcw } from "lucide-react";

const LS_KEY = "jwj_understood_terms";

function getUnderstood(): string[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function removeUnderstood(term: string) {
  try {
    const terms = getUnderstood().filter((t) => t !== term);
    localStorage.setItem(LS_KEY, JSON.stringify(terms));
  } catch {}
}

export function UnderstoodTermsSection() {
  const [terms, setTerms] = useState<string[]>([]);

  useEffect(() => {
    setTerms(getUnderstood().filter((t) => t in GLOSSARY));
  }, []);

  if (terms.length === 0) return null;

  const handleRestore = (term: string) => {
    removeUnderstood(term);
    setTerms((prev) => prev.filter((t) => t !== term));
  };

  return (
    <Section>
      <Header>
        <TitleRow>
          <BookOpen size={15} />
          <Title>이해한 용어</Title>
        </TitleRow>
        <Count>{terms.length}개</Count>
      </Header>
      <List>
        {terms.map((term) => (
          <Item key={term}>
            <ItemContent>
              <Term>{term}</Term>
              <Def>{GLOSSARY[term]}</Def>
            </ItemContent>
            <RestoreBtn
              type="button"
              onClick={() => handleRestore(term)}
              aria-label={`${term} 다시 보기`}
            >
              <RotateCcw size={13} />
              다시 보기
            </RestoreBtn>
          </Item>
        ))}
      </List>
    </Section>
  );
}

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  color: #191f28;
  font-size: 15px;
  font-weight: 700;
`;

const Title = styled.h3`
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: #191f28;
`;

const Count = styled.span`
  color: #8b95a1;
  font-size: 13px;
  font-weight: 400;
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Item = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border: 1px solid #e5e8eb;
  border-radius: 10px;
  background: #ffffff;
`;

const ItemContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
`;

const Term = styled.span`
  color: #191f28;
  font-size: 14px;
  font-weight: 600;
`;

const Def = styled.span`
  color: #6b7684;
  font-size: 13px;
  font-weight: 400;
  line-height: 1.55;
  word-break: keep-all;
`;

const RestoreBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  padding: 6px 10px;
  border: 1px solid #e5e8eb;
  border-radius: 6px;
  background: #ffffff;
  color: #8b95a1;
  font-size: 12px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  white-space: nowrap;
  transition: border-color 150ms, color 150ms;

  &:hover {
    border-color: #3182f6;
    color: #3182f6;
  }
`;

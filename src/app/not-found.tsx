"use client";

import Link from "next/link";
import styled from "@emotion/styled";

export default function NotFound() {
  return (
    <Page>
      <Inner>
        <Code>404</Code>
        <Title>페이지를 찾을 수 없어요</Title>
        <Description>주소가 잘못됐거나 삭제된 페이지예요.</Description>
        <HomeLink href="/home">홈으로 돌아가기</HomeLink>
      </Inner>
    </Page>
  );
}

const Page = styled.main`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 40px 20px;
  background: #ffffff;
`;

const Inner = styled.div`
  text-align: center;
  max-width: 320px;
`;

const Code = styled.p`
  margin: 0 0 16px;
  color: #e5e8eb;
  font-size: 72px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.04em;
`;

const Title = styled.h1`
  margin: 0 0 8px;
  color: #191f28;
  font-size: 20px;
  font-weight: 600;
  letter-spacing: -0.02em;
`;

const Description = styled.p`
  margin: 0 0 32px;
  color: #6b7684;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.6;
`;

const HomeLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  height: 44px;
  padding: 0 20px;
  background: #191f28;
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  border-radius: 8px;
  letter-spacing: -0.01em;
  transition: opacity 120ms;

  &:hover {
    opacity: 0.85;
  }
`;

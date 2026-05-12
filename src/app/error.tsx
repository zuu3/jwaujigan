"use client";

import { useEffect } from "react";
import Link from "next/link";
import styled from "@emotion/styled";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Page>
      <Inner>
        <Title>문제가 생겼어요</Title>
        <Description>잠시 후 다시 시도해주세요.</Description>
        <Actions>
          <RetryButton onClick={reset}>다시 시도</RetryButton>
          <HomeLink href="/home">홈으로</HomeLink>
        </Actions>
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

const Actions = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
`;

const RetryButton = styled.button`
  display: inline-flex;
  align-items: center;
  height: 44px;
  padding: 0 20px;
  background: #3182f6;
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  letter-spacing: -0.01em;
  font-family: inherit;
  transition: opacity 120ms;

  &:hover {
    opacity: 0.85;
  }
`;

const HomeLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  height: 44px;
  padding: 0 20px;
  background: #f2f4f6;
  color: #191f28;
  font-size: 14px;
  font-weight: 600;
  border-radius: 8px;
  letter-spacing: -0.01em;
  transition: background 120ms;

  &:hover {
    background: #e5e8eb;
  }
`;

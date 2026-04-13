"use client";

import styled from "@emotion/styled";

type FullScreenLoaderProps = {
  title: string;
  description?: string;
};

export function FullScreenLoader({
  title,
  description,
}: FullScreenLoaderProps) {
  return (
    <Overlay role="status" aria-live="polite" aria-busy="true">
      <Panel>
        <Spinner aria-hidden="true" />
        <Title>{title}</Title>
        {description ? <Description>{description}</Description> : null}
      </Panel>
    </Overlay>
  );
}

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(248, 251, 255, 0.86);
  backdrop-filter: blur(10px);
`;

const Panel = styled.div`
  display: grid;
  justify-items: center;
  gap: 14px;
  width: min(100%, 360px);
  padding: 28px 24px;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.12);
  text-align: center;
`;

const Spinner = styled.div`
  width: 42px;
  height: 42px;
  border: 4px solid rgba(49, 130, 246, 0.16);
  border-top-color: #3182f6;
  border-radius: 999px;
  animation: spin 0.8s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const Title = styled.div`
  color: #191f28;
  font-size: 1.05rem;
  font-weight: 800;
  letter-spacing: -0.03em;
`;

const Description = styled.p`
  margin: 0;
  color: #6b7684;
  font-size: 0.94rem;
  line-height: 1.5;
  word-break: keep-all;
`;

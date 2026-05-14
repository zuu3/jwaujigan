import styled from "@emotion/styled";
import Link from "next/link";

export const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

export const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e8eb;
`;

export const SectionKicker = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #191f28;
  font-size: 18px;
  font-weight: 700;
`;

export const SectionDate = styled.div`
  color: #8b95a1;
  font-size: 14px;
  font-weight: 500;
`;

export const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 32px 0;
`;

export const EmptyTitle = styled.h3`
  margin: 0;
  color: #191f28;
  font-size: 18px;
  font-weight: 700;
`;

export const EmptyText = styled.p`
  margin: 0;
  color: #4E5968;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.6;
`;

export const PrimaryLink = styled(Link)`
  display: inline-flex;
  width: fit-content;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border-radius: 8px;
  padding: 0 16px;
  color: #ffffff;
  background: #3182f6;
  font-size: 14px;
  font-weight: 600;
  transition: background 150ms ease-out;

  &:hover {
    background: #2272eb;
  }
`;

export const SkeletonBlock = styled.div<{ $h: number }>`
  height: ${({ $h }) => $h}px;
  border-radius: 8px;
  background: #f2f4f6;
  animation: shimmer 1.2s linear infinite;

  @keyframes shimmer {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

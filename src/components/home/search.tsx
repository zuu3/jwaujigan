"use client";

import styled from "@emotion/styled";
import Link from "next/link";
import { Search, X } from "lucide-react";
import type { RefObject } from "react";
import type { SearchResponse } from "@/app/api/search/route";

type SearchBarProps = {
  searchQuery: string;
  isSearchActive: boolean;
  isLoading: boolean;
  searchResults: SearchResponse | undefined;
  searchInputRef: RefObject<HTMLInputElement | null>;
  onQueryChange: (value: string) => void;
  onClear: () => void;
};

export function SearchBar({
  searchQuery,
  isSearchActive,
  isLoading,
  searchResults,
  searchInputRef,
  onQueryChange,
  onClear,
}: SearchBarProps) {
  return (
    <>
      <SearchBarRoot role="search">
        <SearchIconWrap aria-hidden="true">
          <Search size={16} />
        </SearchIconWrap>
        <SearchInput
          ref={searchInputRef}
          type="search"
          placeholder="이슈 또는 정치인 검색"
          value={searchQuery}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onQueryChange(e.target.value)}
          aria-label="검색"
        />
        {searchQuery ? (
          <SearchClear
            type="button"
            onClick={onClear}
            aria-label="검색 초기화"
          >
            <X size={14} />
          </SearchClear>
        ) : null}
      </SearchBarRoot>

      {isSearchActive ? (
        <SearchResults aria-busy={isLoading}>
          {isLoading ? (
            <SearchSkeletonList>
              {[0, 1, 2].map((item) => (
                <SearchSkeletonRow key={item}>
                  <SearchSkeletonLine $w={item === 0 ? "34%" : "48%"} />
                  <SearchSkeletonLine $w={item === 0 ? "72%" : "58%"} $small />
                </SearchSkeletonRow>
              ))}
            </SearchSkeletonList>
          ) : (
            <>
              <SearchSection>
                <SearchSectionTitle>이슈</SearchSectionTitle>
                {(searchResults?.issues.length ?? 0) === 0 ? (
                  <SearchEmpty>이슈 결과가 없어요.</SearchEmpty>
                ) : (
                  searchResults?.issues.map((issue) => (
                    <SearchIssueRow key={issue.id} href={`/issues/${issue.id}`}>
                      <SearchIssueTitle>{issue.title}</SearchIssueTitle>
                      <SearchIssueMeta>{issue.summary}</SearchIssueMeta>
                    </SearchIssueRow>
                  ))
                )}
              </SearchSection>
              <SearchSection>
                <SearchSectionTitle>정치인</SearchSectionTitle>
                {(searchResults?.politicians.length ?? 0) === 0 ? (
                  <SearchEmpty>정치인 결과가 없어요.</SearchEmpty>
                ) : (
                  searchResults?.politicians.map((p) => (
                    <SearchPoliticianRow key={p.id} href={`/politicians/${p.id}`}>
                      <SearchPoliticianName>{p.name}</SearchPoliticianName>
                      <SearchPoliticianMeta>
                        {[p.party, p.district].filter(Boolean).join(" · ")}
                      </SearchPoliticianMeta>
                    </SearchPoliticianRow>
                  ))
                )}
              </SearchSection>
            </>
          )}
        </SearchResults>
      ) : null}
    </>
  );
}

/* ── Styled components ──────────────────────────────────── */

const SearchBarRoot = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  background: #f2f4f6;
  border-radius: 10px;
  padding: 0 14px;
  margin: 16px 0 4px;
  transition: box-shadow 150ms;

  &:focus-within {
    box-shadow: 0 0 0 2px #3182f6;
  }
`;

const SearchIconWrap = styled.span`
  color: #b0b8c1;
  display: flex;
  align-items: center;
  flex-shrink: 0;
`;

const SearchInput = styled.input`
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  padding: 12px 0;
  font-size: 14px;
  color: #191f28;
  font-family: inherit;

  &::placeholder {
    color: #b0b8c1;
  }

  &::-webkit-search-cancel-button {
    display: none;
  }
`;

const SearchClear = styled.button`
  background: none;
  border: none;
  padding: 12px 8px;
  cursor: pointer;
  color: #b0b8c1;
  display: flex;
  align-items: center;
  border-radius: 4px;

  &:hover {
    color: #6b7684;
  }
`;

const SearchResults = styled.div`
  display: grid;
  gap: 4px;
  padding: 8px 0 16px;
`;

const SearchSection = styled.div`
  display: grid;
`;

const SearchSectionTitle = styled.div`
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: #8b95a1;
  text-transform: uppercase;
  padding: 10px 0 6px;
`;

const SearchEmpty = styled.div`
  font-size: 13px;
  color: #b0b8c1;
  padding: 8px 0;
`;

const SearchIssueRow = styled(Link)`
  display: grid;
  gap: 2px;
  padding: 10px 12px;
  border-radius: 8px;
  text-decoration: none;

  &:hover {
    background: #f2f4f6;
  }
`;

const SearchIssueTitle = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: #191f28;
  word-break: keep-all;
`;

const SearchIssueMeta = styled.div`
  font-size: 12px;
  color: #8b95a1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const SearchPoliticianRow = styled(Link)`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  text-decoration: none;

  &:hover {
    background: #f2f4f6;
  }
`;

const SearchPoliticianName = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: #191f28;
`;

const SearchPoliticianMeta = styled.div`
  font-size: 12px;
  color: #8b95a1;
`;

const shimmer = `
  background: linear-gradient(90deg, #f2f4f6 0%, #ffffff 50%, #f2f4f6 100%);
  background-size: 200% 100%;
  animation: shimmer 1.2s infinite;
  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`;

const SearchSkeletonList = styled.div`
  display: grid;
  gap: 4px;
  padding-top: 8px;
`;

const SearchSkeletonRow = styled.div`
  display: grid;
  gap: 7px;
  padding: 10px 12px;
`;

const SearchSkeletonLine = styled.div<{ $w: string; $small?: boolean }>`
  width: ${({ $w }) => $w};
  height: ${({ $small }) => ($small ? 12 : 15)}px;
  border-radius: 4px;
  ${shimmer}
`;

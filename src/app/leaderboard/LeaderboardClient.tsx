"use client";

import styled from "@/lib/styled";
import Image from "next/image";
import Link from "next/link";
import { Trophy } from "lucide-react";
import type { LeaderboardEntry } from "@/app/api/leaderboard/route";

export function LeaderboardClient({ entries }: { entries: LeaderboardEntry[] }) {
  return (
    <Page>
      <Shell>
        <Header>
          <Trophy size={20} />
          <Title>리더보드</Title>
        </Header>
        <Subtitle>포인트 상위 유저 (공개 프로필만 노출)</Subtitle>

        <Table>
          <thead>
            <tr>
              <Th style={{ width: 40 }}>#</Th>
              <Th>유저</Th>
              <Th style={{ textAlign: "right" }}>포인트</Th>
              <Th style={{ textAlign: "right" }}>배틀 승</Th>
              <Th style={{ textAlign: "right" }}>이슈 투표</Th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <Tr key={entry.user_id} $top3={entry.rank <= 3}>
                <Td>
                  <RankCell $rank={entry.rank}>
                    {entry.rank <= 3 ? ["🥇", "🥈", "🥉"][entry.rank - 1] : entry.rank}
                  </RankCell>
                </Td>
                <Td>
                  <UserCellLink href={`/u/${entry.user_id}`}>
                    <Avatar>
                      {entry.image ? (
                        <Image src={entry.image} alt="" width={32} height={32} style={{ borderRadius: "50%", objectFit: "cover" }} />
                      ) : (
                        <AvatarInitial>
                          {entry.name ? entry.name[0].toUpperCase() : "?"}
                        </AvatarInitial>
                      )}
                    </Avatar>
                    <UserName>{entry.name ?? "익명"}</UserName>
                  </UserCellLink>
                </Td>
                <Td style={{ textAlign: "right" }}>
                  <StatNum>{entry.points.toLocaleString()}</StatNum>
                </Td>
                <Td style={{ textAlign: "right" }}>
                  <StatNum>{entry.battle_wins.toLocaleString()}</StatNum>
                </Td>
                <Td style={{ textAlign: "right" }}>
                  <StatNum>{entry.issue_votes.toLocaleString()}</StatNum>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>

        {entries.length === 0 ? (
          <Empty>아직 공개 프로필 유저가 없습니다.</Empty>
        ) : null}
      </Shell>
    </Page>
  );
}

const Page = styled.main`
  min-height: 100vh;
  background: #ffffff;
  color: #191f28;
`;

const Shell = styled.div`
  width: min(100%, 640px);
  margin: 0 auto;
  padding: 40px 20px 80px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  color: #191f28;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 22px;
  font-weight: 700;
`;

const Subtitle = styled.p`
  margin: 0 0 16px;
  font-size: 13px;
  color: #8b95a1;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
`;

const Th = styled.th`
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 600;
  color: #8b95a1;
  border-bottom: 1px solid #e5e8eb;
  text-align: left;
`;

const Tr = styled.tr<{ $top3: boolean }>`
  background: ${({ $top3 }) => ($top3 ? "#f9fafb" : "transparent")};

  &:not(:last-of-type) {
    border-bottom: 1px solid #f2f4f6;
  }
`;

const Td = styled.td`
  padding: 12px 12px;
  vertical-align: middle;
`;

const RankCell = styled.span<{ $rank: number }>`
  font-size: ${({ $rank }) => ($rank <= 3 ? "18px" : "14px")};
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: ${({ $rank }) => ($rank <= 3 ? "#191f28" : "#8b95a1")};
`;

const UserCellLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: inherit;

  &:hover span {
    color: #3182f6;
  }
`;

const Avatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  background: #e5e8eb;
`;

const AvatarInitial = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  color: #6b7684;
`;

const UserName = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: #191f28;
`;

const StatNum = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: #4e5968;
  font-variant-numeric: tabular-nums;
`;

const Empty = styled.p`
  text-align: center;
  color: #8b95a1;
  font-size: 14px;
  padding: 40px 0;
`;

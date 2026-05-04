import { notFound, redirect } from "next/navigation";
import { auth } from "../../../../../auth";
import { ArenaBattle } from "@/containers/arena";
import { getArenaIssueById, getCachedArenaBattle } from "@/lib/arena";

type BattlePageProps = {
  params: Promise<{
    issueId: string;
  }>;
  searchParams: Promise<{
    stance?: string;
  }>;
};

export default async function BattlePage({
  params,
  searchParams,
}: BattlePageProps) {
  const [{ issueId }, query, session] = await Promise.all([
    params,
    searchParams,
    auth(),
  ]);
  const stance = query.stance;

  if (stance !== "progressive" && stance !== "conservative") {
    redirect(`/arena/${issueId}`);
  }

  const [issue, cachedBattle] = await Promise.all([
    getArenaIssueById(issueId),
    getCachedArenaBattle(issueId),
  ]);

  if (!issue) {
    notFound();
  }

  return (
    <ArenaBattle
      issue={issue}
      stance={stance}
      isAuthenticated={Boolean(session?.user?.email)}
      initialCachedBattle={cachedBattle}
    />
  );
}

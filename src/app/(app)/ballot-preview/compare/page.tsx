import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getLocalElectionPerson } from "@/lib/local-election";
import type { ElectionType } from "@/lib/local-election.types";
import { BallotCompare } from "@/containers/ballot-compare";

export const metadata: Metadata = {
  title: "후보 공약 비교",
};

export default async function BallotComparePage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; aType?: string; b?: string; bType?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.email) redirect("/");

  const params = await searchParams;
  const { a, aType, b, bType } = params;

  if (!a || !aType || !b || !bType) redirect("/ballot-preview");

  const [personA, personB] = await Promise.all([
    getLocalElectionPerson(a, aType as ElectionType, "candidates"),
    getLocalElectionPerson(b, bType as ElectionType, "candidates"),
  ]);

  if (!personA || !personB) redirect("/ballot-preview");

  return <BallotCompare personA={personA as import("@/lib/local-election.types").LocalElectionCandidate} personB={personB as import("@/lib/local-election.types").LocalElectionCandidate} />;
}

import { notFound } from "next/navigation";
import { getLocalElectionPerson } from "@/lib/local-election";
import { LocalPoliticianDetail } from "@/containers/local-politician-detail";
import type { ElectionType } from "@/lib/local-election.types";

export default async function LocalPoliticianPage({
  params,
  searchParams,
}: {
  params: Promise<{ huboid: string }>;
  searchParams: Promise<{ type?: string; tab?: string }>;
}) {
  const { huboid } = await params;
  const { type, tab } = await searchParams;

  if (!type || !tab) notFound();

  const person = await getLocalElectionPerson(
    huboid,
    type as ElectionType,
    tab as "winners" | "candidates",
  );

  if (!person) notFound();

  return <LocalPoliticianDetail person={person} tab={tab as "winners" | "candidates"} />;
}

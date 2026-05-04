import { notFound } from "next/navigation";
import { ArenaIssueDetail } from "@/containers/arena";
import { getArenaIssueById } from "@/lib/arena";

type ArenaIssuePageProps = {
  params: Promise<{
    issueId: string;
  }>;
};

export default async function ArenaIssuePage({ params }: ArenaIssuePageProps) {
  const { issueId } = await params;
  const issue = await getArenaIssueById(issueId);

  if (!issue) {
    notFound();
  }

  return <ArenaIssueDetail issue={issue} />;
}

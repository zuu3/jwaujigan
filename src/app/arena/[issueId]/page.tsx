import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArenaIssueDetail } from "@/containers/arena";
import { getArenaIssueById } from "@/lib/arena";

type ArenaIssuePageProps = {
  params: Promise<{ issueId: string }>;
};

export async function generateMetadata({ params }: ArenaIssuePageProps): Promise<Metadata> {
  const { issueId } = await params;
  const issue = await getArenaIssueById(issueId);
  if (!issue) return {};

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const ogImageUrl = `${baseUrl}/api/arena/og?issueId=${issueId}`;

  return {
    title: `${issue.title} | 좌우지간 AI 배틀`,
    description: issue.summary,
    openGraph: {
      title: issue.title,
      description: issue.summary,
      images: [{ url: ogImageUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: issue.title,
      description: issue.summary,
      images: [ogImageUrl],
    },
  };
}

export default async function ArenaIssuePage({ params }: ArenaIssuePageProps) {
  const { issueId } = await params;
  const issue = await getArenaIssueById(issueId);

  if (!issue) {
    notFound();
  }

  return <ArenaIssueDetail issue={issue} />;
}

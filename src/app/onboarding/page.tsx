import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { OnboardingContainer } from "@/containers/onboarding";
import type { PoliticalAnswers } from "@/lib/political-profile";

type Props = {
  searchParams: Promise<{ retest?: string; demo?: string; a?: string }>;
};

export default async function OnboardingPage({ searchParams }: Props) {
  const session = await auth();
  const { retest, demo, a } = await searchParams;
  const isRetest = retest === "true";
  const isDemo = demo === "1";

  let demoAnswers: PoliticalAnswers | null = null;
  if (isDemo && a) {
    try {
      const decoded = Buffer.from(decodeURIComponent(a), "base64").toString("utf-8");
      demoAnswers = JSON.parse(decoded) as PoliticalAnswers;
    } catch {}
  }

  if (session?.user?.hasPoliticalProfile && !isRetest && !isDemo) {
    redirect("/home");
  }

  return (
    <OnboardingContainer
      initialDistrict={session?.user?.district ?? null}
      isRetest={isRetest}
      demoAnswers={demoAnswers}
    />
  );
}

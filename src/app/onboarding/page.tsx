import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { OnboardingContainer } from "@/containers/onboarding";

type Props = {
  searchParams: Promise<{ retest?: string }>;
};

export default async function OnboardingPage({ searchParams }: Props) {
  const session = await auth();
  const { retest } = await searchParams;
  const isRetest = retest === "true";

  if (session?.user?.hasPoliticalProfile && !isRetest) {
    redirect("/home");
  }

  return (
    <OnboardingContainer
      initialDistrict={session?.user?.district ?? null}
      isRetest={isRetest}
    />
  );
}

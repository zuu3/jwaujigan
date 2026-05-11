import { auth } from "../../../auth";
import { OnboardingContainer } from "@/containers/onboarding";

export default async function OnboardingPage() {
  const session = await auth();

  return <OnboardingContainer initialDistrict={session?.user?.district ?? null} />;
}

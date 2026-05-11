import { redirect } from "next/navigation";
import { auth } from "../../../auth";
import { OnboardingContainer } from "@/containers/onboarding";

export default async function OnboardingPage() {
  const session = await auth();

  if (session?.user?.district) {
    redirect("/home");
  }

  return <OnboardingContainer initialDistrict={session?.user?.district ?? null} />;
}

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { OnboardingContainer } from "@/containers/onboarding";

export default async function OnboardingPage() {
  const session = await auth();

  // 성향 분석까지 완료한 유저는 홈으로
  if (session?.user?.hasPoliticalProfile) {
    redirect("/home");
  }

  return <OnboardingContainer initialDistrict={session?.user?.district ?? null} />;
}

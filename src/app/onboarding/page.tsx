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
  const hasDistrict = Boolean(session?.user?.district);
  const hasProfile = Boolean(session?.user?.hasPoliticalProfile);

  // 성향+지역구 둘 다 끝난 정상 유저만 홈으로. (데모 저장 유저는 지역구가 없어
  // hasProfile만 true → 여기서 /home 보내면 미들웨어와 리다이렉트 루프)
  if (hasProfile && hasDistrict && !isRetest) {
    redirect("/home");
  }

  return (
    <OnboardingContainer
      initialDistrict={session?.user?.district ?? null}
      isRetest={isRetest}
      hasPoliticalProfile={hasProfile}
    />
  );
}

import { auth } from "@/lib/auth";
import { SaveResultContainer } from "@/containers/save-result";
import {
  calculatePoliticalProfile,
  type PoliticalAnswers,
  type PoliticalProfileResult,
} from "@/lib/political-profile";

export const metadata = { title: "내 성향 결과 저장 | 좌우지간", robots: "noindex" };

type Props = { searchParams: Promise<{ a?: string }> };

export default async function SaveResultPage({ searchParams }: Props) {
  const { a } = await searchParams;
  const session = await auth();

  let answers: PoliticalAnswers | null = null;
  let profile: PoliticalProfileResult | null = null;
  if (a) {
    try {
      const decoded = Buffer.from(decodeURIComponent(a), "base64").toString("utf-8");
      const parsed = JSON.parse(decoded) as PoliticalAnswers;
      profile = calculatePoliticalProfile(parsed); // 유효하지 않으면 throw
      answers = parsed;
    } catch {
      answers = null;
      profile = null;
    }
  }

  return (
    <SaveResultContainer
      isAuthenticated={Boolean(session?.user?.id)}
      answers={answers}
      profile={profile}
      encoded={a ?? null}
    />
  );
}

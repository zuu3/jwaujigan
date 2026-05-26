import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { BallotPreview } from "@/containers/ballot-preview";

export const metadata: Metadata = {
  title: "내 투표용지 미리보기",
};

export default async function BallotPreviewPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/");
  }

  return <BallotPreview />;
}

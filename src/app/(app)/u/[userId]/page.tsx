import { notFound } from "next/navigation";
import { PublicProfileContainer } from "@/containers/public-profile";
import type { PublicProfile } from "@/app/api/u/[userId]/route";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/u/${userId}`, { cache: "no-store" });

  if (res.status === 404) notFound();

  if (res.status === 403) {
    return <PublicProfileContainer profile={null} isPrivate />;
  }

  if (!res.ok) notFound();

  const profile = await res.json() as PublicProfile;
  return <PublicProfileContainer profile={profile} isPrivate={false} />;
}

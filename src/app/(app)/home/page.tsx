import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getHotIssuesFromDb } from "@/lib/issues-server";
import { HomeContainer } from "@/containers/home";

export default async function HomePage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/");
  }

  const initialIssues = await getHotIssuesFromDb(session.user.id ?? null);

  return <HomeContainer session={session} initialIssues={initialIssues} />;
}

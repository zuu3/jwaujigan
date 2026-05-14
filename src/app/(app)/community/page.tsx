import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CommunityContainer } from "@/containers/community";

export default async function CommunityPage() {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/");
  }

  return <CommunityContainer />;
}

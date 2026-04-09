import { redirect } from "next/navigation";
import { auth } from "../../../auth";
import { HomeContainer } from "@/containers/home";

export default async function HomePage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/");
  }

  return <HomeContainer session={session} />;
}

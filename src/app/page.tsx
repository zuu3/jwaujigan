import { auth } from "../../auth";
import { LandingContainer } from "@/containers/landing/index";

export default async function Home() {
  const session = await auth();

  return <LandingContainer isAuthenticated={Boolean(session?.user?.email)} />;
}

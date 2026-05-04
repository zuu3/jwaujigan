import { auth } from "../../../auth";
import { ArenaIndex } from "@/containers/arena";
import { getArenaIssues } from "@/lib/arena";

export default async function ArenaPage() {
  const [session, issues] = await Promise.all([auth(), getArenaIssues()]);

  return (
    <ArenaIndex
      issues={issues}
      isAuthenticated={Boolean(session?.user?.email)}
    />
  );
}

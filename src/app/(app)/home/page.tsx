import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { HomeContainer } from "@/containers/home";

export default async function HomePage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/");
  }

  return (
    <>
      {/* HTML 파싱 시점에 issues 데이터 fetch 시작 — React Query 실행 전에 응답이 캐시에 있게 함 */}
      <link rel="preload" href="/api/issues" as="fetch" />
      <HomeContainer session={session} />
    </>
  );
}

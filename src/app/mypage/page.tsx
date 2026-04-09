import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "../../../auth";

export default async function MyPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/");
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "32px 24px",
        color: "#191f28",
        background: "#f8fbff",
      }}
    >
      <div style={{ width: "min(100%, 960px)", margin: "0 auto" }}>
        <h1 style={{ margin: 0, fontSize: "2rem", letterSpacing: "-0.05em" }}>
          마이페이지
        </h1>
        <p style={{ marginTop: 16, color: "#6b7684", lineHeight: 1.7 }}>
          {session.user.name ?? "사용자"} / {session.user.email}
        </p>
        <Link href="/home">홈으로 돌아가기</Link>
      </div>
    </main>
  );
}

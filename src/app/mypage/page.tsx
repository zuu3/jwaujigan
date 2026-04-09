import { redirect } from "next/navigation";
import Link from "next/link";
import { SignOutButton } from "@/components/auth/sign-out-button";
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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <h1 style={{ margin: 0, fontSize: "2rem", letterSpacing: "-0.05em" }}>
            마이페이지
          </h1>
          <SignOutButton
            callbackUrl="/"
            style={{
              display: "inline-flex",
              minHeight: 40,
              alignItems: "center",
              justifyContent: "center",
              padding: "0 14px",
              border: "1px solid #d7dde5",
              borderRadius: 999,
              color: "#191f28",
              background: "#ffffff",
              fontSize: "0.9rem",
              fontWeight: 700,
              cursor: "pointer",
            }}
          />
        </div>
        <p style={{ marginTop: 16, color: "#6b7684", lineHeight: 1.7 }}>
          {session.user.name ?? "사용자"} / {session.user.email}
        </p>
        <Link href="/home">홈으로 돌아가기</Link>
      </div>
    </main>
  );
}

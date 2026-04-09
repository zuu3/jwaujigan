import Link from "next/link";

export default function ArenaPage() {
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
          AI 배틀 아레나
        </h1>
        <p style={{ marginTop: 16, color: "#6b7684", lineHeight: 1.7 }}>
          배틀 화면은 다음 단계에서 붙일 예정입니다.
        </p>
        <Link href="/home">홈으로 돌아가기</Link>
      </div>
    </main>
  );
}

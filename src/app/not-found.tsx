import Link from "next/link";

export default function NotFound() {
  return (
    <main
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: "40px 20px",
        background: "#ffffff",
      }}
    >
      <div style={{ textAlign: "center", maxWidth: 320 }}>
        <p
          style={{
            margin: "0 0 16px",
            color: "#e5e8eb",
            fontSize: 72,
            fontWeight: 700,
            lineHeight: 1,
            letterSpacing: "-0.04em",
          }}
        >
          404
        </p>
        <h1
          style={{
            margin: "0 0 8px",
            color: "#191f28",
            fontSize: 20,
            fontWeight: 600,
            letterSpacing: "-0.02em",
          }}
        >
          페이지를 찾을 수 없어요
        </h1>
        <p
          style={{
            margin: "0 0 32px",
            color: "#6b7684",
            fontSize: 14,
            fontWeight: 400,
            lineHeight: 1.6,
          }}
        >
          주소가 잘못됐거나 삭제된 페이지예요.
        </p>
        <Link
          href="/home"
          style={{
            display: "inline-flex",
            alignItems: "center",
            height: 44,
            padding: "0 20px",
            background: "#3182f6",
            color: "#ffffff",
            fontSize: 14,
            fontWeight: 600,
            borderRadius: 8,
            letterSpacing: "-0.01em",
            textDecoration: "none",
          }}
        >
          홈으로 돌아가기
        </Link>
      </div>
    </main>
  );
}

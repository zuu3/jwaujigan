export default function OfflinePage() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: "0 20px",
        textAlign: "center",
        background: "#ffffff",
        fontFamily: "Pretendard, Apple SD Gothic Neo, sans-serif",
      }}
    >
      <div style={{ fontSize: 22, fontWeight: 700, color: "#191f28" }}>
        인터넷 연결이 필요해요
      </div>
      <div style={{ fontSize: 14, color: "#8b95a1", lineHeight: 1.6 }}>
        네트워크 상태를 확인해주세요.
      </div>
    </main>
  );
}

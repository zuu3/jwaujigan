"use client";

import { useEffect } from "react";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="ko">
      <body
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          margin: 0,
          fontFamily: "Pretendard, sans-serif",
          background: "#ffffff",
          textAlign: "center",
          padding: "40px 20px",
        }}
      >
        <div>
          <h1
            style={{
              margin: "0 0 8px",
              color: "#191f28",
              fontSize: "20px",
              fontWeight: 600,
            }}
          >
            서비스에 문제가 생겼어요
          </h1>
          <p style={{ margin: "0 0 24px", color: "#6b7684", fontSize: "14px" }}>
            잠시 후 다시 시도해주세요.
          </p>
          <button
            onClick={reset}
            style={{
              height: "44px",
              padding: "0 20px",
              background: "#3182f6",
              color: "#ffffff",
              fontSize: "14px",
              fontWeight: 600,
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
            }}
          >
            다시 시도
          </button>
        </div>
      </body>
    </html>
  );
}

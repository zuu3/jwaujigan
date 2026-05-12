"use client";

import { useEffect } from "react";
import Link from "next/link";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

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
        <h1
          style={{
            margin: "0 0 8px",
            color: "#191f28",
            fontSize: 20,
            fontWeight: 600,
            letterSpacing: "-0.02em",
          }}
        >
          문제가 생겼어요
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
          잠시 후 다시 시도해주세요.
        </p>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <button
            onClick={reset}
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
              border: "none",
              cursor: "pointer",
              letterSpacing: "-0.01em",
              fontFamily: "inherit",
            }}
          >
            다시 시도
          </button>
          <Link
            href="/home"
            style={{
              display: "inline-flex",
              alignItems: "center",
              height: 44,
              padding: "0 20px",
              background: "#f2f4f6",
              color: "#191f28",
              fontSize: 14,
              fontWeight: 600,
              borderRadius: 8,
              letterSpacing: "-0.01em",
              textDecoration: "none",
            }}
          >
            홈으로
          </Link>
        </div>
      </div>
    </main>
  );
}

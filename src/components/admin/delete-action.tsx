"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { showToast } from "@/lib/toast";

type Props = {
  target: "poll" | "comment";
  id: string;
  redirectTo?: string;
};

export function DeleteAction({ target, id, redirectTo }: Props) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleted, setDeleted] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/community", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target, id }),
      });
      if (res.ok) {
        if (redirectTo) {
          router.push(redirectTo);
        } else {
          setDeleted(true);
        }
      } else {
        showToast("삭제 실패", "error");
      }
    } catch {
      showToast("삭제 실패", "error");
    } finally {
      setLoading(false);
      setConfirm(false);
    }
  };

  if (deleted) {
    return <span style={{ fontSize: 12, color: "#8b95a1" }}>삭제됨</span>;
  }

  return (
    <>
      <button
        onClick={() => setConfirm(true)}
        disabled={loading}
        style={{
          padding: "4px 10px",
          background: "transparent",
          color: "#f04452",
          border: "1px solid #f04452",
          borderRadius: 6,
          fontSize: 12,
          fontWeight: 500,
          cursor: loading ? "default" : "pointer",
          opacity: loading ? 0.6 : 1,
          flexShrink: 0,
        }}
      >
        삭제
      </button>

      {confirm && (
        <>
          <div
            style={{
              position: "fixed", inset: 0, zIndex: 100,
              background: "rgba(2,9,19,0.5)",
            }}
            onClick={() => !loading && setConfirm(false)}
          />
          <div
            style={{
              position: "fixed", top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 101, background: "#ffffff",
              borderRadius: 16, width: "min(calc(100% - 40px), 320px)",
              padding: "24px 20px",
              boxShadow: "0px 8px 24px rgba(0,0,0,0.16)",
            }}
          >
            <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700, color: "#191f28", letterSpacing: "-0.02em" }}>
              정말 삭제할까요?
            </h3>
            <p style={{ margin: "0 0 20px", fontSize: 13, color: "#6b7684", lineHeight: 1.6 }}>
              삭제한 데이터는 복구할 수 없습니다.
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                disabled={loading}
                onClick={() => setConfirm(false)}
                style={{
                  flex: 1, padding: "12px 0", borderRadius: 8,
                  border: "1px solid #e5e8eb", background: "#ffffff",
                  color: "#6b7684", fontSize: 14, fontWeight: 600,
                  cursor: "pointer", fontFamily: "inherit",
                }}
              >
                취소
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => void handleDelete()}
                style={{
                  flex: 1, padding: "12px 0", borderRadius: 8,
                  border: "none", background: "#f04452",
                  color: "#ffffff", fontSize: 14, fontWeight: 600,
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.5 : 1, fontFamily: "inherit",
                }}
              >
                {loading ? "삭제 중…" : "삭제"}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

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
  const [loading, setLoading] = useState(false);
  const [deleted, setDeleted] = useState(false);

  if (deleted) {
    return <span style={{ fontSize: 12, color: "#8b95a1" }}>삭제됨</span>;
  }

  return (
    <button
      onClick={async () => {
        if (loading) return;
        if (!confirm("정말 삭제할까요?")) return;
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
        }
      }}
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
      {loading ? "..." : "삭제"}
    </button>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  reportId: string;
  commentId: string | null;
};

export function ReportActions({ reportId, commentId }: Props) {
  const [loading, setLoading] = useState<"dismiss" | "delete" | null>(null);
  const [done, setDone] = useState(false);
  const router = useRouter();

  if (done) {
    return <span style={{ fontSize: 12, color: "#8b95a1" }}>처리됨</span>;
  }

  const handle = async (action: "dismiss" | "delete") => {
    setLoading(action);
    try {
      const res = await fetch(`/api/admin/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, commentId }),
      });
      if (res.ok) {
        setDone(true);
        router.refresh();
      } else {
        let message = "처리에 실패했습니다.";
        try {
          const data = await res.json() as { message?: string };
          message = data.message ?? message;
        } catch {}
        alert(message);
      }
    } finally {
      setLoading(null);
    }
  };

  return (
    <div style={{ display: "flex", gap: 6 }}>
      {commentId && (
        <button
          type="button"
          disabled={loading !== null}
          onClick={() => void handle("delete")}
          style={{
            padding: "4px 10px",
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 600,
            background: loading === "delete" ? "#fca5a5" : "#fef2f2",
            color: "#e5484d",
            border: "1px solid #fca5a5",
            cursor: loading !== null ? "not-allowed" : "pointer",
            opacity: loading !== null ? 0.6 : 1,
          }}
        >
          {loading === "delete" ? "삭제 중…" : "댓글 삭제"}
        </button>
      )}
      <button
        type="button"
        disabled={loading !== null}
        onClick={() => void handle("dismiss")}
        style={{
          padding: "4px 10px",
          borderRadius: 6,
          fontSize: 12,
          fontWeight: 600,
          background: "#f2f4f6",
          color: "#6b7684",
          border: "1px solid #e5e8eb",
          cursor: loading !== null ? "not-allowed" : "pointer",
          opacity: loading !== null ? 0.6 : 1,
        }}
      >
        {loading === "dismiss" ? "처리 중…" : "무시"}
      </button>
    </div>
  );
}

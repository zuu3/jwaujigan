"use client";

import { useState } from "react";

type Props = {
  issueId?: string;
  expired?: boolean;
};

export function IssueActions({ issueId, expired }: Props) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (!issueId) {
    return (
      <button
        onClick={async () => {
          if (loading) return;
          setLoading(true);
          try {
            const res = await fetch("/api/admin/cron", { method: "POST" });
            const data = await res.json() as { message?: string };
            alert(data.message ?? "크론 실행 완료");
          } catch {
            alert("실행 실패");
          } finally {
            setLoading(false);
          }
        }}
        disabled={loading}
        style={{
          padding: "8px 16px",
          background: "#191f28",
          color: "#ffffff",
          border: "none",
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 600,
          cursor: loading ? "default" : "pointer",
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? "실행 중..." : "크론 강제 실행"}
      </button>
    );
  }

  if (done) {
    return <span style={{ fontSize: 12, color: "#03b26c" }}>완료</span>;
  }

  return (
    <button
      onClick={async () => {
        if (loading) return;
        setLoading(true);
        try {
          const res = await fetch(`/api/admin/issues/${issueId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: expired ? "restore" : "expire" }),
          });
          if (res.ok) setDone(true);
          else alert("처리 실패");
        } catch {
          alert("처리 실패");
        } finally {
          setLoading(false);
        }
      }}
      disabled={loading}
      style={{
        padding: "4px 10px",
        background: "transparent",
        color: expired ? "#3182f6" : "#f04452",
        border: `1px solid ${expired ? "#3182f6" : "#f04452"}`,
        borderRadius: 6,
        fontSize: 12,
        fontWeight: 500,
        cursor: loading ? "default" : "pointer",
        opacity: loading ? 0.6 : 1,
      }}
    >
      {loading ? "..." : expired ? "복원" : "만료 처리"}
    </button>
  );
}

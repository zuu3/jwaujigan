"use client";

import { useState } from "react";
import { showToast } from "@/lib/toast";

const REASONS = ["욕설/혐오", "스팸/광고", "허위정보", "기타"] as const;
type Reason = (typeof REASONS)[number];

type Props = {
  commentId: string;
};

export function ReportButton({ commentId }: Props) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<Reason | "">("");
  const [detail, setDetail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (done) return <span style={{ fontSize: 12, color: "#8b95a1" }}>신고됨</span>;

  const handleSubmit = async () => {
    if (!reason) return;
    setLoading(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType: "comment", targetId: commentId, reason, detail }),
      });
      const data = await res.json() as { message?: string };
      if (res.ok) {
        setDone(true);
        setOpen(false);
        showToast("신고가 접수됐어요.");
      } else {
        showToast(data.message ?? "신고에 실패했습니다.", "error");
      }
    } catch {
      showToast("신고에 실패했습니다.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          background: "none",
          border: "none",
          padding: "0 2px",
          color: "#b0b8c1",
          fontSize: 12,
          cursor: "pointer",
          lineHeight: 1,
        }}
      >
        신고
      </button>

      {open && (
        <>
          <div
            style={{
              position: "fixed", inset: 0, zIndex: 100,
              background: "rgba(2,9,19,0.5)",
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: 20,
            }}
            onClick={() => setOpen(false)}
          />
          <div
            style={{
              position: "fixed",
              top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 101,
              background: "#ffffff",
              borderRadius: 16,
              width: "min(100% - 40px, 360px)",
              padding: "24px 20px",
              boxShadow: "0px 8px 24px rgba(0,0,0,0.16)",
            }}
          >
            <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700, color: "#191f28", letterSpacing: "-0.02em" }}>
              댓글 신고
            </h3>
            <p style={{ margin: "0 0 20px", fontSize: 13, color: "#6b7684" }}>
              신고 사유를 선택하고 자세한 내용을 남겨주세요.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
              {REASONS.map((r) => (
                <label
                  key={r}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: `1px solid ${reason === r ? "#3182f6" : "#e5e8eb"}`,
                    background: reason === r ? "#e8f3ff" : "#ffffff",
                    cursor: "pointer",
                    fontSize: 14,
                    color: reason === r ? "#3182f6" : "#191f28",
                    fontWeight: reason === r ? 600 : 400,
                    transition: "all 120ms",
                  }}
                >
                  <input
                    type="radio"
                    name="report-reason"
                    value={r}
                    checked={reason === r}
                    onChange={() => setReason(r)}
                    style={{ accentColor: "#3182f6" }}
                  />
                  {r}
                </label>
              ))}
            </div>

            <textarea
              placeholder="자세한 내용을 입력해주세요. (선택)"
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              maxLength={500}
              rows={3}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid #e5e8eb",
                fontSize: 13,
                color: "#191f28",
                background: "#f2f4f6",
                resize: "none",
                outline: "none",
                fontFamily: "Pretendard, sans-serif",
                boxSizing: "border-box",
                marginBottom: 16,
              }}
            />

            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                onClick={() => setOpen(false)}
                style={{
                  flex: 1, padding: "12px 0",
                  borderRadius: 8, border: "1px solid #e5e8eb",
                  background: "#ffffff", color: "#6b7684",
                  fontSize: 14, fontWeight: 600, cursor: "pointer",
                }}
              >
                취소
              </button>
              <button
                type="button"
                disabled={!reason || loading}
                onClick={() => void handleSubmit()}
                style={{
                  flex: 1, padding: "12px 0",
                  borderRadius: 8, border: "none",
                  background: !reason ? "#e5e8eb" : "#3182f6",
                  color: !reason ? "#b0b8c1" : "#ffffff",
                  fontSize: 14, fontWeight: 600,
                  cursor: !reason ? "not-allowed" : "pointer",
                  transition: "background 120ms",
                }}
              >
                {loading ? "신고 중…" : "신고하기"}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

"use client";

import { useState } from "react";

type User = { id: string; email: string; name: string | null };

export function PointsForm({ users }: { users: User[] }) {
  const [userId, setUserId] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !amount) return;
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, amount: Number(amount) }),
      });
      const data = await res.json() as { message?: string };
      setMsg(data.message ?? "완료");
      setAmount("");
    } catch {
      setMsg("실패");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: "#ffffff", border: "1px solid #e5e8eb", borderRadius: 12, padding: 20, marginBottom: 0 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: "#191f28", marginBottom: 12 }}>포인트 수동 부여</div>
      <form onSubmit={(e) => void handleSubmit(e)} style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: "1 1 240px" }}>
          <label style={{ fontSize: 12, color: "#6b7684" }}>사용자</label>
          <select
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            required
            style={{ height: 38, padding: "0 10px", border: "1px solid #e5e8eb", borderRadius: 8, fontSize: 13, color: "#191f28", background: "#ffffff" }}
          >
            <option value="">선택하세요</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name ?? u.email} ({u.email})
              </option>
            ))}
          </select>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: 12, color: "#6b7684" }}>포인트</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="예: 100"
            required
            style={{ height: 38, width: 120, padding: "0 10px", border: "1px solid #e5e8eb", borderRadius: 8, fontSize: 13, color: "#191f28" }}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          style={{
            height: 38,
            padding: "0 16px",
            background: "#3182f6",
            color: "#ffffff",
            border: "none",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: loading ? "default" : "pointer",
            opacity: loading ? 0.6 : 1,
            flexShrink: 0,
          }}
        >
          {loading ? "처리 중..." : "부여"}
        </button>
        {msg && <span style={{ fontSize: 13, color: "#03b26c", alignSelf: "center" }}>{msg}</span>}
      </form>
    </div>
  );
}

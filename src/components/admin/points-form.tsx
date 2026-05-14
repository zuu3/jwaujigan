"use client";

import { useState } from "react";

type UserResult = { id: string; email: string; name: string | null; points: number };

export function PointsForm() {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<UserResult[]>([]);
  const [selected, setSelected] = useState<UserResult | null>(null);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setSelected(null);
    setResults([]);
    setMsg("");
    try {
      const res = await fetch(`/api/admin/users/search?q=${encodeURIComponent(query.trim())}`);
      const data = await res.json() as { users: UserResult[] };
      setResults(data.users ?? []);
    } catch {
      alert("검색 실패");
    } finally {
      setSearching(false);
    }
  };

  const handleGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !amount) return;
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selected.id, amount: Number(amount) }),
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

      <form onSubmit={(e) => void handleSearch(e)} style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="이름 또는 이메일로 검색"
          style={{ flex: 1, maxWidth: 300, height: 36, padding: "0 10px", border: "1px solid #e5e8eb", borderRadius: 8, fontSize: 13, color: "#191f28", outline: "none" }}
        />
        <button
          type="submit"
          disabled={searching}
          style={{ height: 36, padding: "0 14px", background: "#f2f4f6", color: "#191f28", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
        >
          {searching ? "검색 중..." : "검색"}
        </button>
      </form>

      {results.length > 0 && !selected && (
        <div style={{ border: "1px solid #e5e8eb", borderRadius: 8, overflow: "hidden", marginBottom: 10 }}>
          {results.map((u) => (
            <button
              key={u.id}
              onClick={() => { setSelected(u); setResults([]); }}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                width: "100%", padding: "10px 14px", background: "#ffffff", border: "none",
                borderBottom: "1px solid #f2f4f6", cursor: "pointer", textAlign: "left", fontSize: 13,
              }}
            >
              <span>
                <span style={{ color: "#191f28", fontWeight: 500 }}>{u.name ?? "—"}</span>
                <span style={{ color: "#8b95a1", marginLeft: 8 }}>{u.email}</span>
              </span>
              <span style={{ color: "#b0b8c1", fontSize: 11, fontFamily: "monospace" }}>{u.id.slice(0, 8)}…</span>
            </button>
          ))}
        </div>
      )}

      {results.length === 0 && query && !searching && !selected && (
        <div style={{ fontSize: 13, color: "#8b95a1", marginBottom: 10 }}>검색 결과가 없습니다.</div>
      )}

      {selected && (
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", background: "#f2f4f6", borderRadius: 8, fontSize: 13 }}>
            <span style={{ fontWeight: 500, color: "#191f28" }}>{selected.name ?? "—"}</span>
            <span style={{ color: "#8b95a1" }}>{selected.email}</span>
            <span style={{ color: "#b0b8c1", fontFamily: "monospace", fontSize: 11 }}>{selected.id.slice(0, 8)}…</span>
            <button
              onClick={() => { setSelected(null); setMsg(""); }}
              style={{ background: "none", border: "none", color: "#b0b8c1", cursor: "pointer", fontSize: 14, padding: 0, lineHeight: 1 }}
            >
              ✕
            </button>
          </div>
          <form onSubmit={(e) => void handleGrant(e)} style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="포인트 (음수 가능)"
              required
              style={{ height: 36, width: 160, padding: "0 10px", border: "1px solid #e5e8eb", borderRadius: 8, fontSize: 13, color: "#191f28", outline: "none" }}
            />
            <button
              type="submit"
              disabled={loading}
              style={{ height: 36, padding: "0 16px", background: "#3182f6", color: "#ffffff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: loading ? "default" : "pointer", opacity: loading ? 0.6 : 1 }}
            >
              {loading ? "처리 중..." : "부여"}
            </button>
            {msg && <span style={{ fontSize: 13, color: "#03b26c" }}>{msg}</span>}
          </form>
        </div>
      )}
    </div>
  );
}

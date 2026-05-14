"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function UserSearch({ defaultValue }: { defaultValue: string }) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (value.trim()) params.set("q", value.trim());
    router.push(`/admin/users${value.trim() ? `?${params.toString()}` : ""}`);
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: "flex", gap: 8, marginBottom: 16 }}
    >
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="이름 또는 이메일로 검색"
        style={{
          flex: 1,
          maxWidth: 320,
          height: 38,
          padding: "0 12px",
          border: "1px solid #e5e8eb",
          borderRadius: 8,
          fontSize: 13,
          color: "#191f28",
          outline: "none",
        }}
      />
      <button
        type="submit"
        style={{
          height: 38,
          padding: "0 16px",
          background: "#191f28",
          color: "#ffffff",
          border: "none",
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        검색
      </button>
      {defaultValue && (
        <button
          type="button"
          onClick={() => { setValue(""); router.push("/admin/users"); }}
          style={{
            height: 38,
            padding: "0 12px",
            background: "transparent",
            color: "#8b95a1",
            border: "1px solid #e5e8eb",
            borderRadius: 8,
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          초기화
        </button>
      )}
    </form>
  );
}

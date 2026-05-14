import { requireAdmin } from "@/lib/admin";
import Link from "next/link";

const NAV = [
  { href: "/admin", label: "개요" },
  { href: "/admin/issues", label: "이슈" },
  { href: "/admin/users", label: "사용자" },
  { href: "/admin/community", label: "커뮤니티" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb", fontFamily: "Pretendard, sans-serif" }}>
      <header style={{ background: "#191f28", padding: "0 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 32, width: "min(100%, 1160px)", margin: "0 auto", height: 52 }}>
          <span style={{ color: "#ffffff", fontSize: 15, fontWeight: 700, letterSpacing: "-0.02em", flexShrink: 0 }}>
            좌우지간 관리자
          </span>
          <nav style={{ display: "flex", gap: 4 }}>
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                style={{ padding: "6px 12px", borderRadius: 6, color: "#b0b8c1", fontSize: 13, fontWeight: 500, textDecoration: "none" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <Link
            href="/home"
            style={{ marginLeft: "auto", color: "#6b7684", fontSize: 13, textDecoration: "none" }}
          >
            서비스로 돌아가기
          </Link>
        </div>
      </header>
      <main style={{ width: "min(100%, 1160px)", margin: "0 auto", padding: "32px 24px" }}>
        {children}
      </main>
    </div>
  );
}

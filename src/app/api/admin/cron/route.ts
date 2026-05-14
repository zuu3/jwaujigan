import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin";

export async function POST() {
  const { error } = await requireAdminApi();
  if (error) return error;

  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ message: "CRON_SECRET 미설정" }, { status: 500 });
  }

  const res = await fetch(`${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/api/cron/refresh-issues`, {
    method: "POST",
    headers: { Authorization: `Bearer ${cronSecret}` },
  });

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json({ message: `크론 실패: ${text}` }, { status: 500 });
  }

  return NextResponse.json({ message: "이슈 갱신 크론 실행 완료" });
}

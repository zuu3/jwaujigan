import { NextResponse } from "next/server";
import { sendWeeklyDigest } from "@/lib/newsletter";

export const maxDuration = 300;

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const startedAt = Date.now();

  try {
    const { sent, failed } = await sendWeeklyDigest();
    const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);

    return NextResponse.json({ ok: true, sent, failed, elapsed_s: elapsed });
  } catch (err) {
    console.error("[cron/newsletter] 예외:", err);
    return NextResponse.json({ ok: false, message: String(err) }, { status: 500 });
  }
}

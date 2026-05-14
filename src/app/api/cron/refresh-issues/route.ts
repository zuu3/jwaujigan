import { NextResponse } from "next/server";
import { getRecentIssueBills } from "@/lib/assembly";
import { buildIssueFromBill } from "@/lib/issues";
import { createServiceRoleSupabaseClient } from "@/lib/supabase";

export const maxDuration = 300;

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleSupabaseClient();
  const startedAt = Date.now();

  try {
    const bills = await getRecentIssueBills();
    console.log(`[cron] ${bills.length}개 법안 수집`);

    // 이미 DB에 있는 bill_id는 Gemini 호출 없이 건너뜀
    const { data: existing } = await supabase
      .from("issues")
      .select("bill_id")
      .in("bill_id", bills.map((b) => b.billId).filter(Boolean));

    const existingIds = new Set((existing ?? []).map((r) => r.bill_id));
    const newBills = bills.filter((b) => !existingIds.has(b.billId));
    console.log(`[cron] 신규 법안 ${newBills.length}개 (${bills.length - newBills.length}개 기존 스킵)`);

    if (newBills.length === 0) {
      return NextResponse.json({ ok: true, inserted: 0, skipped: bills.length });
    }

    const results = await Promise.allSettled(
      newBills.map((bill) => buildIssueFromBill(bill)),
    );

    const succeeded = results.flatMap((r, i) => {
      if (r.status === "fulfilled") return [r.value];
      console.error(`[cron] "${newBills[i]?.title}" 생성 실패:`, r.reason);
      return [];
    });

    if (succeeded.length === 0) {
      return NextResponse.json({ ok: false, message: "생성된 이슈 없음" }, { status: 500 });
    }

    const { error } = await supabase
      .from("issues")
      .upsert(succeeded, { onConflict: "bill_id" });

    if (error) {
      console.error("[cron] upsert 실패:", error);
      return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
    }

    const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
    console.log(`[cron] ${succeeded.length}개 이슈 저장 완료 (${elapsed}s)`);

    return NextResponse.json({
      ok: true,
      inserted: succeeded.length,
      skipped: existingIds.size,
      failed: results.length - succeeded.length,
      elapsed_s: elapsed,
    });
  } catch (err) {
    console.error("[cron] 예외 발생:", err);
    return NextResponse.json({ ok: false, message: String(err) }, { status: 500 });
  }
}

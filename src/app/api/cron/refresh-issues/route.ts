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

    const results = await Promise.allSettled(
      bills.map((bill) => buildIssueFromBill(bill)),
    );

    const succeeded = results.flatMap((r, i) => {
      if (r.status === "fulfilled") return [r.value];
      console.error(`[cron] "${bills[i]?.title}" 생성 실패:`, r.reason);
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
      failed: results.length - succeeded.length,
      elapsed_s: elapsed,
    });
  } catch (err) {
    console.error("[cron] 예외 발생:", err);
    return NextResponse.json({ ok: false, message: String(err) }, { status: 500 });
  }
}

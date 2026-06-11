import { NextResponse } from "next/server";
import { getRecentIssueBills, getBillStatusById } from "@/lib/assembly";
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
    const existingBills = bills.filter((b) => existingIds.has(b.billId));
    console.log(`[cron] 신규 법안 ${newBills.length}개, 기존 갱신 대상 ${existingBills.length}개`);

    // 기존 매칭 법안 expires_at 갱신 (API가 계속 동일 법안 반환해도 이슈 유지)
    const refreshedAt = new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString();
    if (existingBills.length > 0) {
      await supabase
        .from("issues")
        .update({ expires_at: refreshedAt })
        .in("bill_id", existingBills.map((b) => b.billId));
      console.log(`[cron] ${existingBills.length}개 이슈 expires_at 갱신`);
    }

    let inserted = 0;

    if (newBills.length > 0) {
      const results = await Promise.allSettled(
        newBills.map((bill) => buildIssueFromBill(bill)),
      );

      const succeeded = results.flatMap((r, i) => {
        if (r.status === "fulfilled") return [r.value];
        console.error(`[cron] "${newBills[i]?.title}" 생성 실패:`, r.reason);
        return [];
      });

      if (succeeded.length > 0) {
        const { error } = await supabase
          .from("issues")
          .upsert(succeeded, { onConflict: "bill_id" });

        if (error) {
          console.error("[cron] upsert 실패:", error);
        } else {
          inserted = succeeded.length;
          console.log(`[cron] ${inserted}개 신규 이슈 저장`);
        }
      }
    }

    // 최근 7일 내 만료된 이슈의 bill_status 업데이트
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: expiredIssues } = await supabase
      .from("issues")
      .select("id, bill_id")
      .lt("expires_at", new Date().toISOString())
      .gte("expires_at", sevenDaysAgo)
      .not("bill_id", "is", null);

    let statusUpdated = 0;
    for (const issue of expiredIssues ?? []) {
      if (!issue.bill_id) continue;
      const newStatus = await getBillStatusById(issue.bill_id);
      if (newStatus) {
        await supabase.from("issues").update({ bill_status: newStatus }).eq("id", issue.id);
        statusUpdated++;
      }
    }
    console.log(`[cron] 만료 이슈 상태 업데이트 ${statusUpdated}개`);

    const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
    console.log(`[cron] 완료 (${elapsed}s)`);

    return NextResponse.json({
      ok: true,
      inserted,
      refreshed: existingBills.length,
      status_updated: statusUpdated,
      elapsed_s: elapsed,
    });
  } catch (err) {
    console.error("[cron] 예외 발생:", err);
    return NextResponse.json({ ok: false, message: String(err) }, { status: 500 });
  }
}

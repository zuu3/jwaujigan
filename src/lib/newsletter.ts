import "server-only";

import { Resend } from "resend";
import { render } from "@react-email/components";
import { createServiceRoleSupabaseClient } from "@/lib/supabase";
import WeeklyDigest, { type WeeklyDigestIssue } from "@/emails/WeeklyDigest";

const resend = new Resend(process.env.RESEND_API_KEY);

const APP_URL = process.env.NEXTAUTH_URL ?? "https://jwaujigan.com";
const FROM = process.env.NEWSLETTER_FROM ?? "좌우지간 <newsletter@jwaujigan.com>";
const BATCH_SIZE = 50;

export async function getWeeklyIssues(): Promise<WeeklyDigestIssue[]> {
  const supabase = createServiceRoleSupabaseClient();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("issues")
    .select("id, title, summary, progressive, conservative, source_url")
    .gte("created_at", sevenDaysAgo)
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    console.error("[newsletter] 이슈 조회 실패:", error);
    return [];
  }

  return data ?? [];
}

type Subscriber = { email: string; newsletter_token: string };

export async function getSubscribers(): Promise<Subscriber[]> {
  const supabase = createServiceRoleSupabaseClient();

  const { data, error } = await supabase
    .from("users")
    .select("email, newsletter_token")
    .eq("newsletter_subscribed", true);

  if (error) {
    console.error("[newsletter] 구독자 조회 실패:", error);
    return [];
  }

  return data ?? [];
}

export async function sendWeeklyDigest(): Promise<{ sent: number; failed: number }> {
  const [issues, subscribers] = await Promise.all([getWeeklyIssues(), getSubscribers()]);

  if (issues.length === 0) {
    console.log("[newsletter] 이슈 없음, 발송 건너뜀");
    return { sent: 0, failed: 0 };
  }

  if (subscribers.length === 0) {
    console.log("[newsletter] 구독자 없음, 발송 건너뜀");
    return { sent: 0, failed: 0 };
  }

  console.log(`[newsletter] 발송 시작: 이슈 ${issues.length}개, 구독자 ${subscribers.length}명`);

  let sent = 0;
  let failed = 0;

  for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
    const batch = subscribers.slice(i, i + BATCH_SIZE);

    const results = await Promise.allSettled(
      batch.map(async (sub) => {
        const unsubscribeUrl = `${APP_URL}/api/newsletter/unsubscribe?token=${sub.newsletter_token}`;

        const html = await render(
          WeeklyDigest({ issues, unsubscribeUrl, appUrl: APP_URL }),
        );

        await resend.emails.send({
          from: FROM,
          to: sub.email,
          subject: `이번 주 주요 이슈 ${issues.length}개 — 좌우지간`,
          html,
        });
      }),
    );

    for (const r of results) {
      if (r.status === "fulfilled") sent++;
      else {
        failed++;
        console.error("[newsletter] 발송 실패:", r.reason);
      }
    }
  }

  console.log(`[newsletter] 완료: 성공 ${sent}, 실패 ${failed}`);
  return { sent, failed };
}

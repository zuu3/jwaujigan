import { unstable_noStore as noStore } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "../../../auth";
import { MyPageContainer, type BattleLogItem, type MyPageProfile, type PoliticalProfile } from "@/containers/mypage";
import { createServiceRoleSupabaseClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function MyPage() {
  noStore();

  const session = await auth();

  if (!session?.user?.email) {
    redirect("/");
  }

  const supabase = createServiceRoleSupabaseClient();
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id, email, name, image, district, created_at")
    .eq("email", session.user.email)
    .maybeSingle();

  if (userError) {
    console.error("Failed to fetch mypage user", userError);
    throw new Error("Failed to fetch mypage user.");
  }

  const profile: MyPageProfile = {
    id: user?.id ?? session.user.id,
    email: user?.email ?? session.user.email,
    name: user?.name ?? session.user.name ?? null,
    image: user?.image ?? session.user.image ?? null,
    district: user?.district ?? session.user.district ?? null,
    created_at: user?.created_at ?? null,
  };
  const userIds = [...new Set([profile.id, session.user.id].filter(Boolean))];

  const [politicalProfileResult, battleLogsResult] = await Promise.all([
    supabase
      .from("user_political_profiles")
      .select("economic_score, social_score, security_score, political_type, completed_at")
      .in("user_id", userIds)
      .order("completed_at", { ascending: false, nullsFirst: false })
      .limit(1),
    supabase
      .from("battle_logs")
      .select("id, topic, result, created_at")
      .in("user_id", userIds)
      .order("created_at", { ascending: false }),
  ]);

  if (politicalProfileResult.error) {
    console.error("Failed to fetch political profile", politicalProfileResult.error);
    throw new Error("Failed to fetch political profile.");
  }

  if (battleLogsResult.error) {
    console.error("Failed to fetch battle logs", battleLogsResult.error);
    throw new Error("Failed to fetch battle logs.");
  }

  return (
    <MyPageContainer
      profile={profile}
      politicalProfile={(politicalProfileResult.data?.[0] ?? null) as PoliticalProfile | null}
      battleLogs={(battleLogsResult.data ?? []) as BattleLogItem[]}
    />
  );
}

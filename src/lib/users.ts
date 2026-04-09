import { createServiceRoleSupabaseClient } from "@/lib/supabase";

type SyncUserInput = {
  email: string;
  name: string | null;
  image: string | null;
};

export type UserGateState = {
  userId: string | null;
  district: string | null;
  hasPoliticalProfile: boolean;
};

export async function syncUserRecord(input: SyncUserInput) {
  const supabase = createServiceRoleSupabaseClient();
  const updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("users")
    .upsert(
      {
        email: input.email,
        name: input.name,
        image: input.image,
        updated_at,
      },
      {
        onConflict: "email",
      },
    )
    .select("id, email, district")
    .single();

  if (error) {
    console.error("Failed to sync user record", error);
  }

  return {
    ok: !error,
    data: data ?? null,
  };
}

export async function updateUserDistrict(email: string, district: string) {
  const supabase = createServiceRoleSupabaseClient();
  const updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("users")
    .update({
      district,
      updated_at,
    })
    .eq("email", email)
    .select("id, email, district")
    .single();

  if (error) {
    console.error("Failed to update user district", error);
  }

  return {
    ok: !error,
    data: data ?? null,
  };
}

export async function getUserGateState(email: string): Promise<UserGateState> {
  const supabase = createServiceRoleSupabaseClient();

  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id, district")
    .eq("email", email)
    .maybeSingle();

  let profile: { user_id: string } | null = null;
  let profileError: { code?: string } | null = null;

  if (user?.id) {
    const profileResponse = await supabase
      .from("user_political_profiles")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    profile = profileResponse.data;
    profileError = profileResponse.error;
  }

  if (userError) {
    console.error("Failed to fetch user state", userError);
  }

  if (profileError && profileError.code !== "PGRST116") {
    console.error("Failed to fetch political profile state", profileError);
  }

  return {
    userId: user?.id ?? null,
    district: user?.district ?? null,
    hasPoliticalProfile: Boolean(profile?.user_id),
  };
}

export async function getPoliticalProfileByUserId(userId: string) {
  const supabase = createServiceRoleSupabaseClient();

  const { data, error } = await supabase
    .from("user_political_profiles")
    .select(
      "user_id, economic_score, security_score, social_score, political_type, completed_at",
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    console.error("Failed to fetch political profile", error);
  }

  return data ?? null;
}

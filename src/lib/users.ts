import { createServiceRoleSupabaseClient } from "@/lib/supabase";

type SyncUserInput = {
  email: string;
  name: string | null;
  image: string | null;
};

export type UserGateState = {
  userId: string | null;
  district: string | null;
  area: string | null;
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

export async function updateUserDistrict(email: string, district: string, area?: string | null) {
  const supabase = createServiceRoleSupabaseClient();
  const updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("users")
    .update({
      district,
      ...(area !== undefined ? { area: area ?? null } : {}),
      updated_at,
    })
    .eq("email", email)
    .select("id, email, district, area")
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
    .select("id, district, area, user_political_profiles(user_id)")
    .eq("email", email)
    .maybeSingle();

  if (userError) {
    console.error("Failed to fetch user state", userError);
  }

  const profiles = user?.user_political_profiles;
  const hasProfile = Array.isArray(profiles) ? profiles.length > 0 : Boolean(profiles);

  return {
    userId: user?.id ?? null,
    district: user?.district ?? null,
    area: user?.area ?? null,
    hasPoliticalProfile: hasProfile,
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

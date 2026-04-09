import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          image: string | null;
          district: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name?: string | null;
          image?: string | null;
          district?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          image?: string | null;
          district?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_political_profiles: {
        Row: {
          id: string;
          user_id: string;
          economic_score: number;
          security_score: number;
          social_score: number;
          political_type: string;
          test_answers: Record<string, number>;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          economic_score: number;
          security_score: number;
          social_score: number;
          political_type: string;
          test_answers: Record<string, number>;
          completed_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          economic_score?: number;
          security_score?: number;
          social_score?: number;
          political_type?: string;
          test_answers?: Record<string, number>;
          completed_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_political_profiles_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

let browserClient: SupabaseClient<Database> | null = null;

function getEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

function createSupabaseClient(key: string) {
  return createClient<Database>(getEnv("NEXT_PUBLIC_SUPABASE_URL"), key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export function createBrowserSupabaseClient() {
  if (!browserClient) {
    browserClient = createSupabaseClient(getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"));
  }

  return browserClient;
}

export function createServerSupabaseClient() {
  return createSupabaseClient(getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"));
}

export function createServiceRoleSupabaseClient() {
  return createSupabaseClient(getEnv("SUPABASE_SERVICE_ROLE_KEY"));
}

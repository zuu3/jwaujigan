import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      issues: {
        Row: {
          id: string;
          title: string;
          summary: string;
          progressive: string;
          conservative: string;
          source_url: string | null;
          bill_id: string | null;
          published_at: string | null;
          proposer: string | null;
          committee: string | null;
          bill_status: string | null;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          summary: string;
          progressive: string;
          conservative: string;
          source_url?: string | null;
          bill_id?: string | null;
          published_at?: string | null;
          proposer?: string | null;
          committee?: string | null;
          bill_status?: string | null;
          expires_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          summary?: string;
          progressive?: string;
          conservative?: string;
          source_url?: string | null;
          bill_id?: string | null;
          published_at?: string | null;
          proposer?: string | null;
          committee?: string | null;
          bill_status?: string | null;
          expires_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      battle_logs: {
        Row: {
          id: string;
          user_id: string | null;
          topic: string;
          messages: Json;
          result: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          topic: string;
          messages: Json;
          result?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          topic?: string;
          messages?: Json;
          result?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "battle_logs_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      votes: {
        Row: {
          id: string;
          battle_id: string;
          user_id: string;
          side: string;
        };
        Insert: {
          id?: string;
          battle_id: string;
          user_id: string;
          side: string;
        };
        Update: {
          id?: string;
          battle_id?: string;
          user_id?: string;
          side?: string;
        };
        Relationships: [
          {
            foreignKeyName: "votes_battle_id_fkey";
            columns: ["battle_id"];
            isOneToOne: false;
            referencedRelation: "battle_logs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "votes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      users: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          image: string | null;
          district: string | null;
          points: number;
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
          points?: number;
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
      politician_reports: {
        Row: {
          id: string;
          user_id: string;
          politician_id: string;
          politician_name: string;
          report: unknown;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          politician_id: string;
          politician_name: string;
          report: unknown;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          politician_id?: string;
          politician_name?: string;
          report?: unknown;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "politician_reports_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      politician_follows: {
        Row: {
          id: string;
          user_id: string;
          politician_id: string;
          politician_name: string;
          politician_image: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          politician_id: string;
          politician_name: string;
          politician_image?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          politician_id?: string;
          politician_name?: string;
          politician_image?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "politician_follows_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      generation_locks: {
        Row: {
          key: string;
          locked_at: string;
          expires_at: string;
        };
        Insert: {
          key: string;
          locked_at?: string;
          expires_at: string;
        };
        Update: {
          key?: string;
          locked_at?: string;
          expires_at?: string;
        };
        Relationships: [];
      };
      issue_votes: {
        Row: {
          id: string;
          issue_id: string;
          user_id: string;
          stance: "progressive" | "conservative" | "neutral";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          issue_id: string;
          user_id: string;
          stance: "progressive" | "conservative" | "neutral";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          issue_id?: string;
          user_id?: string;
          stance?: "progressive" | "conservative" | "neutral";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      verdict_votes: {
        Row: {
          id: string;
          issue_id: string;
          user_id: string;
          side: "progressive" | "conservative" | "draw";
          created_at: string;
        };
        Insert: {
          id?: string;
          issue_id: string;
          user_id: string;
          side: "progressive" | "conservative" | "draw";
          created_at?: string;
        };
        Update: {
          id?: string;
          issue_id?: string;
          user_id?: string;
          side?: "progressive" | "conservative" | "draw";
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      issue_vote_counts: {
        Row: {
          issue_id: string;
          progressive: number;
          conservative: number;
          neutral: number;
          total: number;
        };
        Relationships: [];
      };
      verdict_vote_counts: {
        Row: {
          issue_id: string;
          progressive: number;
          conservative: number;
          draw: number;
          total: number;
        };
        Relationships: [];
      };
    };
    Functions: {
      increment_user_points: {
        Args: { p_user_id: string; p_amount: number };
        Returns: void;
      };
    };
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

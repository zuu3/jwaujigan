import "server-only";

import { createServiceRoleSupabaseClient } from "@/lib/supabase";
import type { HotIssue } from "@/types/issue";

type DebateMessage = {
  role: "progressive" | "conservative" | "user";
  content: string;
};

type DebateResult = {
  winner: "progressive" | "conservative" | "draw";
  reason: string;
};

type IssueRow = {
  id: string;
  title: string;
  summary: string;
  progressive: string;
  conservative: string;
  created_at: string;
};

export type CachedArenaBattle = {
  messages: DebateMessage[];
  result: DebateResult;
};

function mapIssueRow(row: IssueRow): HotIssue {
  return {
    ...row,
    source_url: null,
    bill_id: null,
    published_at: null,
  };
}

export function getArenaBattleCacheTopic(issueId: string) {
  return `arena-cache:v2:${issueId}`;
}

function isValidCachedMessages(value: unknown): value is DebateMessage[] {
  return (
    Array.isArray(value) &&
    value.length >= 6 &&
    value.every(
      (message) =>
        typeof message === "object" &&
        message !== null &&
        ((message as DebateMessage).role === "progressive" ||
          (message as DebateMessage).role === "conservative" ||
          (message as DebateMessage).role === "user") &&
        typeof (message as DebateMessage).content === "string" &&
        (message as DebateMessage).content.trim().length > 0,
    )
  );
}

function parseCachedResult(value: string | null): DebateResult | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as Partial<DebateResult>;

    if (
      (parsed.winner === "progressive" ||
        parsed.winner === "conservative" ||
        parsed.winner === "draw") &&
      typeof parsed.reason === "string" &&
      parsed.reason.trim().length > 0
    ) {
      return {
        winner: parsed.winner,
        reason: parsed.reason,
      };
    }
  } catch {
    return null;
  }

  return null;
}

export async function getArenaIssues() {
  const supabase = createServiceRoleSupabaseClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("issues")
    .select("id, title, summary, progressive, conservative, created_at")
    .gt("expires_at", now)
    .order("created_at", { ascending: false })
    .limit(6);

  if (error) {
    console.error("Failed to fetch arena issues", error);
    throw new Error("Failed to fetch arena issues.");
  }

  return (data ?? []).map(mapIssueRow);
}

export async function getArenaIssueById(issueId: string) {
  const supabase = createServiceRoleSupabaseClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("issues")
    .select("id, title, summary, progressive, conservative, created_at")
    .eq("id", issueId)
    .gt("expires_at", now)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch arena issue", error);
    throw new Error("Failed to fetch arena issue.");
  }

  return data ? mapIssueRow(data) : null;
}

export async function getCachedArenaBattle(issueId: string) {
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from("battle_logs")
    .select("messages, result")
    .is("user_id", null)
    .eq("topic", getArenaBattleCacheTopic(issueId))
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch cached arena battle", error);
    return null;
  }

  if (!data || !isValidCachedMessages(data.messages)) {
    return null;
  }

  const result = parseCachedResult(data.result);

  if (!result) {
    return null;
  }

  return {
    messages: data.messages,
    result,
  };
}

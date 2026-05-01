import "server-only";

import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Database } from "@/lib/supabase";
import type { AssemblyIssueBill } from "@/lib/assembly";

type IssueInsert = Database["public"]["Tables"]["issues"]["Insert"];

type GeneratedIssueCard = {
  title: string;
  summary: string;
  progressive: string;
  conservative: string;
};

function getGeminiApiKey() {
  const value = process.env.GEMINI_API_KEY;

  if (!value) {
    throw new Error("Missing environment variable: GEMINI_API_KEY");
  }

  return value;
}

function getGenerativeModel() {
  const client = new GoogleGenerativeAI(getGeminiApiKey());

  return client.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.4,
    },
  });
}

function normalizeGeneratedIssue(raw: GeneratedIssueCard): GeneratedIssueCard {
  return {
    title: raw.title.trim().replace(/\s+/g, " "),
    summary: raw.summary.trim().replace(/\s+/g, " "),
    progressive: raw.progressive.trim().replace(/\s+/g, " "),
    conservative: raw.conservative.trim().replace(/\s+/g, " "),
  };
}

export async function buildIssueFromBill(bill: AssemblyIssueBill): Promise<IssueInsert> {
  const model = getGenerativeModel();
  const prompt = [
    "다음 국회 발의 법안을 홈 화면용 정치 이슈 카드로 변환하세요.",
    "반드시 JSON 객체만 반환하세요.",
    "title은 짧고 명확하게, summary는 한 줄 요약으로, progressive와 conservative는 읽기 쉽게 1~2문장으로 작성하세요.",
    "progressive는 공공성, 분배, 보호 관점에서, conservative는 재정건전성, 시장원리, 안보/책임 관점에서 요약하세요.",
    "선동적 표현을 피하고 짧고 명확한 한국어로 작성하세요.",
    "",
    `법안명: ${bill.title}`,
    `제안자: ${bill.proposer ?? "정보 없음"}`,
    `소관위원회: ${bill.committee ?? "정보 없음"}`,
  ].join("\n");

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const parsed = JSON.parse(text) as GeneratedIssueCard;
  const normalized = normalizeGeneratedIssue(parsed);
  const expiresAt = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString();

  return {
    title: normalized.title,
    summary: normalized.summary,
    progressive: normalized.progressive,
    conservative: normalized.conservative,
    source_url: bill.sourceUrl,
    bill_id: bill.billId,
    published_at: bill.publishedAt,
    expires_at: expiresAt,
  };
}

import "server-only";

import { GoogleGenerativeAI, type GenerationConfig, type Tool } from "@google/generative-ai";

const DEFAULT_MODEL = "gemini-2.5-flash";

function getGeminiApiKey() {
  const value = process.env.GEMINI_API_KEY;

  if (!value) {
    throw new Error("Missing environment variable: GEMINI_API_KEY");
  }

  return value;
}

export function getGeminiModel({
  generationConfig,
  systemInstruction,
  tools,
}: {
  generationConfig?: GenerationConfig;
  systemInstruction?: string;
  tools?: Tool[];
} = {}) {
  const client = new GoogleGenerativeAI(getGeminiApiKey());

  return client.getGenerativeModel({
    model: DEFAULT_MODEL,
    generationConfig,
    systemInstruction,
    tools,
  });
}

export function getGeminiSearchModel(systemInstruction?: string) {
  const client = new GoogleGenerativeAI(getGeminiApiKey());

  // Gemini 2.5는 googleSearch 도구로 grounding 지원. SDK 0.24 타입엔 없어서 cast 필요
  return client.getGenerativeModel({
    model: DEFAULT_MODEL,
    systemInstruction,
    tools: [{ googleSearch: {} } as unknown as Tool],
  });
}

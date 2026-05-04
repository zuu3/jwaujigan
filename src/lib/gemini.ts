import "server-only";

import { GoogleGenerativeAI, type GenerationConfig } from "@google/generative-ai";

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
}: {
  generationConfig?: GenerationConfig;
  systemInstruction?: string;
} = {}) {
  const client = new GoogleGenerativeAI(getGeminiApiKey());

  return client.getGenerativeModel({
    model: DEFAULT_MODEL,
    generationConfig,
    systemInstruction,
  });
}

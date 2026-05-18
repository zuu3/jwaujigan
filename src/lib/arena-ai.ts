import "server-only";

import { getGeminiModel } from "@/lib/gemini";

type ArenaAiProvider = "gemini" | "deepseek";

type GenerateTextOptions = {
  prompt: string;
  systemInstruction?: string;
  temperature?: number;
  maxOutputTokens?: number;
  timeoutMs?: number;
};

type GenerateJsonOptions = {
  prompt: string;
  temperature?: number;
  maxOutputTokens?: number;
  timeoutMs?: number;
};

type DeepSeekMessage = {
  role: "system" | "user";
  content: string;
};

type DeepSeekChatResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
  error?: {
    message?: string;
  };
};

const DEFAULT_DEEPSEEK_MODEL = "deepseek-v4-flash";
const DEFAULT_DEEPSEEK_BASE_URL = "https://api.deepseek.com";

function getArenaAiProvider(): ArenaAiProvider {
  const value = process.env.ARENA_AI_PROVIDER?.toLowerCase();

  if (value === "deepseek") return "deepseek";
  return "gemini";
}

function shouldFallbackToGemini() {
  return process.env.ARENA_AI_FALLBACK_TO_GEMINI !== "false";
}

function getDeepSeekApiKey() {
  const value = process.env.DEEPSEEK_API_KEY;

  if (!value) {
    throw new Error("Missing environment variable: DEEPSEEK_API_KEY");
  }

  return value;
}

function getDeepSeekModel() {
  return process.env.DEEPSEEK_MODEL ?? DEFAULT_DEEPSEEK_MODEL;
}

function getDeepSeekBaseUrl() {
  return process.env.DEEPSEEK_BASE_URL ?? DEFAULT_DEEPSEEK_BASE_URL;
}

function createTimeoutSignal(timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  return {
    signal: controller.signal,
    clear: () => clearTimeout(timeout),
  };
}

async function collectGeminiStream(
  stream: AsyncIterable<{ text: () => string }>,
) {
  let fullText = "";

  for await (const chunk of stream) {
    fullText += chunk.text();
  }

  return fullText.trim();
}

async function callDeepSeekChat({
  messages,
  temperature,
  maxOutputTokens,
  timeoutMs = 30_000,
  json,
}: {
  messages: DeepSeekMessage[];
  temperature?: number;
  maxOutputTokens?: number;
  timeoutMs?: number;
  json?: boolean;
}) {
  const timeout = createTimeoutSignal(timeoutMs);

  try {
    const response = await fetch(`${getDeepSeekBaseUrl()}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getDeepSeekApiKey()}`,
      },
      body: JSON.stringify({
        model: getDeepSeekModel(),
        messages,
        thinking: { type: "disabled" },
        temperature,
        max_tokens: maxOutputTokens,
        response_format: json ? { type: "json_object" } : undefined,
        stream: false,
      }),
      signal: timeout.signal,
    });

    const data = (await response.json().catch(() => ({}))) as DeepSeekChatResponse;

    if (!response.ok) {
      throw new Error(data.error?.message ?? `DeepSeek request failed: ${response.status}`);
    }

    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      throw new Error("DeepSeek response was empty.");
    }

    return content;
  } finally {
    timeout.clear();
  }
}

export async function generateArenaDebateText({
  prompt,
  systemInstruction,
  temperature = 0.6,
  maxOutputTokens = 2500,
  timeoutMs = 30_000,
}: GenerateTextOptions) {
  if (getArenaAiProvider() === "deepseek") {
    try {
      return await callDeepSeekChat({
        messages: [
          ...(systemInstruction
            ? [{ role: "system" as const, content: systemInstruction }]
            : []),
          { role: "user", content: prompt },
        ],
        temperature,
        maxOutputTokens,
        timeoutMs,
      });
    } catch (error) {
      if (!shouldFallbackToGemini()) throw error;
      console.warn("[arena-ai] DeepSeek debate failed; falling back to Gemini.", error);
    }
  }

  const model = getGeminiModel({
    generationConfig: {
      temperature,
      maxOutputTokens,
    },
    systemInstruction,
  });
  const result = await model.generateContentStream(prompt, {
    timeout: timeoutMs,
  });

  return collectGeminiStream(result.stream);
}

export async function generateArenaJudgeText({
  prompt,
  temperature = 0.4,
  maxOutputTokens = 600,
  timeoutMs = 30_000,
}: GenerateJsonOptions) {
  if (getArenaAiProvider() === "deepseek") {
    try {
      return await callDeepSeekChat({
        messages: [
          {
            role: "system",
            content: "응답은 반드시 유효한 JSON 객체 하나만 반환하세요.",
          },
          { role: "user", content: prompt },
        ],
        temperature,
        maxOutputTokens,
        timeoutMs,
        json: true,
      });
    } catch (error) {
      if (!shouldFallbackToGemini()) throw error;
      console.warn("[arena-ai] DeepSeek judge failed; falling back to Gemini.", error);
    }
  }

  const model = getGeminiModel({
    generationConfig: {
      responseMimeType: "application/json",
      maxOutputTokens,
      temperature,
    },
  });
  const result = await model.generateContent(prompt);

  return result.response.text();
}

import { NextResponse } from "next/server";
import { getGeminiModel } from "@/lib/gemini";

type DebateMessage = {
  role: "progressive" | "conservative" | "user";
  content: string;
};

type JudgeRequestBody = {
  issueTitle?: string;
  history?: DebateMessage[];
};

type JudgeResponse = {
  winner: "progressive" | "conservative" | "draw";
  reason: string;
};

function isValidHistory(value: unknown): value is DebateMessage[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every(
      (message) =>
        typeof message === "object" &&
        message !== null &&
        ((message as DebateMessage).role === "progressive" ||
          (message as DebateMessage).role === "conservative" ||
          (message as DebateMessage).role === "user") &&
        typeof (message as DebateMessage).content === "string",
    )
  );
}

function getStanceLabel(stance: "progressive" | "conservative") {
  return stance === "progressive" ? "진보" : "보수";
}

function formatHistory(history: DebateMessage[]) {
  return history
    .map((message, index) => {
      const speaker =
        message.role === "user" ? "사용자 개입" : `${getStanceLabel(message.role)} AI`;

      return `${index + 1}. ${speaker}: ${message.content}`;
    })
    .join("\n");
}

function parseJudgeResponse(text: string): JudgeResponse {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  const parsed = JSON.parse(cleaned) as Partial<JudgeResponse>;
  const winner =
    parsed.winner === "progressive" ||
    parsed.winner === "conservative" ||
    parsed.winner === "draw"
      ? parsed.winner
      : "draw";
  const reason =
    typeof parsed.reason === "string" && parsed.reason.trim()
      ? normalizeReason(parsed.reason.trim())
      : "논거의 우열이 명확하지 않았습니다.";

  return { winner, reason };
}

function normalizeReason(reason: string) {
  const trimmed = reason.replace(/\s+/g, " ").slice(0, 50);

  if (/[.!?。]$/.test(trimmed)) {
    return trimmed;
  }

  return `${trimmed.replace(/[,\s]+$/g, "")}.`;
}

export async function POST(request: Request) {
  const body = (await request.json()) as JudgeRequestBody;

  if (
    !body.issueTitle ||
    !isValidHistory(body.history)
  ) {
    return NextResponse.json({ message: "Invalid judge request." }, { status: 400 });
  }

  const prompt = [
    `다음은 "${body.issueTitle}"에 대한 토론 기록이야.`,
    "진보 AI와 보수 AI가 서로 토론했고, 사용자의 개입 발언은 참고 자료일 뿐이야.",
    "",
    formatHistory(body.history),
    "",
    "논리성, 근거, 설득력 기준으로 판정해줘.",
    "반드시 JSON으로만 응답:",
    '{ "winner": "progressive" | "conservative" | "draw", "reason": "완결된 판정 이유 45자 이내" }',
  ].join("\n");

  try {
    const model = getGeminiModel({
      generationConfig: {
        responseMimeType: "application/json",
        maxOutputTokens: 160,
        temperature: 0.2,
      },
    });
    const result = await model.generateContent(prompt);
    const response = parseJudgeResponse(result.response.text());

    return NextResponse.json(response);
  } catch (error) {
    console.error("Failed to judge debate", error);

    return NextResponse.json(
      { message: "Failed to judge debate." },
      { status: 500 },
    );
  }
}

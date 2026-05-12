import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
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

function extractJson(text: string): string {
  const stripped = text
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  const match = stripped.match(/\{[\s\S]*\}/);
  if (match) return match[0];
  return stripped;
}

function resolveWinner(raw: unknown): JudgeResponse["winner"] | null {
  if (raw === "progressive" || raw === "conservative" || raw === "draw") return raw;
  if (raw === "진보") return "progressive";
  if (raw === "보수") return "conservative";
  if (raw === "무승부") return "draw";
  if (typeof raw === "string") {
    const lower = raw.toLowerCase();
    if (lower.includes("progressive")) return "progressive";
    if (lower.includes("conservative")) return "conservative";
  }
  return null;
}

function parseJudgeResponse(text: string): JudgeResponse {
  console.log("[judge] raw response:", text);
  try {
    const cleaned = extractJson(text);
    const parsed = JSON.parse(cleaned) as Record<string, unknown>;
    const winner = resolveWinner(parsed.winner) ?? resolveWinner(parsed.result) ?? "draw";
    const reason =
      typeof parsed.reason === "string" && parsed.reason.trim()
        ? normalizeReason(parsed.reason.trim())
        : "논거의 우열이 명확하지 않았습니다.";
    console.log("[judge] parsed:", { winner, reason });
    return { winner, reason };
  } catch {
    const lower = text.toLowerCase();
    const winner: JudgeResponse["winner"] =
      lower.includes("progressive") ? "progressive" :
      lower.includes("conservative") ? "conservative" :
      lower.includes("진보") ? "progressive" :
      lower.includes("보수") ? "conservative" :
      "draw";
    return { winner, reason: "논거의 우열이 명확하지 않았습니다." };
  }
}

function normalizeReason(reason: string) {
  const trimmed = reason.replace(/\s+/g, " ").slice(0, 50);

  if (/[.!?。]$/.test(trimmed)) {
    return trimmed;
  }

  return `${trimmed.replace(/[,\s]+$/g, "")}.`;
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

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
    "두 AI 중 논거가 더 구체적이고 설득력 있는 쪽을 반드시 선택해.",
    "draw는 두 입장이 완전히 동등해서 도저히 구분이 불가능할 때만 써. 가능하면 승자를 골라.",
    "",
    "아래 JSON 형식으로만 응답하고 다른 텍스트는 절대 출력하지 마:",
    '{"winner": "progressive", "reason": "판정 이유 45자 이내"}',
    "",
    "winner 값은 반드시 영어로: progressive(진보 우세), conservative(보수 우세), draw(무승부)",
  ].join("\n");

  try {
    const model = getGeminiModel({
      generationConfig: {
        responseMimeType: "application/json",
        maxOutputTokens: 160,
        temperature: 0.5,
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

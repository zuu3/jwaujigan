import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getGeminiModel } from "@/lib/gemini";

type DebateMessage = {
  role: "progressive" | "conservative" | "user";
  content: string;
};

type JudgeRequestBody = {
  issueTitle?: string;
  issueBody?: string;
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
  if (raw === "무승부" || raw === "비김" || raw === "비겼음") return "draw";
  if (typeof raw === "string") {
    const lower = raw.toLowerCase();
    if (lower.includes("progressive")) return "progressive";
    if (lower.includes("conservative")) return "conservative";
    if (lower.includes("draw")) return "draw";
  }
  return null;
}

function getDefaultReason(winner: JudgeResponse["winner"]) {
  if (winner === "progressive") {
    return "진보 측이 법안 필요성과 이용자 보호 효과를 더 직접적으로 연결했습니다.";
  }

  if (winner === "conservative") {
    return "보수 측이 규제 부담과 시장 위축 가능성을 더 구체적으로 짚었습니다.";
  }

  return "양측 모두 타당한 근거를 냈지만 결정적 우열은 크지 않았습니다.";
}

function parseJudgeResponse(text: string): JudgeResponse {
  console.log("[judge] raw response:", text);
  try {
    const cleaned = extractJson(text);
    const parsed = JSON.parse(cleaned) as Record<string, unknown>;
    const winner = resolveWinner(parsed.winner) ?? resolveWinner(parsed.result) ?? "draw";
    const parsedReason =
      typeof parsed.reason === "string" && parsed.reason.trim()
        ? normalizeReason(parsed.reason.trim())
        : getDefaultReason(winner);
    const reason =
      winner !== "draw" && /우열이?\s*명확하지|구분이?\s*어렵|비슷한 수준/.test(parsedReason)
        ? getDefaultReason(winner)
        : parsedReason;
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
    return { winner, reason: getDefaultReason(winner) };
  }
}

function normalizeReason(reason: string) {
  const trimmed = reason.replace(/\s+/g, " ").slice(0, 80);

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
    body.issueBody ? `\n[법안 상세 내용 — 사실 검증에 활용]\n${body.issueBody.slice(0, 1500)}` : "",
    "",
    "[토론 기록]",
    formatHistory(body.history),
    "",
    "판정 기준 (다음 순서대로 평가):",
    "1. 사실 정확성 — 법안 상세 내용과 일치하는 주장을 한 쪽 우대",
    "2. 논거 구체성 — 추상어보다 조항·기준·대상을 명시한 쪽 우대",
    "3. 반박의 적절성 — 상대 주장의 약점을 정확히 짚은 쪽 우대",
    "4. 일관성 — 라운드 간 입장이 흔들리지 않은 쪽 우대",
    "5. 반복 감점 — 같은 우려나 같은 가치만 반복하고 새 근거를 못 낸 쪽 감점",
    "",
    "어느 진영도 미리 편들지 마. 발언만 보고 객관적으로 평가해.",
    "draw는 두 입장이 완전히 동등해서 도저히 구분이 불가능할 때만 써.",
    "winner가 progressive 또는 conservative이면 reason에서 '우열이 명확하지 않다', '비슷하다' 같은 표현을 쓰지 마.",
    "reason은 승리한 쪽이 어떤 기준에서 앞섰는지와 패한 쪽의 한계를 함께 담아.",
    "",
    "응답 형식 — 다음 규칙을 절대 준수:",
    "1. 응답은 오직 JSON 객체 하나로만 시작. 즉 첫 문자가 반드시 { 여야 함.",
    "2. JSON 앞이나 뒤에 'Here is...', '```json', 설명, 인사말 등 어떤 텍스트도 붙이지 마.",
    "3. JSON 형식:",
    '{"winner": "progressive", "reason": "진보 측이 이용자 보호 필요성을 구체 조항과 연결했고, 보수 측은 부담 근거가 반복됐습니다."}',
    "4. winner 값은 반드시 영어 소문자로: progressive, conservative, draw 중 하나.",
    "5. reason은 반드시 한국어로 작성하고 80자 이내.",
  ].filter(Boolean).join("\n");

  try {
    const model = getGeminiModel({
      generationConfig: {
        responseMimeType: "application/json",
        maxOutputTokens: 600,
        temperature: 0.4,
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

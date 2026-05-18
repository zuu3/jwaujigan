import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateArenaJudgeText } from "@/lib/arena-ai";

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

function formatHistory(history: DebateMessage[]) {
  return history
    .map((message, index) => {
      const speaker =
        message.role === "user"
          ? "사용자 개입"
          : message.role === "progressive"
            ? "A"
            : "B";

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
  if (raw === "A" || raw === "a") return "progressive";
  if (raw === "B" || raw === "b") return "conservative";
  if (raw === "진보") return "progressive";
  if (raw === "보수") return "conservative";
  if (raw === "무승부" || raw === "비김" || raw === "비겼음") return "draw";
  if (typeof raw === "string") {
    const lower = raw.toLowerCase();
    if (lower === "a" || lower.includes("side a")) return "progressive";
    if (lower === "b" || lower.includes("side b")) return "conservative";
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
      lower.includes("conservative") || lower.includes("보수") || /\bb\b/.test(lower) ? "conservative" :
      lower.includes("progressive") || lower.includes("진보") || /\ba\b/.test(lower) ? "progressive" :
      "draw";
    return { winner, reason: getDefaultReason(winner) };
  }
}

function normalizeReason(reason: string) {
  const trimmed = reason.replace(/\s+/g, " ").trim();

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
    "A와 B가 서로 토론했고, 사용자의 개입 발언은 참고 자료일 뿐이야.",
    "A는 한쪽 입장, B는 반대쪽 입장이지만, 판정할 때 정치 라벨이나 선호 진영을 떠올리지 마.",
    "판정 결과를 낼 때만 A=progressive, B=conservative로 변환해.",
    body.issueBody ? `\n[법안 상세 내용 — 사실 검증에 활용]\n${body.issueBody.slice(0, 1500)}` : "",
    "",
    "[토론 기록]",
    formatHistory(body.history),
    "",
    "판정 기준 (다음 순서대로 평가):",
    "1. 사실 정확성 — 법안 상세 내용과 일치하거나, 법안의 허점·부작용을 정확히 짚은 쪽 우대",
    "2. 논거 구체성 — 추상어보다 조항·기준·대상·절차·예외·집행 가능성을 명시한 쪽 우대",
    "3. 반박의 적절성 — 상대 주장의 약점과 빠진 전제를 정확히 짚은 쪽 우대",
    "4. 일관성 — 라운드 간 입장이 흔들리지 않은 쪽 우대",
    "5. 반복 감점 — 같은 우려나 같은 가치만 반복하고 새 근거를 못 낸 쪽 감점",
    "6. 법적·행정적 타당성 — 명확성 원칙, 과잉금지원칙, 재산권, 예측 가능성, 집행 비용, 규제 사각지대 지적도 공익·보호 필요성과 동등한 무게로 평가",
    "7. 상대가 새로운 법적·행정적 우려나 집행상 허점을 제시했으면 반복으로 감점하지 마",
    "8. 예산 확보, 단계적 시행, 우선순위 설정, 인력 수급, 원격 지원, 평가 기준 보완처럼 실행 방식을 제안했다면 구체적 대안으로 인정해",
    "9. 토론자가 새 조건·수정안·보완책을 제안했으면 그것을 현 법안 조항처럼 평가하지 마. 현 법안에 없는 내용을 '법안 내용과 연결했다'고 쓰면 안 돼",
    "10. 법안의 목적과 직접 일치하는 주장도 구체 논거로 인정해. 같은 결론을 반복했더라도 사업성, 가격, 공급량, 비용 전가처럼 다른 근거를 제시했다면 반복 감점하지 마",
    "",
    "법안의 취지에 찬성하는 쪽을 자동으로 우대하지 마. 법안의 한계·부작용·집행 가능성 지적도 정확하면 승리할 수 있어.",
    "먼저 말한 쪽에 유리하게 평가하지 마.",
    "두 입장이 각각 강점과 약점을 보이고 결정적 우열이 작으면 draw를 적극 허용해.",
    "reason은 토론 기록에 충실해야 해. 실제로 제시한 대안을 '대안이 없다'고 쓰거나, 새 우려를 '반복'이라고 단정하지 마.",
    "reason에서 '법안 조항', '법안 내용'이라고 표현하려면 [법안 상세 내용]이나 이슈 설명에 실제로 있는 내용만 사용해.",
    "먼저 a_best와 b_best에 각자 가장 강한 논거를 한 문장씩 적고, margin에 decisive 또는 close를 적어.",
    "winner가 progressive 또는 conservative여도 margin이 close이면 reason에 '근소하게' 또는 '다만'을 포함해 반대쪽 최강 논거를 인정해.",
    "winner가 progressive 또는 conservative이면 reason은 반드시 'A는 ... B는 ... 다만 ...' 또는 'B는 ... A는 ... 다만 ...' 구조로 작성해.",
    "winner가 draw이면 reason에서 양쪽의 가장 강한 논거와 결정적 우열이 작았던 이유를 담아.",
    "",
    "응답 형식 — 다음 규칙을 절대 준수:",
    "1. 응답은 오직 JSON 객체 하나로만 시작. 즉 첫 문자가 반드시 { 여야 함.",
    "2. JSON 앞이나 뒤에 'Here is...', '```json', 설명, 인사말 등 어떤 텍스트도 붙이지 마.",
    "3. JSON 형식:",
    '{"winner": "draw", "margin": "close", "a_best": "A는 학습 기회 확대와 공적 표준화 필요성을 제시했습니다.", "b_best": "B는 기준 모호성, 기업 간 형평성, 행정 부담을 구체적으로 짚었습니다.", "reason": "A는 학습계좌제를 통한 기회 확대를 법안 취지와 연결했고, B는 기준 모호성과 행정 부담이라는 실행상 허점을 구체적으로 제기했습니다. 다만 양쪽 모두 보완책의 세부 기준까지 제시하진 못해 결정적 우열은 작았습니다."}',
    "4. winner 값은 반드시 영어 소문자로: progressive(A), conservative(B), draw 중 하나.",
    "5. margin 값은 반드시 영어 소문자로: decisive, close 중 하나.",
    "6. a_best, b_best, reason은 반드시 한국어로 작성.",
  ].filter(Boolean).join("\n");

  try {
    const text = await generateArenaJudgeText({
      prompt,
      maxOutputTokens: 600,
      temperature: 0.2,
    });
    const response = parseJudgeResponse(text);

    return NextResponse.json(response);
  } catch (error) {
    console.error("Failed to judge debate", error);

    return NextResponse.json(
      { message: "Failed to judge debate." },
      { status: 500 },
    );
  }
}

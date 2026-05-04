import { NextResponse } from "next/server";
import { getGeminiModel } from "@/lib/gemini";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DebateMessage = {
  role: "progressive" | "conservative" | "user";
  content: string;
};

type DebateRequestBody = {
  issueId?: string;
  issueTitle?: string;
  progressiveContext?: string;
  conservativeContext?: string;
  speakerStance?: "progressive" | "conservative";
  round?: number;
  history?: DebateMessage[];
};

function isValidHistory(value: unknown): value is DebateMessage[] {
  return (
    Array.isArray(value) &&
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
  if (history.length === 0) {
    return "이전 발언 없음";
  }

  return history
    .map((message) => {
      if (message.role === "user") {
        return `사용자 개입: ${message.content}`;
      }

      return `${getStanceLabel(message.role)} AI: ${message.content}`;
    })
    .join("\n");
}

function buildDebatePrompt({
  round,
  issueTitle,
  history,
  speakerStance,
  retry,
}: {
  round: number;
  issueTitle: string;
  history: DebateMessage[];
  speakerStance: "progressive" | "conservative";
  retry?: boolean;
}) {
  const opponentStance =
    speakerStance === "progressive" ? "conservative" : "progressive";
  const opponentMessages = history.filter((message) => message.role === opponentStance);
  const latestOpponentMessage = opponentMessages.at(-1);
  const latestUserMessage = history.filter((message) => message.role === "user").at(-1);
  const commonRules = [
    "출력은 토론 발언문만 작성해.",
    "이슈 제목만 반복하지 마.",
    "상대 발언을 따옴표로 길게 재인용하지 마.",
    "직전 발언과 같은 문장 구조를 반복하지 마.",
    "제목, 키워드, 명사구만 출력하면 안 돼.",
    "완결된 주장 문장 2~3문장으로 작성해.",
    "구체적인 정책 효과, 위험, 기준, 절차 중 최소 2개를 포함해.",
    "80자 이상 150자 이내로 작성해.",
  ];
  const retryRules = retry
    ? [
        "",
        "이전 응답이 너무 짧거나 제목만 반복했어.",
        "반드시 이유와 근거가 들어간 완결된 토론 발언으로 다시 작성해.",
      ]
    : [];

  if (!latestOpponentMessage) {
    return [
      `현재 라운드: ${round} / 3`,
      "",
      `${getStanceLabel(speakerStance)} AI의 첫 발언이야.`,
      `"${issueTitle}"에 대해 네 입장을 먼저 제시해.`,
      latestUserMessage ? `참고할 사용자 의견: ${latestUserMessage.content}` : "",
      ...commonRules,
      ...retryRules,
    ].join("\n");
  }

  return [
    `현재 라운드: ${round} / 3`,
    "",
    "토론 기록:",
    formatHistory(history),
    "",
    `상대 AI의 최신 주장: ${latestOpponentMessage.content}`,
    latestUserMessage ? `참고할 사용자 의견: ${latestUserMessage.content}` : "",
    "상대 AI 주장에 직접 반박하고 네 입장을 강화해.",
    ...commonRules,
    ...retryRules,
  ].join("\n");
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

function isWeakDebateText(text: string, issueTitle: string) {
  const normalizedText = text.replace(/\s+/g, "");
  const normalizedTitle = issueTitle.replace(/\s+/g, "");

  if (text.length < 45) {
    return true;
  }

  if (normalizedText === normalizedTitle) {
    return true;
  }

  if (
    normalizedText.length <= normalizedTitle.length + 8 &&
    normalizedText.includes(normalizedTitle)
  ) {
    return true;
  }

  return !/[.!?。]|다$|요$|함$|됨$/.test(text);
}

function splitForSse(text: string) {
  const chunks: string[] = [];

  for (let index = 0; index < text.length; index += 18) {
    chunks.push(text.slice(index, index + 18));
  }

  return chunks;
}

function compactContext(context: string) {
  return context
    .replace(/\s+/g, " ")
    .replace(/[.!?。]$/g, "")
    .replace(/(합니다|입니다|한다|된다|개정안입니다|일부 개정안입니다)$/g, "")
    .slice(0, 54);
}

function buildFallbackDebateText({
  aiStance,
  issueTitle,
  context,
  history,
  round,
}: {
  aiStance: "progressive" | "conservative";
  issueTitle: string;
  context: string;
  history: DebateMessage[];
  round: number;
}) {
  const issueSubject = issueTitle.replace(/\s*(개정안|일부 개정안|법안)$/g, "");
  const contextSummary = compactContext(context);
  const opponentStance =
    aiStance === "progressive" ? "conservative" : "progressive";
  const hasOpponentMessage = history.some((message) => message.role === opponentStance);

  if (aiStance === "progressive") {
    if (!hasOpponentMessage) {
      return `${issueSubject}은 취지보다 집행 기준이 중요해. ${contextSummary}라는 목표를 살리려면 현장 부담, 예산, 피해 구제 절차를 함께 공개해야 해.`;
    }

    if (round === 2) {
      return `보수 측은 필요성을 강조하지만 ${issueSubject}은 현장 적용 과정의 부작용도 봐야 해. 대상 범위와 책임 기준을 분리해야 정책 효과를 검증할 수 있어.`;
    }

    return `결국 쟁점은 찬반이 아니라 설계의 투명성이야. ${issueSubject}이 실제 개선으로 이어지려면 사전 기준과 사후 평가를 같이 둬야 설득력이 생겨.`;
  }

  if (!hasOpponentMessage) {
    return `${issueSubject}은 문제를 미루면 현장의 비용이 더 커져. ${contextSummary}라는 목표를 달성하려면 권한 범위와 책임 주체를 명확히 해 실행력을 높여야 해.`;
  }

  if (round === 2) {
    return `진보 측의 통제 장치도 필요하지만 기준만 늘리면 집행 속도가 떨어져. ${issueSubject}은 우선순위와 담당 책임을 정해야 현장에서 바로 작동해.`;
  }

  return `예측 가능성은 중요하지만 실효성이 빠지면 제도는 선언에 그쳐. ${issueSubject}은 평가 기준을 두되 필요한 조치는 지체 없이 집행해야 효과가 나와.`;
}

export async function POST(request: Request) {
  const body = (await request.json()) as DebateRequestBody;

  if (
    !body.issueId ||
    !body.issueTitle ||
    !body.progressiveContext ||
    !body.conservativeContext ||
    (body.speakerStance !== "progressive" && body.speakerStance !== "conservative") ||
    typeof body.round !== "number" ||
    body.round < 1 ||
    body.round > 3 ||
    !isValidHistory(body.history)
  ) {
    return NextResponse.json({ message: "Invalid debate request." }, { status: 400 });
  }

  const aiStance = body.speakerStance;
  const aiStanceLabel = getStanceLabel(aiStance);
  const context =
    aiStance === "progressive"
      ? body.progressiveContext
      : body.conservativeContext;
  const systemInstruction = [
    `너는 다음 이슈에 대해 ${aiStanceLabel} 입장을 가진 토론자야.`,
    "",
    `이슈: ${body.issueTitle}`,
    `${aiStanceLabel} 관점 요약: ${context}`,
    "",
    "상대의 주장에 논리적으로 반박해.",
    "- 150자 이내로 핵심만",
    "- 데이터와 논리로만, 감정적 표현 없이",
    "- 반말 사용",
  ].join("\n");
  const prompt = buildDebatePrompt({
    round: body.round,
    issueTitle: body.issueTitle,
    history: body.history,
    speakerStance: body.speakerStance,
  });

  try {
    const model = getGeminiModel({
      generationConfig: {
        temperature: 0.55,
        maxOutputTokens: 180,
      },
      systemInstruction,
    });
    const result = await model.generateContentStream(prompt, {
      timeout: 30_000,
    });
    const firstText = await collectGeminiStream(result.stream);
    let debateText = firstText;

    if (isWeakDebateText(firstText, body.issueTitle)) {
      console.warn("[debate weak response retry]", {
        issueId: body.issueId,
        round: body.round,
        text: firstText,
      });

      const retryPrompt = buildDebatePrompt({
        round: body.round,
        issueTitle: body.issueTitle,
        history: body.history,
        speakerStance: body.speakerStance,
        retry: true,
      });
      const retryResult = await model.generateContentStream(retryPrompt, {
        timeout: 30_000,
      });

      debateText = await collectGeminiStream(retryResult.stream);
    }

    if (isWeakDebateText(debateText, body.issueTitle)) {
      console.warn("[debate weak response fallback]", {
        issueId: body.issueId,
        round: body.round,
        text: debateText,
      });

      debateText = buildFallbackDebateText({
        aiStance,
        issueTitle: body.issueTitle,
        context,
        history: body.history,
        round: body.round,
      });
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          controller.enqueue(encoder.encode(": stream-open\n\n"));

          for (const text of splitForSse(debateText)) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text })}\n\n`),
            );
          }

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          console.error("[debate stream error]", error);

          controller.enqueue(
            encoder.encode(
              `event: error\ndata: ${JSON.stringify({
                message: "Failed to stream debate response.",
              })}\n\n`,
            ),
          );
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        }
      },
      cancel(reason) {
        console.info("[debate stream cancelled]", reason);
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("Failed to stream debate response", error);

    return NextResponse.json(
      { message: "Failed to stream debate response." },
      { status: 500 },
    );
  }
}

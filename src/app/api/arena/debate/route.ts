import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateArenaDebateText } from "@/lib/arena-ai";
import { getDailyBattleLimit, kstTodayStartISO } from "@/services/points/points";
import { createServiceRoleSupabaseClient } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SSE_CHARACTER_DELAY_MS = 18;

type DebateMessage = {
  role: "progressive" | "conservative" | "user";
  content: string;
};

type DebateRequestBody = {
  issueId?: string;
  issueTitle?: string;
  issueBody?: string;
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

function sanitizeUserContent(content: string): string {
  return content
    .slice(0, 200)
    .replace(/\n/g, " ")
    .replace(/system:|<\|.*?\|>|ignore (previous|all|above)|forget (previous|instructions)/gi, "")
    .trim();
}

function formatHistory(history: DebateMessage[]) {
  if (history.length === 0) {
    return "이전 발언 없음";
  }

  return history
    .map((message) => {
      if (message.role === "user") {
        return `사용자 개입: ${sanitizeUserContent(message.content)}`;
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
    "출력은 발언문만. 다른 설명 붙이지 마.",
    "이슈 제목 그대로 반복하지 마.",
    "상대 발언 길게 재인용하지 마.",
    "직전 발언과 같은 문장 구조 피해.",
    "1~2문장으로 짧게. 분량 90~140자.",
    "반드시 이유를 넣고, 가능하면 법안의 대상·의무·수치·예외 중 하나를 짚어.",
    "추상어만 반복하지 말고, 이 조항이 실제로 누구에게 어떤 영향이 있는지 말해.",
    "반드시 마침표나 종결어미(~해/~야/~지/~잖아)로 마무리. 미완성 금지.",
    "카톡 톤 — 친구한테 말하듯 자연스럽게.",
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
      "첫 문장은 핵심 주장, 다음 문장은 구체 근거로 써.",
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
    "상대가 말한 우려나 장점을 하나 인정하더라도, 왜 네 결론이 더 타당한지 구체적으로 이어가.",
    ...commonRules,
    ...retryRules,
  ].join("\n");
}

function isWeakDebateText(text: string, issueTitle: string) {
  const trimmed = text.trimEnd();
  const normalizedText = text.replace(/\s+/g, "");
  const normalizedTitle = issueTitle.replace(/\s+/g, "");

  // 너무 짧음 (15자 미만은 의미 없음)
  if (text.length < 15) {
    return true;
  }

  // 제목만 반복
  if (normalizedText === normalizedTitle) {
    return true;
  }

  if (
    normalizedText.length <= normalizedTitle.length + 8 &&
    normalizedText.includes(normalizedTitle)
  ) {
    return true;
  }

  // 쉼표·조사·연결어미로 끝남 = 미완성
  if (/[,，·]$/.test(trimmed)) return true;
  // 조사/연결어미로 끝나면서 마침표 없으면 잘린 것
  if (/(은|는|이|가|을|를|에|와|과|로|며|면서|하고|하며|있고|있으며|등은|등을|등의)$/.test(trimmed)) {
    return true;
  }

  // 종결어미·문장부호 어느 것도 없음
  return !/[.!?。]$|다\.?$|요\.?$|함\.?$|됨\.?$|해\.?$|어\.?$|지\.?$|야\.?$/.test(trimmed);
}

function splitForSse(text: string) {
  return Array.from(text);
}

function wait(milliseconds: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

function buildFallbackDebateText({
  aiStance,
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
  const opponentStance =
    aiStance === "progressive" ? "conservative" : "progressive";
  const hasOpponentMessage = history.some((message) => message.role === opponentStance);
  const contextHint = context.split(/[.!?\n]/).find((item) => item.trim().length > 12)?.trim();

  if (aiStance === "progressive") {
    if (!hasOpponentMessage) {
      return contextHint
        ? `난 찬성 쪽이야. ${contextHint}라는 점을 보면, 책임 소재를 분명히 해야 이용자 보호가 실제로 작동하지.`
        : "난 찬성 쪽이야. 시장 자율만 믿으면 책임 회피가 생기니까, 보호 장치랑 정보 공개가 같이 가야 효과가 나지.";
    }
    if (round === 2) {
      return "부담 우려는 이해해. 그래도 책임 주체와 연락 체계가 명확해야 피해가 났을 때 이용자가 실제로 구제받을 수 있잖아.";
    }
    return "결국 쟁점은 부담보다 책임의 실효성이야. 국내 이용자에게 서비스한다면 최소한의 대응 의무는 감수해야 맞지.";
  }

  if (!hasOpponentMessage) {
    return contextHint
      ? `취지는 알겠어. 그래도 ${contextHint} 같은 방향이 과하면 해외 기업엔 진입비용이 커져서 선택지가 줄 수 있어.`
      : "취지는 알겠어. 그래도 의무가 과하면 해외 기업엔 진입비용이 커져서 국내 이용자의 선택지도 줄 수 있어.";
  }
  if (round === 2) {
    return "이용자 보호는 필요하지. 다만 국내 법인 우선 지정처럼 고정비를 키우는 방식보다 위험 기반 규제가 더 균형 있어.";
  }
  return "책임 강화 자체엔 동의해. 하지만 보고 의무와 대리인 요건이 넓게 걸리면 작은 해외 서비스부터 한국을 피할 수 있어.";
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as DebateRequestBody;

  // 배틀 첫 호출(round 1, progressive 선발)에서만 일일 한도 + 쿨다운 체크
  if (body.round === 1 && body.speakerStance === "progressive") {
    const supabase = createServiceRoleSupabaseClient();
    const userId = session.user.id;

    const { data: userRow } = await supabase
      .from("users")
      .select("points")
      .eq("id", userId)
      .maybeSingle();

    const dailyLimit = getDailyBattleLimit(userRow?.points ?? 0);
    if (dailyLimit !== Infinity) {
      const { count } = await supabase
        .from("battle_logs")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", kstTodayStartISO());

      if ((count ?? 0) >= dailyLimit) {
        return NextResponse.json(
          { message: "daily_limit_reached", limit: dailyLimit },
          { status: 429 },
        );
      }
    }

    // 쿨다운: 마지막 배틀 완료 후 30초 이내 재시작 차단
    const cooldownMs = 30_000;
    const { data: lastBattle } = await supabase
      .from("battle_logs")
      .select("created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastBattle) {
      const elapsed = Date.now() - new Date(lastBattle.created_at).getTime();
      if (elapsed < cooldownMs) {
        const retryAfter = Math.ceil((cooldownMs - elapsed) / 1000);
        return NextResponse.json(
          { message: "cooldown", retry_after: retryAfter },
          { status: 429, headers: { "Retry-After": String(retryAfter) } },
        );
      }
    }
  }

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
    `너는 ${aiStanceLabel} 입장으로 이 이슈를 친구와 카톡 채팅하듯 토론해.`,
    "",
    `이슈: ${body.issueTitle}`,
    `${aiStanceLabel} 관점 요약: ${context}`,
    body.issueBody ? `\n[법안 상세 내용]\n${body.issueBody.slice(0, 1500)}` : "",
    "",
    "말투 규칙:",
    "- 친구한테 말하듯 자연스러운 반말. 격식체(~다/~이다/~한다) 금지. 입말(~해/~야/~지/~잖아/~거든)만 사용.",
    "- '~하는 것이다', '~할 것이다' 같은 딱딱한 표현 금지. '~하는 거야', '~할 거야'로.",
    "- 너무 정중하거나 학술적인 어휘 피해. 친구 톤으로.",
    "- '근데', '솔직히', '아니', '그래도' 같은 자연스러운 접속사 가끔 사용.",
    "",
    "내용 규칙:",
    "- 상대 주장에 직접 반박하거나 네 입장을 강하게 펼쳐.",
    "- 분량은 90~140자. 짧되 근거가 보여야 함.",
    "- 반드시 문장 끝까지 마무리. 마침표나 종결어미로 완결.",
    "- 매 발언마다 최소 하나는 구체화: 법안의 대상, 의무, 수치, 절차, 부작용, 보완책 중 하나를 언급.",
    "- 같은 말 반복 금지. 이전 발언과 다른 근거 또는 다른 반박 포인트를 써.",
    "- 상대 진영 조롱·비하 금지. 친구끼리 의견 다툼 느낌으로.",
  ].filter(Boolean).join("\n");
  const prompt = buildDebatePrompt({
    round: body.round,
    issueTitle: body.issueTitle,
    history: body.history,
    speakerStance: body.speakerStance,
  });

  try {
    const firstText = await generateArenaDebateText({
      prompt,
      systemInstruction,
      temperature: 0.6,
      maxOutputTokens: 2500,
      timeoutMs: 30_000,
    });
    console.log(
      `[debate r${body.round} ${aiStance}] raw(${firstText.length}자):`,
      firstText.slice(0, 80),
    );
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
      debateText = await generateArenaDebateText({
        prompt: retryPrompt,
        systemInstruction,
        temperature: 0.6,
        maxOutputTokens: 2500,
        timeoutMs: 30_000,
      });
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
            await wait(SSE_CHARACTER_DELAY_MS);
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

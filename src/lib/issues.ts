import "server-only";

import type { Database } from "@/lib/supabase";
import type { AssemblyIssueBill } from "@/lib/assembly";
import { getGeminiModel, getGeminiSearchModel } from "@/lib/gemini";

type IssueInsert = Database["public"]["Tables"]["issues"]["Insert"];

async function searchBillContext(bill: AssemblyIssueBill): Promise<string | null> {
  try {
    const model = getGeminiSearchModel();
    const searchPrompt = [
      "다음 한국 국회 법안에 대해 웹에서 검색하여 구체적인 내용을 정리해주세요.",
      "뉴스 기사, 국회 자료, 보도자료를 참조하여 사실 기반으로 작성합니다.",
      "",
      `법안명: ${bill.title}`,
      `제안자: ${bill.proposer ?? "정보 없음"}`,
      `소관위원회: ${bill.committee ?? "정보 없음"}`,
      bill.publishedAt ? `제안일: ${bill.publishedAt.slice(0, 10)}` : "",
      "",
      "다음 항목을 정리해주세요 (검색 결과가 충분하지 않은 항목은 생략):",
      "1. 제안이유 / 배경",
      "2. 주요 조항 및 변경사항",
      "3. 영향받는 대상 (시민/기업/정부)",
      "4. 사회적 쟁점 및 논의 동향",
      "5. 진보·보수 진영의 입장 차이",
      "",
      "검색에서 직접 확인된 내용만 포함하고, 추측은 명시하세요.",
    ].filter(Boolean).join("\n");

    const result = await model.generateContent(searchPrompt);
    const text = result.response.text().trim();
    return text.length > 100 ? text : null;
  } catch (e) {
    console.error("[issues] searchBillContext error:", e);
    return null;
  }
}

type GeneratedIssueCard = {
  title: string;
  summary: string;
  body: string;
  progressive: string;
  conservative: string;
  scenario: string;
};

function getIssueGenerativeModel() {
  return getGeminiModel({
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.4,
    },
  });
}

function normalizeGeneratedIssue(raw: Partial<GeneratedIssueCard>): GeneratedIssueCard {
  const safe = (v: string | undefined) => (v ?? "").trim();
  const compact = (v: string | undefined) => safe(v).replace(/\s+/g, " ");

  const normalized = {
    title: compact(raw.title),
    summary: compact(raw.summary),
    body: safe(raw.body),
    progressive: compact(raw.progressive),
    conservative: compact(raw.conservative),
    scenario: safe(raw.scenario),
  };

  if (!normalized.title || !normalized.summary || !normalized.body) {
    throw new Error(
      `Gemini 응답에 필수 필드 누락: title=${!!normalized.title}, summary=${!!normalized.summary}, body=${!!normalized.body}`,
    );
  }

  return normalized;
}

export async function buildIssueFromBill(bill: AssemblyIssueBill): Promise<IssueInsert> {
  // 1단계: 웹 검색으로 법안 컨텍스트 수집
  const searchContext = await searchBillContext(bill);
  console.log(
    `[issues] searched "${bill.title.slice(0, 30)}":`,
    searchContext ? `${searchContext.length}자 수집` : "검색 결과 없음",
  );

  // 2단계: 수집된 컨텍스트로 구조화된 이슈 카드 생성
  const model = getIssueGenerativeModel();

  const prompt = [
    "당신은 한국 국회 법안을 일반 시민에게 설명하는 정치 평론가입니다.",
    "반드시 JSON 객체만 반환하고, 모든 텍스트는 한국어로 작성하세요.",
    "어떤 필드에서도 '원문이 없어 알 수 없다' 같은 거절·회피 답변은 절대 금지입니다.",
    "",
    "필드 작성 기준:",
    "- title: 15자 이내. 법안명에서 핵심 키워드만 추출",
    "- summary: 이 법안이 무엇을 하려는지 한 문장으로 명확히 서술",
    "- body: 4문단으로 구성. 문단 구분은 \\n\\n. 각 문단은 3~5문장.",
    "  1문단: 법안의 배경 — 어떤 사회 문제·정책 환경에서 발의되었는지",
    "  2문단: 법안의 핵심 내용 — 어떤 법을 어떻게 바꾸려는지, 신설·개정·삭제 조항",
    "  3문단: 영향받는 대상 — 시민·기업·정부 중 누가 어떻게 영향받는지",
    "  4문단: 쟁점과 향후 전망 — 통과 시 효과, 사회적 논의 지점",
    "- progressive: 진보·공공성·분배·노동자 보호 관점에서 이 법안을 어떻게 평가할지 2~3문장",
    "- conservative: 재정건전성·시장원리·기업 자율·규제 최소화 관점에서 이 법안을 어떻게 평가할지 2~3문장",
    "- scenario: '만약 이 법이 통과된다면' 가상 상황. 3개 시나리오를 줄바꿈(\\n\\n)으로 구분.",
    "  각 시나리오는 '• ' 로 시작. 구체적 인물·상황·결과 묘사 (예: '서울에 사는 30대 직장인 A씨는...').",
    "  추상적 효과가 아니라 일상에서 체감되는 구체적 변화로 작성.",
    "",
    "스타일 규칙:",
    "- 선동적·감정적 표현 금지",
    "- '약 60%', '대부분' 같은 근거 없는 수치·일반화 금지",
    "- 단정 대신 '~할 것으로 보입니다', '~가 예상됩니다' 같은 추론 표현 허용",
    "- '확인할 수 없다', '원문이 없어 알 수 없다' 같은 회피는 절대 금지",
    "",
    `법안명: ${bill.title}`,
    `제안자: ${bill.proposer ?? "정보 없음"}`,
    `소관위원회: ${bill.committee ?? "정보 없음"}`,
    bill.billStatus ? `현재 상태: ${bill.billStatus}` : "",
    "",
    searchContext
      ? `[웹 검색으로 수집한 법안 관련 정보]\n${searchContext}\n\n위 검색 정보를 우선 활용하여 작성하세요.`
      : "[웹 검색 결과 없음] 법안명을 분석하여 한국 법률 일반 지식으로 충실히 작성하세요.",
  ].filter(Boolean).join("\n");

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const parsed = JSON.parse(text) as Partial<GeneratedIssueCard>;
  const normalized = normalizeGeneratedIssue(parsed);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  return {
    title: normalized.title,
    summary: normalized.summary,
    body: normalized.body,
    progressive: normalized.progressive,
    conservative: normalized.conservative,
    scenario: normalized.scenario || null,
    source_url: bill.sourceUrl,
    bill_id: bill.billId,
    published_at: bill.publishedAt,
    proposer: bill.proposer,
    committee: bill.committee,
    bill_status: bill.billStatus,
    expires_at: expiresAt,
  };
}

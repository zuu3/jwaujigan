import { NextResponse } from "next/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase";
import { GLOSSARY } from "@/lib/glossary";

const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com";
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL ?? "deepseek-chat";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (auth !== `Bearer ${cronSecret}` && auth !== `Bearer ${serviceKey}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "no DEEPSEEK_API_KEY" }, { status: 500 });

  const supabase = createServiceRoleSupabaseClient();
  const { data: issues, error } = await supabase
    .from("issues")
    .select("title,body,progressive,conservative")
    .not("body", "is", null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const existingKeys = Object.keys(GLOSSARY);
  const allNew = new Map<string, string>();
  const failures: number[] = [];

  for (let i = 0; i < issues.length; i++) {
    const issue = issues[i];
    const text = [issue.title, issue.body, issue.progressive, issue.conservative]
      .filter(Boolean)
      .join("\n\n")
      .slice(0, 3000);

    try {
      const terms = await extractTerms(text, [...existingKeys, ...allNew.keys()], apiKey);
      for (const t of terms) {
        if (t.term && t.definition && !existingKeys.includes(t.term)) {
          allNew.set(t.term, t.definition);
        }
      }
    } catch {
      failures.push(i + 1);
    }

    await sleep(200);
  }

  const newTerms = [...allNew.entries()].map(([term, definition]) => ({ term, definition }));

  return NextResponse.json({
    existing: existingKeys.length,
    issues_processed: issues.length,
    failures,
    new_terms: newTerms,
    glossary_patch: newTerms
      .map(({ term, definition }) => `  "${term}": "${definition.replace(/"/g, '\\"')}",`)
      .join("\n"),
  });
}

async function extractTerms(
  text: string,
  existingKeys: string[],
  apiKey: string,
): Promise<{ term: string; definition: string }[]> {
  const res = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages: [
        {
          role: "system",
          content: `당신은 정치 리터러시 플랫폼의 용어 사전 편집자입니다.
주어진 텍스트에서 중학생 수준의 독자가 모를 수 있는 정치·법률·경제 용어를 추출하세요.

규칙:
- 아래 제외 목록의 용어는 절대 포함하지 마세요
- 고유명사(인명, 지명, 특정 법안명)는 제외
- 설명은 2문장 이내, 쉬운 한국어
- JSON 배열만 반환. 다른 텍스트 없음

형식: [{"term": "용어", "definition": "설명"}]

제외 목록: ${existingKeys.join(", ")}`,
        },
        {
          role: "user",
          content: `다음 텍스트에서 용어를 추출하세요:\n\n${text}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    }),
  });

  if (!res.ok) throw new Error(`DeepSeek ${res.status}`);

  const data = await res.json() as { choices?: Array<{ message?: { content?: string | null } }> };
  const content = data.choices?.[0]?.message?.content ?? "";

  try {
    const match = content.match(/\[[\s\S]*\]/);
    if (!match) return [];
    return JSON.parse(match[0]) as { term: string; definition: string }[];
  } catch {
    return [];
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

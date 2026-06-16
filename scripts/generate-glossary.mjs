/**
 * 이슈 본문에서 어려운 용어를 DeepSeek으로 추출해 glossary.ts를 업데이트합니다.
 * 실행: node scripts/generate-glossary.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// ── .env.local 파싱 ──────────────────────────────────────────────────────────
function loadEnv() {
  const envPath = path.join(ROOT, ".env.local");
  const raw = fs.readFileSync(envPath, "utf-8");
  for (const line of raw.split("\n")) {
    const match = line.match(/^([^#=\s]+)\s*=\s*(.*)$/);
    if (match) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  }
}

// ── 기존 glossary.ts에서 키 추출 ─────────────────────────────────────────────
function loadExistingKeys() {
  const glossaryPath = path.join(ROOT, "src/lib/glossary.ts");
  const src = fs.readFileSync(glossaryPath, "utf-8");
  const keys = [];
  const regex = /"([^"]+)":\s*"/g;
  let m;
  while ((m = regex.exec(src)) !== null) keys.push(m[1]);
  return keys;
}

// ── Supabase에서 이슈 본문 fetch ─────────────────────────────────────────────
async function fetchIssueBodies(supabaseUrl, serviceKey) {
  const res = await fetch(
    `${supabaseUrl}/rest/v1/issues?select=title,body,progressive,conservative`,
    {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
      },
    }
  );
  if (!res.ok) throw new Error(`Supabase fetch failed: ${res.status}`);
  return await res.json();
}

// ── DeepSeek 호출 ─────────────────────────────────────────────────────────────
async function extractTerms(text, existingKeys, apiKey, model, baseUrl) {
  const systemPrompt = `당신은 정치 리터러시 플랫폼의 용어 사전 편집자입니다.
주어진 텍스트에서 중학생 수준의 독자가 모를 수 있는 정치·법률·경제 용어를 추출하세요.

규칙:
- 이미 있는 용어(아래 목록)는 절대 포함하지 마세요
- 고유명사(인명, 지명, 법안명)는 제외
- 설명은 2문장 이내, 쉬운 한국어, 실생활 예시 포함 가능
- JSON 배열만 반환. 다른 텍스트 없음

형식: [{"term": "용어", "definition": "설명"}]

이미 있는 용어 (제외 목록):
${existingKeys.join(", ")}`;

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `다음 텍스트에서 용어를 추출하세요:\n\n${text}` },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`DeepSeek error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content ?? "";

  try {
    const match = content.match(/\[[\s\S]*\]/);
    if (!match) return [];
    return JSON.parse(match[0]);
  } catch {
    console.warn("JSON 파싱 실패:", content.slice(0, 200));
    return [];
  }
}

// ── glossary.ts 업데이트 ──────────────────────────────────────────────────────
function updateGlossaryFile(newTerms) {
  const glossaryPath = path.join(ROOT, "src/lib/glossary.ts");
  let src = fs.readFileSync(glossaryPath, "utf-8");

  const insertLines = newTerms
    .map(({ term, definition }) => {
      const escaped = definition.replace(/"/g, '\\"');
      return `  "${term}": "${escaped}",`;
    })
    .join("\n");

  // }; 바로 앞에 삽입
  src = src.replace(/^};$/m, `\n  // AI 자동 추출\n${insertLines}\n};`);
  fs.writeFileSync(glossaryPath, src, "utf-8");
}

// ── main ──────────────────────────────────────────────────────────────────────
async function main() {
  loadEnv();

  const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
  const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL ?? "deepseek-chat";
  const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com";
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!DEEPSEEK_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error("필요한 환경변수가 없습니다.");
  }

  console.log("📚 기존 용어 로드 중...");
  const existingKeys = loadExistingKeys();
  console.log(`   ${existingKeys.length}개 기존 용어`);

  console.log("📰 이슈 본문 fetch 중...");
  const issues = await fetchIssueBodies(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  console.log(`   ${issues.length}개 이슈`);

  const allNew = new Map();

  for (let i = 0; i < issues.length; i++) {
    const issue = issues[i];
    const text = [issue.title, issue.body, issue.progressive, issue.conservative]
      .filter(Boolean)
      .join("\n\n")
      .slice(0, 3000); // 토큰 절약

    process.stdout.write(`\r⚙️  이슈 처리 중... ${i + 1}/${issues.length}`);

    try {
      const terms = await extractTerms(
        text,
        [...existingKeys, ...allNew.keys()],
        DEEPSEEK_API_KEY,
        DEEPSEEK_MODEL,
        DEEPSEEK_BASE_URL
      );
      for (const t of terms) {
        if (t.term && t.definition && !existingKeys.includes(t.term)) {
          allNew.set(t.term, t.definition);
        }
      }
    } catch (e) {
      console.warn(`\n⚠️  이슈 ${i + 1} 실패:`, e.message);
    }

    // rate limit 방지
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log(`\n\n✅ 새 용어 ${allNew.size}개 추출:`);
  for (const [term, def] of allNew) {
    console.log(`   • ${term}: ${def.slice(0, 50)}...`);
  }

  if (allNew.size > 0) {
    updateGlossaryFile([...allNew.entries()].map(([term, definition]) => ({ term, definition })));
    console.log("\n📝 glossary.ts 업데이트 완료");
  } else {
    console.log("\n새로 추가할 용어가 없습니다.");
  }
}

main().catch((e) => {
  console.error("오류:", e);
  process.exit(1);
});

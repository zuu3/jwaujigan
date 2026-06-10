/**
 * 전국 구시군의원·시도의원 선거구 맵핑 빌드 스크립트
 *
 * 실행 방법:
 *   1. law.go.kr DRF API 키 등록 (https://open.law.go.kr/LSO/main.do)
 *   2. 서버 IP/도메인 등록 후 OC 코드 발급
 *   3. LAW_OC_CODE 환경변수 설정 후 실행:
 *      LAW_OC_CODE=your_code node scripts/build-local-election-map.mjs
 *
 * 또는 수동으로 조례 텍스트를 파싱하여 src/lib/districts/local-election-map.json 작성:
 *
 * 형식:
 * {
 *   "부산광역시": {
 *     "가야제1동": { "local": "부산진구나선거구", "provincial": "부산진구제1선거구" },
 *     "가야제2동": { "local": "부산진구나선거구", "provincial": "부산진구제1선거구" }
 *   }
 * }
 *
 * 데이터 출처:
 * - law.go.kr 자치법규 → "{구이름} 의회의원 지역선거구획정 조례" 검색
 * - 각 조례 본문에서 선거구별 읍면동 목록 추출
 */

import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OC = process.env.LAW_OC_CODE;

if (!OC) {
  console.error('LAW_OC_CODE 환경변수를 설정하세요.');
  console.error('law.go.kr에서 API 키를 발급받으세요: https://open.law.go.kr/LSO/main.do');
  process.exit(1);
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { rejectUnauthorized: false }, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve({ raw: data });
        }
      });
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function searchOrdinances(query) {
  const url = `https://www.law.go.kr/DRF/lawSearch.do?OC=${OC}&target=ordin&type=JSON&query=${encodeURIComponent(query)}&display=100&page=1`;
  return fetchJson(url);
}

async function getOrdinanceDetail(lsiSeq) {
  const url = `https://www.law.go.kr/DRF/lawService.do?OC=${OC}&target=ordin&type=JSON&lsiSeq=${lsiSeq}`;
  return fetchJson(url);
}

// 조례 본문에서 선거구→동 맵핑 파싱
function parseOrdinanceText(text) {
  const result = {};
  // 선거구 절 패턴: "제X선거구(가선거구)" 또는 "가선거구:" 다음에 동 목록
  const sggPattern = /([가나다라마바사아자차카타파하]선거구)[^:：\n]*[:：]([^제가나다라마바사아자차카타파하]+)/g;
  let m;
  while ((m = sggPattern.exec(text)) !== null) {
    const sggSuffix = m[1]; // "가선거구"
    const dongList = m[2];
    const dongs = dongList.split(/[,，·\s]+/).map((d) => d.trim()).filter((d) => d.endsWith('동') || d.endsWith('읍') || d.endsWith('면') || d.endsWith('리'));
    for (const dong of dongs) {
      result[dong] = sggSuffix;
    }
  }
  return result;
}

async function main() {
  const map = {};

  // 구시군의원 선거구획정 조례 검색
  const keywords = ['의회의원 지역선거구획정', '의원 지역선거구획정'];

  for (const keyword of keywords) {
    console.log(`검색 중: ${keyword}`);
    const searchResult = await searchOrdinances(keyword);

    if (!searchResult?.LawSearch?.law) {
      console.log('결과 없음 또는 오류');
      continue;
    }

    for (const law of searchResult.LawSearch.law) {
      const { lsiSeq, lsNm, orgNm } = law;
      if (!lsiSeq || !orgNm) continue;

      console.log(`  처리 중: ${orgNm} - ${lsNm}`);

      const detail = await getOrdinanceDetail(lsiSeq);
      if (!detail?.LawService?.body) continue;

      const parsed = parseOrdinanceText(detail.LawService.body);
      if (Object.keys(parsed).length === 0) continue;

      // orgNm에서 시도 추출 (e.g., "부산광역시 부산진구" → 시도: "부산광역시")
      const parts = orgNm.split(' ');
      const sdName = parts[0];

      if (!map[sdName]) map[sdName] = {};

      for (const [dong, sggSuffix] of Object.entries(parsed)) {
        // 구이름 추출 (e.g., "부산진구가선거구" → "부산진구")
        const guName = orgNm.replace(/^[^\s]+\s/, '').replace(/의회.*$/, '').trim();
        map[sdName][dong] = {
          ...(map[sdName][dong] || {}),
          local: `${guName}${sggSuffix}`,
        };
      }
    }
  }

  const outputPath = path.join(__dirname, '../src/lib/districts/local-election-map.json');
  fs.writeFileSync(outputPath, JSON.stringify(map, null, 2));
  console.log(`\n완료. ${outputPath}에 저장됨.`);
  console.log(`총 ${Object.values(map).reduce((acc, v) => acc + Object.keys(v).length, 0)}개 동 맵핑 생성.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

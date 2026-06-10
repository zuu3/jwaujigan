/**
 * law.go.kr 자치법규 별표2 스크래핑
 * 시도단위 의회의원 선거구 조례 → 동→선거구 맵핑 추출
 * 실행: node scripts/scrape-local-election-map.mjs
 */

import pkg from '/Users/juhyun/Desktop/프로젝트/jwj/jwaujigan/node_modules/.pnpm/playwright@1.59.1/node_modules/playwright/index.js';
const { chromium } = pkg;
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT = path.join(__dirname, '../src/lib/districts/local-election-map.json');

// 시도별 lsiSeq (law.go.kr 자치법규)
// 시도단위 조례 1개에 해당 시도 전체 구·군 선거구 수록
const PROVINCES = {
  '강원특별자치도': 2127433,
  '경기도': 1705363,
  '경상남도': 2127205,
  '경상북도': 2127099,
  '광주광역시': 2127051,
  '대구광역시': 2127075,
  '대전광역시': 2127079,
  '부산광역시': 2127997,
  '서울특별시': 2127439,
  '세종특별자치시': 2128475,
  '울산광역시': 2128277,
  '인천광역시': 1703197,
  '전라남도': 2127093,
  '전북특별자치도': 2127207,
  '제주특별자치도': 2127965,
  '충청남도': 2128589,
  '충청북도': 2127089,
};

/** Synap viewer XML에서 단락 배열 추출 */
function extractParagraphsFromXml(xml) {
  const paragraphs = [];
  const paraRe = /<paragraph[^>]*>([\s\S]*?)<\/paragraph>/g;
  let pm;
  while ((pm = paraRe.exec(xml)) !== null) {
    const textRe = /<text[^>]*>([^<]*)<\/text>/g;
    let para = '';
    let tm;
    while ((tm = textRe.exec(pm[1])) !== null) {
      para += tm[1];
    }
    const t = para.trim();
    if (t) paragraphs.push(t);
  }
  return paragraphs;
}

/** 커리쿼트 제거 + 공백 정규화 */
function normalizePara(text) {
  // eslint-disable-next-line no-misleading-character-class
  return text.replace(/[“”‘’”]/g, ‘’).trim();
}

/** 동 이름인지 확인 */
function isDongLine(text) {
  return /[동읍면리]/.test(text) && /[가-힣]/.test(text);
}

/** 동 문자열에서 개별 동/읍/면 이름 추출 */
function extractDongs(text) {
  // 괄호 안 리 단위 제거 ("흥해읍(매산리, 북송리,...)" → "흥해읍")
  const clean = text.replace(/\([^)]*\)/g, '');
  return clean
    .split(/[,，·]\s*/)
    .map(d => d.trim().replace(/\s+/g, ''))
    .filter(d => /[동읍면리]/.test(d) && d.length >= 2 && /[가-힣]/.test(d));
}

/**
 * 단락에서 선거구명 추출
 * 반환: { sggName, wiw } 또는 null
 *
 * 지원 포맷:
 *   "부산진구가선거구"           → fullSggRe
 *   "가선거구" / "가 선거구"     → abbrevSggRe (currentWiw 필요)
 *   "중구 가선거구"              → districtLetterRe (공백 있는 전체명)
 *   "중구 가 선거구"             → districtLetterRe (공백 포함)
 *   "포항시가선거구" (따옴표 제거 후) → fullSggRe
 *   "천안시 가" (따옴표 제거 후)  → districtLetterAloneRe
 */
function extractSggInfo(para, currentWiw) {
  const p = normalizePara(para);

  // 패턴1: 구이름+선거구 붙음 — "부산진구가선거구", "포항시가선거구"
  const m1 = /^([가-힣]+)([가나다라마바사아자차카타파하]선거구)$/.exec(p);
  if (m1) return { sggName: p, wiw: m1[1] };

  // 패턴2: 구이름+공백+글자+[공백]선거구 — "중구 가선거구", "중구 가 선거구"
  const m2 = /^([가-힣]+(?:구|군|시|읍))\s+([가나다라마바사아자차카타파하])\s*선거구$/.exec(p);
  if (m2) return { sggName: m2[1] + m2[2] + '선거구', wiw: m2[1] };

  // 패턴3: 구이름+공백+글자만 (따옴표 제거 후 "천안시 가") — 선거구 단어 없음
  const m3 = /^([가-힣]+(?:구|군|시|읍))\s+([가나다라마바사아자차카타파하])$/.exec(p);
  if (m3) return { sggName: m3[1] + m3[2] + '선거구', wiw: m3[1] };

  // 패턴4: 글자만 — "가선거구", "가 선거구"
  const m4 = /^([가나다라마바사아자차카타파하])\s*선거구$/.exec(p);
  if (m4) return { sggName: (currentWiw ?? '') + m4[1] + '선거구', wiw: currentWiw };

  return null;
}

// 표 헤더에서 districtRe 오매칭되는 단어 제외
const DISTRICT_HEADER_WORDS = new Set(['지역구', '선거구']);

/** 단락 배열에서 선거구→동 맵핑 파싱 */
function parseSggMappings(paragraphs) {
  const result = {};
  const districtRe = /^[가-힣]+(구|군|시|읍)$/;

  let currentSgg = null;
  let currentWiw = null;

  for (const para of paragraphs) {
    const p = para.trim();
    const pNorm = normalizePara(p);
    // 공백 제거 버전 — "동  구" 같은 표 셀 처리
    const pCompact = pNorm.replace(/\s+/g, '');

    // 선거구명 감지
    const sggInfo = extractSggInfo(p, currentWiw);
    if (sggInfo) {
      currentSgg = sggInfo.sggName;
      if (sggInfo.wiw) currentWiw = sggInfo.wiw;
      continue;
    }

    // 구/군/시/읍 이름 → currentWiw 갱신 (헤더 단어 제외)
    if (districtRe.test(pCompact) && !DISTRICT_HEADER_WORDS.has(pCompact)) {
      currentWiw = pCompact;
      continue;
    }

    // 동 목록
    if (currentSgg && isDongLine(pNorm)) {
      for (const dong of extractDongs(pNorm)) {
        if (!result[dong]) result[dong] = {};
        result[dong].local = currentSgg;
      }
    }
  }

  return result;
}

/** lsiSeq로 조례 로드 → bylInfoDiv DOM 파싱 → 선거구 관련 bylSeq 반환 */
async function getBylSeqForSgg(page, lsiSeq) {
  // ordinViewAll 호출 (ordinSc.do 페이지에서 정의됨)
  await page.evaluate((seq) => {
    if (typeof ordinViewAll === 'function') {
      ordinViewAll(seq, 'dummy', '', 'ELIS');
    }
  }, String(lsiSeq));

  await page.waitForTimeout(3000);

  // DOM에서 bylInfoDiv 링크 수집
  const bylLinks = await page.evaluate(() => {
    const links = document.querySelectorAll('[onclick*="bylInfoDiv"]');
    return [...links].map(el => ({
      onclick: el.getAttribute('onclick') ?? '',
      text: el.textContent.trim(),
    }));
  });

  if (bylLinks.length === 0) return null;

  // "선거구" 포함 별표 우선, 없으면 마지막 별표
  const sggLink = bylLinks.find(l => l.text.includes('선거구')) ?? bylLinks[bylLinks.length - 1];
  const seqMatch = sggLink.onclick.match(/\(.*?(\d+)/);
  return seqMatch ? seqMatch[1] : null;
}

/** bylSeq → bylFlSeq + xmlBasePath */
async function getBylViewerInfo(page, bylSeq) {
  const bylHtml = await page.evaluate(async (bSeq) => {
    const resp = await fetch(`/LSW/ordinBylContentsInfoR.do?bylSeq=${bSeq}&gubun=ELIS`);
    return await resp.text();
  }, bylSeq);

  // bylFlSeq는 iframe id 또는 bylFlSeq 파라미터에서 추출
  const flMatch = bylHtml.match(/bylFlSeq[='"&]+(\d{7,})/) ?? bylHtml.match(/fancybox-frame(\d{7,})/);
  if (!flMatch) return null;
  const bylFlSeq = flMatch[1];

  const viewerJson = await page.evaluate(async (flSeq) => {
    const resp = await fetch(`/LSW/ordinBylViewerLinkR.do?bylFlSeq=${flSeq}&gubun=ELIS`);
    return await resp.text();
  }, bylFlSeq);

  let viewerFlUrl = null;
  try {
    viewerFlUrl = JSON.parse(viewerJson).viewerFlUrl;
  } catch {
    const urlM = viewerJson.match(/"viewerFlUrl"\s*:\s*"([^"]+)"/);
    viewerFlUrl = urlM?.[1] ?? null;
  }
  if (!viewerFlUrl) return null;

  // /NCIS/LIC/FILES/BYL/... → /BYL/...
  const xmlBasePath = viewerFlUrl.replace('/NCIS/LIC/FILES', '');
  return { bylSeq, bylFlSeq, xmlBasePath };
}

/** viewerPath의 모든 thumbnailxml 페이지의 단락 배열 수집 */
async function fetchAllParagraphs(page, xmlBasePath) {
  const allParagraphs = [];
  for (let i = 0; i <= 30; i++) {
    const xml = await page.evaluate(async ({ basePath, pn }) => {
      const r = await fetch(`https://www.law.go.kr/viewer${basePath}/thumbnailxml/${pn}.xml`);
      if (r.status !== 200) return null;
      return await r.text();
    }, { basePath: xmlBasePath, pn: i });
    if (!xml) break;
    allParagraphs.push(...extractParagraphsFromXml(xml));
  }
  return allParagraphs;
}

async function processProvince(page, sdName, lsiSeq) {
  console.log(`\n[${sdName}] lsiSeq=${lsiSeq}`);
  await page.waitForTimeout(600);

  const bylSeq = await getBylSeqForSgg(page, lsiSeq);
  if (!bylSeq) {
    console.log('  [skip] bylSeq not found in DOM');
    return null;
  }
  console.log(`  bylSeq=${bylSeq}`);

  const viewerInfo = await getBylViewerInfo(page, bylSeq);
  if (!viewerInfo) {
    console.log('  [skip] viewerInfo not found');
    return null;
  }
  console.log(`  xmlBasePath=${viewerInfo.xmlBasePath}`);

  const paragraphs = await fetchAllParagraphs(page, viewerInfo.xmlBasePath);
  const dongMap = parseSggMappings(paragraphs);
  const count = Object.keys(dongMap).length;
  console.log(`  → ${count}개 동 맵핑`);

  return count > 0 ? dongMap : null;
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // ordinSc.do 초기화 (ordinViewAll 함수 로드됨)
  await page.goto('https://www.law.go.kr/LSW/ordinSc.do?menuId=2&schtype=0&nwYn=1');
  await page.waitForTimeout(4000);

  const map = {};

  for (const [sdName, lsiSeq] of Object.entries(PROVINCES)) {
    try {
      const dongMap = await processProvince(page, sdName, lsiSeq);
      if (dongMap) {
        map[sdName] = dongMap;
        fs.writeFileSync(OUTPUT, JSON.stringify(map, null, 2));
        console.log(`  ✓ 저장`);
      }
    } catch (err) {
      console.error(`  [error] ${sdName}: ${err.message}`);
    }
  }

  await browser.close();

  const total = Object.values(map).reduce((s, v) => s + Object.keys(v).length, 0);
  console.log(`\n=== 완료 ===`);
  console.log(`${Object.keys(map).length}개 시도, ${total}개 동 맵핑`);
  console.log(`저장: ${OUTPUT}`);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});

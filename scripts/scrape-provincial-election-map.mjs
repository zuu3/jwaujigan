import https from 'node:https';
import fs from 'node:fs';

const BASE_XML = 'https://www.law.go.kr/viewer/BYL/LS/2026/04/0017252026042921609/SKIN/163897925/thumbnailxml';
const OUTPUT = '/Users/juhyun/Desktop/프로젝트/jwj/jwaujigan/src/lib/districts/local-election-map.json';

const PROVINCE_KEYS = {
  '서울특별시의회의원': '서울특별시',
  '부산광역시의회의원': '부산광역시',
  '대구광역시의회의원': '대구광역시',
  '인천광역시의회의원': '인천광역시',
  '광주광역시의회의원': '광주광역시',
  '대전광역시의회의원': '대전광역시',
  '울산광역시의회의원': '울산광역시',
  '세종특별자치시의회의원': '세종특별자치시',
  '경기도의회의원': '경기도',
  '강원특별자치도의회의원': '강원특별자치도',
  '충청북도의회의원': '충청북도',
  '충청남도의회의원': '충청남도',
  '전북특별자치도의회의원': '전북특별자치도',
  '전라남도의회의원': '전라남도',
  '경상북도의회의원': '경상북도',
  '경상남도의회의원': '경상남도',
  '제주특별자치도의회의원': '제주특별자치도',
  '전남광주통합특별시의회의원': '전남광주통합특별시',
};

function fetchOnce(pn) {
  return new Promise((resolve, reject) => {
    https.get(`${BASE_XML}/${pn}.xml`, {
      rejectUnauthorized: false,
      headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://www.law.go.kr' }
    }, r => {
      if (r.statusCode === 404) { resolve(null); return; }
      if (r.statusCode !== 200) { reject(new Error(`HTTP ${r.statusCode}`)); return; }
      let b = ''; r.on('data', c => b += c); r.on('end', () => resolve(b)); r.on('error', reject);
    }).on('error', reject);
  });
}

// 일시 오류로 페이지 누락되면 그 뒤 전체가 잘리므로 3회 재시도
async function fetchXml(pn) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try { return await fetchOnce(pn); }
    catch { await new Promise(r => setTimeout(r, 1500)); }
  }
  throw new Error(`page ${pn}: fetch failed after 3 retries`);
}

const COL_SPLIT = 170;
function extractColumnRows(xml) {
  const textRe = /<text[^>]*l='([\d.]+)'[^>]*t='([\d.]+)'[^>]*>([^<]*)<\/text>/g;
  const chars = []; let m;
  while ((m = textRe.exec(xml)) !== null) {
    const ch = m[3]; if (!ch.trim()) continue;
    chars.push({ l: parseFloat(m[1]), t: parseFloat(m[2]), ch });
  }
  if (!chars.length) return [];
  chars.sort((a, b) => a.t - b.t || a.l - b.l);
  const yGroups = []; let cur = [chars[0]];
  for (let i = 1; i < chars.length; i++) {
    if (Math.abs(chars[i].t - cur[0].t) <= 4) cur.push(chars[i]);
    else { yGroups.push(cur); cur = [chars[i]]; }
  }
  yGroups.push(cur);
  return yGroups.map(g => {
    const sorted = g.sort((a, b) => a.l - b.l);
    const left = sorted.filter(c => c.l < COL_SPLIT).map(c => c.ch).join('');
    // dead zone(170~180) 글자도 right에 포함 — '숭인제1동'의 '숭' 누락 방지
    const right = sorted.filter(c => c.l >= COL_SPLIT).map(c => c.ch).join('');
    const all = sorted.map(c => c.ch).join('');
    return { left: left.trim(), right: right.trim(), all: all.trim() };
  }).filter(r => r.left || r.right);
}

function detectProvince(t) {
  const s = t.replace(/\s+/g, '');
  for (const [key, prov] of Object.entries(PROVINCE_KEYS)) if (s.includes(key)) return prov;
  return null;
}

function isValidDong(text) {
  if (!text || text.length < 2) return false;
  if (!/[가-힣]/.test(text)) return false;
  if (text.includes('의원') || text.includes('의회') || text.includes('지역구')) return false;
  if (!/[동읍면리]/.test(text)) return false;
  return true;
}

const DONG_CHAR = '[가-힣\\d‧]+?';
function splitAtDongBoundary(text) {
  if (!text || !/[동읍면리]/.test(text)) return [];
  const re = new RegExp(`${DONG_CHAR}(?:동|읍|면|리)(?=[가-힣‧]|$)`, 'g');
  const results = []; let mm;
  while ((mm = re.exec(text)) !== null) {
    const d = mm[0];
    if (d.length >= 2 && /[가-힣]/.test(d)) results.push(d);
  }
  return results.length > 0 ? results : (text.length >= 2 ? [text] : []);
}

function extractDongs(text) {
  if (!text) return [];
  const clean = text.replace(/\([^)]*\)/g, '');
  const parts = clean.split(/[,，·]+/);
  const dongs = [];
  for (const part of parts) {
    const p = part.trim().replace(/\s+/g, '').replace(/[^가-힣\d‧]+$/, '');
    if (!p) continue;
    const split = splitAtDongBoundary(p);
    dongs.push(...split.filter(isValidDong));
    if (isValidDong(p) && !split.includes(p) && p.length <= 8 && split.length <= 1) dongs.push(p);
  }
  return dongs;
}

const ODL = '․'; const HPT = '‧';
const GU_PREFIX_RE = /^[가-힣]+?(구|군|시)/;
function stripGuPrefix(dong) { const m = GU_PREFIX_RE.exec(dong); return m ? dong.slice(m[0].length) : dong; }

function compoundVariants(dong) {
  if (!/^[가-힣]+[동읍면리]$/.test(dong)) return [];
  const core = dong.slice(0, -1), terminal = dong.slice(-1);
  if (core.length < 3 || core.length > 10) return [];
  const results = new Set();
  for (let i = 1; i < core.length; i++) results.add(core.slice(0, i) + HPT + core.slice(i) + terminal);
  for (let i = 1; i < core.length - 1; i++)
    for (let j = i + 1; j < core.length; j++)
      results.add(core.slice(0,i) + HPT + core.slice(i,j) + HPT + core.slice(j) + terminal);
  return [...results];
}

function dongVariants(dong) {
  const vs = new Set([dong]);
  const toODL = s => s.replace(/[.‧]/g, ODL);
  const toDot = s => s.replace(/[.․‧]/g, '.');
  const toHPT = s => s.replace(/[.․]/g, HPT);
  vs.add(toODL(dong)); vs.add(toDot(dong)); vs.add(toHPT(dong));
  const noJe = dong.replace(/제(\d)/g, '$1');
  vs.add(noJe); vs.add(toODL(noJe)); vs.add(toDot(noJe)); vs.add(toHPT(noJe));
  vs.add(noJe.replace(/([가-힣])(\d)/g, '$1제$2'));
  vs.add(dong.replace(/([가-힣])(\d)/g, '$1제$2'));
  const dot2 = dong.replace(/(\d)(\d)(?=[동읍면리가])/g, '$1.$2');
  const odl2 = dong.replace(/(\d)(\d)(?=[동읍면리가])/g, `$1${ODL}$2`);
  const hpt2 = dong.replace(/(\d)(\d)(?=[동읍면리가])/g, `$1${HPT}$2`);
  vs.add(dot2); vs.add(odl2); vs.add(hpt2);
  vs.add(dot2.replace(/제(\d)/g, '$1')); vs.add(odl2.replace(/제(\d)/g, '$1'));
  const hptAfterDigit = dong.replace(/(\d)([가-힣])/g, `$1${HPT}$2`);
  vs.add(hptAfterDigit); vs.add(hptAfterDigit.replace(/([가-힣])(\d)/g, '$1제$2'));
  const allDigitHpt = dong.replace(/(\d)(?=\d)/g, `$1${HPT}`);
  vs.add(allDigitHpt); vs.add(dong.replace(/(\d)(?=\d)/g, `$1${ODL}`));
  vs.add(dong + '동'); vs.add(dong + '면'); vs.add(dong + '읍'); vs.add(dong + '리');
  if (/^[면읍리][가-힣]{1,}[동읍면리]$/.test(dong)) vs.add(dong.slice(1));
  for (const cv of compoundVariants(dong)) vs.add(cv);
  if (/^구[가-힣\d]{2,}[동읍면리]$/.test(dong)) {
    const noQu = dong.slice(1);
    vs.add(noQu); vs.add(noQu.replace(/제(\d)/g, '$1')); vs.add(noQu.replace(/([가-힣])(\d)/g, '$1제$2'));
  }
  if (/^동[가-힣]/.test(dong)) {
    const noDong = dong.slice(1);
    vs.add(noDong); vs.add(noDong.replace(/제(\d)/g, '$1')); vs.add(noDong.replace(/([가-힣])(\d)/g, '$1제$2'));
    for (const cv of compoundVariants(noDong)) vs.add(cv);
    const noGuNd = stripGuPrefix(noDong);
    if (noGuNd !== noDong && noGuNd.length >= 2) vs.add(noGuNd);
  }
  const noDigit = dong.replace(/\d+(?=[동읍면리])/g, '');
  if (noDigit !== dong && isValidDong(noDigit)) vs.add(noDigit);
  const noGu1 = stripGuPrefix(dong);
  if (noGu1 !== dong && noGu1.length >= 2) {
    vs.add(noGu1); vs.add(toODL(noGu1)); vs.add(toDot(noGu1)); vs.add(toHPT(noGu1));
    vs.add(noGu1.replace(/제(\d)/g, '$1')); vs.add(noGu1.replace(/([가-힣])(\d)/g, '$1제$2'));
    vs.add(noGu1.replace(/(\d)([가-힣])/g, `$1${HPT}$2`));
    vs.add(noGu1 + '동'); vs.add(noGu1 + '면');
    for (const cv of compoundVariants(noGu1)) vs.add(cv);
    if (/^[면읍리][가-힣]{1,}[동읍면리]$/.test(noGu1)) vs.add(noGu1.slice(1));
    const noGu2 = stripGuPrefix(noGu1);
    if (noGu2 !== noGu1 && noGu2.length >= 2) {
      vs.add(noGu2); vs.add(toODL(noGu2)); vs.add(toDot(noGu2)); vs.add(toHPT(noGu2));
      vs.add(noGu2.replace(/제(\d)/g, '$1')); vs.add(noGu2.replace(/([가-힣])(\d)/g, '$1제$2'));
      vs.add(noGu2 + '동'); vs.add(noGu2 + '면');
      for (const cv of compoundVariants(noGu2)) vs.add(cv);
    }
  }
  return [...vs];
}

// 새 sgg 시작인지 판단
function isNewSgg(leftC) {
  if (!leftC) return false;
  if (leftC === '선거구') return false; // '선거구' 자체가 (군|구|시)$ 패턴에 걸리는 것 방지
  return /^[가-힣]+제\d+선거구$/.test(leftC)  // 완전한 1행 형식
    || /^[가-힣]+제\d+$/.test(leftC)           // 제N (선거구 다음행 예상)
    || /^[가-힣]+(군|구|시)$/.test(leftC);    // 보은군/강진군 형식 (선거구 다음행 예상)
}

async function run() {
  const existingMap = JSON.parse(fs.readFileSync(OUTPUT, 'utf-8'));
  // 기초의원 map 스크래핑 오염 키 제거 (동 이름이 아닌 것)
  const JUNK_KEY_RE = /선거구|의회의원|의원정수|^\d+개|개읍|개면|^\d+가?동$|^서울특별시/;
  const JUNK_EXACT = new Set(['동구', '서구', '남구', '북구', '중구']);
  let junkRemoved = 0;
  for (const dongMap of Object.values(existingMap)) {
    for (const key of Object.keys(dongMap)) {
      if (JUNK_KEY_RE.test(key) || JUNK_EXACT.has(key)) { delete dongMap[key]; junkRemoved++; }
    }
  }
  console.log(`junk keys removed: ${junkRemoved}`);
  // --fresh 플래그가 있을 때만 기존 provincial 초기화. 기본은 누적(union) 모드.
  if (process.argv.includes('--fresh')) {
    for (const dongMap of Object.values(existingMap))
      for (const entry of Object.values(dongMap)) delete entry.provincial;
  }

  console.log('Fetching...');
  const allRows = [];
  for (let pn = 0; pn <= 80; pn++) {
    const xml = await fetchXml(pn);
    if (!xml) break;
    allRows.push(...extractColumnRows(xml));
    process.stdout.write(`  page ${pn} (${allRows.length})\r`);
  }
  console.log(`\nRows: ${allRows.length}`);

  const provincialMap = {};
  let province = null, sggParts = [], rightBuf = '';

  const sggTexts = {}; // province → [{sgg, text}] (원본 우측 텍스트 보관, reverse matching용)

  function flushSgg() {
    if (sggParts.length === 0 || !province) return;
    const joined = sggParts.join('');
    if (!joined || joined === '선거구') { sggParts = []; rightBuf = ''; return; }
    const sggName = joined.replace(/(선거구)+$/, '') + '선거구'; // '선거구' 중복 push 방어
    const dongs = extractDongs(rightBuf);
    if (!provincialMap[province]) provincialMap[province] = {};
    for (const dong of dongs) provincialMap[province][dong] = sggName;
    if (!sggTexts[province]) sggTexts[province] = [];
    sggTexts[province].push({ sgg: sggName, text: rightBuf });
    sggParts = []; rightBuf = '';
  }

  for (const { left, right, all } of allRows) {
    const leftC = left.replace(/\s+/g, '');
    const rightC = right.replace(/\s+/g, '');

    const prov = detectProvince(all);
    if (prov) { flushSgg(); province = prov; sggParts = []; rightBuf = ''; continue; }
    if (!province) continue;

    if (leftC && isNewSgg(leftC)) {
      // lazy flush previous sgg before starting new one
      flushSgg();
      sggParts = [leftC];
      rightBuf = rightC;
      continue;
    }

    if (leftC === '선거구') {
      if (sggParts.length > 0) {
        sggParts.push('선거구');
        // 우측 내용 축적 (commas도 축적하지 않음)
        if (rightC && !/^[,，\s]+$/.test(rightC)) rightBuf += rightC;
        // lazy — NOT flushing here
      }
      continue;
    }

    // 기타 모든 행: sggParts가 있으면 우측 내용 축적 (commas 제외)
    if (sggParts.length > 0 && rightC && !/^[,，\s]+$/.test(rightC)) {
      rightBuf += rightC;
    }
  }
  flushSgg();

  // local 값에서 시군구명 추출 — '하남시가선거구' → '하남시'. 형식 안 맞으면 null (가드 skip)
  // 시도 내 동명 중복 오염 방지 (하남 신장1동 ↔ 오산 신장동 등)
  function localCityOf(entry) {
    const mm = /^([가-힣]+?(시|군|구))[가-힣]선거구$/.exec(entry?.local || '');
    return mm ? mm[1] : null;
  }
  // 인천 2026 구 개편: 옛 구명 → 신 구명 허용
  const CITY_RENAME = {
    '중구': ['제물포구', '영종구'],
    '동구': ['제물포구'],
    '서구': ['서구', '검단구'],
  };
  function cityGuardOk(entry, sgg) {
    const lc = localCityOf(entry);
    if (!lc) return true;
    if (sgg.startsWith(lc)) return true;
    const renames = CITY_RENAME[lc];
    if (renames && renames.some(r => sgg.startsWith(r))) return true;
    return false;
  }

  function tryMerge(target, dong, sgg) {
    for (const v of dongVariants(dong)) {
      const entry = existingMap[target]?.[v];
      if (entry && cityGuardOk(entry, sgg)) { entry.provincial = sgg; return true; }
    }
    return false;
  }

  // 통합특별시 sgg 라우팅: 광주 5개 구 prefix → 광주만, 그 외 → 전남만
  // ('동명동' 등 광주/전남 중복 동명 cross-contamination 방지)
  const GWANGJU_GU_RE = /^(동구|서구|남구|북구|광산구)/;

  let merged = 0, missed = 0;
  const missedByProv = {};
  for (const [prov, dongs] of Object.entries(provincialMap)) {
    const targets = prov === '전남광주통합특별시' ? ['광주광역시', '전라남도'] : [prov];
    for (const target of targets) {
      if (!existingMap[target]) continue;
      for (const [dong, sgg] of Object.entries(dongs)) {
        if (prov === '전남광주통합특별시') {
          const isGJ = GWANGJU_GU_RE.test(sgg);
          if (isGJ !== (target === '광주광역시')) continue;
        }
        if (tryMerge(target, dong, sgg)) merged++;
        else { missed++; if (!missedByProv[target]) missedByProv[target] = []; missedByProv[target].push(`${dong}→${sgg}`); }
      }
    }
  }

  // ===== Reverse matching pass =====
  // map의 미커버 key를 기준으로 sgg 원본 텍스트에서 substring 검색
  // normalize: ‧․. 및 '제' 제거, 괄호 내용 제거
  function norm(s) {
    return s.replace(/\([^)]*\)/g, '').replace(/[‧․.\s]/g, '').replace(/제(\d)/g, '$1');
  }

  // province별 normalized sgg texts (boundary 검색용으로 comma 유지)
  const normTexts = {};
  for (const [prov, list] of Object.entries(sggTexts)) {
    normTexts[prov] = list.map(({ sgg, text }) => ({ sgg, ntext: norm(text) }));
  }

  function reverseFind(targetProv, key, entry) {
    const sourceProvs = [];
    if (normTexts[targetProv]) sourceProvs.push(targetProv);
    if ((targetProv === '광주광역시' || targetProv === '전라남도') && normTexts['전남광주통합특별시'])
      sourceProvs.push('전남광주통합특별시');
    const base = norm(key);
    if (base.length < 2) return null;
    // 키 변형: 원형 / 면↔읍 swap (양지면→양지읍 승격) / 숫자 제거 (석수3동→석수동)
    const keyVariants = [base];
    if (base.endsWith('면')) keyVariants.push(base.slice(0, -1) + '읍');
    else if (base.endsWith('읍')) keyVariants.push(base.slice(0, -1) + '면');
    const noDig = base.replace(/\d+(?=[동읍면리])/g, '');
    if (noDig !== base && noDig.length >= 2) keyVariants.push(noDig);

    for (const nkey of keyVariants) {
      const hits = new Set();
      const looseHits = new Set();
      for (const sp of sourceProvs) {
        for (const { sgg, ntext } of normTexts[sp]) {
          // 통합특별시 텍스트는 sgg prefix로 광주/전남 라우팅
          if (sp === '전남광주통합특별시') {
            const isGJ = /^(동구|서구|남구|북구|광산구)/.test(sgg);
            if (isGJ !== (targetProv === '광주광역시')) continue;
          }
          if (entry && !cityGuardOk(entry, sgg)) continue;
          let idx = ntext.indexOf(nkey);
          let strictHit = false;
          while (idx !== -1) {
            // boundary: 시작/comma/동읍면리 종료/시군구 접두 뒤 허용 (의창구동읍)
            const before = idx === 0 ? '' : ntext[idx - 1];
            if (before === '' || before === ',' || /[동읍면리시군구]/.test(before)) {
              hits.add(sgg);
              strictHit = true;
              break;
            }
            idx = ntext.indexOf(nkey, idx + 1);
          }
          if (!strictHit && nkey.length >= 3 && ntext.includes(nkey)) looseHits.add(sgg);
        }
      }
      if (hits.size === 1) return [...hits][0];
      if (hits.size > 1) continue; // ambiguous → 다음 변형 시도
      // pass 2: boundary 무시 — '동탄구동탄1동' 같은 오분리 케이스. unique sgg만
      if (looseHits.size === 1) return [...looseHits][0];
    }
    return null;
  }

  let reverseMerged = 0;
  const stillMissing = {};
  for (const [prov, dongMap] of Object.entries(existingMap)) {
    for (const [key, entry] of Object.entries(dongMap)) {
      if (entry.provincial) continue;
      const sgg = reverseFind(prov, key, entry);
      if (sgg) { entry.provincial = sgg; reverseMerged++; }
      else { if (!stillMissing[prov]) stillMissing[prov] = []; stillMissing[prov].push(key); }
    }
  }
  console.log(`\nReverse matching: +${reverseMerged}`);

  // 수동 보정 — 자동 매핑 불가하지만 근거가 명확한 케이스
  const MANUAL_OVERRIDES = {
    // XML 원본에서 '숭' 글자 렌더 누락 (별표 종로구제2: 창신제1~3동, 숭인제1동, 숭인제2동)
    '서울특별시/숭인제1동': '종로구제2선거구',
    // 2023.7 회천3동에서 분동, 별표 미반영 — 모(母)동인 회천3동과 동일 선거구
    '경기도/회천4동': '양주시제2선거구',
  };
  for (const [pk, sgg] of Object.entries(MANUAL_OVERRIDES)) {
    const [prov, key] = pk.split('/');
    const entry = existingMap[prov]?.[key];
    if (entry && !entry.provincial) entry.provincial = sgg;
  }

  fs.writeFileSync(OUTPUT, JSON.stringify(existingMap, null, 2));

  // 미커버 목록 파일 출력
  let gapsMd = '# 시도의원 선거구 미매핑 행정동\n\n';
  gapsMd += '공직선거법 별표2 스크래핑으로 매핑하지 못한 행정동 목록.\n\n';
  for (const [prov, keys] of Object.entries(stillMissing)) {
    if (keys.length === 0) continue;
    gapsMd += `## ${prov} (${keys.length}개)\n\n${keys.map(k => `- ${k}`).join('\n')}\n\n`;
  }
  fs.writeFileSync('/tmp/provincial-gaps.md', gapsMd); // 구조적 미매핑은 src/lib/districts/PROVINCIAL_GAPS.md 참고

  let total = 0, withProv = 0;
  for (const [prov, dongMap] of Object.entries(existingMap)) {
    const tot = Object.keys(dongMap).length;
    const wp = Object.values(dongMap).filter(v => v.provincial).length;
    total += tot; withProv += wp;
    console.log(`${prov}: ${wp}/${tot} (${Math.round(wp/tot*100)}%)`);
  }
  console.log(`\n전체: ${withProv}/${total} (${Math.round(withProv/total*100)}%)`);
  console.log(`병합 ${merged}, 미매칭 ${missed}`);
  for (const [p, ms] of Object.entries(missedByProv)) {
    if (ms.length > 0) console.log(`\n[${p}] 미매칭 ${ms.length}개:`, ms.slice(0,6).join(', '));
  }
}
run().catch(e => { console.error(e); process.exit(1); });

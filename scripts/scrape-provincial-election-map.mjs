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

function fetchXml(pn) {
  return new Promise((resolve, reject) => {
    https.get(`${BASE_XML}/${pn}.xml`, {
      rejectUnauthorized: false,
      headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://www.law.go.kr' }
    }, r => {
      if (r.statusCode !== 200) { resolve(null); return; }
      let b = '';
      r.on('data', c => b += c);
      r.on('end', () => resolve(b));
      r.on('error', reject);
    }).on('error', reject);
  });
}

const COL_SPLIT = 170;

function extractColumnRows(xml) {
  const textRe = /<text[^>]*l='([\d.]+)'[^>]*t='([\d.]+)'[^>]*>([^<]*)<\/text>/g;
  const chars = [];
  let m;
  while ((m = textRe.exec(xml)) !== null) {
    const ch = m[3];
    if (!ch.trim()) continue;
    chars.push({ l: parseFloat(m[1]), t: parseFloat(m[2]), ch });
  }
  if (chars.length === 0) return [];
  chars.sort((a, b) => a.t - b.t || a.l - b.l);
  const yGroups = [];
  let cur = [chars[0]];
  for (let i = 1; i < chars.length; i++) {
    if (Math.abs(chars[i].t - cur[0].t) <= 4) cur.push(chars[i]);
    else { yGroups.push(cur); cur = [chars[i]]; }
  }
  yGroups.push(cur);
  return yGroups.map(g => {
    const sorted = g.sort((a, b) => a.l - b.l);
    const left = sorted.filter(c => c.l < COL_SPLIT).map(c => c.ch).join('');
    const right = sorted.filter(c => c.l >= COL_SPLIT + 10).map(c => c.ch).join('');
    const all = sorted.map(c => c.ch).join('');
    return { left: left.trim(), right: right.trim(), all: all.trim() };
  }).filter(r => r.left || r.right);
}

function detectProvince(t) {
  const s = t.replace(/\s+/g, '');
  for (const [key, prov] of Object.entries(PROVINCE_KEYS)) {
    if (s.includes(key)) return prov;
  }
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
  const results = [];
  let mm;
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
    // 비분리 전체도 시도 (진동면 → 진동+면, 전체도 유지)
    if (isValidDong(p) && !split.includes(p) && p.length <= 8 && split.length <= 1) dongs.push(p);
  }
  return dongs;
}

const ODL = '․'; // U+2024
const HPT = '‧'; // U+2027

const GU_PREFIX_RE = /^[가-힣]+?(구|군|시)/; // 비탐욕 (전주시만 제거)

function stripGuPrefix(dong) {
  const m = GU_PREFIX_RE.exec(dong);
  return m ? dong.slice(m[0].length) : dong;
}

// 순수 한글 + 단말 패턴 동명에 ‧ 삽입 변형 생성
function compoundVariants(dong) {
  if (!/^[가-힣]+[동읍면리]$/.test(dong)) return [];
  const core = dong.slice(0, -1);
  const terminal = dong.slice(-1);
  if (core.length < 3 || core.length > 10) return [];
  const results = new Set();
  for (let i = 1; i < core.length; i++) {
    results.add(core.slice(0, i) + HPT + core.slice(i) + terminal);
  }
  for (let i = 1; i < core.length - 1; i++) {
    for (let j = i + 1; j < core.length; j++) {
      results.add(core.slice(0,i) + HPT + core.slice(i,j) + HPT + core.slice(j) + terminal);
    }
  }
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

  // 연속 두 자릿수 사이 구분자
  const dot2 = dong.replace(/(\d)(\d)(?=[동읍면리가])/g, '$1.$2');
  const odl2 = dong.replace(/(\d)(\d)(?=[동읍면리가])/g, `$1${ODL}$2`);
  const hpt2 = dong.replace(/(\d)(\d)(?=[동읍면리가])/g, `$1${HPT}$2`);
  vs.add(dot2); vs.add(odl2); vs.add(hpt2);
  vs.add(dot2.replace(/제(\d)/g, '$1')); vs.add(odl2.replace(/제(\d)/g, '$1'));

  // 숫자→한글 사이 ‧ 삽입 (봉명2송정동→봉명2‧송정동)
  const hptAfterDigit = dong.replace(/(\d)([가-힣])/g, `$1${HPT}$2`);
  vs.add(hptAfterDigit);
  vs.add(hptAfterDigit.replace(/([가-힣])(\d)/g, '$1제$2'));

  // 다자리 연속숫자 모두 ‧ 삽입 (종로1234가동→종로1‧2‧3‧4가동)
  const allDigitHpt = dong.replace(/(\d)(?=\d)/g, `$1${HPT}`);
  vs.add(allDigitHpt);
  const allDigitOdl = dong.replace(/(\d)(?=\d)/g, `$1${ODL}`);
  vs.add(allDigitOdl);

  // terminal 확장 (강동→강동동, 초읍→초읍동, 진동→진동면)
  vs.add(dong + '동'); vs.add(dong + '면'); vs.add(dong + '읍'); vs.add(dong + '리');

  // 앞 면/읍/리 단음절 prefix 제거 (면광석면→광석면, 읍남사읍→남사읍)
  if (/^[면읍리][가-힣]{1,}[동읍면리]$/.test(dong)) {
    vs.add(dong.slice(1));
  }

  // 순수 한글 복합동명 ‧ 삽입 (탑대성동→탑‧대성동)
  for (const cv of compoundVariants(dong)) vs.add(cv);

  // 비탐욕 구/시 prefix 제거 (1단계)
  const noGu1 = stripGuPrefix(dong);
  if (noGu1 !== dong && noGu1.length >= 2) {
    vs.add(noGu1); vs.add(toODL(noGu1)); vs.add(toDot(noGu1)); vs.add(toHPT(noGu1));
    vs.add(noGu1.replace(/제(\d)/g, '$1'));
    vs.add(noGu1.replace(/([가-힣])(\d)/g, '$1제$2'));
    vs.add(noGu1.replace(/(\d)([가-힣])/g, `$1${HPT}$2`));
    vs.add(noGu1 + '동'); vs.add(noGu1 + '면');
    for (const cv of compoundVariants(noGu1)) vs.add(cv);
    if (/^[면읍리][가-힣]{2,}[동읍면리]$/.test(noGu1)) vs.add(noGu1.slice(1));
    // 2단계
    const noGu2 = stripGuPrefix(noGu1);
    if (noGu2 !== noGu1 && noGu2.length >= 2) {
      vs.add(noGu2); vs.add(toODL(noGu2)); vs.add(toDot(noGu2)); vs.add(toHPT(noGu2));
      vs.add(noGu2.replace(/제(\d)/g, '$1'));
      vs.add(noGu2.replace(/([가-힣])(\d)/g, '$1제$2'));
      vs.add(noGu2 + '동'); vs.add(noGu2 + '면');
      for (const cv of compoundVariants(noGu2)) vs.add(cv);
    }
  }


  // single 구 prefix 제거 (고양시 일산동구 dongs)
  if (/^구[가-힣\d]{2,}[동읍면리]$/.test(dong)) {
    const noQu = dong.slice(1);
    vs.add(noQu);
    vs.add(noQu.replace(/제(\d)/g, '$1'));
    vs.add(noQu.replace(/([가-힣])(\d)/g, '$1제$2'));
  }

  // leading '동' prefix 제거 (동하단제1동→하단제1동, 동효문동→효문동)
  if (/^동[가-힣]/.test(dong)) {
    const noDong = dong.slice(1);
    vs.add(noDong);
    vs.add(noDong.replace(/제(\d)/g, '$1'));
    vs.add(noDong.replace(/([가-힣])(\d)/g, '$1제$2'));
    for (const cv of compoundVariants(noDong)) vs.add(cv);
    // also strip gu prefix from the result
    const noGuNd = stripGuPrefix(noDong);
    if (noGuNd !== noDong && noGuNd.length >= 2) vs.add(noGuNd);
  }

  // 숫자 없는 버전 (운서1동→운서동, 화수1동→화수동)
  const noDigit = dong.replace(/\d+(?=[동읍면리])/g, '');
  if (noDigit !== dong && isValidDong(noDigit)) vs.add(noDigit);

  return [...vs];
}

async function run() {
  const existingMap = JSON.parse(fs.readFileSync(OUTPUT, 'utf-8'));
  for (const dongMap of Object.values(existingMap)) {
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

  function flushSgg() {
    if (sggParts.length === 0 || !province) return;
    const joined = sggParts.join('');
    if (!joined || joined === '선거구') { sggParts = []; rightBuf = ''; return; }
    const sggName = joined.endsWith('선거구') ? joined : joined + '선거구';
    const dongs = extractDongs(rightBuf);
    if (!provincialMap[province]) provincialMap[province] = {};
    for (const dong of dongs) provincialMap[province][dong] = sggName;
    sggParts = []; rightBuf = '';
  }

  for (const { left, right, all } of allRows) {
    const leftC = left.replace(/\s+/g, '');
    const rightC = right.replace(/\s+/g, '');
    const prov = detectProvince(all);
    if (prov) { flushSgg(); province = prov; sggParts = []; rightBuf = ''; continue; }
    if (!province) continue;
    if (leftC) {
      if (leftC === '선거구') {
        if (sggParts.length > 0) { sggParts.push('선거구'); rightBuf += rightC; flushSgg(); }
        continue;
      } else if (/^[가-힣]+제\d+선거구$/.test(leftC)) {
        flushSgg(); sggParts = [leftC]; rightBuf = rightC; flushSgg(); continue;
      } else if (/^[가-힣]+제\d+$/.test(leftC)) {
        flushSgg(); sggParts = [leftC]; rightBuf = rightC; continue;
      }
    }
    if (sggParts.length > 0 && right) rightBuf += rightC;
  }
  flushSgg();

  function tryMerge(target, dong, sgg) {
    for (const v of dongVariants(dong)) {
      if (existingMap[target]?.[v]) {
        existingMap[target][v].provincial = sgg;
        return true;
      }
    }
    return false;
  }

  let merged = 0, missed = 0;
  const missedByProv = {};
  for (const [prov, dongs] of Object.entries(provincialMap)) {
    const targets = prov === '전남광주통합특별시' ? ['광주광역시', '전라남도'] : [prov];
    for (const target of targets) {
      if (!existingMap[target]) continue;
      for (const [dong, sgg] of Object.entries(dongs)) {
        if (tryMerge(target, dong, sgg)) merged++;
        else {
          missed++;
          if (!missedByProv[target]) missedByProv[target] = [];
          missedByProv[target].push(`${dong}→${sgg}`);
        }
      }
    }
  }

  fs.writeFileSync(OUTPUT, JSON.stringify(existingMap, null, 2));

  let totalEntries = 0, withProv = 0;
  for (const [prov, dongMap] of Object.entries(existingMap)) {
    const tot = Object.keys(dongMap).length;
    const wp = Object.values(dongMap).filter(v => v.provincial).length;
    totalEntries += tot; withProv += wp;
    console.log(`${prov}: ${wp}/${tot} (${Math.round(wp/tot*100)}%)`);
  }
  console.log(`\n전체: ${withProv}/${totalEntries} (${Math.round(withProv/totalEntries*100)}%)`);
  console.log(`병합 ${merged}, 미매칭 ${missed}`);
  for (const [p, ms] of Object.entries(missedByProv)) {
    if (ms.length > 0) console.log(`\n[${p}] 미매칭 ${ms.length}개:`, ms.slice(0,8).join(', '));
  }
}
run().catch(e => { console.error(e); process.exit(1); });

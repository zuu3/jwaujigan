/**
 * 공직선거법 별표2 — 시도의원 지역선거구 → 동 맵핑 (v5 final)
 * 컬럼 경계(170px) dead zone 문제 → province 감지에 full-row 텍스트 사용
 */

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
    const all = sorted.map(c => c.ch).join(''); // province 감지용
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

function splitAtDongBoundary(text) {
  if (!text || !/[동읍면리]/.test(text)) return [];
  const results = [];
  const re = /[가-힣\d]+?(?:동|읍|면|리)(?=[가-힣]|$)/g;
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
    dongs.push(...splitAtDongBoundary(part.trim().replace(/\s+/g, '')));
  }
  return dongs;
}

const ODL = '․'; // U+2024

function dongVariants(dong) {
  const vs = new Set([dong]);
  vs.add(dong.replace(/\./g, ODL));
  vs.add(dong.replace(new RegExp(ODL, 'g'), '.'));
  const noJe = dong.replace(/제(\d)/g, '$1');
  vs.add(noJe);
  vs.add(noJe.replace(/\./g, ODL));
  vs.add(noJe.replace(new RegExp(ODL, 'g'), '.'));
  const dotBetween = dong.replace(/(\d)(\d)(?=[동읍면리가])/g, '$1.$2');
  const odlBetween = dong.replace(/(\d)(\d)(?=[동읍면리가])/g, `$1${ODL}$2`);
  vs.add(dotBetween);
  vs.add(odlBetween);
  vs.add(dotBetween.replace(/제(\d)/g, '$1'));
  vs.add(odlBetween.replace(/제(\d)/g, '$1'));
  vs.add(dong.replace(/([가-힣])(\d)/g, '$1제$2'));
  return [...vs];
}

async function run() {
  const existingMap = JSON.parse(fs.readFileSync(OUTPUT, 'utf-8'));

  for (const dongMap of Object.values(existingMap)) {
    for (const entry of Object.values(dongMap)) {
      delete entry.provincial;
    }
  }

  console.log('Fetching 공직선거법 별표2...');
  const allRows = [];
  for (let pn = 0; pn <= 80; pn++) {
    const xml = await fetchXml(pn);
    if (!xml) { console.log(`  page ${pn}: done`); break; }
    allRows.push(...extractColumnRows(xml));
    process.stdout.write(`  page ${pn} (total ${allRows.length})\r`);
  }
  console.log(`\nTotal: ${allRows.length} rows`);

  const provincialMap = {};
  let province = null;
  let sggParts = [];
  let rightBuf = '';

  function flushSgg() {
    if (sggParts.length === 0 || !province) return;
    const last = sggParts[sggParts.length - 1];
    const sggName = last.endsWith('선거구') ? sggParts.join('') : sggParts.join('') + '선거구';
    const dongs = extractDongs(rightBuf);
    if (!provincialMap[province]) provincialMap[province] = {};
    for (const dong of dongs) {
      provincialMap[province][dong] = sggName;
    }
    sggParts = [];
    rightBuf = '';
  }

  for (const { left, right, all } of allRows) {
    const leftC = left.replace(/\s+/g, '');
    const rightC = right.replace(/\s+/g, '');

    // province 감지는 전체 행 텍스트로 (dead zone 문제 해결)
    const prov = detectProvince(all);
    if (prov) {
      flushSgg();
      province = prov;
      sggParts = [];
      rightBuf = '';
      continue;
    }

    if (!province) continue;

    if (leftC) {
      if (leftC === '선거구') {
        sggParts.push('선거구');
        rightBuf += rightC;
        flushSgg();
        continue;
      } else if (/^[가-힣]+제\d+선거구$/.test(leftC)) {
        flushSgg();
        sggParts = [leftC];
        rightBuf = rightC;
        flushSgg();
        continue;
      } else if (/^[가-힣]+제\d+$/.test(leftC)) {
        flushSgg();
        sggParts = [leftC];
        rightBuf = rightC;
        continue;
      }
    }

    if (sggParts.length > 0 && right) {
      rightBuf += rightC;
    }
  }
  flushSgg();

  console.log('\n--- 결과 ---');
  let total = 0;
  for (const [prov, dongs] of Object.entries(provincialMap)) {
    const n = Object.keys(dongs).length;
    total += n;
    const sample = Object.entries(dongs).slice(0, 2).map(([d, s]) => `${d}→${s}`).join(', ');
    console.log(`${prov}: ${n}개 | ${sample}`);
  }
  console.log(`총 ${total}개 동`);

  let merged = 0, missed = 0;
  const missedList = [];

  function tryMerge(target, dong, sgg) {
    for (const v of dongVariants(dong)) {
      if (existingMap[target]?.[v]) {
        existingMap[target][v].provincial = sgg;
        merged++;
        return true;
      }
    }
    return false;
  }

  for (const [prov, dongs] of Object.entries(provincialMap)) {
    const targets = prov === '전남광주통합특별시'
      ? ['광주광역시', '전라남도']
      : [prov];
    for (const target of targets) {
      if (!existingMap[target]) continue;
      for (const [dong, sgg] of Object.entries(dongs)) {
        if (!tryMerge(target, dong, sgg)) {
          missed++;
          missedList.push(`${target}/${dong} → ${sgg}`);
        }
      }
    }
  }

  fs.writeFileSync(OUTPUT, JSON.stringify(existingMap, null, 2));
  console.log(`\n${merged}개 병합, ${missed}개 미매칭`);
  if (missedList.length > 0) {
    console.log('미매칭 샘플 (최대 30):');
    missedList.slice(0, 30).forEach(s => console.log('  ' + s));
  }

  let totalEntries = 0, withProv = 0;
  for (const dongMap of Object.values(existingMap)) {
    for (const entry of Object.values(dongMap)) {
      totalEntries++;
      if (entry.provincial) withProv++;
    }
  }
  console.log(`\n전체 커버리지: ${withProv}/${totalEntries} (${Math.round(withProv/totalEntries*100)}%)`);
}

run().catch(e => { console.error(e); process.exit(1); });

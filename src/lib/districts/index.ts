import "server-only";
import {
  DISTRICTS,
  normalizeKoreanText,
  type DistrictEntry,
} from "./catalog";

export { normalizeKoreanText } from "./catalog";

type DistrictCandidate = {
  entry: DistrictEntry;
  score: number;
  matchedArea: string | null;
};

const PROVINCE_ALIASES: Record<string, string[]> = {
  서울특별시: ["서울특별시", "서울시", "서울"],
  부산광역시: ["부산광역시", "부산시", "부산"],
  대구광역시: ["대구광역시", "대구시", "대구"],
  인천광역시: ["인천광역시", "인천시", "인천"],
  광주광역시: ["광주광역시", "광주시", "광주"],
  대전광역시: ["대전광역시", "대전시", "대전"],
  울산광역시: ["울산광역시", "울산시", "울산"],
  세종특별자치시: ["세종특별자치시", "세종시", "세종"],
  경기도: ["경기도", "경기"],
  강원특별자치도: ["강원특별자치도", "강원도", "강원"],
  충청북도: ["충청북도", "충북"],
  충청남도: ["충청남도", "충남"],
  전북특별자치도: ["전북특별자치도", "전라북도", "전북"],
  전라남도: ["전라남도", "전남"],
  경상북도: ["경상북도", "경북"],
  경상남도: ["경상남도", "경남"],
  제주특별자치도: ["제주특별자치도", "제주도", "제주"],
};

export type DistrictResolveResult = {
  district: string;
  province: string | null;
  matchedArea: string | null;
  sourceAddress: string;
};

function dedupe(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function tokenizeAddress(address: string) {
  return dedupe(
    address
      .split(/[\s,/]+/g)
      .map((token) => normalizeKoreanText(token))
      .filter(Boolean),
  );
}

function isAdministrativeAlias(alias: string) {
  return /(?:시|군|구|동|읍|면|리)$/.test(alias);
}

function addressIncludesAlias(
  alias: string,
  normalizedAddress: string,
  addressTokens: string[],
) {
  if (isAdministrativeAlias(alias)) {
    return addressTokens.includes(alias);
  }

  return normalizedAddress.includes(alias);
}

function buildDistrictAliases(entry: DistrictEntry) {
  const districtStem = entry.district.replace(/선거구$/, "");
  const withoutSuffix = districtStem.replace(/(갑|을|병|정|무)$/, "");
  const administrativeParts = districtStem.match(/[가-힣]+?(?:시|군|구)/g) ?? [];

  return dedupe([
    withoutSuffix,
    ...administrativeParts,
    ...administrativeParts.slice(-1),
  ]).map(normalizeKoreanText);
}

const DISTRICT_ALIAS_COUNTS = DISTRICTS.reduce<Record<string, number>>((acc, entry) => {
  for (const alias of buildDistrictAliases(entry)) {
    const key = `${entry.province ?? "all"}:${alias}`;
    acc[key] = (acc[key] ?? 0) + 1;
  }

  return acc;
}, {});

function buildProvinceAliases(province: string | null) {
  if (!province) {
    return [];
  }

  return dedupe([
    province,
    ...(PROVINCE_ALIASES[province] ?? []),
    province.replace(/특별자치도|특별자치시|특별시|광역시/g, ""),
  ]).map(normalizeKoreanText);
}

function buildAreaAliases(area: string) {
  const aliases = [area];
  const simplified = area.replace(/제(?=\d)/g, "");

  aliases.push(simplified);

  if (area.endsWith("일원")) {
    aliases.push(area.slice(0, -2));
  }

  const numberedDongMatch = simplified.match(/^(.+?)\d동$/);
  if (numberedDongMatch) {
    aliases.push(`${numberedDongMatch[1]}동`);
  }

  const gaMatch = simplified.match(/^(.+?)(\d)가(\d)동$/);
  if (gaMatch) {
    const [, base, lot, admin] = gaMatch;
    aliases.push(`${base}동${lot}가`);
    aliases.push(`${base}동${lot}가${admin}동`);
  }

  if (simplified.endsWith("동")) {
    aliases.push(simplified.slice(0, -1));
  }

  return dedupe(aliases).map(normalizeKoreanText);
}

function detectProvinceFromAddress(normalizedAddress: string) {
  let matchedProvince: string | null = null;
  let longestAliasLength = -1;

  for (const province of Object.keys(PROVINCE_ALIASES)) {
    for (const alias of buildProvinceAliases(province)) {
      if (!alias || !normalizedAddress.includes(alias)) {
        continue;
      }

      if (alias.length > longestAliasLength) {
        matchedProvince = province;
        longestAliasLength = alias.length;
      }
    }
  }

  return matchedProvince;
}

function scoreEntry(
  entry: DistrictEntry,
  normalizedAddress: string,
  addressTokens: string[],
): DistrictCandidate {
  let score = 0;
  let matchedArea: string | null = null;
  let bestAreaScore = 0;

  for (const alias of buildProvinceAliases(entry.province)) {
    if (alias && addressIncludesAlias(alias, normalizedAddress, addressTokens)) {
      score += 20;
      break;
    }
  }

  for (const area of entry.areas) {
    const aliases = buildAreaAliases(area);
    let matchedAlias: string | null = null;

    for (const alias of aliases) {
      if (
        alias.length >= 2 &&
        addressIncludesAlias(alias, normalizedAddress, addressTokens)
      ) {
        matchedAlias = alias;
        break;
      }
    }

    if (!matchedAlias) {
      continue;
    }

    const areaScore =
      Math.max(30, matchedAlias.length * 2) + (area.endsWith("일원") ? 8 : 0);

    if (areaScore > bestAreaScore) {
      bestAreaScore = areaScore;
      matchedArea = area;
    }
  }

  score += bestAreaScore;

  // When reverse geocoding only yields city/county/gu, allow a fallback if that
  // administrative name maps to a single constituency within the province.
  for (const alias of buildDistrictAliases(entry)) {
    const key = `${entry.province ?? "all"}:${alias}`;

    if (
      alias.length >= 2 &&
      addressIncludesAlias(alias, normalizedAddress, addressTokens) &&
      DISTRICT_ALIAS_COUNTS[key] === 1
    ) {
      score += 18;
      break;
    }
  }

  return {
    entry,
    score,
    matchedArea,
  };
}

export function resolveDistrictFromAddress(address: string): DistrictResolveResult | null {
  const normalizedAddress = normalizeKoreanText(address);
  const addressTokens = tokenizeAddress(address);

  if (!normalizedAddress) {
    return null;
  }

  const explicitProvince = detectProvinceFromAddress(normalizedAddress);
  const entriesToScore = explicitProvince
    ? DISTRICTS.filter((entry) => entry.province === explicitProvince)
    : DISTRICTS;

  const candidates = entriesToScore
    .map((entry) => scoreEntry(entry, normalizedAddress, addressTokens))
    .filter((candidate) => candidate.score > 0)
    .sort((left, right) => right.score - left.score);

  const best = candidates[0];
  const second = candidates[1];

  if (!best) {
    return null;
  }

  if (best.score < 30) {
    return null;
  }

  if (second && best.score - second.score < 6) {
    return null;
  }

  return {
    district: best.entry.district,
    province: best.entry.province,
    matchedArea: best.matchedArea,
    sourceAddress: address,
  };
}

export function getDistrictSearchExamples(limit = 8) {
  return DISTRICTS.flatMap((entry) =>
    entry.areas.slice(0, 1).map((area) => `${entry.province ?? ""} ${area}`.trim()),
  ).slice(0, limit);
}

export function getDistrictEntryByName(district: string) {
  const normalized = normalizeKoreanText(district);

  return DISTRICTS.find((entry) => normalizeKoreanText(entry.district) === normalized) ?? null;
}

export function getDistrictSearchTokens(district: string) {
  const entry = getDistrictEntryByName(district);
  const districtStem = district.replace(/선거구$/, "");
  const province = entry?.province
    ?.replace("특별자치도", "")
    ?.replace("특별자치시", "")
    ?.replace("특별시", "")
    ?.replace("광역시", "");

  return [...new Set([`${province ?? ""} ${districtStem}`.trim(), districtStem])];
}

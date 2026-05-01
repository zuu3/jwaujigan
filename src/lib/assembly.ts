import "server-only";
import { getDistrictEntryByName, getDistrictSearchTokens, normalizeKoreanText } from "@/lib/districts";

const ASSEMBLY_API_BASE_URL = "https://open.assembly.go.kr/portal/openapi";

type AssemblyJsonResponse = Record<string, unknown>;

type PersonalMemberRow = {
  HG_NM: string;
  HJ_NM?: string;
  ENG_NM?: string;
  BTH_DATE?: string;
  JOB_RES_NM?: string;
  POLY_NM: string;
  ORIG_NM: string;
  ELECT_GBN_NM?: string;
  CMITS?: string;
  CMIT_NM?: string;
  REELE_GBN_NM?: string;
  UNITS?: string;
  SEX_GBN_NM?: string;
  TEL_NO?: string;
  E_MAIL?: string;
  HOMEPAGE?: string;
  MEM_TITLE?: string;
  MONA_CD: string;
  ASSEM_ADDR?: string;
};

type IntegratedMemberRow = {
  NAAS_CD: string;
  NAAS_NM: string;
  PLPT_NM?: string;
  ELECD_NM?: string;
  BLNG_CMIT_NM?: string;
  NAAS_PIC?: string;
};

export type LocalPolitician = {
  id: string;
  name: string;
  party: string;
  district: string;
  committee: string | null;
  reelection: string | null;
  office: string | null;
  image: string | null;
};

export type PoliticianDetail = {
  id: string;
  name: string;
  nameHanja: string | null;
  nameEnglish: string | null;
  birthDate: string | null;
  jobTitle: string | null;
  party: string;
  district: string;
  electionType: string | null;
  committee: string | null;
  reelection: string | null;
  terms: string | null;
  gender: string | null;
  phone: string | null;
  email: string | null;
  homepage: string | null;
  office: string | null;
  biography: string | null;
  image: string | null;
};

type BillListRow = {
  BILL_ID?: string;
  BILL_NO?: string;
  BILL_NAME?: string;
  PROPOSER?: string;
  PROPOSE_DT?: string;
  COMMITTEE?: string;
  CURR_COMMITTEE?: string;
  LINK_URL?: string;
  DETAIL_LINK?: string;
  AGE?: string;
};

export type AssemblyIssueBill = {
  billId: string;
  title: string;
  proposer: string | null;
  committee: string | null;
  publishedAt: string | null;
  sourceUrl: string | null;
};

const ISSUE_KEYWORDS = [
  "예산",
  "세금",
  "조세",
  "안보",
  "국방",
  "복지",
  "교육",
  "노동",
  "환경",
  "외교",
  "연금",
  "청년",
  "주택",
  "부동산",
  "임대",
  "전세",
  "산업",
  "통상",
  "기업",
  "소상공인",
  "재난",
  "의료",
  "보건",
  "기후",
  "에너지",
  "아동",
  "돌봄",
  "저출생",
  "출산",
  "이민",
  "교통",
  "AI",
  "인공지능",
];

function getAssemblyApiKey() {
  const value = process.env.ASSEMBLY_OPEN_API_KEY;

  if (!value) {
    throw new Error("Missing environment variable: ASSEMBLY_OPEN_API_KEY");
  }

  return value;
}

function buildUrl(endpoint: string, params: Record<string, string | number | undefined>) {
  const url = new URL(`${ASSEMBLY_API_BASE_URL}/${endpoint}`);
  url.searchParams.set("KEY", getAssemblyApiKey());
  url.searchParams.set("Type", "json");
  url.searchParams.set("pIndex", "1");
  url.searchParams.set("pSize", "100");

  for (const [key, value] of Object.entries(params)) {
    if (value == null || value === "") {
      continue;
    }

    url.searchParams.set(key, String(value));
  }

  return url;
}

async function fetchAssemblyJson(endpoint: string, params: Record<string, string | number | undefined>) {
  const response = await fetch(buildUrl(endpoint, params), {
    cache: "no-store",
    headers: {
      "User-Agent": "jwaujigan/1.0",
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Assembly API request failed: ${endpoint}`);
  }

  return (await response.json()) as AssemblyJsonResponse;
}

function toIsoDate(dateString: string | undefined) {
  if (!dateString) {
    return null;
  }

  const trimmed = dateString.trim();

  if (!trimmed) {
    return null;
  }

  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(trimmed)
    ? `${trimmed}T00:00:00.000Z`
    : trimmed;
  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

function extractRows<T>(payload: AssemblyJsonResponse, rootKey: string) {
  const root = payload[rootKey];

  if (!Array.isArray(root)) {
    return [] as T[];
  }

  const rowContainer = root.find((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      return false;
    }

    return "row" in item;
  }) as { row?: T | T[] } | undefined;

  const row = rowContainer?.row;

  if (!row) {
    return [] as T[];
  }

  return Array.isArray(row) ? row : [row];
}

function getProvinceShortName(province: string | null) {
  if (!province) {
    return "";
  }

  return province
    .replace("특별자치도", "")
    .replace("특별자치시", "")
    .replace("특별시", "")
    .replace("광역시", "");
}

function filterRowsByDistrict<T extends { ORIG_NM?: string }>(
  rows: T[],
  district: string,
  province: string | null,
) {
  const districtStem = district.replace(/선거구$/, "");
  const candidates = [
    normalizeKoreanText(`${getProvinceShortName(province)} ${districtStem}`),
    normalizeKoreanText(districtStem),
  ];

  const exactMatches = rows.filter((row) => {
    const normalizedOrigin = normalizeKoreanText(row.ORIG_NM ?? "");
    return candidates.includes(normalizedOrigin);
  });

  if (exactMatches.length > 0) {
    return exactMatches;
  }

  return rows.filter((row) =>
    normalizeKoreanText(row.ORIG_NM ?? "").includes(normalizeKoreanText(districtStem)),
  );
}

async function fetchPersonalMembersByDistrict(district: string) {
  const entry = getDistrictEntryByName(district);
  const searchTokens = getDistrictSearchTokens(district);
  const collected = new Map<string, PersonalMemberRow>();

  for (const token of searchTokens) {
    const payload = await fetchAssemblyJson("nwvrqwxyaytdsfvhu", {
      ORIG_NM: token,
    });
    const rows = extractRows<PersonalMemberRow>(payload, "nwvrqwxyaytdsfvhu");

    for (const row of filterRowsByDistrict(rows, district, entry?.province ?? null)) {
      collected.set(row.MONA_CD, row);
    }
  }

  return [...collected.values()];
}

function pickBestIntegratedRow(
  rows: IntegratedMemberRow[],
  name: string,
  district: string,
  province: string | null,
) {
  const districtStem = district.replace(/선거구$/, "");
  const candidates = [
    normalizeKoreanText(`${getProvinceShortName(province)} ${districtStem}`),
    normalizeKoreanText(districtStem),
  ];

  return (
    rows.find((row) => {
      if (row.NAAS_NM !== name) {
        return false;
      }

      const districts = (row.ELECD_NM ?? "").split("/").map(normalizeKoreanText);

      return candidates.some((candidate) =>
        districts.some((item) => item.includes(candidate)),
      );
    }) ??
    rows.find((row) => row.NAAS_NM === name) ??
    null
  );
}

async function fetchMemberPicture(
  name: string,
  district: string,
  province: string | null,
) {
  const payload = await fetchAssemblyJson("ALLNAMEMBER", {
    NAAS_NM: name,
  });
  const rows = extractRows<IntegratedMemberRow>(payload, "ALLNAMEMBER");
  const matched = pickBestIntegratedRow(rows, name, district, province);

  return matched?.NAAS_PIC ?? null;
}

async function fetchPersonalMemberById(monaCd: string) {
  const payload = await fetchAssemblyJson("nwvrqwxyaytdsfvhu", {
    MONA_CD: monaCd,
  });
  const rows = extractRows<PersonalMemberRow>(payload, "nwvrqwxyaytdsfvhu");

  return rows[0] ?? null;
}

export async function getLocalPoliticiansByDistrict(
  district: string,
): Promise<LocalPolitician[]> {
  const entry = getDistrictEntryByName(district);
  const members = await fetchPersonalMembersByDistrict(district);

  const politicians = await Promise.all(
    members.map(async (member) => ({
      id: member.MONA_CD,
      name: member.HG_NM,
      party: member.POLY_NM,
      district: member.ORIG_NM,
      committee: member.CMITS ?? member.CMIT_NM ?? null,
      reelection: member.REELE_GBN_NM ?? null,
      office: member.ASSEM_ADDR ?? null,
      image: await fetchMemberPicture(member.HG_NM, district, entry?.province ?? null),
    })),
  );

  return politicians;
}

export async function getPoliticianDetailById(
  monaCd: string,
): Promise<PoliticianDetail | null> {
  const member = await fetchPersonalMemberById(monaCd);

  if (!member) {
    return null;
  }

  const image = await fetchMemberPicture(member.HG_NM, member.ORIG_NM, null);

  return {
    id: member.MONA_CD,
    name: member.HG_NM,
    nameHanja: member.HJ_NM ?? null,
    nameEnglish: member.ENG_NM ?? null,
    birthDate: member.BTH_DATE ?? null,
    jobTitle: member.JOB_RES_NM ?? null,
    party: member.POLY_NM,
    district: member.ORIG_NM,
    electionType: member.ELECT_GBN_NM ?? null,
    committee: member.CMITS ?? member.CMIT_NM ?? null,
    reelection: member.REELE_GBN_NM ?? null,
    terms: member.UNITS ?? null,
    gender: member.SEX_GBN_NM ?? null,
    phone: member.TEL_NO ?? null,
    email: member.E_MAIL ?? null,
    homepage: member.HOMEPAGE ?? null,
    office: member.ASSEM_ADDR ?? null,
    biography: member.MEM_TITLE ?? null,
    image,
  };
}

export async function getRecentIssueBills(): Promise<AssemblyIssueBill[]> {
  const payload = await fetchAssemblyJson("nzmimeepazxkubdpn", {
    AGE: 22,
    pIndex: 1,
    pSize: 20,
  });
  const rows = extractRows<BillListRow>(payload, "nzmimeepazxkubdpn");

  return rows
    .filter((row) => {
      const haystack = [
        row.BILL_NAME,
        row.COMMITTEE,
        row.CURR_COMMITTEE,
        row.PROPOSER,
      ]
        .filter(Boolean)
        .join(" ");

      return ISSUE_KEYWORDS.some((keyword) => haystack.includes(keyword));
    })
    .map((row) => ({
      billId: row.BILL_ID ?? row.BILL_NO ?? "",
      title: row.BILL_NAME?.trim() ?? "",
      proposer: row.PROPOSER?.trim() ?? null,
      committee: row.COMMITTEE?.trim() ?? row.CURR_COMMITTEE?.trim() ?? null,
      publishedAt: toIsoDate(row.PROPOSE_DT),
      sourceUrl: row.DETAIL_LINK?.trim() ?? row.LINK_URL?.trim() ?? null,
    }))
    .filter((bill) => bill.billId && bill.title)
    .slice(0, 5);
}

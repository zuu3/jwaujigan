import "server-only";
import { get as httpsGet } from "node:https";
import { createServiceRoleSupabaseClient } from "@/lib/supabase";

export type {
  ElectionType,
  LocalElectionWinner,
  LocalElectionCandidate,
  LocalElectionResult,
} from "./local-election.types";
export { ELECTION_TYPE_LABELS } from "./local-election.types";

import type { ElectionType, LocalElectionWinner, LocalElectionCandidate, LocalElectionResult } from "./local-election.types";

// sgTypecode → ElectionType (actual API mapping, exhaustively tested)
// User docs were wrong: 시도지사=3(not 1), 교육감=11(not 7), 비례=8/9(not 4/6)
const WINNER_SG_TYPE: Record<ElectionType, number> = {
  governor: 3,       // 시도지사 17개
  mayor: 4,          // 시장군수구청장 226개
  provincial: 5,     // 시도의원 지역구 779개
  provincialPr: 8,   // 시도의원 비례 93개 — sdName만 필터
  local: 6,          // 구시군의원 지역구 2601개
  localPr: 9,        // 구시군의원 비례 386개
  superintendent: 11, // 교육감 17개 — sdName만 필터
};

const CANDIDATE_SG_TYPE: Record<ElectionType, number> = {
  governor: 3,
  mayor: 4,
  provincial: 5,
  provincialPr: 8,
  local: 6,
  localPr: 9,
  superintendent: 11,
};

// Types that filter by sdName only (no wiwName — province-level positions)
const SD_ONLY_TYPES = new Set<ElectionType>(["governor", "provincialPr", "superintendent"]);

// ─── XML parsing ─────────────────────────────────────────────────────────────

function parseXmlItems(xml: string): Record<string, string>[] {
  const items: Record<string, string>[] = [];
  const itemRe = /<item>([\s\S]*?)<\/item>/g;
  let itemMatch: RegExpExecArray | null;

  while ((itemMatch = itemRe.exec(xml)) !== null) {
    const item: Record<string, string> = {};
    const fieldRe = /<([^/>]+)>([^<]*)<\/\1>/g;
    let fieldMatch: RegExpExecArray | null;

    while ((fieldMatch = fieldRe.exec(itemMatch[1])) !== null) {
      item[fieldMatch[1]] = fieldMatch[2].trim();
    }

    items.push(item);
  }

  return items;
}

function parseTotalCount(xml: string): number {
  const m = xml.match(/<totalCount>(\d+)<\/totalCount>/);
  return m ? parseInt(m[1], 10) : 0;
}

function isOkResponse(xml: string): boolean {
  return xml.includes("<resultCode>INFO-00</resultCode>");
}

// ─── In-memory cache ─────────────────────────────────────────────────────────

type CacheEntry = { data: Record<string, string>[]; expiry: number };

const WINNER_CACHE = new Map<string, CacheEntry>();
const CANDIDATE_CACHE = new Map<string, CacheEntry>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

// ─── Fetcher ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 100;
const BASE_URL = "https://apis.data.go.kr/9760000";
const WINNER_API = "WinnerInfoInqireService2/getWinnerInfoInqire";
const CANDIDATE_API = "PofelcddInfoInqireService/getPofelcddRegistSttusInfoInqire";
const WINNER_SG_ID = "20220601";
const CANDIDATE_SG_ID = "20260603";

function fetchPageRaw(url: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const req = httpsGet(
      url,
      { rejectUnauthorized: false },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c: Buffer) => chunks.push(c));
        res.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
        res.on("error", reject);
      },
    );
    req.on("error", reject);
    req.setTimeout(15_000, () => {
      req.destroy(new Error("Election API request timed out"));
    });
  });
}

async function fetchPage(
  apiPath: string,
  sgId: string,
  sgTypecode: number,
  pageNo: number,
  numOfRows: number,
): Promise<string> {
  const key = encodeURIComponent(process.env.LOCAL_ELECTION_API_KEY ?? "");
  const url = `${BASE_URL}/${apiPath}?serviceKey=${key}&sgId=${sgId}&sgTypecode=${sgTypecode}&numOfRows=${numOfRows}&pageNo=${pageNo}`;
  return fetchPageRaw(url);
}

async function fetchAllItems(
  apiPath: string,
  sgId: string,
  sgTypecode: number,
  memCache: Map<string, CacheEntry>,
): Promise<Record<string, string>[]> {
  const cacheKey = `election:${sgId}:${sgTypecode}`;

  const memCached = memCache.get(cacheKey);
  if (memCached && memCached.expiry > Date.now()) {
    return memCached.data;
  }

  const supabase = createServiceRoleSupabaseClient();
  const { data: dbCached } = await supabase
    .from("election_cache")
    .select("data, expires_at")
    .eq("cache_key", cacheKey)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (dbCached) {
    const data = dbCached.data as Record<string, string>[];
    memCache.set(cacheKey, { data, expiry: Date.now() + CACHE_TTL });
    return data;
  }

  const firstXml = await fetchPage(apiPath, sgId, sgTypecode, 1, 1);
  if (!isOkResponse(firstXml)) return [];

  const total = parseTotalCount(firstXml);
  if (total === 0) return [];

  const pageCount = Math.ceil(total / PAGE_SIZE);
  const pageNums = Array.from({ length: pageCount }, (_, i) => i + 1);

  const allItems: Record<string, string>[] = [];
  const BATCH = 10;
  for (let i = 0; i < pageNums.length; i += BATCH) {
    const batch = pageNums.slice(i, i + BATCH);
    const results = await Promise.all(
      batch.map((p) => fetchPage(apiPath, sgId, sgTypecode, p, PAGE_SIZE).then(parseXmlItems)),
    );
    allItems.push(...results.flat());
  }

  const expiresAt = new Date(Date.now() + CACHE_TTL).toISOString();
  await supabase.from("election_cache").upsert(
    { cache_key: cacheKey, data: allItems, expires_at: expiresAt },
    { onConflict: "cache_key" },
  );

  memCache.set(cacheKey, { data: allItems, expiry: Date.now() + CACHE_TTL });
  return allItems;
}

// ─── District → sdName / wiwNames ────────────────────────────────────────────

export function extractLocalElectionFilter(
  province: string | null,
  district: string,
): { sdName: string; wiwNames: string[] } | null {
  if (!province) return null;

  // Strip "선거구" suffix and election suffix (갑/을/병/정/무)
  const stem = district.replace(/선거구$/, "").replace(/(갑|을|병|정|무)$/, "");

  // Multi-county districts like "청송군·영양군"
  const wiwNames = stem.includes("·") ? stem.split("·") : [stem];

  return { sdName: province, wiwNames };
}

// ─── Filtering helpers ────────────────────────────────────────────────────────

function matchesRegion(
  item: Record<string, string>,
  sdName: string,
  wiwNames: string[],
  sdOnly: boolean,
): boolean {
  if (item.sdName !== sdName) return false;

  if (sdOnly) return true;

  // wiwName match — API value may differ slightly (e.g. "성남시분당구" vs "분당구")
  const apiWiw = item.wiwName ?? "";
  return wiwNames.some(
    (w) => apiWiw === w || apiWiw.endsWith(w),
  );
}

// ─── Photo URLs ──────────────────────────────────────────────────────────────

const SD_GSG: Record<string, string> = {
  "서울특별시": "1100",
  "부산광역시": "2600",
  "대구광역시": "2700",
  "인천광역시": "2800",
  "전남광주통합특별시": "2900",
  "광주광역시": "2900",
  "대전광역시": "3000",
  "울산광역시": "3100",
  "경기도": "4100",
  "충청북도": "4300",
  "충청남도": "4400",
  "전라남도": "4600",
  "경상북도": "4700",
  "경상남도": "4800",
  "제주특별자치도": "4900",
  "세종특별자치시": "5100",
  "강원특별자치도": "5200",
  "전북특별자치도": "5300",
};

// Photos only available for province-level types (SD_ONLY_TYPES)
export function getLocalElectionPhotoUrl(
  huboid: string,
  sdName: string,
  sgId: string,
  electionType: ElectionType,
): string | null {
  if (!SD_ONLY_TYPES.has(electionType)) return null;
  const gsg = SD_GSG[sdName];
  if (!gsg || !huboid) return null;
  return `https://cdn.nec.go.kr/photo_${sgId}/Gsg${gsg}/Hb${huboid}/gicho/${huboid}.JPG`;
}

// ─── Public API ──────────────────────────────────────────────────────────────

export async function getLocalElectionPerson(
  huboid: string,
  type: ElectionType,
  tab: "winners" | "candidates",
): Promise<LocalElectionWinner | LocalElectionCandidate | null> {
  const apiPath = tab === "winners" ? WINNER_API : CANDIDATE_API;
  const sgId = tab === "winners" ? WINNER_SG_ID : CANDIDATE_SG_ID;
  const sgTypecode = tab === "winners" ? WINNER_SG_TYPE[type] : CANDIDATE_SG_TYPE[type];
  const cache = tab === "winners" ? WINNER_CACHE : CANDIDATE_CACHE;

  const items = await fetchAllItems(apiPath, sgId, sgTypecode, cache);
  const item = items.find((i) => i.huboid === huboid);
  if (!item) return null;

  const sdName = item.sdName ?? "";
  const hid = item.huboid ?? "";

  if (tab === "winners") {
    return {
      huboid: hid,
      electionType: type,
      sggName: item.sggName ?? "",
      sdName,
      wiwName: item.wiwName ?? "",
      giho: item.giho ?? "",
      jdName: item.jdName ?? "",
      name: item.name ?? "",
      gender: item.gender ?? "",
      age: item.age ?? "",
      birthday: item.birthday ?? "",
      addr: item.addr ?? "",
      edu: item.edu ?? "",
      job: item.job ?? "",
      career1: item.career1 ?? "",
      career2: item.career2 ?? "",
      dugsu: item.dugsu ?? "",
      dugyul: item.dugyul ?? "",
      photoUrl: null,
    } as LocalElectionWinner;
  }

  return {
    huboid: hid,
    electionType: type,
    sggName: item.sggName ?? "",
    sdName,
    wiwName: item.wiwName ?? "",
    giho: item.giho ?? "",
    jdName: item.jdName ?? "",
    name: item.name ?? "",
    gender: item.gender ?? "",
    age: item.age ?? "",
    birthday: item.birthday ?? "",
    addr: item.addr ?? "",
    edu: item.edu ?? "",
    job: item.job ?? "",
    career1: item.career1 ?? "",
    career2: item.career2 ?? "",
    status: item.status ?? "",
    photoUrl: getLocalElectionPhotoUrl(hid, sdName, CANDIDATE_SG_ID, type),
  } as LocalElectionCandidate;
}

export async function getLocalElectionData(
  province: string,
  wiwNames: string[],
): Promise<LocalElectionResult> {
  const electionTypes = Object.keys(WINNER_SG_TYPE) as ElectionType[];

  const [winnerSets, candidateSets] = await Promise.all([
    Promise.all(
      electionTypes.map((type) =>
        fetchAllItems(
          WINNER_API,
          WINNER_SG_ID,
          WINNER_SG_TYPE[type],
          WINNER_CACHE,
        ).then((items) => ({
          type,
          items: items.filter((item) =>
            matchesRegion(item, province, wiwNames, SD_ONLY_TYPES.has(type)),
          ),
        })),
      ),
    ),
    Promise.all(
      electionTypes.map((type) =>
        fetchAllItems(
          CANDIDATE_API,
          CANDIDATE_SG_ID,
          CANDIDATE_SG_TYPE[type],
          CANDIDATE_CACHE,
        ).then((items) => ({
          type,
          items: items.filter((item) =>
            matchesRegion(item, province, wiwNames, SD_ONLY_TYPES.has(type)),
          ),
        })),
      ),
    ),
  ]);

  const winners = Object.fromEntries(
    winnerSets.map(({ type, items }) => [
      type,
      items.map(
        (item): LocalElectionWinner => {
          const hid = item.huboid ?? "";
          const sd = item.sdName ?? "";
          return {
            huboid: hid,
            electionType: type,
            sggName: item.sggName ?? "",
            sdName: sd,
            wiwName: item.wiwName ?? "",
            giho: item.giho ?? "",
            jdName: item.jdName ?? "",
            name: item.name ?? "",
            gender: item.gender ?? "",
            age: item.age ?? "",
            birthday: item.birthday ?? "",
            addr: item.addr ?? "",
            edu: item.edu ?? "",
            job: item.job ?? "",
            career1: item.career1 ?? "",
            career2: item.career2 ?? "",
            dugsu: item.dugsu ?? "",
            dugyul: item.dugyul ?? "",
            photoUrl: null,
          };
        },
      ),
    ]),
  ) as Record<ElectionType, LocalElectionWinner[]>;

  const candidates = Object.fromEntries(
    candidateSets.map(({ type, items }) => [
      type,
      items.map(
        (item): LocalElectionCandidate => {
          const hid = item.huboid ?? "";
          const sd = item.sdName ?? "";
          return {
            huboid: hid,
            electionType: type,
            sggName: item.sggName ?? "",
            sdName: sd,
            wiwName: item.wiwName ?? "",
            giho: item.giho ?? "",
            jdName: item.jdName ?? "",
            name: item.name ?? "",
            gender: item.gender ?? "",
            age: item.age ?? "",
            birthday: item.birthday ?? "",
            addr: item.addr ?? "",
            edu: item.edu ?? "",
            job: item.job ?? "",
            career1: item.career1 ?? "",
            career2: item.career2 ?? "",
            status: item.status ?? "",
            photoUrl: getLocalElectionPhotoUrl(hid, sd, CANDIDATE_SG_ID, type),
          };
        },
      ),
    ]),
  ) as Record<ElectionType, LocalElectionCandidate[]>;

  return { sdName: province, wiwNames, winners, candidates };
}

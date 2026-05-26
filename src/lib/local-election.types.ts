export type ElectionType =
  | "governor"       // 시도지사 (code=3, 17개)
  | "mayor"          // 시장군수구청장 (code=4, 226개)
  | "provincial"     // 시도의원 지역구 (code=5)
  | "provincialPr"   // 시도의원 비례 (code=8)
  | "local"          // 구시군의원 지역구 (code=6)
  | "localPr"        // 구시군의원 비례 (code=9)
  | "superintendent"; // 교육감 (code=11, 17개)

export const ELECTION_TYPE_LABELS: Record<ElectionType, string> = {
  governor: "시·도지사",
  mayor: "시장·군수·구청장",
  provincial: "시·도의원 (지역구)",
  provincialPr: "시·도의원 (비례)",
  local: "구·시·군의원 (지역구)",
  localPr: "구·시·군의원 (비례)",
  superintendent: "교육감",
};

export type LocalElectionWinner = {
  huboid: string;
  electionType: ElectionType;
  sggName: string;
  sdName: string;
  wiwName: string;
  giho: string;
  jdName: string;
  name: string;
  gender: string;
  age: string;
  birthday: string;
  addr: string;
  edu: string;
  job: string;
  career1: string;
  career2: string;
  dugsu: string;
  dugyul: string;
  photoUrl: string | null;
};

export type LocalElectionCandidate = {
  huboid: string;
  electionType: ElectionType;
  sggName: string;
  sdName: string;
  wiwName: string;
  giho: string;
  jdName: string;
  name: string;
  gender: string;
  age: string;
  birthday: string;
  addr: string;
  edu: string;
  job: string;
  career1: string;
  career2: string;
  status: string;
  photoUrl: string | null;
};

export type LocalElectionResult = {
  sdName: string;
  wiwNames: string[];
  winners: Record<ElectionType, LocalElectionWinner[]>;
  candidates: Record<ElectionType, LocalElectionCandidate[]>;
};

export type PoliticalAxis = "economic" | "security" | "social";

export type Question = {
  id: string;
  axis: PoliticalAxis;
  reversed: boolean;
  text: string;
  context?: string;
};

export const questions: Question[] = [
  {
    id: "q1",
    axis: "economic",
    reversed: false,
    text: "대기업 규제를 강화해 중소기업과의 격차를 줄여야 한다",
  },
  {
    id: "q2",
    axis: "economic",
    reversed: false,
    text: "부동산 세금을 높여 집값을 안정시키는 것이 맞다",
  },
  {
    id: "q13",
    axis: "social",
    reversed: false,
    text: "병역 의무는 성별 관계없이 동등하게 적용되어야 한다",
  },
  {
    id: "q3",
    axis: "economic",
    reversed: false,
    text: "최저임금을 빠르게 올리는 것이 경제 전체에 도움이 된다",
  },
  {
    id: "q6",
    axis: "security",
    reversed: true,
    text: "주한미군은 한국 안보에 반드시 필요하다",
    context: "주한미군은 한국전쟁(1950~53) 이후 한국에 주둔 중인 미군입니다. 현재 약 2만 8천 명 규모로, 유사시 미국의 즉각 개입을 보장하는 역할을 합니다.",
  },
  {
    id: "q4",
    axis: "economic",
    reversed: false,
    text: "공공 의료·교육 서비스 확대를 위해 세금을 더 걷어도 괜찮다",
  },
  {
    id: "q12",
    axis: "social",
    reversed: false,
    text: "이민자·외국인 노동자 수용을 더 확대해야 한다",
  },
  {
    id: "q7",
    axis: "security",
    reversed: false,
    text: "대북 제재보다 교류·협력이 한반도 평화에 더 효과적이다",
    context: "대북 제재는 북한의 핵·미사일 개발을 억제하기 위해 국제사회가 부과하는 경제·외교적 압박입니다. 교류·협력은 경제 지원, 이산가족 상봉, 남북 공동사업 등을 통해 관계를 개선하는 방식입니다.",
  },
  {
    id: "q5",
    axis: "economic",
    reversed: true,
    text: "기업의 자유로운 경쟁이 보장될 때 경제가 더 잘 성장한다",
  },
  {
    id: "q14",
    axis: "social",
    reversed: true,
    text: "전통적인 가족 구조와 가치관은 사회 안정에 중요하다",
  },
  {
    id: "q8",
    axis: "security",
    reversed: true,
    text: "사드 배치는 국가 안보를 위해 필요한 결정이었다",
    context: "사드(THAAD)는 미국의 고고도 미사일 방어 시스템입니다. 2017년 경북 성주에 배치됐으며, 북한 미사일 요격이 목적입니다. 중국은 자국 안보 위협을 이유로 강하게 반발했고, 한국에 경제 보복을 가하기도 했습니다.",
  },
  {
    id: "q11",
    axis: "social",
    reversed: false,
    text: "동성 결혼을 법적으로 인정해야 한다",
  },
  {
    id: "q9",
    axis: "security",
    reversed: false,
    text: "한미동맹보다 자주적 외교 노선을 강화해야 한다",
    context: "한미동맹은 1953년 한미상호방위조약으로 맺어진 군사·안보 동맹입니다. 자주적 외교 노선은 미국에 의존하지 않고 한국이 독립적으로 외교 정책을 결정하는 방향을 뜻합니다.",
  },
  {
    id: "q15",
    axis: "social",
    reversed: false,
    text: "소수자 권리 보호를 위한 차별금지법이 필요하다",
    context: "차별금지법은 성별·나이·장애·성적지향·인종 등을 이유로 한 차별을 포괄적으로 금지하는 법입니다. 2007년부터 입법이 논의됐으나 종교계 반발 등으로 아직 통과되지 않았습니다.",
  },
  {
    id: "q10",
    axis: "security",
    reversed: false,
    text: "북한과의 경제협력은 한국 경제에도 실질적인 이익이 된다",
    context: "대표적인 남북 경제협력 사례로 개성공단이 있습니다. 2004년 설립돼 남한 기업이 북한 노동력을 활용했으나, 2016년 핵실험 이후 전면 중단됐습니다.",
  },
];

export const likertOptions = [
  { label: "매우 동의", value: 2 },
  { label: "동의", value: 1 },
  { label: "모르겠다", value: 0 },
  { label: "비동의", value: -1 },
  { label: "매우 비동의", value: -2 },
] as const;

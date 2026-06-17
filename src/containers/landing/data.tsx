import {
  MapPinned,
  MessageCircleMore,
  Scale,
  Share2,
  Sparkles,
  Vote,
  type LucideIcon,
} from "lucide-react";

export type ValueItem = {
  title: string;
  description: string;
  icon: LucideIcon;
};

export type EngagementItem = {
  title: string;
  description: string;
  icon: LucideIcon;
};

export const values: ValueItem[] = [
  {
    title: "재미있게",
    description: "배틀과 투표로 정치 이슈를 지루하지 않게 이해해요.",
    icon: Sparkles,
  },
  {
    title: "균형 있게",
    description: "같은 이슈를 진보와 보수 관점으로 나란히 봅니다.",
    icon: Scale,
  },
  {
    title: "쉽게",
    description: "우리 동네 정치인부터 시작해 부담 없이 들어옵니다.",
    icon: MapPinned,
  },
];

export const localInfoItems = [
  "내 지역구를 설정하고 해당 지역 정치인을 바로 확인",
  "사진, 정당, 약력, 소관 위원회를 한 화면에서 정리",
  "발의한 법안 목록을 국회 원문 링크와 함께 확인",
  "팔로우한 정치인의 새 법안을 홈 피드에서 바로 확인",
];

export const arenaPoints = [
  "국회 법안 기반으로 자동 생성된 이슈 중에서 선택",
  "진보 AI와 보수 AI가 번갈아 발언하며 논리를 비교",
  "실시간으로 읽히는 대화 흐름으로 몰입감 있게 확인",
];

export const analysisPoints = [
  "법안을 한 문장 요약으로 먼저 파악",
  "진보와 보수가 각각 어떻게 보는지 나란히 비교",
  "배경·조항·영향을 4문단으로 정리한 상세 내용 확인",
];

export const engagementItems: EngagementItem[] = [
  {
    title: "실시간 투표",
    description: "토론을 보면서 어느 쪽이 더 설득력 있는지 바로 참여해요.",
    icon: Vote,
  },
  {
    title: "토론 개입",
    description: "내 의견을 직접 넣으면 AI가 그 맥락을 반영해 다음 발언을 이어갑니다.",
    icon: MessageCircleMore,
  },
  {
    title: "결과 공유",
    description: "토론 결과 카드를 링크로 공유할 수 있습니다.",
    icon: Share2,
  },
];

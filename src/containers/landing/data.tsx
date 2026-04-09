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
    description: "배틀과 투표로 정치 이슈를 지루하지 않게 이해합니다.",
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
  "사진, 정당, 약력, 최근 활동을 한 화면에서 정리",
  "법안, 뉴스, 공약 이행 흐름을 시각적으로 이해",
  "관심 있는 정치인은 즐겨찾기로 저장해두고 다시 확인",
];

export const arenaPoints = [
  "이슈를 직접 입력하거나 많이 이야기되는 주제를 선택",
  "좌파 AI와 우파 AI가 번갈아 발언하며 논리를 비교",
  "실시간으로 읽히는 대화 흐름으로 몰입감 있게 확인",
];

export const analysisPoints = [
  "복잡한 정책을 3줄로 먼저 이해",
  "보수와 진보가 중요하게 보는 포인트를 비교",
  "쟁점에 필요한 사실관계를 함께 정리",
];

export const engagementItems: EngagementItem[] = [
  {
    title: "실시간 투표",
    description: "토론을 보면서 어느 쪽이 더 설득력 있는지 바로 참여합니다.",
    icon: Vote,
  },
  {
    title: "대변인 모드",
    description: "내 의견을 넣으면 AI가 더 논리적인 문장으로 다듬어줍니다.",
    icon: MessageCircleMore,
  },
  {
    title: "공유하기",
    description: "흥미로운 장면이나 결과를 이미지나 링크로 공유할 수 있습니다.",
    icon: Share2,
  },
];

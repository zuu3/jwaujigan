## Brand
name: 좌우지간
description: MZ세대 대상 정치 리터러시 플랫폼

## Colors
primary: #3182f6        /* 진보 라벨 전용 */
secondary: #e5484d      /* 보수 라벨 전용 — #ef4444에서 AA 보정 */
background: #ffffff
text: #191f28           /* 본문 primary */
text-sub: #4e5968       /* 보조 텍스트 */
muted: #8b95a1          /* meta, label, placeholder */
line: #e5e7eb           /* hairline (강) */
line-soft: #f2f4f6      /* hairline (약), row divider */

/* 규칙: primary/secondary는 라벨 텍스트에만. 본문·배경 색칠 금지 */

## Typography
UI: Pretendard
scale: 32px / 24px / 18px / 16px / 14px
body: 16px, line-height 1.6
weight: 400 (body), 500 (label), 600 (heading)

## Typography
UI: Pretendard
scale: 32px / 24px / 18px / 16px / 14px
body: 16px, line-height 1.6
weight: 400 (body), 500 (label), 600 (heading), 700 (display)
letter-spacing: -0.02em ~ -0.04em (display only)

## Spacing
section-gap: 40px (mobile 32px)
landing-section-gap: 80px
component-padding: 16px / 24px
hairline: 1px solid line / line-soft

## Style
- light mode only
- typography-first (toss 참고)
- hairline 구조 — 배경 박스 / 회색 섹션 배경 금지
- box-shadow 금지 — hairline border로 대체
- CTA: border-radius 8px, min-height 44px
- 모션: opacity fade 200ms only (y-slide 금지)

## Voice
- 정치 정보를 쉽고 담담하게
- 사실 진술형, 명사형 종결 선호
- 선동적 표현 금지
- 마케팅·캐치카피 톤 금지
- 진보/보수 외 임의 강조색 추가 금지

## Forbidden Patterns
- purple-to-blue gradients
- gradient text
- glassmorphism
- bounce/elastic easing
- nested cards
- rounded-square icon tiles above headings
- 3D abstract illustrations
- framer-motion y-slide entrance (opacity-only 허용)
- 본문 텍스트 색칠 (진보/보수 색은 라벨에만)
- 회색 배경 박스 섹션 (IntroBand류)
- uppercase eyebrow (한국어)
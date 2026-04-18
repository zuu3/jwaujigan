# DESIGN.md — 좌우지간 (JWJ)

> 베이스: **Notion** 디자인 시스템 (따뜻한 미니멀, 밝은 캔버스)  
> 레이어: 진보/보수 듀얼 컬러, 배틀 UI, 한국어 타이포그래피

---

## 1. Visual Theme & Atmosphere

좌우지간은 정치가 어렵고 멀게 느껴지는 이유를 없애는 플랫폼이다. 디자인도 그 태도를 그대로 반영한다 — 무겁지 않고, 과하지 않고, 읽기 편하다.

캔버스는 순백(`#ffffff`)과 따뜻한 오프화이트(`#f6f5f4`)의 교차. 그레이는 차갑지 않고 황갈색 언더톤이 있다. 전체적으로 품질 좋은 종이 위에 인쇄된 느낌 — 스크린이지만 아날로그의 온기가 있다.

컬러 포인트는 딱 두 개다: **진보 블루** (`#0052cc`)와 **보수 레드** (`#d93025`). 한국 정치 컨벤션을 따르며, UI 전체에서 드물게 쓰인다 — 배경 wash가 아니라 정확한 포인트로만.

**AI스러운 디자인을 피하는 원칙:**
- 보라색 그라디언트, 글로우 효과, glassmorphism 없음
- 뻔한 카드 + 진한 그림자 조합 없음
- 과한 rounded corner (카드에 20px 이상) 없음
- 모든 컬러는 극도로 절제, 목적이 있을 때만 사용

**Key Characteristics:**
- 순백 캔버스, warm neutral 스케일 (황갈색 언더톤)
- Near-black 텍스트 (`rgba(0,0,0,0.95)`) — 순수 검정보다 미세하게 따뜻함
- 1px whisper border (`rgba(0,0,0,0.1)`) — 경계는 속삭이듯
- 진보 블루(`#0052cc`) × 보수 레드(`#d93025`) — 이 두 색만 채도 있게
- Pretendard Variable — 한국어 최적화, Notion Inter와 동급 품질
- 그림자는 4-5겹 초저불투명도 — 느껴지되 보이지 않는 깊이

---

## 2. Color Palette & Roles

### Primary
- **Near-Black** (`rgba(0,0,0,0.95)`): 메인 텍스트, 헤딩
- **Pure White** (`#ffffff`): 페이지 배경, 카드 표면
- **Warm White** (`#f6f5f4`): 섹션 교차 배경 — 황갈색 언더톤

### 정치 컬러 (이 두 색만 채도 있게 사용)
- **진보 블루** (`#0052cc`): 진보 진영, 배틀 좌측, 메인 CTA/링크
- **보수 레드** (`#d93025`): 보수 진영, 배틀 우측

### 중립 포인트
- **팩트 앰버** (`#b45309`): 팩트체크, 중립/공통 이슈

### Warm Neutral Scale
- **Warm Gray 500** (`#615d59`): 부제목, 설명 텍스트
- **Warm Gray 300** (`#a39e98`): 플레이스홀더, 캡션, 비활성

### Semantic
- **진보 Dimmed** (`rgba(0,82,204,0.08)`): 진보 배지 배경 틴트
- **보수 Dimmed** (`rgba(217,48,37,0.08)`): 보수 배지 배경 틴트
- **Border Whisper** (`rgba(0,0,0,0.1)`): 모든 경계선 기본값
- **Border Medium** (`rgba(0,0,0,0.18)`): 강조 경계선

### Shadows
- **Card Shadow**: `rgba(0,0,0,0.04) 0px 4px 18px, rgba(0,0,0,0.027) 0px 2px 7.8px, rgba(0,0,0,0.02) 0px 0.8px 2.9px, rgba(0,0,0,0.01) 0px 0.175px 1px`
- **Deep Shadow**: 5겹, 최대 opacity 0.05, 52px blur — 모달용

### Gradient
- **배틀 배경만 허용**: `linear-gradient(to right, rgba(0,82,204,0.05), rgba(255,255,255,0), rgba(217,48,37,0.05))` — 극도로 절제
- 그 외 모든 그라디언트 금지

---

## 3. Typography Rules

### Font Family
- **Primary**: `Pretendard Variable`, fallback: `Pretendard, -apple-system, Apple SD Gothic Neo, Noto Sans KR, sans-serif`
- **Monospace**: `JetBrains Mono`, fallback: `ui-monospace, SF Mono, Menlo` — 수치 전용
- **OpenType**: `"lnum"`, `"locl"` 권장

### Hierarchy

| Role | Size | Weight | Line Height | Letter Spacing | 용도 |
|---|---|---|---|---|---|
| Display Hero | 56–64px | 700 | 1.05 | -1.5px | 메인 히어로 |
| Section Heading | 40–48px | 700 | 1.10 | -1px | 섹션 제목 |
| Card Title | 22–26px | 700 | 1.25 | -0.3px | 카드 제목 |
| Sub Heading | 18–20px | 600 | 1.30 | -0.1px | 서브 섹션 |
| Body Large | 17px | 400 | 1.65 | 0 | 서비스 소개, 정책 |
| Body | 15–16px | 400 | 1.60 | 0 | 일반 본문 |
| Label / Tag | 12px | 600 | 1.33 | 0.1px | 태그, 배지 |
| Caption | 13–14px | 400 | 1.40 | 0 | 메타데이터 |
| Mono Score | 20–32px | 600 | 1.00 | 0 | 지지율, 점수 |

### Principles
- letter-spacing은 크기에 반비례: 64px → -1.5px, 48px → -1px, 26px → -0.3px, 16px → 0
- weight 4단계: 400(읽기) / 500(UI) / 600(강조) / 700(헤딩)
- 수치는 JetBrains Mono
- 한국어 행간: body 1.60+, heading 1.10+ 확보

---

## 4. Component Stylings

### Buttons

**Primary — Blue (메인 CTA)**
- Background: `#0052cc`
- Text: `#ffffff`, Pretendard 15px / 600
- Radius: `6px`
- Padding: `9px 18px`
- Hover: `#0043a8`
- Active: `scale(0.97)`

**Secondary — Ghost**
- Background: `rgba(0,0,0,0.05)`
- Text: `rgba(0,0,0,0.85)`
- Radius: `6px`
- Hover: `rgba(0,0,0,0.08)`

**Outlined (진보/보수 맥락)**
- Background: transparent
- Border: `1px solid #0052cc` (진보) 또는 `1px solid #d93025` (보수)
- Text: 해당 컬러
- Radius: `6px`
- Hover: Dimmed 배경 채워짐

**Tag/Badge Pill**
- Background: `rgba(0,82,204,0.08)` / `rgba(217,48,37,0.08)` / `#f6f5f4`
- Text: `#0052cc` / `#d93025` / `#615d59`
- Radius: `9999px`
- Padding: `3px 10px`
- Font: 12px / 600

### Cards

**기본 카드 (정치인/이슈)**
- Background: `#ffffff`
- Border: `1px solid rgba(0,0,0,0.1)`
- Radius: `12px`
- Shadow: Card Shadow
- Padding: `24px`
- Hover: 그림자 미세 강화
- 진영 표시는 Badge Pill로만 — 카드 배경색 변경 없음

**배틀 카드 — 진보**
- Background: `#ffffff`
- Border: `1px solid rgba(0,82,204,0.25)`
- 상단: `3px solid #0052cc` top border
- Radius: `12px`

**배틀 카드 — 보수**
- Background: `#ffffff`
- Border: `1px solid rgba(217,48,37,0.25)`
- 상단: `3px solid #d93025` top border
- Radius: `12px`

**섹션 교차**
- `#ffffff` ↔ `#f6f5f4` 교차, 구분선/그림자 없이 배경색 전환만

### Navigation
- Background: `#ffffff`, 하단 `1px solid rgba(0,0,0,0.1)`
- 로고 **좌우지간**: Pretendard 20px / 700
  - `좌` = `#0052cc`
  - `우` = `#d93025`
  - `지간` = `rgba(0,0,0,0.95)`
- 링크: 15px / 500, `#615d59` → hover `rgba(0,0,0,0.95)`, 150ms
- CTA: Primary Blue 버튼

### 배틀 (AI 아레나) UI
- 배경: 흰 배경 + 극도로 절제된 배틀 그라디언트
- 좌우 분할: 각 50%, 중간 `1px solid rgba(0,0,0,0.1)`
- VS 텍스트: 13px / 600, `#a39e98`, 중앙
- 발언 버블: 기본 카드 + 진영별 탑 보더 3px
- 투표: Outlined 버튼 (진보/보수 각각)

### 성향 테스트 UI
- 문항 카드: `#ffffff`, `12px` radius, Card Shadow
- 슬라이더: 좌(`#0052cc`) ↔ 우(`#d93025`), 중간 `#a39e98`
- 진행: JetBrains Mono `"3 / 15"`, `#615d59`

---

## 5. Layout Principles

### Spacing System
- **Base unit**: 8px
- **Scale**: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96px
- **섹션 패딩**: 64–96px vertical
- **카드 패딩**: 20–24px
- **컴포넌트 간격**: 12–16px

### Grid & Container
- **Max width**: 1200px, centered
- **Container padding**: 20px (모바일) / 48px (데스크탑)
- 카드 피드: 3열 / 2열 / 1열
- 배틀 UI: 좌우 50:50 (모바일: 상하)
- 성향 테스트: 단일 컬럼, max-width 640px

### Whitespace
Notion처럼 — 공백이 디자인이다. 섹션 사이 최소 64px. 여백이 접근성을 만든다.

### Border Radius Scale
- `4px` — 인풋, 소형 요소
- `6px` — 기본 버튼
- `12px` — 카드, 컨테이너
- `16px` — 모달, 주요 피처 카드
- `9999px` — 배지 pill

---

## 6. Depth & Elevation

| Level | Treatment | 용도 |
|---|---|---|
| Flat (0) | 없음 | 페이지 배경 |
| Whisper (1) | `1px solid rgba(0,0,0,0.1)` | 카드/컨테이너 기본 보더 |
| Soft Card (2) | 4겹 shadow (max 0.04) | 일반 카드 |
| Deep Card (3) | 5겹 shadow (max 0.05, 52px) | 모달 |
| 진보 (A) | `1px solid rgba(0,82,204,0.25)` + top 3px `#0052cc` | 진보 배틀 카드 |
| 보수 (B) | `1px solid rgba(217,48,37,0.25)` + top 3px `#d93025` | 보수 배틀 카드 |

그림자는 누적 opacity 절대 0.06 초과 금지. 색깔 있는 그림자 없음.

---

## 7. Do's and Don'ts

### Do
- 흰 배경 ↔ `#f6f5f4` 교차로 섹션 리듬 만들기
- 진보=블루(`#0052cc`), 보수=레드(`#d93025`) 일관 유지
- `rgba(0,0,0,0.1)` whisper border 기본값으로
- 진영 표시는 배지 pill로만 — 카드 배경 컬러 변경 없음
- 그림자 4–5겹 초저불투명도
- letter-spacing 폰트 크기에 반비례 적용
- 배틀 카드 진영 구분: 탑 보더 3px만

### Don't
- 보라색, 그라디언트, glassmorphism, 글로우 일절 없음
- 색깔 있는 box-shadow 없음 (rgba(0,0,0,...) 만)
- 카드 radius 16px 초과 없음 (모달 제외)
- 진보/보수 컬러를 배경 wash로 깔지 않음
- 두 채도 컬러 동시에 과다 노출 없음

---

## 8. Responsive Behavior

### Breakpoints
| Name | Width | 주요 변화 |
|---|---|---|
| Mobile | < 768px | 1열, 히어로 64→36px, 배틀 상하, nav 햄버거 |
| Tablet | 768–1023px | 2열 카드, 배틀 좌우 유지 |
| Desktop | ≥ 1024px | 3열 카드, 풀 히어로 |

### Collapsing
- 히어로 타이포: 64px → 48px → 36px
- 카드: 3 → 2 → 1열
- 배틀: 좌우 → 상하 (진보 위, 보수 아래)
- 섹션 패딩: 96 → 64 → 40px

---

## 9. Agent Prompt Guide

### Quick Color Reference
```
배경:       #ffffff
교차 배경:  #f6f5f4
메인 텍스트: rgba(0,0,0,0.95)
부 텍스트:  #615d59
연한 텍스트: #a39e98
진보:       #0052cc
보수:       #d93025
중립/팩트:  #b45309
기본 보더:  rgba(0,0,0,0.1)
```

### Example Component Prompts

1. *"히어로: 흰 배경. Pretendard 64px/700, letter-spacing -1.5px, line-height 1.05, rgba(0,0,0,0.95). 부제목 17px/400 #615d59 line-height 1.65. CTA: #0052cc, 흰 텍스트, 6px radius, 9px 18px padding."*

2. *"정치인 카드: 흰 배경, 1px solid rgba(0,0,0,0.1), 12px radius. 그림자: rgba(0,0,0,0.04) 0px 4px 18px + 3겹 추가. 제목 22px/700 -0.3px. 정당 배지: pill, 진보면 #0052cc 텍스트 + rgba(0,82,204,0.08) 배경."*

3. *"배틀 UI: 좌우 50% 분할, 중간 1px solid rgba(0,0,0,0.1). 좌(진보): 흰 배경, 1px solid rgba(0,82,204,0.25), 상단 3px solid #0052cc. 우(보수): 1px solid rgba(217,48,37,0.25), 상단 3px solid #d93025. 글로우 없음."*

4. *"성향 슬라이더: 5단계. 왼쪽 #0052cc, 중간 #a39e98, 오른쪽 #d93025. 선택: outlined 버튼. 카드: 흰 배경, 12px radius, Card Shadow."*

5. *"네비: 흰 배경, 하단 1px solid rgba(0,0,0,0.1). 로고 '좌'=#0052cc '우'=#d93025 '지간'=rgba(0,0,0,0.95) / Pretendard 20px/700. 링크 15px/500 #615d59. CTA: #0052cc '시작하기' 6px radius."*

### Iteration Checklist
1. **AI 징후 제거**: 보라색·그라디언트·글로우·glassmorphism 발견 즉시 제거
2. **그림자 체크**: 색깔 그림자 → rgba(0,0,0,...) 검정으로 교체
3. **진영 컬러**: 배경 wash → badge pill로만
4. **그레이 체크**: 파란 그레이 → `#615d59`, `#a39e98`으로
5. **보더 체크**: 진한 보더 → `rgba(0,0,0,0.1)` whisper로
6. **배틀 카드**: 글로우 없음, 탑 보더 3px만으로 진영 구분
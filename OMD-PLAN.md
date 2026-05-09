# OMD-PLAN — 좌우지간 home 리디자인 (토스 톤)

> Generated 2026-05-09 · run `run-2026-05-09T06-19-10-793Z-모든-페이지-리디자인-토스-스타일`
> Source of truth: 본 파일을 직접 편집해도 됩니다. 편집 후 picker에서 `edit (Other)` 선택 + 한 줄 알려주세요.

---

## 1. Intent

**모든 페이지 리디자인 → 우선 home 한 화면을 깊게.**
나머지 화면(arena / mypage / politicians / onboarding)은 home에서 정립한 토큰·voice를 적용하는 후속 라운드로 처리. 본 계획은 home 1차 라운드에 한정.

## 2. Audience

- **MZ 정치 리터러시 사용자** (DESIGN.md §Brand 그대로 유지, 신규 페르소나 추가 없음)
- 보조 페르소나 가정: "지역구 막 설정한 첫 방문자" / "재방문 — 핫이슈 빠르게 훑고 배틀로 진입"

## 3. Tone seed

**토스 (toss) — calm-cerulean, 본문 타이포 + 굵은 숫자 + 여백, 장식 거의 0.**

DESIGN.md 기존 토큰과 정합:
- primary `#3182f6` ↔ 토스 브랜드 블루와 동일 계열 → 그대로 사용
- secondary `#ef4444` ↔ 보수 시그널 전용으로 한정 (브랜드 강조에 사용 금지)
- light mode only / typography-first / Pretendard — DESIGN.md §Style 그대로 강화

## 4. Exit scope

**코드 패치까지** — `src/containers/home/index.tsx` 직접 수정 (emotion styled-components 그대로 유지).
- 추가로 `DESIGN.md.patch` 한 건 — Voice 섹션 1-2줄 보강 + 토큰 미세 정렬
- 새 컴포넌트 추출은 최소화 (이번 라운드는 in-file 수정 위주)

## 5. Risk areas (사용자 지정)

1. **DESIGN.md 금지 패턴 위반 제거** — 현재 코드 검사 결과
   - `IntroBand` 배경 `#f8f9fa` ✅ 무난 (gradient 아님)
   - `MotionBattleBanner` 배경 `#111827` solid ✅
   - `box-shadow: 0 10px 30px rgba(15, 23, 42, 0.05)` on `ProfileChip` ⚠️ 토스 스타일 아님 — 제거 또는 1px border 1단으로 환원
   - `border-radius: 12px` on banner / `999px` on chip / `6px` on buttons → 토스는 보통 12-14 / 8 / pill 일관성. 검토 필요.
   - `framer-motion` `y: 12-22` initial slide → 토스는 모션 거의 0. opacity-only로 축소 또는 제거.
2. **타이포 스케일 재정렬** — DESIGN.md `32 / 24 / 18 / 16 / 14`인데 현재 코드는 `1.04rem / 18px / 15px / 14px / 13px / 12px / 11px` 혼재. 코드를 spec에 맞춰 정렬:
   - h1 `IntroTitle` 18 → **24** (토스 메인 헤딩 톤)
   - h2 `SectionTitle` 15 → **18**
   - h2 `BannerTitle` 20 → **24**
   - body 13 → **16** (DESIGN.md body 기준)
   - meta 11-12 → **14** 통일
   - `IntroEyebrow` / `SectionEyebrow` `text-transform: uppercase` + letter-spacing → **제거** (토스 안 씀, 한국어 콘텐츠에 부적합)
3. **여백 / 밀도** — 토스는 섹션간 32-48px / 컴포넌트 내부 16-24px. 현재 `MotionSection padding-top: 24px` + `SectionHeader padding 10/12` → 섹션 간 여백을 **40px**로, 본문 row 간 12-16px로 정돈. `Main width 720px` 유지.
4. **마이크로카피 voice 통일** — 현재 혼재된 톤:
   - "오늘 확인할 정치 이슈와 지역구 의원을 바로 볼 수 있어요" → 길고 설명적 (토스 X)
   - "AI가 대신 싸워드립니다" → 캐치 카피티 (토스 X, 약간 마케팅톤)
   - "오늘 나온 쟁점을 빠르게 훑어봅니다" → 토스 톤 근접 ✅
   - "맞춤 홈 브리핑" → 가식적 ("브리핑" 제거)
   - 통일 원칙: **사실 진술 + 명사형 종결 + 명확한 숫자** (토스 voice). 자세한 카피 표는 Phase 7에서.

## 6. Phase plan

| # | Phase | 산출물 | 게이트 |
|---|---|---|---|
| 2 | UX Research | `references-cited.md` (toss home / toss certs / 1-2 newneek 비교) | 자동 |
| 3 | IA / Journey | 생략 (단일 화면, 기존 IA 유지) | — |
| 4 | Wireframe | `wireframes/home.md` — 섹션 순서 + 여백 + 타이포 명시 ASCII | **사용자 승인** |
| 5 | DESIGN.md.patch | Voice 1-2줄 보강 + Typography scale 명시 + Forbidden Patterns에 "framer-motion y-slide entrance" 추가 | **사용자 승인** |
| 6 | Components | 신규 컴포넌트 추출 없음 — `home/index.tsx` 인라인 수정으로 처리 | 자동 |
| 7 | Microcopy | `components/microcopy.json` — IntroTitle / IntroText / SectionTitle / BannerTitle / BannerText / CompactNoticeLabel 6-10개 키 재작성 | 자동 |
| 7.5 | UX-writer + UX-engineer 병렬 audit | 섹션별 critique + 대안 + impact/effort 우선순위 | **사용자 승인** (top fixes pick) |
| 8 | Validation | a11y-auditor + persona-tester × 2 (첫 방문자 / 재방문) | 자동 |
| 9 | 코드 패치 적용 | `src/containers/home/index.tsx` Edit, `DESIGN.md` patch apply | **SHIP_GATE** |

## 7. Success criteria

**정성**
- 토스 home 옆에 두고 "같은 디자이너 손" 느낌 — 본문 우선, 장식 zero, 숫자 강조.
- DESIGN.md Forbidden Patterns 7개 중 위반 0건.
- 마이크로카피 한 줄도 마케팅톤 없음.

**정량**
- IntroTitle 24 / SectionTitle 18 / body 16 / meta 14 — 5단 스케일로 환원.
- 섹션 간 수직 리듬 40px 일관.
- box-shadow 발생 0건 (chip 포함).
- framer-motion y-translate 제거 (opacity fade만 유지 또는 모션 zero).

## 8. A11y floor

WCAG AA (DESIGN.md 기본 준수). 추가 점검:
- IssueText `$tone="red"` `#ef4444` on white → contrast 3.76 ⚠️ AA 본문 4.5 미달. 색만으로 진보/보수 구분 X — 라벨 텍스트 + 색 병행 OK이나 본문에 빨강/파랑 그대로 쓰지 말고 **본문은 #111827로, 라벨만 색** 으로 분리 검토.

## 9. Asset policy

신규 에셋 추가 없음. 기존 정당 로고 그대로.

## 10. Reference URLs

- toss.im (home) — primary 톤 레퍼런스
- DESIGN.md (project root) — 기존 spec
- 67-catalog `references/toss/DESIGN.md` — 본 라운드 fold-in 시 Voice 시그니처 참조

## 11. Out of scope (이번 라운드 X)

- arena / mypage / politicians / onboarding 페이지
- 다크모드
- 신규 컴포넌트 추출 (Button / Card 등 분리)
- 신규 에셋 (favicon / og image 등)
- 데이터 영속화 / API / 백엔드

후속 라운드에서 별도 OMD-PLAN으로.

---

## 12. Picker

`go` 누르면 Phase 2부터 순차 진행. 원하면 OMD-PLAN.md 직접 편집 후 `edit (Other)` + 한 줄.

---
omd: 0.1
brand: 좌우지간
base_ref: toss
---

# Design System: 좌우지간

## 1. Visual Theme & Atmosphere

좌우지간 is a political literacy platform built for the generation that gets its news from smartphones, not newspapers. The page opens on a clean white canvas (`#ffffff`) with deep charcoal headings (`#191f28`) and a signature blue (`#3182f6`) — the same cerulean conviction that a political view can be understood without being sold. Two semantic colors define the product's purpose: the primary blue carries progressive framing; the conservative red (`#ef4444`) carries equal visual weight. Neither dominates the interface except in direct political context.

The **Pretendard** typeface is the quiet hero. Purpose-built for Korean-Latin mixed text, it balances hangul and Latin characters with the same optical care that financial apps apply to numerals. The font ships in 9 weights but the UI exercises restraint, primarily using 400, 600, and 700. No decorative illustration font; political content requires no embellishment beyond the words themselves.

What defines 좌우지간 visually is restraint in a space that isn't restrained. Political media defaults to outrage colors, punchy headlines, and tribal iconography. 좌우지간 refuses all of it. A calm white surface, two colors with clear semantic roles, one typeface in three weights. Clarity is the position.

**Key Characteristics:**
- 좌우지간 Blue (`#3182f6`) as primary interactive color + progressive political indicator
- 좌우지간 Red (`#ef4444`) as conservative political indicator — equal visual weight, never used as error
- Pretendard with Korean-Latin optical balancing
- 10-step grey scale with warm undertones
- Three-tier token architecture: primitive → semantic → component
- Minimal shadow system — trust comes from clarity, not depth
- Mobile-first at 375px design baseline

## 2. Color Palette & Roles

### Primary
- **좌우지간 Blue** (`#3182f6`): `blue500`. Primary interactive color — CTAs, links, active states, selection highlights. In political context, also the designated progressive-leaning accent.
- **Blue Hover** (`#2272eb`): `blue600`. Hover/pressed state for blue500 elements.
- **Blue Light** (`#e8f3ff`): `blue50`. Informational backgrounds, progressive-leaning issue tags, subtle blue-tinted surfaces.
- **Pure White** (`#ffffff`): `background`, `layeredBackground`. Page background, card surfaces.
- **Dark Charcoal** (`#191f28`): `grey900`. Primary heading color, strongest text. Warm near-black.

### Political Semantic
- **Conservative Red** (`#ef4444`): `red.political`. Conservative-leaning political accent — politician party tags, issue position indicators, arena opponent side. Never used for error states.
- **Conservative Light** (`#fef2f2`): `red.politicalLight`. Conservative-side subtle backgrounds, tag fills.

### Brand (Logo/Marketing Only)
- **Brand Blue** (`#0064FF`): Logo and marketing materials only. Distinct from UI blue500.

### Semantic (State-based)
- **Error Red** (`#f04452`): `red500`. Error states, destructive actions only. Visually close to conservative red but semantically separate — never appears alongside political content in the same context.
- **Success Green** (`#03b26c`): `green500`. Confirmations, positive indicators.
- **Warning Orange** (`#fe9800`): `orange500`. Pending states, attention-needed indicators.
- **Info Teal** (`#18a5a5`): `teal500`. Informational accent, neutral issue framing.

### Neutral Scale
- **Grey 50** (`#f9fafb`): Lightest gray, `greyBackground` surface.
- **Grey 100** (`#f2f4f6`): Secondary background, card fills, disabled surfaces.
- **Grey 200** (`#e5e8eb`): Default border color, dividers, input backgrounds.
- **Grey 400** (`#b0b8c1`): Placeholder text, disabled icon fills.
- **Grey 500** (`#8b95a1`): Caption text, secondary labels.
- **Grey 600** (`#6b7684`): Body text, descriptions, metadata.
- **Grey 700** (`#4e5968`): Emphasized body text, sub-headings.
- **Grey 800** (`#333d4b`): Strong labels, navigation text.

### Surface & Borders
- **Border Default**: `#e5e8eb` (grey200). Standard card borders, input borders, dividers.
- **Border Strong**: `#d1d6db` (grey300). Emphasized borders, active input outlines.
- **Background Float**: `#ffffff`. Floating elements — tooltips, dropdowns.
- **Overlay Scrim**: `rgba(2,9,19,0.5)` to `rgba(2,9,19,0.91)`. Blue-tinted dark overlays.

## 3. Typography Rules

### Font Family
- **Primary**: `"Pretendard", "Apple SD Gothic Neo", Roboto, "Noto Sans KR", sans-serif`
- **Monospace**: `"SF Mono", SFMono-Regular, Menlo, Consolas, monospace`

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|------|--------|-------------|----------------|-------|
| Display Hero | Pretendard | 30px | 700 | 40px (1.33) | normal | Hero screens, key stat moments |
| Display Large | Pretendard | 26px | 700 | 36px (1.38) | normal | Section headers, issue titles |
| Heading Large | Pretendard | 22px | 700 | 30px (1.36) | normal | Feature titles, modal headers |
| Heading | Pretendard | 20px | 600 | 28px (1.40) | normal | Card headings, sub-sections |
| Subtitle | Pretendard | 16px | 600 | 24px (1.50) | normal | Navigation titles, list headers |
| Body Large | Pretendard | 16px | 400 | 24px (1.50) | normal | Descriptions, issue summaries |
| Body | Pretendard | 14px | 400 | 22px (1.57) | normal | Standard reading text |
| Body Small | Pretendard | 13px | 400 | 20px (1.54) | normal | Secondary information |
| Caption | Pretendard | 12px | 400 | 18px (1.50) | normal | Timestamps, source attribution |
| Stat Display | Pretendard | 30px+ | 700 | tight | normal | Vote counts, poll numbers — tabular nums |

### Principles
- **Nine weights, three used**: Ships 100-900, but UI uses 400 (body), 600 (emphasis), 700 (headings). Restraint over variety.
- **Stat numerals**: Fixed-width (tabular) for poll percentages, vote counts, and comparative statistics. Variable-width for display text. Context determines mode.
- **Korean-Latin optical balance**: Korean characters and Latin/numerals are independently weighted so mixed text looks harmonious without manual kerning.
- **Political label legibility**: Issue position tags (진보/보수/중도) given enhanced legibility at small sizes — political framing must be readable at a glance.

## 4. Component Stylings

### Buttons

**Primary (Fill)**
- Background: `#3182f6` (blue500)
- Text: `#ffffff`
- Radius: 8px–12px
- Font: 16px weight 600
- Pressed: dimmed overlay
- Loading: 3-dot animation replacing text
- Disabled: reduced opacity via `--button-disabled-opacity-color`
- Display modes: `inline` (auto-width), `block` (full-width), `full` (fills parent)
- Sizes: `tiny`, `medium`, `large`, `big` (default)
- Use: Primary CTAs (`이슈 보기`, `정치인 확인`, `배틀 참여하기`)

**Secondary (Weak)**
- Background: `#e8f3ff` (blue50) or `#f2f4f6` (grey100)
- Text: `#3182f6` (blue500) or `#191f28` (grey900)
- Use: Secondary actions, filter chips, less prominent CTAs

**Dark**
- Background: `#191f28` (grey900)
- Text: `#ffffff`
- Use: Actions on light backgrounds where blue would carry unintended political connotation

**Danger**
- Background: `#f04452` (red500)
- Text: `#ffffff`
- Note: Never use conservative red (`#ef4444`) here — error and political semantics must not overlap

### Cards & Containers

**Issue Card**
- Background: `#ffffff`
- Border: 1px solid `#e5e8eb` (grey200)
- Radius: 12px
- Shadow: `0px 2px 8px rgba(0,0,0,0.08)`
- Layout: Headline (16px weight 600, `#191f28`) + summary (14px weight 400, `#6b7684`) + bottom row (timestamp `#8b95a1` left / political tag right)
- Political tag: 12px weight 600, blue50 bg + blue500 text for 진보, red.politicalLight bg + `#ef4444` text for 보수

**Politician Profile Card**
- Same container as Issue Card
- Layout: 40px circle avatar left + name (16px weight 700) + party tag (12px weight 600, political color) + key stance snippet (13px weight 400, `#6b7684`)

**Arena Card**
- Split-screen structure: blue side (진보 position) | red side (보수 position)
- Left half: `#e8f3ff` tint, `진보` label 12px weight 600 blue500 top
- Right half: `#fef2f2` tint, `보수` label 12px weight 600 `#ef4444` top
- Center divider: 1px `#e5e8eb`
- Each side: position text 14px weight 400 `#191f28`

### Inputs & Forms
- Background: `#f2f4f6` (grey100) for contained variant
- Border: 1px solid `#e5e8eb`, focus: 2px solid `#3182f6`
- Radius: 8px
- Text: `#191f28`, Placeholder: `#b0b8c1` (grey400)
- Error border: `#f04452` (red500) — not conservative red

### Navigation
- Bottom tab bar: white background, top border `#e5e8eb`
- Active: `#3182f6` icon + `#191f28` text, Inactive: `#b0b8c1` icon + `#8b95a1` text
- Top app bar: white, sticky, optional backdrop blur on scroll
- Segmented control for 진보/보수/중도 filter switching

### Overlays
- Bottom Sheet: `#ffffff`, 16px top radius
- Dialog: centered modal, alert and confirm variants
- Toast: floating notification, subtle shadow, auto-dismiss
- Tooltip: `#191f28` background, white text, arrow pointer

## 5. Layout Principles

### Spacing System
- Base unit: 8px
- Common values: 4px, 8px, 12px, 16px, 20px, 24px, 32px, 40px, 48px
- Horizontal padding: 20px
- Political label grids: 4px internal spacing

### Grid & Container
- Design baseline: 375px mobile width
- Content: full-width with 20px horizontal padding
- Single-column, mobile-first
- Issue list: full-width rows with consistent left-align

### Whitespace Philosophy
- **Breathing room for political claims.** Issue headlines get extra surrounding space. A claim at 20px type with 24px margins communicates confidence; the same claim crammed at 8px margins looks like push notification spam.
- **Progressive density.** The home feed is spacious; issue detail and politician profile screens are denser. The deeper the user navigates, the more information per pixel — they've committed to the topic and want facts.
- **Grouped by alignment.** Progressive and conservative positions separated by clear structural dividers; related content within a group uses 8–12px gaps.

### Border Radius Scale
- Compact (4px): Small badges, inline political stance tags
- Standard (8px): Inputs, small buttons, compact cards
- Comfortable (12px): Issue cards, dialog corners
- Large (16px): Featured cards, bottom sheet top corners
- Pill (9999px): Toggle switches, filter chips

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat (Level 0) | No shadow | Page background, inline elements |
| Subtle (Level 1) | `0px 1px 3px rgba(0,0,0,0.06)` | Slight lift, list item separation |
| Standard (Level 2) | `0px 2px 8px rgba(0,0,0,0.08)` | Issue cards, content panels |
| Elevated (Level 3) | `0px 4px 12px rgba(0,0,0,0.12)` | Dropdowns, popovers, floating buttons |
| Modal (Level 4) | `0px 8px 24px rgba(0,0,0,0.16)` | Bottom sheets, dialogs |

**Shadow Philosophy**: 좌우지간 keeps shadows minimal and neutral. In political content, visual noise undermines credibility — elevation is communicated through subtle opacity differences rather than dramatic depth. No colored shadows. Where other political apps use heavy red-vs-blue gradients to signal stakes, 좌우지간 uses restraint as its credibility statement.

### Blur Effects
- Menu components use backdrop blur for lightweight floating panels
- Navigation bar applies subtle blur on scroll for the sticky header

## 7. Do's and Don'ts

### Do
- Use 좌우지간 Blue (`#3182f6`) for all interactive elements — links, buttons, toggles, selections
- Apply the full Pretendard font stack with Korean fallbacks
- Use tabular (fixed-width) numerals for poll percentages and vote/seat counts
- Use 700 weight for issue headlines and key stats, 400 for body, 600 for emphasis
- Keep border-radius between 8px–16px for most elements
- Use blue (`#3182f6` / `#e8f3ff`) for progressive framing only when in direct political context
- Use red (`#ef4444` / `#fef2f2`) for conservative framing only when in direct political context
- Treat both political colors with exactly equal visual weight — neither side is visually privileged

### Don't
- Don't use conservative red (`#ef4444`) for error states — that is `#f04452` exclusively
- Don't use heavy shadows — rely on background color layering, not depth
- Don't use bold (700) for body text — reserved for headings and key stats
- Don't mix tabular and variable-width numerals in the same data context
- Don't use either political color (blue/red) as decoration when not in explicit political context
- Don't use border-radius > 16px except for pills/toggles
- Don't add declarative styling (aggressive headlines, full-bleed political color washes) that implies editorial alignment

## 8. Responsive Behavior

### Breakpoints
| Name | Width | Key Changes |
|------|-------|-------------|
| Mobile (Primary) | <480px | Full design fidelity, 375px baseline |
| Tablet | 480–768px | Expanded cards, optional side margins |
| Desktop | >768px | Centered column, max-width ~480px for mobile-web parity |

### Touch Targets
- Buttons: xlarge (~56px), large (~48px), medium (~40px), small (~36px)
- Issue list items: minimum 52px row height
- Arena battle vote buttons: large targets (56–64px) — committed choice, mis-tap must be impossible

### Collapsing Strategy
- Desktop web mirrors mobile layout in a centered column
- Bottom sheet → modal dialog on larger screens
- Sticky bottom CTA bar with safe area insets on all devices
- Horizontal scrolling card carousels for politician discovery

### Image Behavior
- Politician photos: 40–56px avatar circle with consistent sizing within context
- Charts/graphs: full-width, responsive, maintain aspect ratio
- No decorative illustrations

## 9. Agent Prompt Guide

### Quick Color Reference
- Primary CTA: 좌우지간 Blue (`#3182f6`)
- CTA Hover: Blue 600 (`#2272eb`)
- Background: Pure White (`#ffffff`)
- Background Surface: Light Gray (`#f2f4f6`)
- Heading text: Dark Charcoal (`#191f28`)
- Body text: Medium Gray (`#6b7684`)
- Caption text: Gray (`#8b95a1`)
- Placeholder: Soft Gray (`#b0b8c1`)
- Border: Gray 200 (`#e5e8eb`)
- Progressive accent: Blue (`#3182f6`) / Blue Light (`#e8f3ff`)
- Conservative accent: Red (`#ef4444`) / Red Light (`#fef2f2`)
- Error (state only, never political): Red 500 (`#f04452`)
- Success/Positive: Green (`#03b26c`)
- Warning: Orange (`#fe9800`)

### Example Component Prompts
- "Create an issue card: white bg, 12px radius, 20px padding. Headline 16px weight 600 `#191f28`. Summary 14px weight 400 `#6b7684`. Bottom row: timestamp 12px `#8b95a1` left, political tag right (진보: blue50 bg + blue500 text 12px weight 600 / 보수: `#fef2f2` bg + `#ef4444` text). Shadow `0px 2px 8px rgba(0,0,0,0.08)`."
- "Build a politician profile card: white bg, 12px radius, 20px padding. Left: 40px circle avatar. Right: name 16px weight 700 `#191f28`, party tag 12px weight 600 in political color, stance snippet 13px weight 400 `#6b7684`."
- "Design an arena battle screen: full-width split. Left half `#e8f3ff` tint, `진보` label 12px weight 600 blue500 top-left. Right half `#fef2f2` tint, `보수` label 12px weight 600 `#ef4444` top-right. Center divider 1px `#e5e8eb`. Each side: position text 14px weight 400 `#191f28`. Bottom: vote button full-width each side (blue500 / `#ef4444` bg, white text, 16px weight 600, 56px height)."
- "Create a bottom tab bar: white bg, top border 1px `#e5e8eb`. 4 tabs (홈, 이슈, 정치인, 마이페이지). Active: `#3182f6` icon + `#191f28` label 11px weight 500. Inactive: `#b0b8c1` icon + `#8b95a1` label. Height 56px with safe area."
- "Design an onboarding screen: white bg, full-width 20px padding. One idea per screen. Heading 26px weight 700 `#191f28`. Sub-copy 16px weight 400 `#6b7684`. CTA at bottom: `#3182f6` bg, white text, 16px weight 600, 56px height, 12px radius, full-width."

### Iteration Guide
1. Always use the full Pretendard font stack with Korean fallbacks
2. Primary interactive color is `#3182f6` — in political context this also signals progressive framing
3. Conservative red is `#ef4444` — never use on error states (that is `#f04452`)
4. Grey scale has warm undertones: grey900 `#191f28`, grey50 `#f9fafb`
5. Border-radius: 8px inputs, 12px cards, 16px sheets, pill for filter chips
6. Shadows are single-layer, pure black opacity, no colored tints
7. Mobile-first: design at 375px, 20px horizontal padding
8. Political colors appear only where they carry meaning — never as decoration

---

## 10. Voice & Tone

좌우지간 speaks like a trusted friend who read the news so you don't have to: calm, unhurried, zero jargon, and visibly refusing to take sides. Political information is stated, not framed. Korean is the primary voice. Sentences end in periods; buttons do not. No emoji on issue and politician screens. No exclamation marks except in explicit user celebration moments (arena result reveal).

| Context | Tone |
|---|---|
| CTAs | Imperative, short Korean verb form (`이슈 보기`, `정치인 확인`, `배틀 참여하기`) |
| Issue summaries | Declarative single sentence. Passive framing preferred. No adjectives that editorialize. |
| Error messages | Specific + blameless + actionable. Never `문제가 발생했습니다`. |
| Onboarding screens | Second-person, one idea per screen, no bullet lists. |
| Political stats | Bare numerals with units. `63%`, `212석`, `3,847표`. Never `약 60%` or `200여 석`. |
| Empty states | Explain the *why* in one line, offer one action. Never `데이터가 없습니다`. |
| Arena results | Neutral framing. `A 의견 54% / B 의견 46%` — no winner language, no congratulation. |

**Forbidden phrases.** `불편을 드려 죄송합니다`, `Oops`, `죄송하지만`, any phrase implying editorial alignment (`~라는 주장`, `~측에 따르면`, `사실은`), approximations on statistics (`약 60%`, `200여 석`), any exclamatory framing on political topics, sentences starting with `I'm sorry` in English strings.

## 11. Brand Narrative

좌우지간 is a political literacy platform for a generation that knows more about trending audio than pending legislation. The product launched with a single founding refusal: that political information in Korea defaults to outrage, tribal color, and the presumption that the reader has already picked a side. 좌우지간 refuses that aesthetic vocabulary entirely.

The name — 좌우지간 ("regardless of left or right" / "between left and right") — is a double meaning: it spans the political spectrum, and it signals that the facts matter regardless of alignment. The thesis is "정치를 어렵지 않게, MZ세대의 언어로." The tagline is "선동 없는 정치 정보." Both are commitments, not copy.

What 좌우지간 refuses: the red-vs-blue war-room palette of legacy political media, the shallow virality of political social feeds, the presumption that young people are apathetic rather than under-served. The interface treats the user as someone who wants to understand, not someone who wants to be confirmed in what they already think.

## 12. Principles

1. **Breathing room for political claims.** Issue headlines get ≥1.5× the surrounding spacing of normal text. A position stated in 20px with 24px margins communicates confidence; the same position crammed at 8px margins looks like a push notification.
2. **Progressive density.** The home feed is spacious; issue detail and politician profile screens are denser. The deeper the user navigates, the more information per pixel — they've committed to the topic and want facts.
3. **One position, equal halves.** If a screen shows both progressive and conservative positions, they are equal halves — not hero-and-footnote. Neither side is visually privileged at the component level.
4. **Blue and red are information, not decoration.** `#3182f6` and `#ef4444` appear only where they carry political meaning or signal interactivity. They never decorate headers, borders, or backgrounds without that specific intent.
5. **Restraint communicates neutrality.** A single accent color on a white surface says "I'm showing you something." Two equal accent colors on a white surface says "I'm showing you both sides." Visual balance is the product's core claim.
6. **Korean and Latin are co-equal.** Typography stacks and optical weights assume both scripts render simultaneously in the same line.
7. **Numbers are facts.** Poll percentages, seat counts, and vote shares use 700 weight and tabular numerals. Approximations are forbidden on primary surfaces.
8. **Negative space is editorial restraint.** If reducing padding would fit more content, the answer is a second screen, not a busier layout.

## 13. Personas

*Personas below are fictional archetypes informed by the stated target segments of the 좌우지간 platform.*

**지은 (Jieun), 23, 서울.** University student, politically interested but overwhelmed. Opens 좌우지간 when something big happens in the news and she wants to understand it without reading fourteen conflicting articles. Needs the issue summary to be readable in 30 seconds. Would close the app immediately if it felt like it was pushing her toward a position. Her friends share screenshots of politician comparisons more than they share news articles. She is the "정치에 관심 없던 20대" who became interested — and the platform must not lose her to cynicism.

**태양 (Taeyang), 27, 부산.** Software engineer, first-time voter in the last election. Had never engaged with politics until a policy directly affected his industry. Uses 좌우지간 to track specific politicians related to tech and labor legislation. Wants the politician profile to show stances, not personality. Distrusts anything that looks like PR. Would recommend the app only if he trusts it is not subtly aligned. He is the "처음 투표하는 MZ" who showed up and intends to stay informed.

**혜린 (Hyerin), 32, 성남.** Mid-level manager, votes in every election but finds political media gives her noise rather than signal. Uses 좌우지간 on the commute. Wants the arena feature not as entertainment but as format — she wants the strongest argument on both sides, then she decides. Subscribes to newsletters but prefers mobile-native experiences for speed. She is the "균형있는 관점을 원하는 직장인" who has the habit but lacks the tool.

## 14. States

| State | Treatment |
|---|---|
| **Empty (first use)** | Single paragraph of `grey700` body text explaining *why* the screen is empty (`아직 확인한 이슈가 없어요`), plus one suggested action as a secondary button (blue50 bg, blue500 text). Never an illustration. Never `데이터가 없습니다`. |
| **Empty (filter cleared)** | Single line of `grey500` caption (`조건에 맞는 결과가 없어요`). No button — user resets the filter themselves. |
| **Loading (first paint)** | Skeleton blocks matching the final layout structure at `#f2f4f6` (grey100). Political stat numerals render as `--` until resolved; they never appear as skeleton blocks (would imply a placeholder value). |
| **Loading (refresh)** | Top bar pull-down spinner in blue500. No overlay, no blocking. Content stays visible with previous values. |
| **Error (inline field)** | `#f04452` (red500) 2px border on the input, error text below in red500 13px. One actionable sentence (`검색어를 다시 확인해주세요`). |
| **Error (toast)** | `#191f28` background, white 14px 400 text, 3s auto-dismiss. One sentence. No icons. Bottom of screen with 20px inset. |
| **Error (screen-blocking)** | Reserved for server outage. White screen, centered single-line message in `grey900` 16px weight 600, retry button in blue500. No illustration. |
| **Success (inline flash)** | Brief flash of `#e8f3ff` (blue50) behind the updated element, 300ms fade to default. For routine actions like saving a preference. |
| **Arena vote committed** | Dedicated confirmation state — not a toast. The user's chosen side fills with full political color (`#3182f6` or `#ef4444`), result percentages animate in with tabular numerals. This weight is intentional; a political position taken is not a toast moment. |
| **Skeleton** | `#f2f4f6` blocks at exact final dimensions. 1.2s shimmer as `linear-gradient` with 8% white highlight. Rounded at component radius (8px/12px/16px). Never used on political stats — those show `--`. |
| **Disabled** | Button opacity drops per `--button-disabled-opacity-color`. Disabled inputs keep `grey200` border so geometry is stable if re-enabled. |
| **Loading inside pressed button** | Text replaced by 3-dot animation in white. Width unchanged. Cannot double-submit. |

## 15. Motion & Easing

**Durations:**

| Token | Value | Use |
|---|---|---|
| `motion-instant` | 0ms | Toggle flips, checkbox state changes |
| `motion-fast` | 150ms | Hover, focus, small reveals, button press overlay |
| `motion-standard` | 250ms | Default — sheet opens, card expands, tab switches |
| `motion-slow` | 400ms | Emphasized transitions — arena result reveal, onboarding step advances |
| `motion-page` | 350ms | Full-screen transitions between top-level routes |

**Easings:**

| Token | Curve | Use |
|---|---|---|
| `ease-enter` | `cubic-bezier(0.0, 0.0, 0.2, 1)` | Things appearing — sheets, toasts, screen pushes |
| `ease-exit` | `cubic-bezier(0.4, 0.0, 1, 1)` | Things leaving — dismissals, pops |
| `ease-standard` | `cubic-bezier(0.4, 0.0, 0.2, 1)` | Two-way transitions — collapsible cards, tab content |
| `ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Reserved. Only for arena vote commit animation. Nowhere else — overshoot on routine UI would feel unserious. |

**Signature motions.**

1. **Stat updates.** When poll numbers update, the old number slides up 20px and fades out (`motion-fast / ease-exit`), the new number slides in from below 20px (`motion-standard / ease-enter`). Never cross-fade political statistics — a number flickering between values looks like a data error.
2. **Bottom-sheet presentation.** Sheets rise from `y+40px` with `motion-standard / ease-enter` and a synchronized backdrop fade from `rgba(2,9,19,0)` to `rgba(2,9,19,0.5)`. Dismissal uses `motion-fast / ease-exit` — leaving feels lighter than entering.
3. **Arena vote reveal.** On position commit, the result percentages count up over `motion-slow` with `ease-spring`. This is the one place spring easing is licensed. Everywhere else, standard easing.
4. **Reduce motion.** If `prefers-reduced-motion: reduce`, all `motion-*` tokens collapse to `motion-instant`. Crossfades replace slides. The app stays usable; just less kinetic.

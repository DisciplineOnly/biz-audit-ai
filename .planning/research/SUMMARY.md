# Project Research Summary

**Project:** BizAudit v1.1 — Localization & Sub-Niche Specialization
**Domain:** i18n retrofit + Bulgarian market localization + sub-niche form branching for an existing React SPA
**Researched:** 2026-02-21
**Confidence:** HIGH

## Executive Summary

BizAudit v1.1 adds two orthogonal capabilities to a working v1.0 product: URL-based language routing with full Bulgarian translation, and sub-niche specialization of form answer options across 17 sub-niches (12 Home Services + 5 Real Estate). The existing architecture is well-suited to both additions — the React Router v6 BrowserRouter, Supabase backend, and Claude Haiku 4.5 edge function all accommodate the changes without replacement. The recommended approach is i18next + react-i18next for i18n, optional URL path segments (`/bg/*`) for language routing, and a config-driven sub-niche data model rather than conditional branching. The key recommendation: establish the i18n infrastructure and type-safe sub-niche config layer before writing any translated or sub-niche-specific content, because retrofitting either after content exists is significantly more expensive.

The primary risk is the scoring engine breaking silently for Bulgarian users. The existing `scoring.ts` stores English answer strings as both display labels and state values — when Bulgarian labels replace them, every lookup in `scoreMap()` returns the fallback score of 1, producing uniform ~33/100 scores for all Bulgarian audits with no visible error. This must be resolved in the first phase by separating display labels from stored values in `StyledSelect` and `MultiCheckbox` before any translation work begins. A second structural risk is adding sub-niche branching as boolean flags (extending the existing `isHS` pattern), which produces an unmaintainable 136+ conditional branch tree across 8 step components and scoring logic; a typed config object per sub-niche prevents this.

The Bulgarian market has distinct platform requirements that English-default option lists miss entirely: Viber dominates messaging at 35.7% market share (versus WhatsApp at 19.1%), OLX.bg has 4M monthly active users for home service discovery, and Bulgarian real estate buyers use imot.bg/homes.bg rather than Zillow. Revenue tiers must be expressed in BGN at meaningfully lower absolute values than US benchmarks. Bulgarian AI report generation is achievable by passing a language parameter to the existing `generate-report` edge function — no new infrastructure needed — but the existing `sanitizeText()` regex strips Cyrillic characters and must be updated before any Bulgarian text reaches the AI prompt.

## Key Findings

### Recommended Stack

The v1.0 stack (React 18 / Vite 5 / TypeScript 5 / Tailwind 3 / shadcn/ui / Supabase / Claude Haiku 4.5) requires no changes. Four npm packages are the complete addition for v1.1 i18n: `i18next`, `react-i18next`, `i18next-resources-to-backend`, and `i18next-browser-languagedetector`. The existing React Router v6.30.1 handles language-prefixed URLs natively via optional route segments — no additional routing library needed. Bulgarian AI reports require only a system prompt instruction added to the existing `buildPrompt()` function in the edge function.

See: `.planning/research/STACK.md`

**Core technologies:**
- `i18next@^25.8.13`: Core i18n engine — industry standard, 11M weekly downloads, TypeScript 5 compatible
- `react-i18next@^16.5.4`: React bindings — official integration, React 18 peer dep satisfied
- `i18next-resources-to-backend@^1.2.1`: Vite-native lazy loading via dynamic imports — preferred over http-backend for this setup
- `i18next-browser-languagedetector@^8.2.1`: Language detection — configured to prioritize URL path over localStorage (critical ordering)
- React Router v6 optional `/:lang?` segment: Language routing — no new library; `BrowserRouter` preferred over `createBrowserRouter` to avoid i18next initialization ordering issues
- TypeScript `i18next.d.ts` augmentation: Compile-time key checking on all `t()` calls — 20 lines of boilerplate with high payoff across ~200 keys per namespace

**No new backend dependencies.** Bulgarian report generation uses a prompt instruction added to the existing `buildPrompt()` function in the `generate-report` edge function.

### Expected Features

See: `.planning/research/FEATURES.md`

**Must have — v1.1 launch (table stakes):**
- i18n infrastructure with `/bg/` URL routing — foundation for all locale work; everything else depends on this
- Full Bulgarian translation of all UI strings, form steps, and landing page — without this, the Bulgarian market offering does not exist
- Sub-niche CRM option branching (3 HS groups + 5 RE sub-niches) — users immediately recognize the form is not built for them if irrelevant software names appear
- Sub-niche lead source options (all 17 sub-niches) — most visible trust signal for specialized users
- Sub-niche KPI option lists (Step 7) — current generic list misrepresents all non-HVAC trades
- Bulgarian real estate portals (imot.bg, homes.bg, property.bg, suprimmo.net) in `/bg/` locale
- Bulgarian HS lead sources (OLX.bg, bazar.bg, Facebook groups) in `/bg/` locale
- Viber in Bulgarian communication options (Step 5) — 35.7% market share; absence signals the product is not built for Bulgaria
- AI report generation in Bulgarian — English report for a Bulgarian business defeats personalization goal

**Should have — v1.x after validation:**
- Sub-niche pricing model options (milestone billing for construction, service agreements for pest control)
- Sub-niche scoring weight adjustments — validate option branching with real data first
- BGN revenue/price tiers in Step 1 for `/bg/` locale
- Property management Step 4/8 reframe (owner acquisition framing vs current lead nurture framing)
- Commercial RE extended nurture duration options (12–24 months)
- Sub-niche tools checklist additions (FF&E tools for interior design, aerial measurement for roofing)

**Defer to v2+:**
- Third language expansion (Romanian, Greek) — no validated demand
- Admin analytics dashboard by sub-niche
- Bulgarian regulatory content in AI reports (requires legal review)
- Per-sub-niche AI prompt tuning beyond passing context

**Grouping strategy for HS sub-niches (reduces 12 sub-niches to 3 config groups):**
- Group A — Reactive Service: HVAC, Plumbing, Electrical, Garage Doors (ServiceTitan/FieldEdge ecosystem)
- Group B — Recurring/Scheduled: Pest Control, Landscaping, Cleaning (GorillaDesk/ZenMaid ecosystem)
- Group C — Project-Based: Roofing, Painting, GC, Construction, Interior Design (Buildertrend/Procore ecosystem)

### Architecture Approach

The v1.1 architecture adds three new layers over the unchanged v1.0 foundation: an i18n layer (react-i18next wrapping the entire app), a `LanguageRouter` component that syncs URL path prefix to i18n state, and a sub-niche config layer that replaces inline option arrays in step components. The database gains two columns (`language`, `sub_niche`) via migration. The edge function gains a language parameter that controls the AI prompt language. No existing routes, components, or state management patterns are replaced — only extended.

See: `.planning/research/ARCHITECTURE.md`

**Major components (new/modified):**
1. `src/lib/i18n.ts` (new): i18next singleton init, 4 namespaces (common, landing, steps, report), English resources bundled statically
2. `src/components/LanguageRouter.tsx` (new): Thin wrapper reads `/:lang` URL param, calls `i18n.changeLanguage()`, renders `<Outlet />`
3. `src/hooks/useLanguage.ts` (new): `navigateWithLang()` helper that prepends `/bg` prefix — prevents locale prefix loss on every `navigate()` call
4. `src/locales/en/` + `src/locales/bg/` (new): 4 JSON namespaces per language; `steps.json` carries all sub-niche option variants
5. `src/components/audit/SubNicheSelector.tsx` (new): Card grid rendered in Step 1 after niche selection, dispatches `SET_SUB_NICHE`
6. `src/config/subniches.ts` (new): Typed `SubNicheConfig` objects per sub-niche with option arrays, scoring weight overrides, and i18n label keys
7. `src/types/audit.ts` (modified): Adds `SubNiche` discriminated union, `subNiche: SubNiche | null`, `language: 'en' | 'bg'` to `AuditFormState`
8. `src/lib/scoring.ts` (modified): Adds `getSubNicheWeights()` — config-driven weight overrides applied after base scoring; no inline conditionals
9. `generate-report/index.ts` (modified): Reads `language` from request body; constructs Bulgarian system prompt when `language === 'bg'`; includes sub-niche context in user prompt
10. DB migration (new): `ALTER TABLE audits ADD COLUMN language TEXT DEFAULT 'en', ADD COLUMN sub_niche TEXT` (nullable)

**Critical structural decision — separate display from stored values:**
`StyledSelect` and `MultiCheckbox` must be updated to accept `{value: string, label: string}` pairs. The `value` (stable English string) is stored in `AuditFormState` and scored against; the `label` is displayed via `t()`. This must happen before any translation work begins.

### Critical Pitfalls

See: `.planning/research/PITFALLS.md`

1. **Scoring engine breaks silently for Bulgarian users** — `scoreMap()` uses English display strings as lookup keys; Bulgarian-stored answers return the fallback score of 1, producing uniform ~33/100 scores with no error. Fix: update `StyledSelect` and `MultiCheckbox` to `{value, label}` API before writing any translations. This is the single highest-risk item.

2. **Navigation drops `/bg/` prefix mid-flow** — every `navigate('/generating')` call is a locale-stripping hole. There are 4 navigate calls in `Loading.tsx` alone. Fix: implement `useLocalizedNavigate()` hook in Phase 1; all navigate calls use it, never raw `navigate()`.

3. **localStorage and i18next detection conflict** — i18next's `languageDetector` defaults to checking localStorage before URL path, causing a `/bg/` URL to render in English if `i18nextLng` localStorage key says `'en'`. Fix: configure `detection.order: ['path', 'htmlTag', 'localStorage']` during i18next init.

4. **Sub-niche as boolean flags creates unmaintainable branching** — extending the `isHS` pattern with `isHVAC`, `isPlumbing` etc. produces 136+ conditional branches across 8 step components and scoring logic. Fix: define a typed `SubNicheConfig` schema before writing any sub-niche-specific content; all branching reads from config, not inline conditionals.

5. **AI prompt does not enforce Bulgarian output; Cyrillic gets stripped** — without an explicit language instruction, Claude Haiku 4.5 defaults to English when the prompt is in English. The existing `sanitizeText()` regex strips Cyrillic entirely, so Bulgarian free-text fields reach the AI as empty strings. Fix: add language instruction to `buildPrompt()`; update `sanitizeText()` to use Unicode-aware regex (`\p{L}\p{N}`).

6. **Rate limit error message is hardcoded English** — the 429 response from the edge function always reads in English regardless of UI language. Fix: return a machine-readable code (`code: 'RATE_LIMIT_DAILY'`) that the frontend translates via i18n.

## Implications for Roadmap

Based on research, the build order is driven by hard dependencies: i18n infrastructure must exist before translation content; component API must change before translation values are written; English namespaces must be correct before Bulgarian content is duplicated into them; sub-niche config schema must exist before sub-niche-specific option arrays are written.

### Phase 1: i18n Infrastructure and Routing

**Rationale:** Every other piece of work depends on this phase. Translation files cannot be written without a namespace structure. Sub-niche content cannot be localized without i18n in place. The `StyledSelect`/`MultiCheckbox` component API change must happen here — before any translation content — because fixing it after translations are written requires auditing every option array in all 8 steps.

**Delivers:** Working `/bg/*` route branch; i18next initialized with English resources; `useLocalizedNavigate()` hook; `LanguageRouter` component; `StyledSelect`/`MultiCheckbox` updated to `{value, label}` API; `SubNiche` and `language` types added to `AuditFormState`; i18next detection order configured correctly; smoke test confirms `/bg/` route loads with `i18n.language === 'bg'`

**Features addressed:** i18n infrastructure (P1 foundation)

**Pitfalls addressed:** Pitfall 1 (scoring silent failure), Pitfall 2 (navigation prefix loss), Pitfall 3 (localStorage/URL conflict)

**Research flag:** Standard patterns — well-documented react-i18next + React Router v6 integration; skip research-phase

### Phase 2: English UI Translation Pass

**Rationale:** Must come before Bulgarian content. Extracting all hardcoded strings into `en/*.json` files ensures the namespace structure and key naming conventions are correct in English. Bugs in key names are cheap to fix before the Bulgarian file exists. The app must function identically after this phase — English translations equal the original strings with zero regressions.

**Delivers:** Four English translation namespaces (common, landing, steps, report) fully populated; all hardcoded strings in Index, AuditForm, all 8 step components, and Report replaced with `t()` calls; English app behavior verified identical to pre-v1.1

**Features addressed:** Full English translation (prerequisite for all Bulgarian work)

**Pitfalls addressed:** Pitfall 6 (translation key explosion — namespace structure and stable key naming established before BG content is written)

**Research flag:** Standard patterns — mechanical string extraction; skip research-phase

### Phase 3: Sub-Niche Config Layer and Selection UI

**Rationale:** The config schema must be defined before any sub-niche-specific content is written. Writing sub-niche content into components and then extracting it to config is 2x the work. The `SubNicheSelector` UI is low-complexity but gates all subsequent sub-niche branching in Steps 2–8. The HS 3-group strategy (Reactive / Recurring / Project-Based) reduces 12 sub-niches to 3 config entries, making this phase tractable.

**Delivers:** `src/config/subniches.ts` with typed `SubNicheConfig` per sub-niche; `SubNicheSelector` card grid in Step 1; sub-niche validation before advancing from Step 1; sub-niche option arrays for CRMs (3 HS groups + 5 RE sub-niches), lead sources (all 17), and KPIs (all sub-niches) populated in English; step components read from config rather than inline arrays

**Features addressed:** Sub-niche CRM options (P1), sub-niche lead sources (P1), sub-niche KPI options (P1)

**Pitfalls addressed:** Pitfall 4 (boolean flag explosion), Pitfall 7 (subNiche missing from AuditFormState)

**Research flag:** No additional research needed — FEATURES.md contains complete option lists for all 17 sub-niches across all relevant fields

### Phase 4: Scoring Engine Sub-Niche Weights

**Rationale:** Depends on Phase 3 (sub-niche config schema). Can partially overlap with Phase 3. Scoring weight overrides are read from the same config objects defined in Phase 3. The `getSubNicheWeights()` function is low-complexity; the research-informed initial weight values will need tuning after real audit data accumulates.

**Delivers:** `getSubNicheWeights()` in `scoring.ts`; weight overrides applied in `computeScores()`; unit tests verifying base weights unchanged without sub-niche, overrides apply correctly with sub-niche; weights sum to 1.0 validated in tests

**Features addressed:** Sub-niche scoring weight adjustments (initial P2 placeholder values; tuned post-launch with real data)

**Pitfalls addressed:** Pitfall 4 (config-driven scoring, no conditional branching in scoring.ts)

**Research flag:** Weight values need post-launch validation with real sub-niche audit data — initial values are research-informed estimates. Flag for `/gsd:research-phase` only if differentiated weights are required before launch.

### Phase 5: Database Migration and Backend Extension

**Rationale:** Depends on Phases 1 and 3 (language and sub_niche fields defined in state must exist before being persisted). Must complete before Phase 6 to verify the English pipeline works end-to-end with new fields before adding Bulgarian language complexity to the edge function. The `sanitizeText()` Cyrillic fix belongs here as well — it gates all Bulgarian free-text input.

**Delivers:** Supabase migration adding `language` and `sub_niche` columns to `audits` table; `submitAudit.ts` includes both fields in INSERT; `Loading.tsx` passes `language` and `subNiche` to `generate-report`; `sanitizeText()` updated to Unicode-aware regex; English audit with sub-niche submits correctly; database rows have correct language/sub_niche values

**Features addressed:** Backend persistence of language and sub-niche (prerequisite for AI report, analytics, and email language)

**Pitfalls addressed:** Pitfall 5 (Cyrillic stripped by sanitizeText), Pitfall 2 (language parameter flows through to edge function)

**Research flag:** Standard Supabase migration and edge function extension patterns; skip research-phase

### Phase 6: Bulgarian Content and AI Report

**Rationale:** Last because it depends on all prior phases. The English namespace files must be correct (Phase 2), the sub-niche option arrays must exist in English (Phase 3), the edge function must receive the language parameter (Phase 5). Writing Bulgarian translations before the English namespace structure is finalized means rewriting translation files. Native-speaker review of generated Bulgarian reports is a hard quality gate before launch.

**Delivers:** Four Bulgarian translation namespaces (bg/common.json, bg/landing.json, bg/steps.json, bg/report.json); BG-market option variants (imot.bg/homes.bg RE portals, OLX.bg/bazar.bg HS leads, Viber communications, BGN currency display); Bulgarian system prompt instruction in `generate-report` edge function; 429 rate-limit code returned as machine-readable for frontend translation; verified end-to-end flow at `/bg/` producing Bulgarian AI reports; Cyrillic preserved through sanitization

**Features addressed:** Full Bulgarian UI translation (P1), Bulgarian RE portals (P1), Bulgarian HS lead sources (P1), Viber communication options (P1), AI report in Bulgarian (P1)

**Pitfalls addressed:** Pitfall 5 (AI prompt language enforcement), Pitfall 6 (rate limit message locale)

**Research flag:** Bulgarian AI output quality is MEDIUM confidence — Anthropic does not benchmark Bulgarian specifically. Manual QA of generated Bulgarian reports is required. Engage a native Bulgarian business-domain speaker for translation review before launch sign-off. This is a quality gate, not a technical unknown.

### Phase Ordering Rationale

- Phases 1 and 2 before any state changes: prove routing and `t()` work end-to-end in English before touching form logic; zero regressions before adding complexity
- `StyledSelect`/`MultiCheckbox` API change in Phase 1: the highest retrofit cost if deferred; touching every option in all 8 steps is cheaper before translations exist
- Phase 3 (config schema) before Phase 4 (scoring): scoring reads from config — the schema must exist first
- Phase 2 (English translations) before Phase 6 (Bulgarian): translation key naming bugs are cheapest to fix before the Bulgarian file duplicates them
- Phase 5 (database/backend) before Phase 6 (Bulgarian AI): verify English pipeline end-to-end with new fields before adding language complexity to the edge function
- Phase 4 can partially overlap with Phase 3 — no blocking dependency, both read from the same config schema

### Research Flags

**Phases needing deeper research during planning:**
- **Phase 4 (scoring weights):** Weight values per sub-niche are research-informed estimates, not empirically validated. Implement with placeholder parity weights and tune in v1.x based on real audit outcomes. Only escalate to `/gsd:research-phase` if differentiated weights are a hard v1.1 requirement.
- **Phase 6 (Bulgarian content):** Bulgarian business terminology for CRM/tool names and KPI descriptions requires native-speaker review. Machine translation is acceptable as a first draft only. Budget translation review time into the phase estimate.

**Phases with standard patterns (skip research-phase):**
- **Phase 1:** react-i18next + React Router v6 optional segments — official documentation with maintained examples; community pattern confirmed by React Router maintainer in GitHub discussion
- **Phase 2:** String extraction and `t()` replacement — mechanical; no novel patterns
- **Phase 3:** Config-driven option branching — standard TypeScript discriminated union pattern
- **Phase 5:** Supabase migration + edge function extension — established patterns already used in v1.0 codebase

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All 4 npm packages verified via `npm info`; React Router v6 optional segment pattern confirmed in official GitHub discussions with maintainer participation; version compatibility verified against existing package.json |
| Features | HIGH (HS/RE sub-niches), MEDIUM (Bulgarian market specifics) | HS/RE sub-niche CRM and KPI data from authoritative domain sources (ServiceTitan blog, Buildium, FieldRoutes, etc.). Bulgarian market: Viber dominance confirmed via SensorTower + Messaggio (two independent sources); OLX.bg MAU confirmed via Balkan eCommerce Summit data; Bulgarian construction software adoption LOW confidence — no Bulgaria-specific data found |
| Architecture | HIGH | Patterns derived from direct inspection of existing BizAudit source code (`scoring.ts`, `AuditFormComponents.tsx`, `App.tsx`, `Loading.tsx`, `generate-report/index.ts`); all component-level decisions verified against actual code, not assumptions |
| Pitfalls | HIGH (retrofit i18n and scoring pitfalls), MEDIUM (Bulgarian AI output quality) | Scoring/navigation/localStorage pitfalls confirmed by direct source code analysis of `scoreMap()`, `StyledSelect`, and `navigate()` calls; Bulgarian AI quality inferred from Anthropic multilingual docs (Bulgarian not in benchmarked set) and peer-reviewed multilingual LLM survey |

**Overall confidence:** HIGH for implementation approach and architecture decisions; MEDIUM for Bulgarian content quality (requires post-implementation native-speaker validation) and sub-niche weight values (requires post-launch data validation)

### Gaps to Address

- **Bulgarian construction software adoption:** No Bulgaria-specific CRM data found. Assumption is international tools (Procore/Buildertrend) or Excel/Google Sheets dominate. Include generic options prominently; validate with Bulgarian user feedback post-launch.

- **BGN revenue tier calibration:** No published Bulgarian SMB revenue benchmark data found. BGN tiers in FEATURES.md are estimates based on EUR/BGN fixed peg (1 EUR = 1.95583 BGN) and general market scale awareness. Flag for validation with Bulgarian business users before launch.

- **Bulgarian AI report quality:** Anthropic does not publish Bulgarian benchmark scores. Claude Haiku 4.5 generates Bulgarian, but quality relative to English output is unverified. Mandate native-speaker review of 3–5 generated Bulgarian reports before launch sign-off. This is a process gap, not a technical blocker.

- **Sub-niche scoring weight values:** Initial overrides in ARCHITECTURE.md are directionally informed but not empirically validated. Treat as v1.1 placeholders; tune in v1.x based on actual audit score distributions.

- **Property management Step 4/8 misalignment:** Research flags that Step 4 (lead nurture for buyers/sellers) and Step 8 financial questions do not fit property management firms. Scoped out of v1.1 due to form restructuring complexity. PM audits will produce lower-quality results until addressed in v1.x.

## Sources

### Primary (HIGH confidence)
- [i18next npm](https://www.npmjs.com/package/i18next) — v25.8.13 current version; TypeScript 5 compatibility
- [react-i18next npm](https://www.npmjs.com/package/react-i18next) — v16.5.4 current version; React 18 peer dep
- [i18next-resources-to-backend GitHub](https://github.com/i18next/i18next-resources-to-backend) — dynamic import usage pattern for Vite
- [i18next TypeScript docs](https://www.i18next.com/overview/typescript) — CustomTypeOptions augmentation
- [react-i18next official docs](https://react.i18next.com/guides/multiple-translation-files) — namespace usage
- [i18next Best Practices](https://www.i18next.com/principles/best-practices) — namespace structure and key naming
- [i18next Language Detector GitHub Issue #250](https://github.com/i18next/i18next-browser-languageDetector/issues/250) — localStorage vs path ordering conflict
- [ServiceTitan HVAC KPIs](https://www.servicetitan.com/blog/hvac-key-performance-indicators) — Group A KPI data
- [FieldRoutes Pest Control KPIs](https://www.fieldroutes.com/blog/pest-control-kpis) — Group B pest control KPI data
- [Buildium Property Management KPIs](https://www.buildium.com/blog/property-management-kpis-to-track/) — RE property management sub-niche data
- [Pearl Collective Interior Design KPIs](https://thepearlcollective.com/kpis-interior-design-firms/) — Group C interior design KPI data
- [4Degrees Commercial RE CRMs 2025](https://www.4degrees.ai/blog/the-best-commercial-real-estate-crms-of-2025) — commercial RE sub-niche CRM data
- [imot.bg](https://www.imot.bg/) — confirmed Bulgaria RE portal #1
- [OLX Bulgaria 4M MAU — Balkan eCommerce Summit](https://balkanecommerce.com/partners/olx-bulgaria/) — classified platform market data
- [Viber Bulgaria — SensorTower Q2 2025](https://sensortower.com/blog/2025-q2-unified-top-5-communication%20apps-units-bg-6070aae1241bc16eb81f5bab) — 35.7% Viber market share confirmed
- [Messaggio Viber Bulgaria](https://messaggio.com/messaging/bulgaria/viber/) — corroborating Viber market dominance
- [Flat Manager BG](https://flatmanager.bg/en/) — Bulgarian property management software confirmed
- [Roomspilot](https://roomspilot.com/) — Bulgarian STR channel manager confirmed
- [Anthropic Multilingual Support](https://platform.claude.com/docs/en/build-with-claude/multilingual-support) — Bulgarian not in benchmarked language set
- BizAudit source code (direct analysis): `src/lib/scoring.ts`, `src/components/audit/AuditFormComponents.tsx`, `src/App.tsx`, `src/pages/Loading.tsx`, `supabase/functions/generate-report/index.ts`

### Secondary (MEDIUM confidence)
- [React Router i18n discussion #10510](https://github.com/remix-run/react-router/discussions/10510) — optional segment pattern for language prefix; React Router maintainer participated
- [Procore Construction KPIs](https://www.procore.com/library/construction-kpis) — Group C construction KPI data
- [Successware HVAC/Plumbing/Electrical KPIs](https://www.successware.com/blog/2024/july/mastering-metrics-kpis-for-hvac-plumbing-electri/) — Group A KPI corroboration
- [Lasso CRM for new construction](https://www.ecisolutions.com/products/lasso-crm/) — new construction RE sub-niche CRM data
- [Centrarium Bulgarian RE market 2025](https://centrarium.com/en/blog/rynok-nedvizhimosti-bolgarii-2025-goda-358.html) — Bulgarian market context
- [Multilingual LLM Survey — Patterns journal 2024](https://www.cell.com/patterns/fulltext/S2666-3899(24)00290-3) — non-English prompt performance degradation patterns

### Tertiary (LOW confidence)
- Bulgarian construction software adoption — no Bulgaria-specific data found; assumption based on general SMB patterns; requires validation with Bulgarian users
- Bulgarian SMB revenue tier calibration — estimated from EUR/BGN fixed rate and general market scale awareness; no published benchmark

---
*Research completed: 2026-02-21*
*Ready for roadmap: yes*

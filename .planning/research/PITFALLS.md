# Pitfalls Research

**Domain:** Adding i18n, Bulgarian localization, and sub-niche specialization to existing React/Vite/TypeScript SPA (BizAudit v1.1)
**Researched:** 2026-02-21
**Confidence:** HIGH for retrofit i18n and scoring pitfalls (direct analysis of existing codebase + verified patterns); MEDIUM for Bulgarian AI output (Anthropic docs confirm Bulgarian not in benchmarked set, behavior inferred from documented multilingual LLM patterns)

---

## Critical Pitfalls

### Pitfall 1: Scoring Engine Breaks Silently When Option Values Are Translated

**What goes wrong:**
The scoring engine in `src/lib/scoring.ts` maps English answer strings directly to numeric scores via lookup tables (e.g., `responseSpeedScore["Under 5 minutes"] = 3`). The form stores these English strings as state values, and the `scoreMap()` function looks them up at scoring time. When Bulgarian translations are added, the form displays Bulgarian labels to the user — but if the Bulgarian label is also stored as the state value, every single lookup returns `undefined`, which falls back to `1` via `map[value] ?? 1`. Every Bulgarian-language user gets a near-uniform score of ~33/100 regardless of their actual answers. There is no error, no warning, and no visible failure — the report simply generates with wrong scores.

**Why it happens:**
The current form uses option display strings as both the UI label and the stored value (`<option value={opt}>{opt}</option>` in `StyledSelect`, checkbox key in `MultiCheckbox`). This single-source pattern is idiomatic for English-only apps but collapses when the display language diverges from the stored value.

**How to avoid:**
Separate display values from stored values immediately when adding i18n. Each option must have a stable, language-agnostic `value` (English string or an opaque key like `"response_speed_under_5_min"`) and a separately translated `label`. The scoring engine always scores against the stable value, never the translated label.

```typescript
// WRONG — both label and value are translated strings
const options = [t('form.step3.responseSpeed.under5'), ...] // translated label stored as value

// CORRECT — value is stable, label is translated separately
const options = [
  { value: "Under 5 minutes", label: t('form.step3.responseSpeed.under5') },
  { value: "5–30 minutes",    label: t('form.step3.responseSpeed.5to30') },
]
// StyledSelect uses opt.value for <option value> and opt.label for display text
// AuditFormState always stores "Under 5 minutes" regardless of display language
```

The `MultiCheckbox` component similarly stores selected values — it must store stable keys, not translated labels.

**Warning signs:**
- All Bulgarian-language audits score in the 25–45 range regardless of how well the business operates.
- `scoreMap()` returns `1` (the fallback) for most answers from Bulgarian users.
- Removing the `?? 1` fallback from `scoreMap()` causes scores to become `NaN` for translated answers.
- The form shows Bulgarian text but `state.step3.responseSpeed` contains a Bulgarian string instead of an English one.

**Phase to address:** i18n infrastructure phase — before any Bulgarian translations are written. The component API for `StyledSelect` and `MultiCheckbox` must be updated to accept `{value, label}` pairs before any translation work begins. This cannot be retrofitted after translations are written without auditing every option in all 8 steps.

---

### Pitfall 2: URL-Based Language Routing Breaks Existing Navigation State Transfer

**What goes wrong:**
The current flow passes `formState`, `scores`, and `auditId` between routes via React Router `location.state` (navigate with state). When a `/bg/` prefix is added via optional segment routing, every internal `navigate()` call that constructs a path must include the current locale prefix. Any `navigate('/generating')` that becomes `navigate('/bg/generating')` now also needs to carry location state — but any hardcoded path string drops the locale prefix, landing the user on the English route. The transition from `/bg/audit` to `/generating` drops the `/bg/` prefix, triggering a route mismatch, or worse, navigates to the English version mid-flow with the right state but wrong language.

**Why it happens:**
`navigate('/generating')` is an absolute path. The `/bg/` prefix is implicit context the developer forgets to thread through every navigate call. There are 4 navigate calls in `Loading.tsx` alone, plus navigate calls in `AuditForm.tsx` and step components. Forgetting even one leaves a locale-stripping hole in the navigation graph.

**How to avoid:**
Create a `useLocalizedNavigate()` hook that wraps React Router's `useNavigate()` and automatically prepends the current locale prefix for non-default locales. All navigate calls in the app use this hook, never raw `navigate()`.

```typescript
// src/lib/useLocalizedNavigate.ts
export function useLocalizedNavigate() {
  const navigate = useNavigate()
  const { locale } = useLocale() // reads :lang param from route context

  return (path: string, options?: NavigateOptions) => {
    const localizedPath = locale === 'en' ? path : `/${locale}${path}`
    navigate(localizedPath, options)
  }
}
```

The route structure wraps all existing routes in an optional `:lang?` segment and validates that `:lang` is a supported locale — otherwise it falls through to the English route.

**Warning signs:**
- Mid-flow language switch drops the `/bg/` prefix.
- `navigate('/generating', { state: ... })` hardcoded in `AuditForm.tsx`.
- The report URL for Bulgarian users shows `/report/:auditId` not `/bg/report/:auditId`.
- Resume via `?resume=true` query param correctly resumes form state but displays in English for Bulgarian users.
- Browser back button on `/bg/report/:id` navigates to `/generating` (no locale prefix).

**Phase to address:** i18n infrastructure phase — route structure and `useLocalizedNavigate` must be in place before any page-level translation work. Touching navigate calls after translations are scattered across components risks missing some.

---

### Pitfall 3: localStorage Audit State Is Language-Unaware, Causing Cross-Language Resume Corruption

**What goes wrong:**
The current system persists `AuditFormState` to localStorage under the keys `ep_audit_state`, `ep_audit_state_scores`, `ep_audit_state_form`. If a user starts an audit in Bulgarian, then revisits the site in English (or vice versa), the `?resume=true` flow restores the state from localStorage and the scoring engine runs correctly (because stored values are stable English keys per Pitfall 1). However, the language the audit was started in is not persisted — so the resumed audit displays in whatever language the URL implies, not the language it was started in.

The bigger risk: i18next's `i18next-browser-languageDetector` also writes the detected language to localStorage under its own key (`i18nextLng`). If the detector runs before the app reads the audit state, and the user's browser locale is English while the URL says `/bg/`, the detector may overwrite or conflict with the URL-based locale detection, causing the UI to flicker or display a mix of languages on the first render.

**Why it happens:**
Two systems write to localStorage (i18n detector and audit state persistence) without coordination. The URL-based locale (from the `:lang` route parameter) should be authoritative, but the i18next language detector defaults to checking localStorage first, then the URL.

**How to avoid:**
Configure the i18next language detector to prioritize path detection over localStorage. Set `detection.order: ['path', 'htmlTag', 'localStorage']` so the URL's `/bg/` prefix always wins. Store the `locale` used when the audit was started as part of the persisted audit state (`ep_audit_state.locale`). When resuming, redirect to the locale-appropriate URL if the current URL locale differs.

```typescript
i18n.init({
  detection: {
    order: ['path', 'htmlTag', 'localStorage'],
    lookupFromPathIndex: 0, // reads from /bg/ in URL
  }
})
```

**Warning signs:**
- `/bg/audit?resume=true` shows English text on initial load before switching to Bulgarian.
- Browser console shows i18next changing language twice on mount.
- Users who resume an audit from a bookmarked URL end up on the wrong language version.
- `localStorage.getItem('i18nextLng')` shows `'en'` while the URL says `/bg/`.

**Phase to address:** i18n infrastructure phase — configure language detection order during initial i18next setup. This is a configuration decision, not a code change, but must be set correctly before any user testing.

---

### Pitfall 4: Sub-Niche Branching Added as More `isHS` Boolean Flags Creates Unmaintainable Scoring

**What goes wrong:**
The current system uses a single `isHS: boolean` flag to branch between two niches. Adding 17 sub-niches (12 Home Services + 5 Real Estate) as additional boolean checks produces code like `if (isHS && subNiche === 'hvac') { ... } else if (isHS && subNiche === 'plumbing') { ... }` scattered across `scoring.ts` (currently 547 lines), each of the 8 step components, `generateMockReport()`, and the AI prompt builder in the edge function. The combinatorial explosion is:

- 8 step components × (2 niches × up to 17 sub-niches) = up to 272 conditional branches to maintain
- `scoring.ts` already has 200+ lines of lookup tables for 2 niches; adding per-sub-niche weight overrides multiplies this
- Each new sub-niche requires changes in at least 5 files

The result is a codebase where no single developer can hold the full branching tree in their head, bugs are introduced by incomplete sub-niche handling, and future changes require surgical edits across the entire codebase.

**Why it happens:**
The `isHS` pattern was the right call for two niches. Developers naturally extend it with `subNiche` checks. The entropy is incremental — each new branch seems small in isolation.

**How to avoid:**
Introduce a data-driven sub-niche configuration layer before writing any sub-niche-specific logic. Define sub-niche config as data, not code:

```typescript
// src/config/subNiches.ts
interface SubNicheConfig {
  id: string          // 'hvac' | 'plumbing' | etc.
  niche: Niche
  label: string       // 'HVAC' — used in UI
  labelKey: string    // 'subNiches.hvac' — i18n key
  scoringWeightOverrides?: Partial<Record<ScoringCategory, number>>
  skipSteps?: number[]
  customOptions?: {
    step: number
    field: string
    options: Array<{ value: string; labelKey: string }>
  }[]
}
```

The scoring engine reads `scoringWeightOverrides` from the config instead of branching. Step components read `customOptions` to inject sub-niche-specific choices into the standard fields. Adding a new sub-niche is adding a config entry, not touching component or scoring code.

**Warning signs:**
- `scoring.ts` grows beyond 700 lines.
- More than 3 `if (subNiche === ...)` chains in a single function.
- A bug fix for HVAC scoring requires changes in more than 2 files.
- `Step2Technology.tsx` has a sub-niche conditional block larger than the existing `isHS` block.

**Phase to address:** Sub-niche architecture phase — the configuration schema must be defined before any sub-niche-specific content is written. Writing sub-niche content into components and then extracting it is 2x the work.

---

### Pitfall 5: AI Prompt Does Not Enforce Bulgarian Output, Causing Mixed-Language Reports

**What goes wrong:**
The `generate-report` edge function sends the system prompt in English and the form context in English (stored values are English regardless of UI language). Without an explicit instruction to respond in Bulgarian, Claude Haiku 4.5 defaults to English — because the prompt language is English, the form answer values are English strings, and Bulgarian is a lower-resource language for the model. The AI-generated `executiveSummary`, `gaps`, `quickWins`, and `strategicRecommendations` arrive in English inside a Bulgarian-language UI.

Even with an explicit Bulgarian instruction, a secondary failure mode exists: the model may start in Bulgarian but drift to English for technical terms, tool names, or when the response approaches the token limit. The JSON structure remains valid but contains a mix of Bulgarian and English text within the same fields.

Bulgarian is not in Anthropic's published multilingual benchmark set — unlike Spanish, French, German, Arabic, or Chinese which are benchmarked at 92–98% of English performance. Claude Haiku 4.5 generates correct Bulgarian but at unknown quality relative to English, and without an explicit instruction it will not output Bulgarian at all when the prompt is English.

**How to avoid:**
Add an explicit language instruction to the system prompt when the audit locale is Bulgarian. Pass `locale` as a parameter to the edge function alongside `auditId`, `formState`, and `scores`.

```typescript
// In buildPrompt():
const languageInstruction = locale === 'bg'
  ? `IMPORTANT: You must write the ENTIRE report in Bulgarian (Български). All text in executiveSummary, gaps, quickWins, and strategicRecommendations must be in Bulgarian. Do not use English except for software product names (e.g., CRM names).`
  : ''

const system = `${languageInstruction}\nYou are a business operations advisor...`
```

Test with Bulgarian output explicitly — do not assume the instruction works without validation. Include Bulgarian text in the test assertion.

Additionally, the rate-limit error message (`"You've already submitted 3 audits today"`) is currently hardcoded in the edge function. It must be translated or parameterized — the edge function must return the locale-appropriate message, or return a machine-readable code the frontend translates.

**Warning signs:**
- The `locale` parameter is not passed from the frontend to the edge function.
- Generated reports are in English for Bulgarian-language users.
- Report text switches from Bulgarian to English mid-paragraph.
- Rate limit message from edge function response is always English regardless of UI language.
- `localStorage` shows `locale: 'bg'` but `audit_reports.report.executiveSummary` is in English.

**Phase to address:** AI report generation phase (Bulgarian-specific) — after the i18n infrastructure is in place and locale context flows through the app, update the edge function to accept and use the locale parameter.

---

### Pitfall 6: Translation Key Explosion Across Niches, Sub-Niches, and Steps Creates Unmaintainable Translation Files

**What goes wrong:**
A naive i18n structure that mirrors the component tree produces a translation file where every sub-niche has its own copy of every option. The math: 8 steps × 2 niches × 17 sub-niches × ~8 options per field = ~2,176 translation entries per language. In Bulgarian, each entry must be translated once — and updated whenever the English source changes. When a question changes for Home Services, a developer must update the English source AND the Bulgarian translation AND verify the scoring engine's stable value still maps correctly.

The real failure mode is not the initial translation burden — it is the ongoing maintenance. When a new CRM is added to `HS_CRMS` in `Step2Technology.tsx`, it must be added to the translation file AND it must remain stable as a stored value so existing audit scores don't break. Developers who update the English source and forget the Bulgarian file leave Bulgarian users seeing missing keys (`[form.step2.crms.newCRM]`) in the UI with no automated detection.

**How to avoid:**
Two structural decisions prevent this:

1. **Translate labels, not values.** The English text of an option is never directly a translation key — instead, use explicit stable keys (`form.step2.crms.servicetitan`) that map to translated labels. This decouples the scoring value from the translation key.

2. **Use shared keys for options that are niche-agnostic.** Many options in Step 2–8 are identical across sub-niches. Put them in a `common` namespace. Only truly sub-niche-specific content gets sub-niche keys.

3. **Add a CI check** (i18next-parser or a custom script) that compares `en.json` and `bg.json` key counts and fails the build if they diverge. Missing translations surface immediately rather than in production.

```
locales/
  en/
    common.json        # shared across niches
    form.json          # all form question labels and options
    report.json        # report section labels
    errors.json        # error messages
  bg/
    common.json
    form.json
    report.json
    errors.json
```

Sub-niche-specific options live in `form.json` under a sub-niche namespace only when they genuinely differ from the base niche. If HVAC and Plumbing share 90% of options, they share 90% of translation keys.

**Warning signs:**
- `bg.json` has a different number of keys than `en.json`.
- A new CRM option was added to `Step2Technology.tsx` but not to `bg.json`.
- `t('form.step2.crms.newCRM')` appears literally in the Bulgarian UI instead of translated text.
- No CI check on translation key completeness.
- Translation files exceed 2,000 lines without namespace splitting.

**Phase to address:** i18n infrastructure phase — namespace structure must be decided before any content is written. Restructuring translation files after Bulgarian content is written requires rewriting all i18n `t()` calls throughout the codebase.

---

### Pitfall 7: AuditFormState Type Does Not Model Sub-Niche, Breaking TypeScript Safety Everywhere

**What goes wrong:**
`AuditFormState` currently has no `subNiche` field. Adding sub-niche-specific form fields as more optional properties (the current `isHS` pattern used `industry?`, `role?`, etc.) compounds an already weak type model. Each new sub-niche would add more optional fields to each step interface, making every step a union of all possible sub-niche fields — but represented as `optional` rather than a discriminated union. TypeScript cannot tell you when you've forgotten to handle the `hvac` sub-niche in a switch, because the type system has no knowledge of the constraint.

The downstream effect is that `computeScores()` and `buildPrompt()` use `||  ""` fallbacks everywhere (`state.step4.schedulingMethod || ""`). Adding sub-niche fields to the same pattern means the scoring engine silently uses empty strings when a field is genuinely not applicable to a sub-niche, rather than knowing the field doesn't exist for that sub-niche. Scores become unreliable.

**How to avoid:**
Add `subNiche` to `AuditFormState` as an enum type and model sub-niche-specific fields as discriminated unions in step interfaces, or accept the current flat optional model but add a validation layer that ensures required fields for the active sub-niche are present before scoring.

At minimum, add `subNiche` to the state and action types before any sub-niche form fields are added:

```typescript
export type SubNiche =
  | 'hvac' | 'plumbing' | 'electrical' | 'roofing' | 'landscaping'
  | 'pest_control' | 'garage_doors' | 'painting' | 'general_contracting'
  | 'construction' | 'interior_design' | 'cleaning'
  | 'residential_sales' | 'commercial_office' | 'property_management'
  | 'new_construction' | 'luxury_resort';

export interface AuditFormState {
  niche: Niche | null;
  subNiche: SubNiche | null;  // add this
  // ...rest unchanged
}
```

The scoring engine reads `subNiche` to apply weight overrides from the sub-niche config layer (see Pitfall 4). It does not add sub-niche conditional branches to the scoring code itself.

**Warning signs:**
- `subNiche` is passed as a prop rather than stored in `AuditFormState`.
- `step1.industry` is being reused to store sub-niche identity.
- `computeScores()` has a new sub-niche parameter not sourced from `AuditFormState`.
- Step components read sub-niche from URL params or context rather than from audit state.
- localStorage resume does not restore sub-niche selection.

**Phase to address:** Type system update — must happen before any sub-niche form fields or scoring code is written. Retrofitting `subNiche` into state after sub-niche-specific form logic is written requires auditing every place state is read, dispatched to, or serialized/deserialized.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Use translated display string as stored form value | No API change to form components | Scoring engine breaks for all non-English users; all lookup tables must be rewritten | Never — separate display from stored value before first translation |
| Add sub-niche as a boolean flag (`isHVAC`, `isPlumbing`) | Mirrors existing `isHS` pattern | 17 booleans × 8 steps = 136+ conditional branches; no single developer can maintain this | Never — use a typed enum + config layer from the start |
| Translate option values stored in `AuditFormState` | Simplifies translation (one source of truth) | Breaks scoring, breaks AI prompt context (form answers in Bulgarian confuse the English prompt), breaks localStorage resume across language switches | Never |
| Machine-translate Bulgarian content without domain review | Faster initial translation | Bulgarian business terminology for home services / real estate may be wrong; answer options users see don't match their actual practice | Acceptable for first draft only — requires domain review before launch |
| Put all translations in a single `translation.json` per language | Simple setup | File becomes 3,000+ lines; cannot lazy-load; CI diff for a single option change touches the entire file | MVP only — split into namespaces before content exceeds 500 lines |
| Hardcode Bulgarian-specific CRM/tool names in component arrays | Quick to ship | Bulgarian-market tools change; list lives in component code not in translation/config layer | Acceptable for v1.1 if reviewed annually |
| Pass locale as URL query param (`?lang=bg`) instead of path prefix | No route changes needed | Breaks existing bookmarked URLs on language switch; conflicts with `?niche=` and `?resume=true` query params; cannot be server-side detected | Never — use path prefix as designed |
| Single edge function handles both English and Bulgarian prompt building | No new infrastructure | Language-specific prompt logic accumulates in one 500+ line file; locale bugs affect both languages | Acceptable if locale handling is cleanly encapsulated in `buildPrompt()` |

---

## Integration Gotchas

Common mistakes when connecting new features to existing systems.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| i18next + React Router v6 optional segment | Using i18next `languageDetector` with default detection order (localStorage first) causes URL locale to be ignored on first visit | Set `detection.order: ['path', 'htmlTag', 'localStorage']` so URL prefix is always authoritative |
| i18next + Vite | Translation JSON files imported as static assets are not hot-reloaded in dev | Use `i18next-http-backend` pointing to `/locales/` served as public assets; files reload on save |
| Edge function + locale | Locale detected client-side but not sent to `generate-report` function | Pass `locale` in the request body alongside `auditId`, `formState`, `scores`; validate it server-side (only accept `'en'` or `'bg'`) |
| Supabase `audits` table + locale | Audit locale not persisted, making admin analytics impossible | Add `locale` column to `audits` table (migration); populate from form submission |
| localStorage audit resume + i18n | Resumed audit loses sub-niche selection if `subNiche` was not in the original `AuditFormState` schema | Add `subNiche` to `initialFormState` with `null` default; RESTORE action already handles this if the field exists |
| Rate limit error message + locale | Rate limit 429 response message is English regardless of user locale | Either translate the error client-side using a machine-readable code (`rateLimited: true, code: 'RATE_LIMIT_DAILY'`) or pass locale to the edge function and build locale-aware messages |
| MultiCheckbox + i18n | `selected` array stores translated labels; comparing `selected.includes(opt)` breaks when language switches mid-session | Store stable English values in `selected`; derive display label separately at render time |

---

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Single large translation JSON (all namespaces, both niches, all sub-niches) | 3+ second initial load; JS bundle size warning from Vite | Split into namespaces; lazy-load sub-niche content on niche selection | Translation file exceeds 500KB |
| Generating all sub-niche CRM/tool option arrays at import time | No observable symptom at 17 sub-niches; adds 200ms+ at 50+ | Lazy-compute options per sub-niche via `useMemo` or static config map | More than 25 sub-niches or more than 50 options per step |
| Sub-niche branching in `computeScores()` using `if/else` chains | Scoring takes >5ms per call; perceptible lag on step transitions | Config-driven weight overrides (O(1) lookup) instead of O(n) conditional chains | Not a real bottleneck at 17 sub-niches, but the pattern causes maintenance failure before performance failure |
| Requesting both English and Bulgarian translations on every page load | Extra network round-trips; unnecessary memory usage | Load only the active locale's translations; fall back to English on missing keys | Two-language apps at scale — not a bottleneck at this project's size |
| AI prompt that includes sub-niche label but not sub-niche context | No performance issue; content issue — AI generates generic advice | Include sub-niche identifier in the user prompt so AI can reference sub-niche-specific benchmarks | Every audit for a specialized sub-niche (HVAC vs General Contracting) |

---

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Accepting arbitrary `locale` values from client without validation in edge function | Prompt injection via locale field (e.g., `locale: "en. Ignore previous instructions."`) | Validate `locale` server-side: `if (!['en', 'bg'].includes(locale)) throw new Error('Invalid locale')` |
| Storing Bulgarian answer options as sub-niche content in the prompt without sanitization | Bulgarian Cyrillic characters pass the existing `sanitizeText()` regex (`/[^\w\s.,!?'-]/g`) which strips Cyrillic — Bulgarian text is sanitized to empty string | Update `sanitizeText()` to preserve Unicode word characters: replace `\w` with `\p{L}\p{N}` using Unicode-aware regex (`/[^\p{L}\p{N}\s.,!?'-]/gu`) |
| Sub-niche value stored in URL and passed directly to AI prompt | URL manipulation injects unexpected sub-niche context into AI prompt | Sub-niche must come from validated `AuditFormState` (which comes from validated form dispatch), not from URL params at scoring/prompt time |
| Translation keys that leak internal system structure | Keys like `t('scoring.hvac.weight.override')` in error messages reveal internal architecture | Use user-facing message keys, not internal config keys, in any client-visible translation |

---

## UX Pitfalls

Common user experience mistakes specific to this locale + sub-niche domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Showing sub-niche selection before niche selection | Confuses users who haven't committed to a niche; sub-niche list is meaningless without niche context | Sub-niche selection is the second question after niche, not a parallel choice |
| Sub-niche selection resets all form state if changed mid-audit | User who selected "HVAC" then changes to "Plumbing" on step 4 loses all previous answers | Show a confirmation warning; selectively clear only sub-niche-specific fields, not shared fields (business name, CRM, etc.) |
| Mixing Bulgarian and English in the same UI because some keys are missing | Users lose trust in a tool that can't decide what language it's in | Missing translation key fallback should fall back to the English string silently (i18next default), not to the raw key. Monitor missing keys via i18next's `missingKeyHandler` |
| Showing English CRM names in Bulgarian UI without explanation | Confusion about whether "ServiceTitan" is a Bulgarian or foreign product | CRM/tool names are proper nouns — keep them in English in the Bulgarian UI. This is correct behavior, not a bug. |
| No language indicator or switch in the UI | Users who reach the wrong language version have no escape path | Show a language toggle in the header/nav; default detection should use URL but allow manual override |
| Bulgarian-language report uses English benchmark phrases ("Most successful teams in your space") | Report feels machine-translated, not locally adapted | Update AI system prompt to use culturally appropriate Bulgarian framing, not direct translation of English benchmark language |

---

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **i18n infrastructure:** `t('key')` calls render Bulgarian text — verify scoring works correctly by submitting a Bulgarian-language audit and checking that scores match an equivalent English audit with the same answers.
- [ ] **URL routing:** `/bg/audit` loads correctly — verify that `navigate()` calls in `Loading.tsx`, `AuditForm.tsx`, and `Report.tsx` all preserve the `/bg/` prefix (check all 4 navigate calls in Loading.tsx).
- [ ] **Sub-niche branching:** Sub-niche selection displays on the form — verify `subNiche` is persisted in `AuditFormState`, survives `?resume=true`, and is included in the Supabase `audits` table insert.
- [ ] **Bulgarian AI report:** Edge function generates a Bulgarian report — verify the report is actually in Bulgarian (not just the wrapper UI), and that Bulgarian Cyrillic text is not stripped by the `sanitizeText()` regex.
- [ ] **Scoring with sub-niches:** Sub-niche weight overrides apply — verify that an HVAC audit with weak scheduling scores lower on scheduling than a General Contracting audit with the same answer, if the HVAC weight override is configured.
- [ ] **Missing translation keys:** Bulgarian UI renders without any `[key]` strings — run i18next in development mode and check console for missing key warnings; run i18next-parser to verify all source `t()` calls have corresponding `bg.json` entries.
- [ ] **Resume across locales:** Start audit at `/bg/audit`, close browser, reopen at `/audit` (English) — verify resume restores state correctly and the language reflects the URL, not the stored locale in localStorage.
- [ ] **Rate limit message locale:** Trigger rate limit from Bulgarian URL — verify the displayed message is in Bulgarian, not English.

---

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Scoring broken for Bulgarian users (translated values stored) | HIGH | Audit all 8 step components; update `StyledSelect`/`MultiCheckbox` to `{value, label}` API; verify all `scoreMap()` lookups use stable values; cannot retroactively fix existing Bulgarian audit scores in DB |
| Translation files diverged (bg.json missing keys) | MEDIUM | Run i18next-parser diff; add missing keys; deploy; existing users see fallback English strings until next deployment |
| Sub-niche added as boolean flags (maintenance explosion) | HIGH | Refactor to config-driven architecture before adding more than 3 sub-niches; earlier is significantly cheaper |
| Bulgarian AI reports in English (locale not passed to edge function) | LOW | Add `locale` to edge function request body; update `buildPrompt()` to use it; existing stored reports are not retroactively fixed |
| Cyrillic text stripped by sanitizeText (scores/prompts get empty strings) | MEDIUM | Update sanitizeText Unicode regex; re-test with Bulgarian free-text fields; existing audits unaffected (free-text only used for AI context, not scoring) |
| Route prefix breaks existing shareable report URLs | MEDIUM | Add redirect middleware: `/report/:id` (no locale prefix) redirects to `/en/report/:id`; existing URLs continue to work |

---

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Scoring engine breaks with translated values (Pitfall 1) | Phase 1: i18n infrastructure — update StyledSelect/MultiCheckbox API before any translation work | Submit Bulgarian audit; verify score matches equivalent English audit |
| Navigation state drops locale prefix (Pitfall 2) | Phase 1: i18n infrastructure — implement useLocalizedNavigate hook | Walk full `/bg/` flow end-to-end; confirm all URLs preserve prefix |
| localStorage locale conflict (Pitfall 3) | Phase 1: i18n infrastructure — configure i18next detector order | Open `/bg/audit`, close, reopen; verify URL locale wins over localStorage |
| Sub-niche boolean flag explosion (Pitfall 4) | Phase 2: sub-niche architecture — define config schema before content | No `if (subNiche === ...)` chains in scoring.ts; adding new sub-niche requires only a config entry |
| AI report in English for Bulgarian users (Pitfall 5) | Phase 3: Bulgarian AI report — add locale to edge function | Generate report via Bulgarian URL; inspect `audit_reports.report.executiveSummary` for Bulgarian text |
| Translation key explosion (Pitfall 6) | Phase 1: i18n infrastructure — namespace design before content | i18next-parser finds 0 missing keys; `bg.json` and `en.json` key counts match |
| subNiche missing from AuditFormState (Pitfall 7) | Phase 2: sub-niche architecture — add to type before form fields | localStorage resume restores subNiche; Supabase audits table includes subNiche column |
| Cyrillic stripped by sanitizeText (Security section) | Phase 3: Bulgarian AI report — test sanitization with Cyrillic | Unit test: sanitizeText('Здравей') returns 'Здравей', not '' |

---

## Sources

- [Anthropic Multilingual Support — Official Docs](https://platform.claude.com/docs/en/build-with-claude/multilingual-support) — Bulgarian not in benchmarked languages; Haiku 4.5 multilingual performance table — HIGH confidence
- [React Router i18n Discussion — GitHub](https://github.com/remix-run/react-router/discussions/10510) — trailing slash pitfalls, optional segment approach, useUrlLang hook pattern — MEDIUM confidence (community discussion with maintainer participation)
- [i18next Language Detector — localStorage vs path ordering](https://github.com/i18next/i18next-browser-languageDetector/issues/250) — documented conflict between localStorage and URL-based detection — HIGH confidence (official repo issue)
- [i18next Best Practices](https://www.i18next.com/principles/best-practices) — namespace structure, key naming — HIGH confidence (official docs)
- [Locize: 8 Signs You Should Improve Your i18next Usage](https://www.locize.com/blog/improve-i18next-usage/) — key naming anti-patterns, translation management at scale — MEDIUM confidence
- [Multilingual LLM Survey — Patterns journal](https://www.cell.com/patterns/fulltext/S2666-3899(24)00290-3) — non-English prompts reduce performance; semantic drift in multilingual outputs — MEDIUM confidence (peer-reviewed, 2024)
- [BizAudit src/lib/scoring.ts](../../../src/lib/scoring.ts) — direct analysis: `scoreMap(value, map)` with `?? 1` fallback; all lookup table keys are English strings — HIGH confidence (source code)
- [BizAudit src/components/audit/AuditFormComponents.tsx](../../../src/components/audit/AuditFormComponents.tsx) — direct analysis: `StyledSelect` uses option string as both value and display; `MultiCheckbox` stores display string in `selected` — HIGH confidence (source code)
- [BizAudit src/App.tsx](../../../src/App.tsx) — direct analysis: 4 routes with absolute paths, no locale prefix — HIGH confidence (source code)
- [BizAudit src/pages/Loading.tsx](../../../src/pages/Loading.tsx) — direct analysis: 4 `navigate()` calls with hardcoded absolute paths — HIGH confidence (source code)
- [BizAudit supabase/functions/generate-report/index.ts](../../../supabase/functions/generate-report/index.ts) — direct analysis: `sanitizeText()` uses `\w` (ASCII word chars only, strips Cyrillic); no `locale` parameter; rate limit message hardcoded in English — HIGH confidence (source code)

---
*Pitfalls research for: BizAudit v1.1 — i18n, Bulgarian localization, and sub-niche specialization retrofit*
*Researched: 2026-02-21*

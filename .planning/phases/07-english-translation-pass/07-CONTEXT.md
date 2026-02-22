# Phase 7: English Translation Pass - Context

**Gathered:** 2026-02-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Extract all hardcoded English strings in the app into i18next JSON namespaces. After extraction, the English experience must be byte-for-byte identical to pre-Phase-7. No new features, no Bulgarian content — just extraction and `t()` wiring.

Scope: Landing page, all 8 audit steps, generating/loading page, and report page. Skip minor pages (404/NotFound, error boundaries).

</domain>

<decisions>
## Implementation Decisions

### Namespace structure
- Per-page JSON files in `public/locales/en/`: `landing.json`, `steps.json`, `generating.json`, `report.json`, `common.json`
- `common.json` holds shared strings: navigation buttons (Next, Back, Submit), validation messages, generic error text
- `steps.json` uses step-scoped sections internally: `{ "step1": {...}, "step2": {...}, ... "step8": {...} }`
- `generating.json` covers the loading page animated text sequences
- `report.json` covers static report chrome (section headings, labels, score display text, category names)
- Files loaded at runtime via i18next-http-backend from `public/locales/en/`

### Key naming convention
- Nested objects style: `{ "hero": { "title": "...", "subtitle": "..." } }` — mirrors component structure
- Access via dot notation: `t('landing:hero.title')`
- Claude's Discretion: whether keys follow component hierarchy or semantic/descriptive naming — pick what reads best in the JSON files
- Claude's Discretion: niche-conditional text (Home Services vs Real Estate) — pick between separate keys (`step1.hs.title` / `step1.re.title`) or i18next context feature, based on what works best with existing `isHS` branching

### Extraction scope
- All user-visible text: labels, placeholders, buttons, headings, descriptions, tooltips, validation messages, toasts, error messages
- Report page static chrome: section headings ("Critical Gaps", "Quick Wins"), score labels, category display names
- Scoring category names (Operations, Marketing, Finance, etc.) — extracted because they appear in the scorecard UI
- Score range descriptors ("Critical", "Needs Work", "Strong") — extracted for display purposes
- Skip: NotFound/404 page, error boundary text, aria-labels, alt text, meta tags
- Skip: `generateMockReport()` template fallback content — English-only edge case, not worth extracting now

### Dynamic string handling
- i18next `{{variable}}` interpolation for strings with embedded values (scores, percentages, counts)
- Example: `t('report:overallScore', { score: 75 })` → "Your overall score: 75/100"
- Claude's Discretion: use `<Trans>` component vs splitting into parts for strings with embedded JSX (bold, links, colored spans) — pick simplest approach per case

### Claude's Discretion
- Key hierarchy style (component-based vs semantic) — pick what reads best
- Niche-conditional text approach (separate keys vs i18next context)
- JSX-embedded string handling (`<Trans>` vs splitting)

</decisions>

<specifics>
## Specific Ideas

- Success criteria explicitly mentions `en/steps.json` and `en/report.json` — namespace names should match
- The generating/loading page has animated text sequences that cycle through messages — these should all be extractable
- Scoring category names and score range descriptors need to be translatable at the display layer while keeping internal scoring keys as English constants

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 07-english-translation-pass*
*Context gathered: 2026-02-22*

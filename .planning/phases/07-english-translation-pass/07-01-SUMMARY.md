---
phase: 07-english-translation-pass
plan: 01
subsystem: i18n
tags: [i18next, i18next-http-backend, react-i18next, namespaces, landing-page]

# Dependency graph
requires:
  - phase: 06-i18n-infrastructure
    provides: "i18next setup, URL-driven language detection, LangLayout routing"
provides:
  - "Namespace-based i18n loading via i18next-http-backend from public/locales/"
  - "5 namespace JSON files (common, landing, steps, generating, report)"
  - "Landing page (Index.tsx) fully using t() calls"
  - "Common strings JSON (brand, nav, buttons, validation, niche)"
affects: [07-02, 07-03, 07-04, 07-05, 07-06, 11-bulgarian-translations]

# Tech tracking
tech-stack:
  added: [i18next-http-backend]
  patterns: [namespace-based i18n, Trans component for embedded HTML, returnObjects for arrays, Array.isArray guards for async data]

key-files:
  created:
    - public/locales/en/common.json
    - public/locales/en/landing.json
    - public/locales/en/steps.json
    - public/locales/en/generating.json
    - public/locales/en/report.json
    - public/locales/bg/common.json
    - public/locales/bg/landing.json
    - public/locales/bg/steps.json
    - public/locales/bg/generating.json
    - public/locales/bg/report.json
  modified:
    - src/lib/i18n.ts
    - src/@types/i18next.d.ts
    - src/pages/Index.tsx
    - src/locales/en/translation.json
    - src/locales/bg/translation.json
    - package.json

key-decisions:
  - "fallbackLng changed from 'bg' to 'en' since English is the only language with complete translations"
  - "useSuspense: false to avoid wrapping components in Suspense boundaries"
  - "Array.isArray guards on returnObjects calls to handle async loading state gracefully"
  - "Trans component used for hero subtitle containing embedded <strong> tag"

patterns-established:
  - "Namespace pattern: useTranslation('landing') for page-specific, useTranslation('common') for shared"
  - "Array translation: t('key', { returnObjects: true }) as string[] with Array.isArray guard"
  - "HTML-in-translation: Trans component with components prop for embedded JSX"
  - "loadPath: /locales/{{lng}}/{{ns}}.json served from public/ directory"

requirements-completed: [TRANS-06]

# Metrics
duration: 3min
completed: 2026-02-22
---

# Phase 7 Plan 01: i18n Namespace Infrastructure & Landing Page Extraction Summary

**Namespace-based i18n via i18next-http-backend with 5 JSON namespaces and full landing page string extraction using t() calls**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-22T12:05:37Z
- **Completed:** 2026-02-22T12:09:03Z
- **Tasks:** 2
- **Files modified:** 16

## Accomplishments
- Restructured i18n from inline static imports to namespace-based HTTP backend loading from public/locales/
- Created 5 English namespace JSON files (common fully populated, landing fully populated, 3 skeletons)
- Created matching Bulgarian skeleton files to prevent loading errors
- Converted all hardcoded strings in Index.tsx to t() and tc() calls with zero visual regression

## Task Commits

Each task was committed atomically:

1. **Task 1: Install i18next-http-backend and restructure i18n config** - `4ab5d90` (feat)
2. **Task 2: Extract all landing page strings to t() calls** - `7e06c9b` (feat)

## Files Created/Modified
- `public/locales/en/common.json` - Shared strings: brand, nav, buttons, validation, niche, copyright
- `public/locales/en/landing.json` - All landing page strings: hero, benefits, stats, niche cards, how-it-works
- `public/locales/en/steps.json` - Empty skeleton for step form strings
- `public/locales/en/generating.json` - Empty skeleton for generating page strings
- `public/locales/en/report.json` - Empty skeleton for report page strings
- `public/locales/bg/common.json` - Minimal Bulgarian brand strings
- `public/locales/bg/landing.json` - Empty Bulgarian landing skeleton
- `public/locales/bg/steps.json` - Empty Bulgarian steps skeleton
- `public/locales/bg/generating.json` - Empty Bulgarian generating skeleton
- `public/locales/bg/report.json` - Empty Bulgarian report skeleton
- `src/lib/i18n.ts` - HttpBackend, 5 namespaces, fallbackLng='en', useSuspense=false
- `src/@types/i18next.d.ts` - Namespace-based TypeScript declarations for common and landing
- `src/pages/Index.tsx` - All strings replaced with t()/tc() calls
- `src/locales/en/translation.json` - Emptied (replaced by namespaces)
- `src/locales/bg/translation.json` - Emptied (replaced by namespaces)
- `package.json` - Added i18next-http-backend dependency

## Decisions Made
- Changed fallbackLng from 'bg' to 'en' -- English is the only language with complete translation files; Bulgarian translations come in Phase 11
- Used `useSuspense: false` in i18n config to avoid Suspense wrapper complexity; acceptable for SPA where translations load quickly
- Added `Array.isArray()` guards around `returnObjects` results to gracefully handle the async loading window before JSON is fetched
- Used `Trans` component from react-i18next for the hero subtitle which contains an embedded `<strong>` tag

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Namespace infrastructure is fully operational, ready for 07-02 (common component extraction)
- 07-03/07-04 will populate steps.json with form step strings
- 07-05 will populate generating.json and report.json
- Pattern established: useTranslation('namespace') + t('key') for all subsequent extraction plans

## Self-Check: PASSED

All 10 key files verified present. Both task commits (4ab5d90, 7e06c9b) verified in git log.

---
*Phase: 07-english-translation-pass*
*Completed: 2026-02-22*

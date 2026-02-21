---
phase: 06-i18n-infrastructure-and-routing
plan: 01
subsystem: i18n
tags: [i18next, react-i18next, react-router, url-routing, typescript]

# Dependency graph
requires:
  - phase: 05-frontend-integration
    provides: React SPA with BrowserRouter and route tree
provides:
  - i18next initialized synchronously from URL path
  - Minimal Bulgarian and English translation JSON skeletons
  - TypeScript type-safety for translation keys via CustomTypeOptions
  - LangLayout route wrapper syncing i18n.language with URL param
  - useLang() hook returning { lang, prefix } for navigation
  - Route tree restructured with /:lang? optional segment
affects: [06-02, 06-03, 06-04, 07, 08, 11]

# Tech tracking
tech-stack:
  added: [i18next@25.8.13, react-i18next@16.5.4]
  patterns: [URL-driven language detection, optional route segment, language layout wrapper]

key-files:
  created:
    - src/lib/i18n.ts
    - src/locales/bg/translation.json
    - src/locales/en/translation.json
    - src/@types/i18next.d.ts
    - src/components/LangLayout.tsx
    - src/hooks/useLang.ts
  modified:
    - src/main.tsx
    - src/App.tsx
    - package.json
    - package-lock.json

key-decisions:
  - "URL-driven language detection only (no i18next-browser-languagedetector) -- URL is king"
  - "Bulgarian default: any path without /en/ prefix loads Bulgarian"
  - "/bg/ alias treated as Bulgarian without redirect -- both / and /bg/ work"
  - "Invalid lang segments treated as Bulgarian default, no redirect"

patterns-established:
  - "URL-driven i18n: first path segment determines language, no localStorage/browser detection"
  - "LangLayout pattern: useEffect syncs i18n.changeLanguage with URL param on every navigation"
  - "useLang() hook: returns { lang, prefix } for downstream navigation and component use"
  - "i18n import before App: src/main.tsx imports src/lib/i18n.ts as first import"

requirements-completed: [I18N-01, I18N-03]

# Metrics
duration: 8min
completed: 2026-02-21
---

# Phase 6 Plan 01: i18n Infrastructure and Routing Summary

**i18next with URL-driven language detection via /:lang? route segment, LangLayout sync wrapper, and useLang() navigation hook**

## Performance

- **Duration:** 8 min
- **Tasks:** 2/2
- **Files modified:** 10

## Accomplishments
- Installed i18next and react-i18next with URL-driven language detection (no browser-languagedetector)
- Created minimal Bulgarian and English translation JSON skeletons with matching key structures
- Restructured App.tsx route tree under `/:lang?` optional segment with LangLayout wrapper
- Created useLang() hook providing `{ lang, prefix }` for downstream navigation use

## Task Commits

Each task was committed atomically:

1. **Task 1: Install i18next and create translation infrastructure** - `10a91bb` (feat)
2. **Task 2: Create LangLayout, useLang hook, and restructure route tree** - `62b30cf` (feat)

## Files Created/Modified
- `src/lib/i18n.ts` - i18next initialization with URL-driven language detection
- `src/locales/bg/translation.json` - Bulgarian translation skeleton (nav, landing, common)
- `src/locales/en/translation.json` - English translation skeleton (nav, landing, common)
- `src/@types/i18next.d.ts` - TypeScript CustomTypeOptions for translation key autocomplete
- `src/components/LangLayout.tsx` - Route layout syncing i18n.language with URL param, sets document.lang
- `src/hooks/useLang.ts` - Hook returning { lang, prefix } for language-aware navigation
- `src/main.tsx` - Added i18n import as first import before App
- `src/App.tsx` - Routes restructured under `/:lang?` with LangLayout element
- `package.json` - Added i18next and react-i18next dependencies
- `package-lock.json` - Lockfile updated

## Decisions Made
- Used URL-driven language detection only (no i18next-browser-languagedetector) per user decision "URL is king"
- Bulgarian is the default language: any path without `/en/` prefix loads Bulgarian
- `/bg/` treated as Bulgarian alias without redirect -- both `/` and `/bg/` work identically
- Invalid language segments (e.g., `/fr/`) resolve to Bulgarian default without redirect

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-existing uncommitted changes from 06-02 plan (Step component refactors) were present in working tree. These were left unstaged and not included in 06-01 commits to maintain clean task boundaries.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- i18n infrastructure is fully in place for Phase 6 remaining plans
- LangLayout and useLang() hook ready for navigation prefix updates (06-03)
- Translation skeleton ready for key expansion in Phase 7
- Route structure ready for language toggle component (06-03)

## Self-Check: PASSED

All 8 created/modified files verified present on disk. Both task commits (10a91bb, 62b30cf) verified in git log.

---
*Phase: 06-i18n-infrastructure-and-routing*
*Completed: 2026-02-21*

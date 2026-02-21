---
phase: 06-i18n-infrastructure-and-routing
plan: 03
subsystem: ui
tags: [react, react-router, i18n, navigation, language-toggle, useLang]

# Dependency graph
requires:
  - phase: 06-i18n-infrastructure-and-routing
    plan: 01
    provides: "useLang() hook with { lang, prefix } and LangLayout route wrapper"
  - phase: 06-i18n-infrastructure-and-routing
    plan: 02
    provides: "SelectOption {value, label} API across all step files"
provides:
  - "Language-prefix-aware navigation across all 5 page files"
  - "LanguageToggle component for BG/EN switching via URL"
  - "Toggle integration on landing page (always) and Step 1 (conditional)"
  - "Zero bare navigate/Link calls remaining in page files"
affects: [06-04, 07-english-translation-pass, 11-bulgarian-content]

# Tech tracking
tech-stack:
  added: []
  patterns: ["prefix-aware navigation via useLang() in all page components", "LanguageToggle URL-based language switcher preserving path and query params"]

key-files:
  created:
    - src/components/LanguageToggle.tsx
  modified:
    - src/pages/Index.tsx
    - src/pages/AuditForm.tsx
    - src/pages/Loading.tsx
    - src/pages/Report.tsx
    - src/pages/NotFound.tsx

key-decisions:
  - "LanguageToggle placed in header alongside existing UI elements rather than floating overlay"
  - "Toggle conditionally rendered with {currentStep === 1 && <LanguageToggle />} -- removed from DOM entirely on Steps 2-8"
  - "NotFound.tsx converted from <a href> to <Link to> for consistent React Router navigation with prefix"

patterns-established:
  - "navigate(prefix || '/') for home navigation -- avoids empty string navigate('')"
  - "navigate(`${prefix}/path`) for sub-path navigation -- when prefix is '' produces '/path' correctly"
  - "LanguageToggle strips old prefix and prepends new prefix, preserving pathname and search params"

requirements-completed: [I18N-02, I18N-04, I18N-06]

# Metrics
duration: 8min
completed: 2026-02-21
---

# Phase 6 Plan 03: Page Navigation and Language Toggle Summary

**Language-prefix-aware navigation across all 5 page files with BG/EN toggle on landing page and Step 1**

## Performance

- **Duration:** 8 min
- **Started:** 2026-02-21T16:07:00Z
- **Completed:** 2026-02-21T16:15:00Z
- **Tasks:** 2/2
- **Files modified:** 6

## Accomplishments
- Updated all ~15 navigate() and Link calls across 5 page files to prepend useLang() prefix
- Created LanguageToggle component with BG/EN URL-based language switching that preserves path and query params
- Integrated toggle into landing page header (always visible) and AuditForm header (Step 1 only, hidden on Steps 2-8)
- Verified zero remaining bare navigate("/") or Link to="/" calls in any page file

## Task Commits

Each task was committed atomically:

1. **Task 1: Update all page navigate() and Link calls to use language prefix** - `ce46197` (feat)
2. **Task 2: Create LanguageToggle component and integrate into landing page and Step 1** - `a2a0197` (feat)

## Files Created/Modified
- `src/components/LanguageToggle.tsx` - BG/EN language switcher widget using useLang() and URL navigation
- `src/pages/Index.tsx` - Added useLang prefix to navigate calls, integrated LanguageToggle in header
- `src/pages/AuditForm.tsx` - Added useLang prefix to all navigate calls, conditionally renders LanguageToggle on Step 1
- `src/pages/Loading.tsx` - Added useLang prefix to 3 report navigations and 2 error fallback navigations
- `src/pages/Report.tsx` - Added useLang prefix to header navigate, footer Link, and error state Links
- `src/pages/NotFound.tsx` - Converted bare `<a href="/">` to `<Link to={prefix || "/"}>` with useLang

## Decisions Made
- Placed LanguageToggle in the header bar alongside existing elements (logo and "Free AI Business Audit Tool" text on landing, next to Save Progress on audit form) for clean visual integration
- Toggle is conditionally rendered (`currentStep === 1`) rather than disabled, so it is fully removed from the DOM on Steps 2-8 per user decision
- Converted NotFound.tsx from bare `<a href="/">` to React Router `<Link>` to ensure prefix-aware navigation

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All page navigation is prefix-aware, ready for Phase 7 translation pass to add t() calls to page text
- LanguageToggle is ready and can be reused if visibility rules change in future
- Route tree with /:lang? segment from 06-01 is now fully exercised end-to-end with prefix navigation
- Final plan 06-04 (redirect and edge case handling) can build on this navigation foundation

## Self-Check: PASSED

All files verified present on disk and both task commits verified in git log.

---
*Phase: 06-i18n-infrastructure-and-routing*
*Completed: 2026-02-21*

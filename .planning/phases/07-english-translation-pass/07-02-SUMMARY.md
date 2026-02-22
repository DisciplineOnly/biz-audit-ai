---
phase: 07-english-translation-pass
plan: 02
subsystem: i18n
tags: [react-i18next, useTranslation, t-function, audit-form, form-components]

# Dependency graph
requires:
  - phase: 07-english-translation-pass
    plan: 01
    provides: "Namespace-based i18n with common.json and steps.json skeleton files"
provides:
  - "AuditForm.tsx fully using t() calls for all chrome text"
  - "AuditFormComponents.tsx StepHeader, RatingButtons, StyledSelect using t() for defaults"
  - "common.json populated with stepLabels, rating labels, form placeholders, audit nicheBadge"
  - "steps.json populated with all 8 step titles/subtitles with niche variants"
affects: [07-03, 07-04, 07-05, 11-bulgarian-translations]

# Tech tracking
tech-stack:
  added: []
  patterns: [TFunction parameter passing for non-hook contexts, Array.isArray guard on returnObjects, nullish coalescing for i18n prop defaults]

key-files:
  created: []
  modified:
    - public/locales/en/common.json
    - public/locales/en/steps.json
    - src/pages/AuditForm.tsx
    - src/components/audit/AuditFormComponents.tsx

key-decisions:
  - "Pass TFunction as parameter to validateStep (Option B) since it lives outside the component and cannot use hooks"
  - "Array.isArray guard on returnObjects results for stepLabels, consistent with pattern from 07-01"
  - "Nullish coalescing for RatingButtons labels and StyledSelect placeholder -- explicit prop overrides t() default"

patterns-established:
  - "TFunction param pattern: pass t from component scope to pure functions that need translated strings"
  - "Prop-or-i18n default: component props override t() defaults via nullish coalescing (placeholder ?? t('key'))"

requirements-completed: [TRANS-06]

# Metrics
duration: 3min
completed: 2026-02-22
---

# Phase 7 Plan 02: Audit Form Chrome & Shared Component i18n Extraction Summary

**Audit form shell fully converted to i18n: step labels, nav buttons, validation messages, rating labels, and select placeholders all served from common.json namespace via t() calls**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-22T12:11:40Z
- **Completed:** 2026-02-22T12:14:56Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Populated common.json with stepLabels array, stepLabelsAlt niche variants, audit.nicheBadge, rating.labels, and form.* placeholder strings
- Populated steps.json with all 8 step titles and subtitles including hs/re niche-conditional sub-keys for steps 4, 5, and 6
- Converted all hardcoded strings in AuditForm.tsx to t() calls: brand, step counter, niche badge, validation header, nav buttons, save button
- Converted AuditFormComponents.tsx: StepHeader "Step X of 8", RatingButtons default labels, StyledSelect default placeholder

## Task Commits

Each task was committed atomically:

1. **Task 1: Add audit form chrome strings to common.json and steps.json** - `415f3e2` (feat)
2. **Task 2: Convert AuditForm.tsx and AuditFormComponents.tsx to t() calls** - `ba7c78f` (feat)

## Files Created/Modified
- `public/locales/en/common.json` - Added stepLabels, stepLabelsAlt, audit.nicheBadge, rating.labels, form.* keys
- `public/locales/en/steps.json` - All 8 step titles/subtitles with hs/re niche variants for steps 4-6
- `src/pages/AuditForm.tsx` - useTranslation('common'), all chrome text via t(), validateStep accepts TFunction param
- `src/components/audit/AuditFormComponents.tsx` - StepHeader, RatingButtons, StyledSelect use useTranslation('common') for defaults

## Decisions Made
- Used Option B (pass t as parameter) for validateStep since it is defined outside the component and cannot use hooks directly
- Applied Array.isArray guard on returnObjects results for stepLabels, consistent with the pattern established in 07-01
- Used nullish coalescing for RatingButtons labels and StyledSelect placeholder so explicit props can override i18n defaults

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Audit form chrome is fully i18n-ready, all navigation/validation/labels from common.json
- Steps.json is populated with titles/subtitles ready for step components to consume in 07-03/07-04
- Step-specific form field labels, hints, and option labels remain hardcoded -- addressed in 07-03 (Steps 1-4) and 07-04 (Steps 5-8)

---
*Phase: 07-english-translation-pass*
*Completed: 2026-02-22*

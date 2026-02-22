---
phase: 07-english-translation-pass
plan: 03
subsystem: i18n
tags: [react-i18next, useTranslation, t-function, form-fields, steps-namespace, niche-conditional]

# Dependency graph
requires:
  - phase: 07-english-translation-pass
    plan: 02
    provides: "steps.json with step titles/subtitles, common.json with shared form strings"
provides:
  - "Step1BusinessInfo fully using t() calls for all field labels, placeholders, section headers"
  - "Step2Technology fully using t() calls for all field labels, placeholders, hints"
  - "Step3LeadFunnel fully using t() calls for all field labels with niche-conditional hs/re sub-keys"
  - "Step4Scheduling fully using t() calls for all field labels in both hs and re variants"
  - "steps.json populated with step1-step4 field labels, placeholders, hints, and section headers"
affects: [07-04, 11-bulgarian-translations]

# Tech tracking
tech-stack:
  added: []
  patterns: [niche-conditional i18n keys with hs/re sub-keys, flat keys for shared fields]

key-files:
  created: []
  modified:
    - public/locales/en/steps.json
    - src/components/audit/Step1BusinessInfo.tsx
    - src/components/audit/Step2Technology.tsx
    - src/components/audit/Step3LeadFunnel.tsx
    - src/components/audit/Step4Scheduling.tsx

key-decisions:
  - "Niche-conditional fields use hs/re sub-keys (e.g., step3.fields.responseSpeed.hs.label) while shared fields use flat keys (e.g., step3.fields.leadSources.label)"
  - "Option arrays (toOptions) intentionally left untranslated -- values are scoring keys, label translation deferred to Phase 11"

patterns-established:
  - "Niche-conditional i18n: isHS ? t('namespace.fields.key.hs.label') : t('namespace.fields.key.re.label')"
  - "Flat i18n for shared fields: t('namespace.fields.key.label') when both niches use same text"
  - "Section headers via i18n: t('step1.hs.sectionHeader') for niche-specific headings"

requirements-completed: [TRANS-02]

# Metrics
duration: 3min
completed: 2026-02-22
---

# Phase 7 Plan 03: Step 1-4 Form Field i18n Extraction Summary

**Steps 1-4 field labels, placeholders, hints, and section headers extracted to steps.json namespace with niche-conditional hs/re sub-keys for all variant text**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-22T12:17:13Z
- **Completed:** 2026-02-22T12:20:29Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Populated steps.json with all step1-step4 field labels, placeholders, hints, and section headers using hs/re sub-key structure for niche-conditional text
- Converted all four step components (Step1BusinessInfo, Step2Technology, Step3LeadFunnel, Step4Scheduling) to use t() calls from the steps namespace
- Zero hardcoded English field labels remain in Step 1-4 components (verified via grep)
- Option arrays (toOptions) preserved untouched as scoring keys

## Task Commits

Each task was committed atomically:

1. **Task 1: Add Step 1-4 field strings to steps.json** - `b51d9db` (feat)
2. **Task 2: Convert Step 1-4 components to t() calls** - `cb744f8` (feat)

## Files Created/Modified
- `public/locales/en/steps.json` - Added step1-step4 field labels, placeholders, hints with hs/re niche-conditional sub-keys
- `src/components/audit/Step1BusinessInfo.tsx` - useTranslation('steps'), all labels/placeholders/section headers via t()
- `src/components/audit/Step2Technology.tsx` - useTranslation('steps'), CRM/satisfaction/tools/frustrations via t()
- `src/components/audit/Step3LeadFunnel.tsx` - useTranslation('steps'), lead sources/speed/tracking/reviews via t()
- `src/components/audit/Step4Scheduling.tsx` - useTranslation('steps'), hs scheduling fields and re follow-up fields via t()

## Decisions Made
- Used hs/re sub-keys for niche-conditional fields (e.g., `step3.fields.responseSpeed.hs.label`) and flat keys for shared fields (e.g., `step3.fields.leadSources.label`) -- consistent structure that maps cleanly to the isHS ternary pattern
- Kept option arrays (toOptions) untranslated -- their string values serve as scoring lookup keys and translating them would break the scoring engine. Label translation deferred to Phase 11 when Bulgarian content is added

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Steps 1-4 are fully i18n-ready, all field labels served from steps.json
- 07-04 will complete the remaining steps (5-8) using the same pattern
- steps.json now contains complete step1-step4 content plus title/subtitle skeletons for steps 5-8

## Self-Check: PASSED

All 5 key files verified present. Both task commits (b51d9db, cb744f8) verified in git log.

---
*Phase: 07-english-translation-pass*
*Completed: 2026-02-22*

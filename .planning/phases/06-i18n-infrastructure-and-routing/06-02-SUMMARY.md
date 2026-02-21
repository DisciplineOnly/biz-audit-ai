---
phase: 06-i18n-infrastructure-and-routing
plan: 02
subsystem: ui
tags: [react, typescript, i18n, form-components, select-option]

# Dependency graph
requires:
  - phase: 05-frontend-integration
    provides: "Working 8-step audit form with StyledSelect and MultiCheckbox components"
provides:
  - "SelectOption interface for {value, label} form option API"
  - "toOptions() helper to convert string[] to SelectOption[]"
  - "All 8 step files using SelectOption[] for scoring-safe i18n"
affects: [07-english-translation-pass, 08-sub-niche-config, 11-bulgarian-content]

# Tech tracking
tech-stack:
  added: []
  patterns: ["SelectOption {value, label} API for all form dropdowns and multi-checkboxes"]

key-files:
  created: []
  modified:
    - src/components/audit/AuditFormComponents.tsx
    - src/components/audit/Step1BusinessInfo.tsx
    - src/components/audit/Step2Technology.tsx
    - src/components/audit/Step3LeadFunnel.tsx
    - src/components/audit/Step4Scheduling.tsx
    - src/components/audit/Step5Communication.tsx
    - src/components/audit/Step6FollowUp.tsx
    - src/components/audit/Step7Operations.tsx
    - src/components/audit/Step8Financial.tsx

key-decisions:
  - "Export toOptions() from AuditFormComponents rather than defining locally in each step file -- reduces duplication and ensures consistency"
  - "Keep RESPONSE_SPEEDS as plain string[] intermediate for spread then wrap with toOptions() -- preserves the composition pattern in Step3"

patterns-established:
  - "SelectOption pattern: all dropdown/checkbox options use {value, label} objects where value is the English scoring key and label is the displayed text"
  - "toOptions() bridge: during English-only phase, wraps string[] with value === label; Phase 7 will replace labels with t() calls"

requirements-completed: [I18N-05]

# Metrics
duration: 8min
completed: 2026-02-21
---

# Phase 6 Plan 02: Value/Label Refactor Summary

**SelectOption {value, label} API for StyledSelect and MultiCheckbox with toOptions() bridge across all 8 step files**

## Performance

- **Duration:** 8 min
- **Started:** 2026-02-21T18:00:00Z
- **Completed:** 2026-02-21T18:08:00Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- SelectOption interface exported from AuditFormComponents.tsx separating stored value (English scoring key) from displayed label
- StyledSelect and MultiCheckbox refactored to accept SelectOption[] instead of string[]
- toOptions() helper exported as a bridge function (value === label for English-only Phase 6)
- All 8 step files updated: every option constant wrapped with toOptions()
- Build passes with zero TypeScript errors, tests pass, no visual regressions

## Task Commits

Each task was committed atomically:

1. **Task 1: Refactor StyledSelect and MultiCheckbox to {value, label} API** - `d6e1981` (feat)
2. **Task 2: Update all 8 step file call sites to {value, label} API** - `2fef428` (feat)

## Files Created/Modified
- `src/components/audit/AuditFormComponents.tsx` - Added SelectOption interface, refactored StyledSelect and MultiCheckbox prop types, added toOptions() helper
- `src/components/audit/Step1BusinessInfo.tsx` - 10 option arrays wrapped with toOptions()
- `src/components/audit/Step2Technology.tsx` - 4 option arrays wrapped with toOptions()
- `src/components/audit/Step3LeadFunnel.tsx` - 12 option arrays wrapped with toOptions()
- `src/components/audit/Step4Scheduling.tsx` - 12 option arrays wrapped with toOptions()
- `src/components/audit/Step5Communication.tsx` - 12 option arrays wrapped with toOptions()
- `src/components/audit/Step6FollowUp.tsx` - 12 option arrays wrapped with toOptions()
- `src/components/audit/Step7Operations.tsx` - 11 option arrays wrapped with toOptions()
- `src/components/audit/Step8Financial.tsx` - 11 option arrays wrapped with toOptions()

## Decisions Made
- Exported toOptions() from AuditFormComponents.tsx as a shared helper rather than defining it locally in each step file. This reduces duplication across 8 files and ensures consistent behavior.
- In Step3LeadFunnel.tsx, kept `RESPONSE_SPEEDS` as a plain `string[]` intermediate array that gets spread into `toOptions([...RESPONSE_SPEEDS, "extra option"])` to preserve the existing composition pattern.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 7 (English Translation Pass) can now replace `toOptions(["English label"])` with `[{ value: "English label", label: t("key") }]` to add translations while keeping scoring values stable
- Phase 8 (Sub-Niche Config) can extend the SelectOption pattern for sub-niche-specific option lists
- Phase 11 (Bulgarian Content) will pass Bulgarian labels via the label field while value remains English

## Self-Check: PASSED

- All 9 modified files verified present via git diff
- Commit d6e1981 verified present in git log
- Commit 2fef428 verified present in git log
- Build passes (vite build succeeded)
- Tests pass (vitest 1/1)
- No remaining `options: string[]` types in audit components

---
*Phase: 06-i18n-infrastructure-and-routing*
*Completed: 2026-02-21*

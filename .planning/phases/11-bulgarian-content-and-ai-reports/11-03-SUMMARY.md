---
phase: 11-bulgarian-content-and-ai-reports
plan: 03
subsystem: api, ai
tags: [anthropic, claude-haiku, i18n, bulgarian, edge-functions, rate-limiting, deno]

# Dependency graph
requires:
  - phase: 09-sub-niche-scoring-and-ai
    provides: SUB_NICHE_LABELS map and sub-niche-aware prompt in generate-report
  - phase: 07-english-i18n-extraction
    provides: i18next namespace infrastructure (generating.json locale files)
provides:
  - Language-aware generate-report edge function (buildBulgarianPrompt for BG, buildPrompt for EN)
  - BG_SUB_NICHE_LABELS map with Bulgarian sub-niche display names
  - Machine-readable rate-limit response (code + hoursRemaining) replacing hardcoded English message
  - Client-side i18n rate-limit message construction in Loading.tsx
  - Shared prompt helpers (buildFormContext, buildCategoryScoreLines, getItemCounts)
affects: [11-04, send-notification]

# Tech tracking
tech-stack:
  added: []
  patterns: [separate-prompt-template-per-language, machine-readable-error-codes, shared-prompt-helpers]

key-files:
  created: []
  modified:
    - supabase/functions/generate-report/index.ts
    - src/pages/Loading.tsx

key-decisions:
  - "Separate Bulgarian prompt template (buildBulgarianPrompt) instead of language flag injection into existing prompt"
  - "Shared helper functions (buildFormContext, buildCategoryScoreLines, getItemCounts) extracted for DRY prompt building"
  - "Sub-niche fallback to raw key (not null) for unknown values, future-proofing against new sub-niches"
  - "MAX_TOKENS increased from 4096 to 5000 for all languages (Bulgarian text ~10-20% longer)"
  - "Machine-readable rate-limit response (code + hoursRemaining) replaces hardcoded English message"

patterns-established:
  - "Separate prompt template per language: buildPrompt (EN) and buildBulgarianPrompt (BG) share helpers but have independent system prompts"
  - "Machine-readable error codes from edge functions: client maps to localized messages via i18n"

requirements-completed: [AI-01, AI-02, AI-03]

# Metrics
duration: 6min
completed: 2026-02-22
---

# Phase 11 Plan 03: AI Report Generation Summary

**Language-aware generate-report edge function with Bulgarian prompt template, BG sub-niche labels, and i18n rate-limit handling**

## Performance

- **Duration:** 6 min
- **Started:** 2026-02-22T21:20:32Z
- **Completed:** 2026-02-22T21:26:41Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Bulgarian AI report prompt with formal Вие tone, Bulgarian platform recommendations (imot.bg, OLX.bg, etc.), and no NRA/tax references
- Language-conditional prompt selection (BG users get buildBulgarianPrompt, EN users get buildPrompt)
- Machine-readable rate-limit response enables client-side i18n for error messages in any language
- Shared prompt helpers extracted for DRY code between EN and BG prompt builders

## Task Commits

Each task was committed atomically:

1. **Task 1: Add Bulgarian prompt template and language support to generate-report edge function** - `a3ddb6b` (feat)
2. **Task 2: Update Loading.tsx to pass language and handle machine-readable rate-limit codes** - `88cce38` (feat)

## Files Created/Modified
- `supabase/functions/generate-report/index.ts` - Language-aware prompt building with buildBulgarianPrompt, BG_SUB_NICHE_LABELS, machine-readable rate-limit response, MAX_TOKENS 5000
- `src/pages/Loading.tsx` - Passes language param to generate-report, constructs localized rate-limit messages from hoursRemaining via i18n

## Decisions Made
- Separate Bulgarian prompt template (buildBulgarianPrompt) rather than injecting a language flag into the existing prompt, per CONTEXT.md guidance
- Extracted shared helpers (buildFormContext, buildCategoryScoreLines, getItemCounts) to keep code DRY between EN and BG prompt builders
- Sub-niche label fallback changed from null to raw key for unknown values, matching STATE.md decision for future-proofing
- MAX_TOKENS increased to 5000 for all languages (not just BG) since Haiku charges per actual output tokens

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Bulgarian AI reports will be generated when users submit audits in Bulgarian language context
- Rate-limit error messages display in the user's current language
- English experience unchanged (regression-safe)
- Ready for Plan 04 (if any remaining Phase 11 work)

## Self-Check: PASSED

All files exist, all commits verified.

---
*Phase: 11-bulgarian-content-and-ai-reports*
*Completed: 2026-02-22*

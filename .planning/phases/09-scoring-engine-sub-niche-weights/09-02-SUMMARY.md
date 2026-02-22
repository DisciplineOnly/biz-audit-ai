---
phase: 09-scoring-engine-sub-niche-weights
plan: 02
subsystem: ai-report
tags: [edge-function, ai-prompt, sub-niche, personalization, claude-haiku]

# Dependency graph
requires:
  - phase: 09-scoring-engine-sub-niche-weights
    plan: 01
    provides: SubNiche types, computeScores() with sub-niche weight overrides
  - phase: 08-sub-niche-selection-and-config
    provides: SubNiche type, subNiche field in AuditFormState, SUB_NICHE_REGISTRY
provides:
  - Sub-niche context in AI report prompt for personalized recommendations
  - SUB_NICHE_LABELS inline map in edge function for key-to-label resolution
  - FormState.subNiche type safety in edge function
affects: [09-03, generate-report, report-display]

# Tech tracking
tech-stack:
  added: []
  patterns: [inline label map for Deno edge function isolation from frontend config]

key-files:
  created: []
  modified:
    - supabase/functions/generate-report/index.ts

key-decisions:
  - "Inline SUB_NICHE_LABELS map in edge function -- cannot import from frontend config in Deno runtime"
  - "Read subNiche from both body.subNiche and body.formState.subNiche for maximum compatibility"
  - "No weight context in AI prompt -- only sub-niche name, per 09-CONTEXT decision"
  - "Human-readable label in prompt (HVAC not hvac) for natural AI output"

patterns-established:
  - "Deno edge function label map pattern: inline Record<string, string> with sync comment to frontend config"
  - "Conditional prompt line via template literal: only include when value present"

requirements-completed: [SCORE-01]

# Metrics
duration: 2min
completed: 2026-02-22
---

# Phase 9 Plan 02: AI Prompt Sub-Niche Context Summary

**Sub-niche name injected into Claude Haiku 4.5 report prompt with inline label resolution and graceful null fallback**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-22T13:35:12Z
- **Completed:** 2026-02-22T13:36:57Z
- **Tasks:** 3
- **Files modified:** 1

## Accomplishments
- buildPrompt() accepts optional subNiche parameter for personalized AI recommendations
- User prompt includes "Sub-Niche: HVAC" (human-readable label) when sub-niche provided, omitted when null
- System prompt instructs Claude to tailor recommendations to the specific business type
- SUB_NICHE_LABELS inline map covers all 17 sub-niches with sync comment to frontend registry
- Edge function reads subNiche from both body.subNiche and body.formState.subNiche paths
- FormState interface updated with subNiche field for type safety

## Task Commits

Each task was committed atomically:

1. **Task 1: Add subNiche to buildPrompt parameters and user prompt** - `4901eae` (feat)
2. **Task 2: Read subNiche from request body and pass to buildPrompt** - `01c0870` (feat)
3. **Task 3: Add subNiche to FormState interface in edge function** - `45822d7` (feat)

## Files Created/Modified
- `supabase/functions/generate-report/index.ts` - Added subNiche parameter to buildPrompt, inline SUB_NICHE_LABELS map, subNiche in FormState interface, system prompt tailoring instruction

## Decisions Made
- **Inline label map instead of shared import** -- Deno edge functions cannot import from the frontend `src/` config, so SUB_NICHE_LABELS is duplicated inline with a comment to keep in sync with SUB_NICHE_REGISTRY
- **Dual read path (body.subNiche ?? body.formState.subNiche)** -- Loading.tsx sends formState which includes subNiche; the dual read ensures compatibility if a top-level subNiche field is ever added
- **No weight context in prompt** -- Per 09-CONTEXT design decision, only the sub-niche name is sent to the AI so it uses its own domain knowledge for recommendations
- **Human-readable label in prompt** -- "HVAC" not "hvac" for natural language output from Claude

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- AI prompt now includes sub-niche context, ready for 09-03 (verification/testing)
- Edge function is backward compatible -- no subNiche in request body = identical v1.0 prompt
- No blockers

## Self-Check: PASSED

All files exist, all commits verified, all must_have artifacts confirmed:
- subNiche in supabase/functions/generate-report/index.ts
- SUB_NICHE_LABELS in supabase/functions/generate-report/index.ts
- FormState.subNiche in edge function
- Build passes with zero errors

---
*Phase: 09-scoring-engine-sub-niche-weights*
*Completed: 2026-02-22*

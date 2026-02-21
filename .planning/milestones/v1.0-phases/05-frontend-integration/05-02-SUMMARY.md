---
phase: 05-frontend-integration
plan: 02
subsystem: ui
tags: [react, supabase, edge-functions, rate-limiting, typescript]

# Dependency graph
requires:
  - phase: 04-rate-limiting
    provides: generate-report edge function with Upstash Redis rate limiting (429 response with rateLimited body)
  - phase: 02-ai-report-edge-function
    provides: generate-report edge function returning { success: true, report: {...} }
  - phase: 01-schema-and-environment
    provides: submitAudit returning Promise<string> with client-generated UUID
provides:
  - Loading.tsx orchestrates submitAudit -> generate-report -> navigate with error states
  - Rate limit 429 blocks user on loading screen with time-hint message
  - Retry/Skip UX for non-429 generate-report failures
  - aiReport passed in navigate state to Report page when AI succeeds
affects: [05-frontend-integration, 06-end-to-end-verification, report-page]

# Tech tracking
tech-stack:
  added: [FunctionsHttpError from @supabase/supabase-js]
  patterns:
    - supabase.functions.invoke for edge function invocation from React
    - Promise.all([apiCall, minTimer]) for minimum animation timer + API race
    - mountedRef pattern for async cleanup safety in useEffect
    - auditIdRef prevents duplicate DB rows on retry

key-files:
  created: []
  modified:
    - src/pages/Loading.tsx
    - src/types/audit.ts

key-decisions:
  - "Loading.tsx uses Promise.all([generateCall, minTimer]) with MIN_WAIT_MS=8000 — ensures 8s minimum animation regardless of API speed"
  - "429 rate limit response blocks user on loading screen — no fallback navigation or template link shown (locked decision)"
  - "Retry re-calls only generate-report — preserves auditIdRef so submitAudit is never called twice (prevents duplicate DB rows)"
  - "Skip to Report navigates without aiReport in state — Report page falls through to template-generated content"
  - "Progress bar pauses at 90% until API resolves, then jumps to 100% on success"
  - "mountedRef guards all setState/navigate calls — async flow cannot be cancelled but ignores results after unmount"
  - "AIReportData interface added to src/types/audit.ts to type the edge function success response"

patterns-established:
  - "Async orchestration pattern: sequential submitAudit then parallel generate-report + timer"
  - "FunctionsHttpError instanceof check for Supabase edge function 4xx responses"

requirements-completed: [DATA-03]

# Metrics
duration: 15min
completed: 2026-02-20
---

# Phase 05 Plan 02: Loading.tsx Async Orchestration Summary

**Loading.tsx refactored to orchestrate submitAudit -> generate-report edge function invocation with 8s minimum animation, 429 rate limit blocking, and Retry/Skip error recovery**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-02-20
- **Completed:** 2026-02-20
- **Tasks:** 1
- **Files modified:** 2

## Accomplishments

- Replaced fire-and-forget submitAudit + hard 14.5s redirect with full async orchestration flow
- Added supabase.functions.invoke('generate-report') with auditId, formState, scores in body
- Implemented Promise.all([generateCall, minTimer]) with 8s minimum animation guarantee
- Rate limit 429 response blocks user on loading screen with time-hint message — no navigation (locked decision honored)
- Non-429 errors show Retry and Skip to Report buttons; Retry re-calls generate-report only (no duplicate rows)
- Progress bar pauses at 90% until API resolves, jumps to 100% on success
- Added AIReportData interface to types/audit.ts for edge function response typing
- mountedRef guards all async state/navigation after component unmount

## Task Commits

1. **Task 1: Refactor Loading.tsx async orchestration and error handling** - `469d015` (feat)

## Files Created/Modified

- `src/pages/Loading.tsx` — Full rewrite: removed 14.5s hard redirect, added generate-report invocation, rate limit UI, retry/skip UX, progress bar pause logic, mountedRef cleanup guard
- `src/types/audit.ts` — Added AIReportData and AIReportItem interfaces for edge function response typing

## Decisions Made

- `Promise.all([generateCall, minTimer])` for parallel minimum timer + API call — matches locked decision from 05-CONTEXT.md
- 429 rate limit path: show block message, set isRateLimited=true, return early — no navigation to report
- Retry calls `callGenerateReport(Date.now())` without MIN_WAIT_MS — user already waited through the animation
- `auditIdRef` is stored from first submitAudit call; never re-called on retry to prevent duplicate DB rows
- `mountedRef` pattern chosen over AbortController — async flow is a Promise chain, not cancellable, but results are safely discarded after unmount

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added AIReportData type to audit.ts**
- **Found during:** Task 1 (Loading.tsx refactor)
- **Issue:** Plan specified `import type { AIReportData } from '@/types/audit'` but the type did not exist in the file — the import would fail TypeScript compilation
- **Fix:** Added AIReportData and AIReportItem interfaces to src/types/audit.ts before writing Loading.tsx
- **Files modified:** src/types/audit.ts
- **Verification:** `npm run build` passes without TypeScript errors
- **Committed in:** 469d015 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 2 — missing type required for correctness)
**Impact on plan:** Essential for TypeScript compilation. The AIReportData type was referenced by the plan but not yet present in audit.ts. No scope creep.

## Issues Encountered

None — build passed on first attempt after writing the refactored component.

## User Setup Required

None — no external service configuration required for this plan.

## Next Phase Readiness

- Loading.tsx now fully wires generate-report — Phase 4 rate limiting guard is active on real traffic
- Report.tsx (Plan 05-03) needs to consume `aiReport` from navigate state to render AI-generated content
- The template-generated content path (no aiReport in state) remains the fallback for retry-skip scenarios and submitAudit failures

---
*Phase: 05-frontend-integration*
*Completed: 2026-02-20*

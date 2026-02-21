---
phase: 05-frontend-integration
plan: 01
subsystem: api
tags: [supabase, edge-functions, deno, typescript, fetch-report, service-role]

# Dependency graph
requires:
  - phase: 01-schema-and-environment
    provides: audits table with RLS (anon INSERT only, no SELECT)
  - phase: 02-ai-report-edge-function
    provides: audit_reports table with AI report JSON, generate-report pattern
  - phase: 03-email-webhook
    provides: audit_reports upsert pattern, corsHeaders inline deploy pattern

provides:
  - supabase/functions/fetch-report/index.ts — service_role edge function for reading audit + AI report data
  - src/lib/fetchReport.ts — typed client helper invoking fetch-report via supabase.functions.invoke
  - AIReportItem and AIReportData interfaces exported from src/types/audit.ts

affects:
  - 05-02 (Loading.tsx integration — imports fetchReport and AIReportData)
  - 05-03 (Report.tsx — uses FetchReportResult shape to render AI report)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "fetch-report reads both audits and audit_reports using service_role client — anon role has no SELECT on either"
    - "FunctionsHttpError body inspection to distinguish 404 not_found from other errors"
    - "Edge function deployment via MCP requires inlined corsHeaders — same pattern as generate-report (Phase 3)"

key-files:
  created:
    - supabase/functions/fetch-report/index.ts
    - src/lib/fetchReport.ts
  modified:
    - src/types/audit.ts

key-decisions:
  - "fetch-report edge function reads audits + audit_reports with service_role — SEC-02 preserved (no anon SELECT policy added)"
  - "fetchReport client uses FunctionsHttpError to distinguish 404 (throws not_found string) from 5xx/network errors"
  - "AIReportData interfaces defined to match generate-report JSON schema (executiveSummary, gaps, quickWins, strategicRecommendations)"
  - "Edge function deployment deferred to orchestrator MCP — executor does not have MCP tool access (same pattern as Phase 2)"

patterns-established:
  - "fetchReport throws Error('not_found') on 404 — callers (Report.tsx) can show branded 404 page on this error string"
  - "Service role reads via edge function — the only pattern for reading audit data from client (SEC-02 compliance)"

requirements-completed: [DATA-03]

# Metrics
duration: ~15min
completed: 2026-02-20
---

# Phase 05 Plan 01: Fetch-Report Edge Function and Client Helper Summary

**Deno edge function with service_role reads from audits + audit_reports, typed fetchReport() client helper, and AIReportData/AIReportItem interfaces — enabling shareable report URL data loading**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-02-20T15:37:13Z
- **Completed:** 2026-02-20
- **Tasks:** 2
- **Files modified:** 3 (1 modified, 2 created) + 1 edge function created

## Accomplishments
- Created `supabase/functions/fetch-report/index.ts` using service_role client to read from both `audits` and `audit_reports` tables, returning combined data as `{ audit, aiReport, reportStatus }` with proper 404 handling
- Created `src/lib/fetchReport.ts` typed client helper using `supabase.functions.invoke`, distinguishing 404 (throws `Error('not_found')`) from other errors via `FunctionsHttpError` body inspection
- Added `AIReportItem` and `AIReportData` interfaces to `src/types/audit.ts` matching the generate-report JSON schema — available for both Loading.tsx (Plan 02) and Report.tsx (Plan 03)
- `npm run build` and `npx tsc --noEmit` both pass with no errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Create fetch-report edge function and AIReportData type** - `6c3e078` (feat)
2. **Task 2: Create fetchReport client helper** - `a14567d` (feat)

**Plan metadata:** (this docs commit)

## Files Created/Modified
- `supabase/functions/fetch-report/index.ts` - Deno edge function: POST `{ auditId }` → 404 or `{ audit, aiReport, reportStatus }` using service_role
- `src/lib/fetchReport.ts` - Client helper: `fetchReport(auditId)` returns `FetchReportResult`, throws `not_found` on 404
- `src/types/audit.ts` - Added `AIReportItem` and `AIReportData` interfaces at end of file

## Decisions Made

- **SEC-02 preserved** — fetch-report uses `SUPABASE_SERVICE_ROLE_KEY` in the edge function; no anon SELECT policy added to audits or audit_reports. All report reads go through the service_role edge function.
- **404 distinction** — The client helper inspects `FunctionsHttpError` body for `error === 'not_found'` before throwing `Error('not_found')`. This lets Report.tsx show a branded 404 page vs. a generic error page.
- **AIReportData schema match** — The interfaces match exactly the JSON structure returned by `generate-report` (executiveSummary string, gaps/quickWins/strategicRecommendations arrays with title/description/priority/cta plus optional impact/timeframe/roi).
- **Deployment deferred to orchestrator** — The Supabase MCP `deploy_edge_function` tool is not accessible from the executor context (confirmed pattern from Phase 2 02-01-SUMMARY). The orchestrator must deploy using the inlined corsHeaders pattern (same as generate-report Phase 3 redeploy).

## Deviations from Plan

None — plan executed exactly as written. All code artifacts created per specifications.

**Note on deployment:** Edge function code created at `supabase/functions/fetch-report/index.ts` (with `../_shared/cors.ts` import for CLI compatibility). Deployment via Supabase MCP requires inlining `corsHeaders` constant — this is an established pattern (STATE.md decision: "generate-report MCP deploy inlines corsHeaders constant"), not a deviation.

## Issues Encountered

- **Supabase CLI not authenticated** — `supabase functions deploy` requires `SUPABASE_ACCESS_TOKEN` or `supabase login`. CLI deployment not possible from executor. MCP deployment by orchestrator is the correct path per Phase 2 precedent.

## User Setup Required

**Edge function deployment required by orchestrator.** The `fetch-report` edge function must be deployed to Supabase project `qyktrwpgfyvgdnexzcpr` via MCP `deploy_edge_function` tool with inlined corsHeaders:

```typescript
// Inline this instead of: import { corsHeaders } from '../_shared/cors.ts'
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
```

The function source from `supabase/functions/fetch-report/index.ts` with the above substitution is ready to deploy.

## Self-Check: PASSED

- [x] `supabase/functions/fetch-report/index.ts` exists
- [x] `src/lib/fetchReport.ts` exists and exports `fetchReport` and `FetchReportResult`
- [x] `src/types/audit.ts` exports `AIReportData` and `AIReportItem`
- [x] `npx tsc --noEmit` passes
- [x] `npm run build` passes (chunk size warning pre-existing, not from our changes)
- [x] Commit `6c3e078` verified (Task 1: fetch-report edge function + AIReportData types)
- [x] Commit `a14567d` verified (Task 2: fetchReport client helper)
- [x] Commit `124cbf4` verified (docs: SUMMARY.md + STATE.md)
- [x] Commit `9518e6a` verified (docs: ROADMAP.md + REQUIREMENTS.md + STATE.md final)

## Next Phase Readiness

- Phase 05-02 (Loading.tsx integration) can proceed — `fetchReport` and `AIReportData` are available to import
- Phase 05-03 (Report.tsx) can proceed — `FetchReportResult` interface defines exact data shape
- **Blocker:** fetch-report edge function must be deployed by orchestrator before end-to-end testing works
- SEC-02 preserved throughout — no new anon SELECT policies added

---
*Phase: 05-frontend-integration*
*Completed: 2026-02-20*

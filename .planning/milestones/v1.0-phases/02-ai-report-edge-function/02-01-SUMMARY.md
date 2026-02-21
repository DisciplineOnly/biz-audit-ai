---
phase: 02-ai-report-edge-function
plan: 01
subsystem: api
tags: [supabase, edge-functions, deno, anthropic, claude, postgres, migration]

requires:
  - phase: 01-schema-and-environment
    provides: audits table with RLS and anon INSERT policy

provides:
  - report_status column migration SQL for audits table (pending/completed/failed)
  - supabase/functions/_shared/cors.ts — shared CORS headers for all edge functions
  - supabase/functions/generate-report/index.ts — complete edge function with Claude Haiku 4.5 integration

affects: [02-02-deploy-and-test, 05-frontend-integration]

tech-stack:
  added: [npm:@anthropic-ai/sdk, npm:@supabase/supabase-js@2, jsr:@supabase/functions-js]
  patterns: [deno-edge-function, input-sanitization-regex, score-driven-prompt-engineering, pii-exclusion-at-prompt-layer]

key-files:
  created:
    - supabase/migrations/20260219120000_add_report_status_to_audits.sql
    - supabase/functions/_shared/cors.ts
    - supabase/functions/generate-report/index.ts
  modified: []

key-decisions:
  - "Migration applied by orchestrator MCP (executor lacks MCP tool access) — same pattern as Phase 1"
  - "Clients instantiated inside Deno.serve handler (not module level) — required for per_worker edge runtime mode"
  - "PII exclusion at prompt-building layer: email, phone, contactName keys never referenced in buildPrompt()"
  - "report_status 'failed' update is best-effort: wrapped in separate try/catch, error intentionally swallowed"
  - "Score-driven item counts: <40 scores get 4-5 gaps/3 wins/3 recs; 40-65 get 3/3/3; >65 get 2/2/2"

patterns-established:
  - "Edge function shared modules live in supabase/functions/_shared/ — import via relative path"
  - "Sanitization before LLM: strip HTML tags, strip special chars, normalize whitespace, truncate to 500 chars"
  - "No fallback content on AI failure — return error, let frontend handle graceful UX"

requirements-completed: [AI-01, AI-02, AI-03, AI-04, SEC-04]

duration: 25min
completed: 2026-02-19
---

# Phase 02 Plan 01: Generate-Report Edge Function Summary

**Deno edge function with Claude Haiku 4.5, regex-based PII exclusion, score-driven prompt engineering, and report_status tracking via Supabase admin client**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-02-19T12:00:00Z
- **Completed:** 2026-02-19T12:25:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Complete `generate-report` edge function implementing full pipeline: sanitize inputs -> build niche-aware prompt -> call Claude Haiku 4.5 -> parse JSON -> update report_status
- `report_status` migration SQL created (ADD COLUMN with CHECK constraint for pending/completed/failed)
- Shared CORS module established for all edge functions
- All 5 requirements addressed: AI-01 (Claude model), AI-02 (niche context), AI-03 (score-sorted categories), AI-04 (structured JSON schema), SEC-04 (sanitization + PII exclusion)

## Task Commits

Each task was committed atomically:

1. **Task 1: report_status migration + shared CORS module** - `031c4cb` (chore)
2. **Task 2: generate-report edge function** - `c1692a7` (feat)

**Plan metadata:** included in this summary commit

## Files Created/Modified
- `supabase/migrations/20260219120000_add_report_status_to_audits.sql` - ALTER TABLE adds report_status TEXT NOT NULL DEFAULT 'pending' with CHECK constraint
- `supabase/functions/_shared/cors.ts` - Exports corsHeaders object with Access-Control-Allow-Origin: * and standard Supabase headers
- `supabase/functions/generate-report/index.ts` - Complete 428-line Deno edge function

## Decisions Made
- **Clients inside handler:** Anthropic and Supabase admin clients instantiated inside `Deno.serve` callback, not at module top level. Required for per_worker edge runtime where handler may be invoked multiple times.
- **PII exclusion by omission:** buildPrompt() function explicitly only maps non-PII step1 fields (industry, employeeCount, role, teamSize, etc.) and never references .email, .phone, or .contactName. No runtime filtering needed — the keys are simply never accessed.
- **Best-effort status failure update:** The 'failed' status update is wrapped in a separate try/catch with the error intentionally swallowed. If the DB is unreachable after an AI failure, we don't want a secondary exception to mask the original error response.
- **Migration via MCP:** Executor agent lacks direct MCP tool access (same limitation as Phase 1). Migration SQL file is committed for version control; actual application to project qyktrwpgfyvgdnexzcpr must be done via Supabase MCP apply_migration or Dashboard SQL editor.

## Deviations from Plan

None - plan executed exactly as written. All code artifacts created per specification.

**Note on migration application:** The migration SQL file is created and tracked in version control. Actual database application requires MCP tool access (which the executor lacks). This is the same pattern established in Phase 1 where the orchestrator handled MCP calls. The migration must be applied before the edge function can update report_status.

## Issues Encountered
- Executor agent lacks Supabase MCP tool access (no `apply_migration` or `execute_sql` tools in tool list). Migration SQL committed locally; application to remote DB deferred to orchestrator MCP call or manual Dashboard step. Identical to Phase 1 pattern — no impact on code artifact deliverables.

## User Setup Required
The plan's `user_setup` section specifies the ANTHROPIC_API_KEY must be stored as a Supabase secret:

**Required before deployment:**
1. Obtain API key from https://console.anthropic.com → API Keys → Create Key
2. Store as Supabase project secret: Dashboard → Project Settings → Edge Functions → Secrets → Add new secret
   - Key: `ANTHROPIC_API_KEY`
   - Value: `sk-ant-...`

Note: `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are auto-injected by the edge runtime — no manual setup needed for those.

## Next Phase Readiness
- Code artifacts complete and committed — ready for Plan 02-02 (deploy and test)
- Migration must be applied to remote DB before 02-02 testing
- ANTHROPIC_API_KEY must be set as Supabase secret before deployment testing

---
*Phase: 02-ai-report-edge-function*
*Completed: 2026-02-19*

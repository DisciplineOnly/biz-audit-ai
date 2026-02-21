---
phase: 03-email-webhook
plan: 01
subsystem: database
tags: [supabase, postgres, migration, rls, jsonb, edge-function, deno]

# Dependency graph
requires:
  - phase: 01-schema-and-environment
    provides: audits table and RLS patterns
  - phase: 02-ai-report-edge-function
    provides: generate-report edge function that produces AI report JSON
provides:
  - email_status column on audits table (pending/sent/failed)
  - audit_reports table with JSONB report column and UNIQUE(audit_id) constraint
  - generate-report edge function that persists AI report before triggering webhook
affects:
  - 03-02-send-notification (reads audit_reports to build email content)
  - Phase 5 (report page may fetch from audit_reports)
  - Phase 6 (verification of end-to-end email flow)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "audit_reports upsert before report_status update — ensures data exists when webhook fires"
    - "onConflict: audit_id for idempotent upserts — safe on edge function retry"
    - "RLS enabled at table creation with no anon policies — service_role reads/writes bypass RLS"

key-files:
  created:
    - supabase/migrations/20260220120000_add_email_status_and_audit_reports.sql
  modified:
    - supabase/functions/generate-report/index.ts

key-decisions:
  - "email_status values: pending/sent/failed only — no 'partial' (admin email only in Phase 3)"
  - "upsert with onConflict audit_id instead of insert — idempotent for edge function retries"
  - "audit_reports upsert placed BEFORE report_status 'completed' update — webhook ordering requirement"
  - "no anon RLS policies on audit_reports — service_role bypasses RLS, no client access needed"

patterns-established:
  - "Webhook ordering: persist data before triggering status change that fires webhook"
  - "Idempotent writes: upsert with onConflict for all edge function DB writes"

requirements-completed: [EMAIL-01]

# Metrics
duration: 8min
completed: 2026-02-20
---

# Phase 3 Plan 01: DB Foundation for Email Notifications Summary

**email_status column (pending/sent/failed) on audits, new audit_reports JSONB table with RLS, and generate-report updated to upsert AI report before triggering Database Webhook**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-02-20T00:00:00Z
- **Completed:** 2026-02-20T00:08:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Migration adds email_status column to audits (pending/sent/failed, no partial) for notification lifecycle tracking
- Migration creates audit_reports table storing full AI report JSON per audit, with UNIQUE(audit_id), ON DELETE CASCADE, and RLS enabled at creation
- generate-report edge function now upserts AI report data into audit_reports BEFORE updating report_status to 'completed', ensuring report data exists when the Database Webhook fires

## Task Commits

Each task was committed atomically:

1. **Task 1: Migration — add email_status column and create audit_reports table** - `f76c3c1` (chore)
2. **Task 2: Update generate-report to persist AI report into audit_reports table** - `dd6db9b` (feat)

**Plan metadata:** (docs commit — see final_commit below)

## Files Created/Modified
- `supabase/migrations/20260220120000_add_email_status_and_audit_reports.sql` - Adds email_status to audits, creates audit_reports table with RLS
- `supabase/functions/generate-report/index.ts` - Upserts reportData into audit_reports before report_status update

## Decisions Made
- email_status values are `pending`, `sent`, `failed` only — no `partial` value since only the admin email is sent in Phase 3
- Used `.upsert()` with `onConflict: 'audit_id'` instead of `.insert()` for idempotency on edge function retries
- Placed audit_reports upsert BEFORE `report_status: 'completed'` update — webhook ordering is critical: report data must exist before send-notification fires
- No anon RLS policies on audit_reports — data is only accessed by edge functions using service_role key which bypasses RLS automatically

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered
None — straightforward SQL migration and edge function insertion. Build passed with no TypeScript errors.

## User Setup Required

**Migration must be applied to remote Supabase DB.** The SQL file is ready at `supabase/migrations/20260220120000_add_email_status_and_audit_reports.sql`.

Apply via the Supabase Dashboard SQL editor or MCP before Phase 3 Plan 02 testing. Both commands must succeed:
- `ALTER TABLE public.audits ADD COLUMN email_status ...`
- `CREATE TABLE public.audit_reports ...`

Note: generate-report edge function also needs to be redeployed with `supabase functions deploy generate-report` after the migration is applied.

## Next Phase Readiness
- DB schema is ready: email_status and audit_reports table defined (awaiting migration application to remote)
- generate-report function updated and deployed code is ready for push
- Plan 02 (send-notification edge function) can now be built — it will read from audit_reports and update email_status on audits

---
*Phase: 03-email-webhook*
*Completed: 2026-02-20*

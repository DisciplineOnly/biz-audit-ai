---
phase: 03-email-webhook
plan: 03
subsystem: infra
tags: [supabase, webhook, resend, email, edge-function, deno]

# Dependency graph
requires:
  - phase: 03-01
    provides: email_status column, audit_reports table, generate-report upsert logic
  - phase: 03-02
    provides: send-notification edge function with Resend HTML email
provides:
  - Deployed send-notification edge function (live in Supabase project)
  - Redeployed generate-report edge function (with audit_reports upsert + inlined CORS headers)
  - Database Webhook on_report_completed wiring audits UPDATE to send-notification
  - End-to-end verified admin email notification pipeline
  - EMAIL-02 (user email) formally documented as deferred
affects:
  - Phase 5 (report page — email notification is complementary; no blocking dependency)
  - Phase 6 (end-to-end verification — email pipeline now testable)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Supabase Edge Function type webhook — simpler than HTTP Request type, no manual URL/auth header config"
    - "MCP deploy inlines corsHeaders — relative import resolution broken in MCP context, inline for MCP deploys, shared import for CLI deploys"
    - "ADMIN_EMAIL must match Resend account owner email — onboarding@resend.dev restriction in sandbox mode"

key-files:
  created: []
  modified:
    - supabase/functions/generate-report/index.ts

key-decisions:
  - "Webhook configured as Supabase Edge Function type — eliminates manual URL and Authorization header configuration vs HTTP Request type"
  - "generate-report MCP deploy inlines corsHeaders constant — MCP cannot resolve ../_shared/cors.ts relative imports; local file retains shared import for CLI deploy compatibility"
  - "ADMIN_EMAIL must match Resend account owner email — sandbox restriction: onboarding@resend.dev can only deliver to account creator's verified email"
  - "EMAIL-02 (user email) deferred — requires custom Resend domain verification before delivery to arbitrary addresses"

patterns-established:
  - "Supabase Database Webhook as sole coupling point — disabling webhook stops emails without side effects on audit submission or report generation"
  - "Double guard in send-notification — checks both report_status === completed AND email_status === pending to prevent duplicate sends on webhook retry"

requirements-completed: [EMAIL-01, EMAIL-02]

# Metrics
duration: ~60min (includes human action steps)
completed: 2026-02-20
---

# Phase 3 Plan 03: Deploy, Configure Webhook, and Verify Email Pipeline Summary

**Supabase Database Webhook on_report_completed wired to deployed send-notification edge function, delivering admin HTML email via Resend within 60 seconds of generate-report completion — verified end-to-end**

## Performance

- **Duration:** ~60 min (includes two human checkpoint steps)
- **Started:** 2026-02-20
- **Completed:** 2026-02-20
- **Tasks:** 3
- **Files modified:** 0 (infrastructure deployment only — no new code files)

## Accomplishments
- Applied Phase 3 migration (email_status column + audit_reports table) to remote Supabase DB via MCP
- Deployed send-notification edge function (v1) and redeployed generate-report (v4 with audit_reports upsert + inlined CORS headers)
- Configured Database Webhook `on_report_completed` targeting audits table UPDATE events, calling send-notification via Supabase Edge Function type (no manual URL/auth config required)
- End-to-end verified: test audit inserted, generate-report called, AI report persisted to audit_reports, webhook fired, admin email received with correct content (contact info, scores, AI recommendations, report link), email_status updated to 'sent'
- EMAIL-02 (user email to contact) formally documented as deferred pending custom Resend domain verification

## Task Commits

This plan was infrastructure deployment only — no code commits were created during execution (all code was committed in 03-01 and 03-02).

1. **Task 1: Deploy edge functions and apply migration** — infrastructure via MCP (no code changes)
2. **Task 2: Configure Database Webhook** — human action in Supabase Dashboard (no code changes)
3. **Task 3: End-to-end email delivery verification** — human verification (no code changes)

**Plan metadata:** (this docs commit)

## Files Created/Modified

None — this plan was entirely infrastructure deployment and configuration. All code artifacts were delivered in Plans 01 and 02.

## Decisions Made

- **Supabase Edge Function webhook type** — Chose "Supabase Edge Function" type over "HTTP Request" type when configuring the webhook. Eliminates the need to manually specify the function URL and Authorization header (service_role key). Simpler and less error-prone.
- **MCP deploy inlines corsHeaders** — The generate-report redeployment via MCP required inlining the `corsHeaders` constant directly in index.ts because MCP cannot resolve `../_shared/cors.ts` relative imports. The local file still uses the shared import for CLI deploy compatibility. Both routes deploy the same effective code.
- **ADMIN_EMAIL = Resend account owner email** — In Resend sandbox mode, `onboarding@resend.dev` can only deliver to the verified email of the account creator. ADMIN_EMAIL secret must match that address exactly.
- **EMAIL-02 deferred** — User email notifications require a verified custom domain in Resend (to send to arbitrary addresses). This is a known constraint, intentionally deferred to a future phase.

## Deviations from Plan

None — plan executed exactly as written. All three tasks completed per their specifications.

The one discovery (MCP deploy requires inlined corsHeaders) was documented as a decision rather than a deviation — it did not change the plan's intent or outcomes, only the mechanism for deploying generate-report.

## Issues Encountered

- **MCP deploy relative import resolution** — When deploying generate-report via MCP tools, `../_shared/cors.ts` relative imports failed to resolve. Resolved by inlining `const corsHeaders = { ... }` directly in the deployed function. Local file unchanged, preserving CLI deploy compatibility.
- **ADMIN_EMAIL Resend sandbox restriction** — Resend's `onboarding@resend.dev` sender can only deliver to the account owner's verified email. This is a Resend sandbox constraint, not a bug. ADMIN_EMAIL must be set to match that address. Documented for Phase 6 and future phases.

## User Setup Required

All configuration completed during this plan:
- RESEND_API_KEY and ADMIN_EMAIL secrets stored in Supabase Edge Functions settings
- Database Webhook `on_report_completed` configured in Supabase Dashboard

No remaining setup required for EMAIL-01. EMAIL-02 (user email) requires custom Resend domain — see Blockers below.

## Next Phase Readiness

- Phase 3 (Email/Webhook) is complete. EMAIL-01 verified end-to-end.
- Phase 4 (Report Page) can proceed — report data is in audit_reports table, report_status is 'completed', shareable UUID is available
- Phase 5 (Integration) should revisit EMAIL-02: add custom domain to Resend, implement user-facing email in send-notification
- Phase 6 (Verification) can now test the full pipeline: audit submission → generate-report → webhook → admin email

**Remaining blocker:**
- EMAIL-02 (user email to contact) deferred — requires Resend custom domain verification (up to 48h DNS propagation). User should initiate domain verification now to have it ready for Phase 5.

---
*Phase: 03-email-webhook*
*Completed: 2026-02-20*

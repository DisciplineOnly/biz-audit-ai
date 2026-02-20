---
phase: 03-email-webhook
plan: 02
subsystem: api
tags: [supabase, deno, edge-function, resend, email, webhook, html-email]

# Dependency graph
requires:
  - phase: 03-email-webhook/03-01
    provides: email_status column on audits, audit_reports table, generate-report upsert ordering
  - phase: 02-ai-report-edge-function
    provides: generate-report edge function that produces and persists AI report JSON
provides:
  - send-notification Supabase edge function (webhook receiver + Resend email sender)
  - Admin HTML email with contact info, color-coded scores, category breakdown, AI recommendations, report link
affects:
  - 03-03-webhook-config (must configure Database Webhook to POST to send-notification URL)
  - Phase 6 (end-to-end verification of full email notification flow)

# Tech tracking
tech-stack:
  added:
    - Resend API (https://api.resend.com/emails) — transactional email via fetch POST
  patterns:
    - "Webhook guard pattern: check report_status === 'completed' first, email_status === 'pending' second to prevent duplicate sends"
    - "Best-effort email + status update: both wrapped in separate try/catch, outer catch ensures 200 always returned"
    - "HTML email: inline styles only, table-based layout, max-width 600px — Outlook/Gmail compatible"
    - "Graceful AI report degradation: email sends even if audit_reports read fails (contact + score info still present)"
    - "PII safety in logs: contact_email never included in console.error calls"

key-files:
  created:
    - supabase/functions/send-notification/index.ts
  modified: []

key-decisions:
  - "Always return 200 from all code paths — Database Webhooks retry on non-200, which would cause duplicate emails"
  - "email_status guard (pending check) added in addition to report_status guard — prevents duplicate sends if webhook fires again after email already sent"
  - "HTML email uses only inline styles (no <style> block) — Gmail strips style blocks; table-based layout for Outlook Word renderer compatibility"
  - "AI report read failure degrades gracefully — email still sends with contact info and scores, omits recommendations section"

patterns-established:
  - "Webhook handler: always-200 pattern with structured skip reasons (reason field in response JSON)"
  - "Double guard: status check + idempotency check before any side effects"

requirements-completed: [EMAIL-01]

# Metrics
duration: 10min
completed: 2026-02-20
---

# Phase 3 Plan 02: Send-Notification Edge Function Summary

**Webhook-triggered Deno edge function that reads AI report from audit_reports, sends color-coded HTML admin email via Resend API, and updates email_status to sent/failed — always returning 200**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-02-20T00:08:00Z
- **Completed:** 2026-02-20T00:18:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- send-notification edge function receives Database Webhook POSTs and guards on `report_status === 'completed'` and `email_status === 'pending'` before processing
- Reads AI-generated report from `audit_reports` table with graceful degradation (email still sends if report is unavailable)
- Builds rich inline-styled HTML admin email containing: contact name/email/phone/niche, color-coded overall score badge, 7-category scores table, top 3 AI strategic recommendations, "View Full Report" CTA button
- Sends email via Resend API (`fetch POST` with Bearer token) to `ADMIN_EMAIL` only — no user email (EMAIL-02 deferred per plan)
- Updates `email_status` to `'sent'` or `'failed'` after attempt (best-effort in separate try/catch)
- All code paths return HTTP 200 — prevents Database Webhook retry storms on any failure

## Task Commits

Each task was committed atomically:

1. **Task 1: Create send-notification edge function with admin email via Resend** - `92a1f0f` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified
- `supabase/functions/send-notification/index.ts` - Webhook receiver edge function: payload parsing, double guard, audit_reports read, HTML email build, Resend send, email_status update, always-200 responses (368 lines)

## Decisions Made
- Always return `status: 200` from every code path — Database Webhooks retry on non-2xx, which would cause duplicate emails and unnecessary API calls
- Added `email_status !== 'pending'` guard in addition to `report_status !== 'completed'` guard — idempotency protection if webhook fires again after email was already sent or if another column update triggers a second webhook event
- HTML email uses inline styles only (no `<style>` block) — Gmail strips `<style>` blocks; table-based layout avoids flexbox/grid issues in Outlook's Word renderer
- AI report degradation: if `audit_reports` read fails, the email still sends with contact info and scores, and simply omits the recommendations section — admin gets the critical info regardless

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None — straightforward Deno edge function implementation following the generate-report pattern.

## User Setup Required

**Two Supabase secrets must be set before deployment:**
- `RESEND_API_KEY` — from Resend Dashboard (https://resend.com/api-keys) → Create API Key
- `ADMIN_EMAIL` — the email address to receive admin notifications (must match the verified email/domain in Resend account; when using `onboarding@resend.dev` sender, the Resend account email is the only valid recipient until a domain is verified)

Set secrets via:
```bash
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxx
supabase secrets set ADMIN_EMAIL=your@email.com
```

Then deploy the function:
```bash
supabase functions deploy send-notification
```

**Plan 03 (Database Webhook configuration) will wire up the trigger** — no Supabase Dashboard configuration needed yet.

## Next Phase Readiness
- send-notification edge function is complete and ready for deployment
- Plan 03 (03-03) must configure the Supabase Database Webhook to POST to the send-notification URL on `UPDATE` events to the `audits` table
- Both `RESEND_API_KEY` and `ADMIN_EMAIL` secrets must be set in Supabase before the webhook can deliver emails

---
*Phase: 03-email-webhook*
*Completed: 2026-02-20*

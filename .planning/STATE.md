# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-19)

**Core value:** Business owners complete the audit and receive a personalized, AI-driven analysis that makes them want to book a consultation
**Current focus:** Phase 3 — Email/Webhook

## Current Position

Phase: 3 of 6 (Email/Webhook)
Plan: 3 of 3 in current phase — 03-03 COMPLETE
Status: Phase 3 complete — all 3 plans done; next: Phase 4 (Report Page)
Last activity: 2026-02-20 — Completed 03-03: Database Webhook configured, end-to-end email pipeline verified

Progress: [████████░░] 50%

## Performance Metrics

**Velocity:**
- Total plans completed: 6
- Average duration: ~13 min/plan (skewed by human checkpoint steps in Phase 3 Plan 3)
- Total execution time: ~111 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-schema-and-environment | 3/3 COMPLETE | ~18 min | ~6 min |
| 02-ai-report-edge-function | 2/2 COMPLETE | ~55 min | ~27 min |
| 03-email-webhook | 3/3 COMPLETE | ~78 min | ~26 min |

**Recent Trend:**
- Last 5 plans: 01-03 (~10 min), 02-01 (~25 min), 02-02 (~30 min), 03-01 (~8 min)
- Trend: Phase 3 plans shorter — DB migration and targeted edge function edits vs. full implementations

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Roadmap: Phase 3 (Email/Webhook) depends only on Phase 1 — can run parallel to Phase 2 if needed
- Roadmap: Phase 6 is a verification-only phase; no new requirements; confirms all prior work end-to-end
- Architecture: AI model is Claude Haiku 4.5 (not GPT-4.1 mini as noted in research — confirmed in requirements AI-01)
- Architecture: Synchronous edge function invocation (fits inside existing 14s loading screen in Loading.tsx)
- Security: RLS must be enabled on audits table creation — not added later; CVE-2025-48757 precedent
- Client SDK: Fail-fast env check — throw at module load if VITE_ vars missing, not buried in user action handlers
- Client SDK: Only VITE_SUPABASE_PUBLISHABLE_KEY exposed to frontend — SEC-03 compliant; no service_role or secret keys
- Client SDK: submitAudit chains .select('id').single() to capture UUID — required for supabase-js v2 (returns null data without .select())
- Client SDK: niche null guard deferred to caller (Loading.tsx in Phase 5) — DB CHECK constraint is final guard
- Verification (01-03): submitAudit changed to crypto.randomUUID() client-side — .select().single() returned null in browser context despite row being inserted; crypto.randomUUID() is the correct v2 browser pattern
- Phase 1: All five success criteria confirmed PASS via automated MCP checks + human browser round-trip approval
- Edge function (02-01): Anthropic + Supabase admin clients instantiated inside Deno.serve handler — required for per_worker edge runtime mode
- Edge function (02-01): PII excluded from LLM prompt by omission — buildPrompt() never references .email, .phone, .contactName keys
- Edge function (02-01): report_status 'failed' update is best-effort — wrapped in separate try/catch, error intentionally swallowed to preserve original error response
- Edge function (02-01): Migration applied by orchestrator MCP — executor lacks direct MCP tool access (same pattern as Phase 1)
- Edge function (02-02): Claude Haiku 4.5 wraps JSON in markdown fences and embeds literal newlines despite prompt instructions — two-pass JSON parsing added (fence strip + newline collapse) and deployed as v3
- Edge function (02-02): ANTHROPIC_API_KEY confirmed absent from client bundle — grep dist/ returns 0; API key stays in Supabase secret store server-side only
- Phase 2: All five success criteria confirmed PASS via curl test — niche framing, score-aware recommendations, PII exclusion, valid JSON schema, no API key in bundle
- Email (03-01): email_status values: pending/sent/failed only — no 'partial' (admin email only in Phase 3)
- Email (03-01): audit_reports upsert uses onConflict: 'audit_id' — idempotent for edge function retries
- Email (03-01): audit_reports upsert placed BEFORE report_status 'completed' update — webhook ordering requirement (data must exist before send-notification fires)
- Email (03-01): no anon RLS policies on audit_reports — service_role bypasses RLS for edge function reads/writes
- Email (03-02): always return 200 from send-notification — Database Webhooks retry on non-2xx, causing duplicate emails
- Email (03-02): double guard on report_status === 'completed' AND email_status === 'pending' — prevents duplicate sends if webhook fires again
- Email (03-02): HTML email uses inline styles only (no style blocks) — Gmail strips style blocks; table-based layout for Outlook compatibility
- Email (03-02): AI report read failure degrades gracefully — email still sends with contact info and scores, omits recommendations section
- Deploy (03-03): Supabase Edge Function webhook type chosen over HTTP Request type — eliminates manual URL/service_role auth header configuration
- Deploy (03-03): generate-report MCP deploy inlines corsHeaders constant — MCP cannot resolve ../_shared/cors.ts; local file retains shared import for CLI deploy compatibility
- Deploy (03-03): ADMIN_EMAIL must match Resend account owner email — onboarding@resend.dev sandbox restriction
- Email (03-03): EMAIL-02 (user email to contact) deferred — requires custom Resend domain verification before delivery to arbitrary addresses

### Pending Todos

None.

### Blockers/Concerns

- EMAIL-02 deferred: user email requires Resend custom domain verification (up to 48h DNS propagation) — should initiate now so it is ready for Phase 5
- Shareable URL SELECT policy decision deferred to Phase 5 planning: anon policy on UUID vs. fetch-report edge function with service role reads

*Resolved:*
- ~~Migration 20260219120000_add_report_status_to_audits.sql must be applied to remote DB~~ — applied via MCP before 02-02 testing
- ~~ANTHROPIC_API_KEY must be stored as Supabase secret~~ — confirmed present and working (02-02 curl PASS)

## Session Continuity

Last session: 2026-02-20
Stopped at: Completed 03-03 (Database Webhook + end-to-end email verification) — Phase 3 complete
Resume file: .planning/phases/04-report-page/04-01-PLAN.md (or run phase-plan for Phase 4)

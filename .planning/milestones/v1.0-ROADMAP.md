# Roadmap: BizAudit

## Overview

BizAudit is a working React/Vite SPA with client-side scoring. This milestone adds the backend layer that makes it a real product: Supabase Postgres persists completed audits, a Deno edge function calls Claude Haiku 4.5 to generate personalized report text, a second edge function sends admin and user emails via Resend, and the frontend is wired to all of it. The build order is backend-first — schema and security before code, edge functions before frontend integration, rate limiting before any endpoint is publicly reachable, and a final hardening pass before real traffic lands.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Schema and Environment** - Supabase project wired up, audits table created with RLS, secrets secured
- [x] **Phase 2: AI Report Edge Function** - generate-report edge function deployed and tested in isolation (completed 2026-02-19)
- [x] **Phase 3: Email and Webhook** - send-notification edge function + Database Webhook sending admin email (user email deferred; completed 2026-02-20)
- [x] **Phase 4: Rate Limiting** - email-based submission rate limiting enforced before frontend goes public (completed 2026-02-20)
- [x] **Phase 5: Frontend Integration** - Loading.tsx and Report.tsx wired to backend; shareable report URLs live (completed 2026-02-20)
- [ ] **Phase 6: Verification and Hardening** - end-to-end system verified against all critical pitfalls before launch

## Phase Details

### Phase 1: Schema and Environment
**Goal**: The Supabase backend is connected to the React SPA with a secure schema accepting anonymous audit submissions
**Depends on**: Nothing (first phase)
**Requirements**: DATA-01, DATA-02, SEC-02, SEC-03
**Success Criteria** (what must be TRUE):
  1. A completed audit can be inserted into Supabase from the browser using only the publishable anon key
  2. The audits table has a UUID primary key that is returned after each insert
  3. An anonymous user querying the audits table via the anon key receives zero rows (RLS blocks reads)
  4. Supabase Security Advisor shows no warnings on the audits table
  5. No API keys other than VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY exist in any VITE_ environment variable
**Plans**: 3 plans

Plans:
- [x] 01-01-PLAN.md — Create audits table with RLS via Supabase MCP migration + Security Advisor check
- [x] 01-02-PLAN.md — Install @supabase/supabase-js, scaffold client singleton and submitAudit function
- [x] 01-03-PLAN.md — Automated backend verification + browser round-trip checkpoint

### Phase 2: AI Report Edge Function
**Goal**: A deployed Supabase edge function generates personalized AI report content from audit answers and can be verified independently via HTTP before any frontend changes
**Depends on**: Phase 1
**Requirements**: AI-01, AI-02, AI-03, AI-04, SEC-04
**Success Criteria** (what must be TRUE):
  1. A curl or Postman request to the generate-report function with sample form data returns a valid JSON report with gaps, quick wins, and strategic recommendations sections
  2. The returned report text references the specific niche (home services or real estate) in its framing
  3. The returned report text references actual weak-scoring categories by name and score
  4. Free-text fields from the form (business name, biggest challenge, tech frustrations) are sanitized before reaching the LLM prompt
  5. The OpenAI API key is not present in the built JS bundle
**Plans**: 2 plans

Plans:
- [x] 02-01-PLAN.md -- Database migration (report_status column), shared CORS module, and generate-report edge function code
- [x] 02-02-PLAN.md -- Deploy edge function via MCP and verify via curl with sample audit data

### Phase 3: Email and Webhook
**Goal**: Admin notification email is sent automatically when an audit report completes, with confirmed deliverability to real inboxes
**Depends on**: Phase 1
**Requirements**: EMAIL-01, EMAIL-02
**Success Criteria** (what must be TRUE):
  1. Inserting a row into the audits table triggers an email to the admin within 60 seconds, including the contact name, email address, niche, overall score, and report link
  2. Inserting a row into the audits table triggers an email to the submitting user within 60 seconds, with a working link to their report
  3. Both emails land in Gmail and Outlook inboxes (not spam) from the verified sending domain
  4. Removing or disabling the Database Webhook stops emails without affecting the core audit submission flow

**NOTE:** EMAIL-02 (user email, criteria 2-3) is deferred until a custom Resend domain is verified. Only EMAIL-01 (admin email) is implemented in this phase.
**Plans**: 3 plans

Plans:
- [x] 03-01-PLAN.md — Migration (email_status column + audit_reports table) and generate-report update to persist AI reports
- [x] 03-02-PLAN.md — send-notification edge function with admin email via Resend
- [x] 03-03-PLAN.md — Deploy, configure Database Webhook, and verify end-to-end email delivery

### Phase 4: Rate Limiting
**Goal**: The generate-report edge function contains a deployed, tested rate limiting guard that rejects abuse — verified via direct curl testing; enforcement on real user traffic activates automatically when Phase 5 wires the frontend
**Depends on**: Phase 2
**Requirements**: SEC-01
**Success Criteria** (what must be TRUE):
  1. Sending four requests to the generate-report edge function with the same email address within 24 hours causes the fourth to receive a 429 response (verified via curl)
  2. Sending requests with different email addresses succeeds without restriction (verified via curl)
  3. Rate limit counters reset after 24 hours so a previously blocked email can submit again (verified by fixedWindow TTL code inspection)

**Note:** Loading.tsx does not call generate-report yet (Phase 5 scope). Rate limiting is deployed and proven via direct HTTP testing. Once Phase 5 adds the generate-report invocation to the submission flow, the guard enforces automatically with zero additional work.
**Plans**: 2 plans

Plans:
- [x] 04-01-PLAN.md -- Add Upstash Redis dual rate limiting (email + IP) to generate-report edge function
- [x] 04-02-PLAN.md -- Upstash setup, deploy edge function, and verify rate limiting via curl

### Phase 5: Frontend Integration
**Goal**: The React SPA is fully wired to the backend — AI report generation runs during the loading screen, completed audits persist to Supabase, and shareable report URLs load from the database
**Depends on**: Phase 2, Phase 4
**Requirements**: DATA-03
**Success Criteria** (what must be TRUE):
  1. Completing the audit form navigates to a report page at /report/:uuid where the UUID is a real Supabase row ID
  2. Copying the /report/:uuid URL, opening it in a fresh incognito browser window with localStorage cleared, and loading it shows the full report
  3. The report page shows AI-generated personalized text (not template-generated text) for the gaps, quick wins, and strategic recommendations sections
  4. If the AI edge function fails, the report page falls back to displaying template-generated content rather than a blank or error state

**Critical wiring note:** This phase MUST add the `generate-report` edge function invocation to Loading.tsx. Currently Loading.tsx only calls `submitAudit()` (Postgres INSERT) — it never invokes the AI report generation. Adding this call also activates the Phase 4 rate limiting guard (deployed but not yet enforced on user traffic). Handle the 429 rate limit response with a toast notification per CONTEXT.md decisions.
**Plans**: 3 plans

Plans:
- [x] 05-01-PLAN.md — Create fetch-report edge function, fetchReport client helper, and AIReportData type
- [x] 05-02-PLAN.md — Refactor Loading.tsx: generate-report invocation, rate limit handling, error retry
- [x] 05-03-PLAN.md — Refactor Report.tsx: dual data source, skeleton loading, polling, branded 404, AI content rendering

### Phase 6: Verification and Hardening
**Goal**: The complete system is confirmed safe and correct against all known critical failure modes before real user traffic lands
**Depends on**: Phase 3, Phase 5
**Requirements**: (none new — verifies all prior requirements end-to-end)
**Success Criteria** (what must be TRUE):
  1. A full end-to-end audit completion — form submission through AI report through email receipt — succeeds with a real submission, not test data
  2. Attempting to read another user's audit row via the Supabase anon key and a guessed UUID returns an empty result set
  3. The built production JS bundle contains no OpenAI API key, Supabase service role key, or Resend API key (confirmed via bundle inspection)
  4. Both admin and user notification emails pass a deliverability check against Gmail and Outlook and do not land in spam
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6
Note: Phase 3 depends only on Phase 1 and can be worked in parallel with Phase 2 if needed.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Schema and Environment | 3/3 | Complete    | 2026-02-19 |
| 2. AI Report Edge Function | 2/2 | Complete   | 2026-02-19 |
| 3. Email and Webhook | 3/3 | Complete   | 2026-02-20 |
| 4. Rate Limiting | 2/2 | Complete   | 2026-02-20 |
| 5. Frontend Integration | 3/3 | Complete    | 2026-02-20 |
| 6. Verification and Hardening | 0/? | Not started | - |

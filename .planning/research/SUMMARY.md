# Project Research Summary

**Project:** BizAudit — Supabase Backend + AI Report Generation
**Domain:** Lead-generation assessment SaaS — adding backend persistence, AI report generation, and email notifications to an existing React/Vite SPA
**Researched:** 2026-02-19
**Confidence:** HIGH

## Executive Summary

BizAudit is an existing React 18 / Vite 5 / TypeScript SPA with a complete 8-step audit form, client-side scoring engine, and report display — all running on localStorage with a mock report generator. The milestone covered by this research adds a real backend layer: Supabase Postgres for persistence, Supabase Edge Functions for server-side LLM report generation and email dispatch, and Resend for transactional email delivery. This is a well-understood integration pattern; Supabase's official documentation covers each component individually, and the combination has been validated across dozens of community implementations. The recommended approach is: browser inserts completed audit to Supabase, a directly-invoked Edge Function calls GPT-4.1 mini with structured outputs and returns the AI report JSON synchronously (hidden inside the existing 14-second loading screen), that JSON is stored with the insert, and a Database Webhook triggers a second Edge Function to send admin and user emails via Resend.

The key architectural decision is whether LLM report generation is synchronous (browser waits) or fully async (webhook-triggered). The existing Loading.tsx already presents a 14-second simulated wait, which is longer than a typical GPT-4.1 mini call (2–8 seconds). This makes synchronous invocation via `supabase.functions.invoke()` the most practical pattern — it avoids the complexity of polling infrastructure while exploiting existing UX cover. Email notifications should remain async via Database Webhook regardless, since the browser has no need to wait for email delivery. The single-table schema (`audits`) with JSONB columns for `form_data`, `scores`, and `ai_report` covers all MVP needs and allows shareable report URLs immediately via the Postgres-generated UUID primary key.

The primary risks are all security- and infrastructure-related rather than product risks: RLS must be enabled on day one (a real CVE in 2025 exposed 170+ apps that skipped it), API keys must never touch `VITE_` environment variables, rate limiting must be in place before the edge function is publicly reachable, and email domain DNS records must be configured days before launch (SPF/DKIM/DMARC propagation takes up to 48 hours). These are all preventable with known patterns — none require architectural re-work if addressed at the right phase.

---

## Key Findings

### Recommended Stack

The backend layer uses Supabase as its single platform: Postgres for storage, Edge Functions (Deno runtime) for server-side logic, and Database Webhooks for async event triggering. All three are managed services with no infrastructure to provision. The frontend already has `@tanstack/react-query` and `zod` installed; both should be used for Supabase async calls and form validation respectively. No new frontend frameworks are needed.

For AI generation, GPT-4.1 mini is strongly recommended over GPT-4o-mini: it has a 1M token context window, significantly better instruction-following, and costs ~$0.004 per 2,000-token report. Structured Outputs (`response_format: json_schema`) guarantee parseable JSON responses and eliminate the prompt-only JSON parsing failures that plague simpler implementations. The OpenAI SDK (`npm:openai@^6` via Deno's npm specifier) is the correct client — the Vercel AI SDK is incompatible with Supabase's Deno runtime.

**Core technologies:**
- `@supabase/supabase-js ^2.97.0`: Client SDK for browser — database writes and edge function invocation via singleton pattern
- `Supabase Edge Functions (Deno)`: Server-side TypeScript for LLM calls and email; no Node.js server to manage; 400s wall-clock timeout on paid tier
- `Supabase Postgres 15.x`: Persistent storage with RLS; single `audits` table with JSONB columns handles all MVP data
- `Supabase Database Webhooks (pg_net)`: Async INSERT→edge-function trigger for email notifications; decouples email from browser session
- `GPT-4.1 mini (gpt-4.1-mini)`: LLM for report generation; structured outputs via `json_schema` response_format; ~$0.004/report
- `Resend (npm:resend@^6)`: Transactional email — official Supabase partner; free tier 3,000 emails/month; HTTP API (SMTP blocked in edge functions)

### Expected Features

The feature research distinguishes sharply between features that are table stakes for this milestone (P1), features that add value after the core loop is validated (P2), and features that belong to a future milestone (P3).

**Must have — v1 launch (table stakes):**
- Audit persistence via Supabase INSERT — without this, nothing else exists
- Shareable report URL from Postgres UUID — client-only localStorage URLs are dead ends
- AI-generated personalized report text (GPT-4.1 mini) — the core value proposition; templates feel generic
- Admin notification email on completion — leads need to reach a human within hours
- User report-ready email with report link — closes the funnel loop; enables re-access and sharing
- Rate limiting (email-based, 3 per 24 hours) — non-negotiable before production; protects OpenAI budget

**Should have — add after validation (competitive differentiators):**
- Niche-specific AI prompt context (home_services vs real_estate) — already available in form data; zero additional API cost
- Score-aware AI recommendations — AI references actual scores in prose; already computed client-side
- Async polling on `/generating` page — polls `audit_reports.status` so user stays in funnel until report is ready
- Partner attribution in admin email — activates referral tracking; simple URL parameter passthrough

**Defer — v2+ only:**
- Admin lead dashboard — justified at ~20+ audits/day; Supabase Dashboard covers the gap until then
- CRM integration (Zapier/HubSpot) — manual copy from email is acceptable at MVP volume
- PDF download — browser `window.print()` can be added as a v1.x CSS-only enhancement with no backend work
- Multi-step email sequences — requires a real marketing automation platform; not a feature to build custom

### Architecture Approach

The architecture follows a clean two-tier pattern: browser-side React SPA talks exclusively to Supabase (PostgREST for DB writes, Functions API for edge function invocation), and all third-party services (OpenAI, Resend) are called exclusively from inside Edge Functions where secrets are protected. The browser never holds or transmits API keys. Two Edge Functions handle separate concerns: `generate-report` (called synchronously by Loading.tsx, returns AI JSON immediately) and `send-notification` (triggered asynchronously by Database Webhook on INSERT, sends admin and user emails). This separation ensures that email delivery failures never affect the user-facing report flow.

**Major components:**
1. `src/lib/supabase.ts` — singleton Supabase client; `persistSession: false` since there are no user accounts
2. `src/services/audit.ts` — typed wrapper functions (`generateAIReport()`, `persistAudit()`, `fetchReport()`); keeps page components free of SDK details
3. `supabase/functions/generate-report/` — receives `{formState, scores}` from browser; calls OpenAI with structured outputs; returns parsed report JSON
4. `supabase/functions/send-notification/` — receives INSERT payload from Database Webhook; sends admin + user emails via Resend
5. `supabase/migrations/20260219_create_audits.sql` — `audits` table with UUID PK, JSONB columns, RLS enabled on creation
6. Modified `Loading.tsx` — calls `generateAIReport()` then `persistAudit()`; navigates to `/report/:uuid` with all data in navigation state
7. Modified `Report.tsx` — renders AI report text from navigation state; falls back to `generateMockReport()` if LLM data absent; fetches from DB when opened via shareable URL

**Key patterns:**
- Direct Edge Function invocation for synchronous LLM generation (fits inside existing 14s loading screen)
- Insert-then-Webhook for async email notifications (decoupled from browser session)
- Anon INSERT / blocked anon SELECT for no-auth data collection (UUID-as-credential for report access)
- Service abstraction in `src/services/audit.ts` (page components never touch the Supabase SDK directly)
- CORS OPTIONS handler required in every edge function called from the browser

### Critical Pitfalls

1. **RLS disabled on `audits` table** — anyone with the anon key (which is in the JS bundle by design) can dump all audit data. CVE-2025-48757 exposed 170+ apps this way in 2025. Enable RLS and write an explicit `USING(false)` SELECT policy for the anon role before inserting any data. Verify with Supabase Security Advisor.

2. **Edge Function timeout killing LLM generation** — 150s request idle timeout means a slow or long-context LLM call returns a 504 silently. GPT-4.1 mini at 2,000 tokens is typically 2–8s, well within limits, but prompt engineering must keep total token count controlled. Never combine the INSERT and LLM call in a single synchronous handler — use the two-function split.

3. **Service role key in client code** — the service role key bypasses all RLS. If it ever gets a `VITE_` prefix or ends up committed to git, the entire database is exposed. Set up `.gitignore` before creating any `.env` files; service role key goes into Supabase project secrets only.

4. **No rate limiting before going live** — unprotected anonymous submission endpoint can be bot-flooded. At $0.004/report, 10,000 bot submissions = $40 in API costs plus database bloat. Add email-based rate limiting (3 per 24 hours) in the edge function before deploying to production. Consider Cloudflare Turnstile as a CAPTCHA layer.

5. **Email deliverability from cold domain** — SPF/DKIM/DMARC DNS records take up to 48 hours to propagate and must be in place before a single production email is sent. Resend handles DKIM signing automatically post-domain-verification. Test against Gmail and Outlook (not just developer's own address) before launch.

6. **Prompt injection via free-text form fields** — user-supplied text in `biggestChallenge`, `techFrustrations`, and business name fields is interpolated into the LLM prompt. Sanitize all free-text inputs (strip control characters, truncate to reasonable lengths) and use XML/JSON delimiters to separate user data from instructions. This is OWASP LLM Top 10 #1 (2025).

---

## Implications for Roadmap

Based on research, the build order is driven by hard dependencies: schema must exist before any code writes to it, edge functions must be deployed before the frontend calls them, and the Database Webhook can only target already-deployed functions. The frontend integration is always last — it depends on all backend components being testable in isolation first.

### Phase 1: Environment and Schema Foundation

**Rationale:** Security and schema decisions made here are irreversible without data migration. Setting up `.gitignore`, environment variable structure, and the `audits` table schema with RLS enabled day-one prevents the most dangerous pitfalls (key exposure, data exposure) from ever occurring.

**Delivers:** Working Supabase project connected to the React SPA; `audits` table accepting anonymous INSERTs; Supabase Security Advisor showing no warnings; `.env` structure with only `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in client variables.

**Addresses (from FEATURES.md):** Audit persistence foundation; shareable URL prerequisite (UUID PK).

**Avoids (from PITFALLS.md):** RLS disabled (Pitfall 1); service role key in client (Pitfall 3); environment setup mistakes.

**Research flag:** Standard patterns — skip research-phase. Supabase schema and RLS setup are fully documented with official examples.

### Phase 2: AI Report Generation Edge Function

**Rationale:** The `generate-report` edge function is the core value-add and the most complex component. It should be built and tested in isolation (via Postman/curl) before any frontend integration touches it. Getting structured outputs, prompt engineering, and CORS headers right in isolation is far easier than debugging through the full browser flow.

**Delivers:** Deployed `generate-report` edge function that accepts `{formState, scores}`, calls GPT-4.1 mini with structured outputs (json_schema), returns parseable report JSON. Tested end-to-end via direct HTTP call before frontend is wired.

**Addresses (from FEATURES.md):** AI-generated personalized report text (P1); niche-specific prompt context (P1 zero-cost add-on); score-aware AI recommendations (P1 zero-cost add-on).

**Avoids (from PITFALLS.md):** LLM timeout (Pitfall 2) — prompt token budget is defined here; prompt injection (Pitfall 5) — sanitization built into the prompt template from the start; OpenAI key in client code (anti-pattern from ARCHITECTURE.md).

**Research flag:** Standard patterns — Supabase + OpenAI pattern is documented with official examples. GPT-4.1 mini structured outputs are confirmed supported. No additional research phase needed.

### Phase 3: Email Notification Edge Function and Database Webhook

**Rationale:** `send-notification` is simpler than `generate-report` (no LLM, just Resend API call) but requires advance DNS work that has a hard 48-hour lead time. This phase must begin early enough that domain verification completes before any phase tests against real inboxes.

**Delivers:** Deployed `send-notification` edge function sending admin and user emails via Resend; Database Webhook configured on `audits` INSERT event targeting `send-notification`; SPF/DKIM/DMARC records verified via MXToolbox; test emails confirmed in Gmail and Outlook inboxes (not spam).

**Addresses (from FEATURES.md):** Admin notification email (P1); user report-ready email with report link (P1).

**Avoids (from PITFALLS.md):** Email deliverability from cold domain (Pitfall 6) — DNS setup must start here, not at launch; Database Webhook JWT issue (PITFALLS integration gotcha — set `verify_jwt: false` on the edge function or pass service role key in webhook header).

**Research flag:** Standard patterns for Resend + Supabase webhook. DNS propagation timing is a process constraint, not a research gap.

### Phase 4: Rate Limiting

**Rationale:** Rate limiting is a non-negotiable prerequisite before the submission endpoint is publicly reachable. It should be added as a discrete phase rather than bolted on to the edge function implementation, to ensure it is tested independently before the frontend goes live.

**Delivers:** Email-based rate limiting (3 submissions per 24 hours per email) implemented in the `generate-report` edge function; verified by submitting 4 requests from the same email address and confirming the 4th returns 429. Optionally: Cloudflare Turnstile CAPTCHA on the final submission step.

**Addresses (from FEATURES.md):** Rate limiting (P1 risk mitigation).

**Avoids (from PITFALLS.md):** Bot flooding / OpenAI cost drain (Pitfall 4).

**Research flag:** Standard patterns — Supabase docs provide a rate limiting example using Upstash Redis. Email-based approach (simpler, no Redis dependency) is documented in community sources. No research phase needed.

### Phase 5: Frontend Integration

**Rationale:** All backend components are independently tested before a single line of frontend code changes. This is the risk-reduction strategy from ARCHITECTURE.md's build order. Frontend integration is a connection phase, not a discovery phase.

**Delivers:** Modified `Loading.tsx` that calls `generateAIReport()` then `persistAudit()` and navigates to `/report/:uuid`; modified `Report.tsx` that renders AI report content from navigation state and falls back to `generateMockReport()` on failure; shareable `/report/:uuid` URL that fetches from Supabase when opened directly; `src/services/audit.ts` with typed service functions; `src/lib/supabase.ts` singleton; `src/hooks/use-audit-submit.ts` for loading/error state.

**Addresses (from FEATURES.md):** All P1 features wired end-to-end; shareable report URL via UUID; report accessible without authentication.

**Avoids (from PITFALLS.md):** Multiple Supabase client instances (singleton pattern); all logic in Loading.tsx (service abstraction); CORS failures (OPTIONS handler in edge functions, confirmed in Phase 2/3); share URL returning blank report (UUID from DB, not localStorage).

**Research flag:** Standard patterns — no additional research needed. The integration points are fully defined by Phases 1–4 outputs.

### Phase 6: Verification and Launch Hardening

**Rationale:** The "Looks Done But Isn't" checklist from PITFALLS.md captures a set of integration checks that individually look complete but have silent failure modes. This phase exists to execute those checks systematically before any real user traffic.

**Delivers:** All PITFALLS.md verification checks passed: RLS curl test, fresh incognito report URL load, rate limit 429 test, LLM API key absent from built JS bundle, CORS confirmed from production domain, email confirmed in Gmail/Outlook. Full end-to-end audit completion flow tested with a real submission.

**Addresses (from PITFALLS.md):** All six critical pitfalls verified; "Looks Done But Isn't" checklist completed.

**Research flag:** No research needed — this is a structured verification phase against known checklists.

### Phase Ordering Rationale

- Schema before code: the `audits` table UUID is the foundation of shareable URLs, the webhook target, and the INSERT that triggers email — nothing else can be built or tested without it.
- Edge functions before frontend: both `generate-report` and `send-notification` must be deployed and independently tested before `Loading.tsx` or `Report.tsx` touch them. Debugging through the browser adds noise.
- Rate limiting before frontend goes public: the endpoint becomes reachable the moment frontend is deployed; rate limiting must be in place before that moment.
- DNS before email testing: 48-hour propagation is a hard constraint; the Resend domain verification should be started in Phase 3 regardless of whether email is fully tested then.
- Verification last: the system must be complete before the verification checklist is meaningful.

### Research Flags

Phases needing deeper research during planning:
- None identified. All components have official Supabase documentation with working examples. The stack is narrow and well-documented.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Schema):** Supabase table creation, RLS policies, and environment variable setup are fully documented.
- **Phase 2 (AI Edge Function):** Supabase + OpenAI integration documented with official examples; GPT-4.1 mini structured outputs confirmed.
- **Phase 3 (Email + Webhook):** Resend + Supabase edge function documented with official examples; Database Webhook configuration in dashboard.
- **Phase 4 (Rate Limiting):** Supabase rate limiting example in official docs; email-based approach is a simpler variant.
- **Phase 5 (Frontend):** supabase-js `from().insert()` and `functions.invoke()` are well-documented; integration points fully defined.
- **Phase 6 (Hardening):** Checklist-driven; no research needed.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All library versions fetched directly from npm and Supabase official docs. Edge function limits verified via official Supabase docs. GPT-4.1 mini pricing and capability: MEDIUM (search-verified, not from official changelog page). |
| Features | HIGH (table stakes) / MEDIUM (differentiators) | Table stakes based on direct competitor analysis (My Web Audit, ScoreApp, Outgrow) and Supabase constraint verification. Differentiator prioritization based on quiz funnel research — single primary source for 40% conversion benchmark. |
| Architecture | HIGH | All patterns verified against official Supabase documentation. Component boundaries and data flow confirmed against multiple official examples. CORS requirement confirmed. Publishable key transition (anon → sb_publishable) is MEDIUM (GitHub Discussion, not official doc). |
| Pitfalls | HIGH | Critical pitfalls backed by official Supabase security docs, OWASP LLM Top 10 (2025), and a real CVE (CVE-2025-48757). Integration gotchas confirmed via official docs and reproducible community reports. |

**Overall confidence:** HIGH

### Gaps to Address

- **Shareable URL SELECT policy decision:** ARCHITECTURE.md identifies two valid options for enabling anon reads of a specific audit row: (1) `FOR SELECT TO anon USING (id = <uuid>)` — simple but requires a policy change, or (2) a `fetch-report` edge function with service role reads. Decision deferred to Phase 5 planning; option 1 is recommended for simplicity given that UUIDs are not guessable.

- **GPT-4.1 mini report quality:** The LLM model is research-recommended but the prompt template is not yet written. Report quality is not validatable until the edge function is built and tested against real form submissions. Plan for one prompt iteration cycle after first real outputs are reviewed.

- **Resend sender domain:** The sending domain must be owned and DNS-accessible. If the project does not yet have a domain, this blocks email delivery entirely. Confirm domain availability in Phase 3 setup — this is a business dependency, not a technical one.

- **Async polling (v1.x):** FEATURES.md marks async polling on `/generating` as P2 (after validation). If user testing reveals that the existing 14-second fake loading screen plus direct edge function invocation causes noticeable UX issues (e.g., report arrives before loading screen ends, or LLM occasionally exceeds 14s), the polling approach becomes P1. This should be validated with real LLM response times during Phase 2.

- **Free tier vs. paid tier Supabase:** PITFALLS.md notes that the free tier pauses after 7 days of inactivity and has a lower edge function timeout (150s vs 400s). If production launch is planned, a paid Supabase tier is needed. This is a cost/infrastructure decision to confirm before Phase 1.

---

## Sources

### Primary (HIGH confidence)
- [Supabase Edge Functions docs](https://supabase.com/docs/guides/functions) — runtime, architecture, limits, CORS
- [Supabase Edge Function Limits](https://supabase.com/docs/guides/functions/limits) — 400s timeout, 256MB memory, 20MB bundle
- [Supabase Send Emails example](https://supabase.com/docs/guides/functions/examples/send-emails) — Resend + edge function pattern
- [Supabase OpenAI example](https://supabase.com/docs/guides/ai/examples/openai) — edge function + OpenAI integration
- [Supabase Database Webhooks](https://supabase.com/docs/guides/database/webhooks) — pg_net INSERT webhook
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security) — anon INSERT/SELECT policy patterns
- [Supabase Hardening the Data API](https://supabase.com/docs/guides/database/hardening-data-api) — security practices
- [Supabase Securing Edge Functions](https://supabase.com/docs/guides/functions/auth) — JWT verification, service role
- [Supabase Rate Limiting Edge Functions](https://supabase.com/docs/guides/functions/examples/rate-limiting) — Upstash Redis pattern
- [openai npm v6.22.0](https://www.npmjs.com/package/openai) — version confirmed
- [resend npm v6.9.2](https://www.npmjs.com/package/resend) — version confirmed
- [Resend: Send emails with Supabase Edge Functions](https://resend.com/docs/send-with-supabase-edge-functions) — official Resend docs
- [OWASP LLM Top 10 2025: Prompt Injection (LLM01)](https://genai.owasp.org/llmrisk/llm01-prompt-injection/) — injection risk ranking

### Secondary (MEDIUM confidence)
- [GPT-4.1 mini launch blog](https://openai.com/index/gpt-4-1/) — model capabilities, pricing, benchmark claims
- [Interact Quiz Conversion Rate Report 2026](https://www.tryinteract.com/blog/quiz-conversion-rate-report/) — 40.1% start-to-lead conversion benchmark
- [ScoreApp features](https://www.scoreapp.com/features/) — AI feedback, CRM sync patterns
- [My Web Audit features](https://www.mywebaudit.com/features) — real-time notifications, shareable links
- [Outgrow review — Blogging Wizard](https://bloggingwizard.com/outgrow-review/) — lead forms, admin notifications
- [CVE-2025-48757 / Lovable apps RLS exposure](https://byteiota.com/supabase-security-flaw-170-apps-exposed-by-missing-rls/) — real-world RLS omission consequence
- [Supabase API Keys Discussion (publishable key transition)](https://github.com/orgs/supabase/discussions/29260) — anon key → sb_publishable format
- [Multiple GoTrueClient instances — Supabase GitHub](https://github.com/orgs/supabase/discussions/37755) — singleton requirement

### Tertiary (LOW confidence)
- Joe Muller (@BosonJoe) X post — documented OpenAI budget drain via unprotected Supabase edge function (single source, but corroborates the rate limiting necessity)

---

*Research completed: 2026-02-19*
*Ready for roadmap: yes*

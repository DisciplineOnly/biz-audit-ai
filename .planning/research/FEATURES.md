# Feature Research

**Domain:** Business Audit / Assessment SaaS — Lead Generation Funnel with AI Reports
**Researched:** 2026-02-19
**Confidence:** HIGH (table stakes, based on direct competitor analysis + industry patterns); MEDIUM (differentiators, based on quiz funnel research + SaaS audit tool review); HIGH (anti-features, based on verified constraints from STACK.md)

> **Scope note:** This document covers only the *new* backend features being added this milestone: persistence, AI report generation, email capture, and admin notification. Existing client-side features (8-step form, scoring engine, report layout, Cal.com embed, localStorage) are already implemented and not re-evaluated here.

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels broken or untrustworthy.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Audit persistence (server-side) | Completed audits must survive browser close. localStorage is a development convenience, not a production contract. Users who share a report link expect it to work. | LOW | Single Supabase INSERT on form submit. The core table (`audit_submissions`) and its schema is already designed in the plan doc. |
| Shareable report URL | The entire value of a report is that it can be reviewed, shared with a partner, or revisited. A client-only URL is a dead end. SEO audit tools (My Web Audit, 66audit), ScoreApp, and Outgrow all provide this. | LOW | `/report/:auditId` route already exists in the frontend. Just needs the auditId to come from Supabase UUID rather than localStorage. |
| Email capture at audit completion | Without email capture, there are no leads. The audit has zero business value if the admin has no way to follow up. Industry standard: collect email *just before* showing results (not upfront), which converts at ~40% of starters per Interact's 2026 quiz conversion report. | LOW | Single email field. Already in Step 1 (email field exists). The key decision is *when* to gate: email is collected at Step 1 naturally; the gate is already in place. No separate gate page needed. |
| Admin notification on audit completion | Without notification, leads sit in a database with no action taken. Every lead-gen tool in this category (My Web Audit, Outgrow) provides real-time or near-real-time admin notification. A lead that doesn't get followed up within hours has a 90%+ drop in conversion probability. | LOW | Resend email to fixed admin address. Triggered via Supabase Edge Function on audit submission. Plain-text or simple HTML email with contact name, email, niche, overall score, and report link. |
| AI-generated personalized report text | The plan doc's stated core value is "report must feel specific to *their* business, not generic." Without LLM-generated text, the report is a template fill-in. Competitors using AI personalization (ScoreApp, Outgrow AI) have set the expectation. A generic template report will feel like a free quiz, not a professional audit. | MEDIUM | GPT-4.1 mini via Supabase Edge Function. Structured outputs (JSON schema) guarantee parseable responses. The report structure is fixed; AI writes the prose within sections. |
| Report accessible without authentication | The flow is anonymous lead-gen. If viewing the report requires creating an account, conversion drops dramatically. Quiz/assessment tools universally serve reports via a public (but hard-to-guess) UUID link. | LOW | Supabase anon key can read audit reports by UUID. RLS policy: `SELECT WHERE id = requested_uuid` with no auth requirement. UUIDs are not guessable. |
| Rate limiting on submission | Without rate limiting, a single bad actor (or bored bot) can drain the entire OpenAI budget in minutes. This happened to a documented Supabase + OpenAI integration project (Joe Muller's Twitter/X post). At $0.004/report, 10,000 bot submissions = $40 in API costs. | MEDIUM | Rate limiting per email (max 3 submissions per 24 hours, as designed in plan doc) covers the most common abuse vector. IP-based rate limiting via Upstash Redis is the Supabase-recommended pattern for Edge Functions. |

---

### Differentiators (Competitive Advantage)

Features that set the product apart. Not expected, but valued.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Niche-specific AI prompt context | The AI prompt knows whether the submitter is a Home Services trade or Real Estate team and applies industry-specific framing. Generic assessment tools use the same prompt for everyone. Niche framing makes the report feel like it was written by someone who understands their specific industry. | LOW | The niche (`home_services` or `real_estate`) is already in the submission data. Pass it as context in the system prompt. One prompt template per niche, parameterized. Cost: zero additional API calls. |
| Score-aware recommendations | The AI prompt includes each category score (0–100) and the overall weighted score, instructing the model to lead with the lowest-scoring areas and frame recommendations by severity. Generic audit tools generate the same recommendations regardless of score. | LOW | Already computed client-side. Send scores as structured data alongside form answers in the edge function payload. The AI references actual numbers in prose ("Your lead funnel scored 34/100, which is in the bottom quartile for home services businesses of your size."). |
| Partner/referral attribution in admin notification | When a lead arrives via a `?ref=` or `?partner=` UTM parameter, the admin notification includes the partner attribution. This enables a tiered follow-up approach (referral partner leads get priority). | LOW | URL parameters are already captured client-side. Include in the INSERT payload. Include in admin email template. Zero additional complexity. |
| Async generation with polling (user stays on page) | Instead of showing "check your email," the user stays on a loading screen that polls for report completion. When the report is ready, they're redirected automatically. This keeps the user in the funnel and ensures they see the report (higher consultation booking rate). | MEDIUM | Requires: (1) `status` column in `audit_reports` table (`pending` / `complete` / `error`), (2) React polling loop on `/generating` page via `useQuery` with `refetchInterval`, (3) edge function sets `status = complete` after writing report. The `/generating` page already exists — it just needs to poll instead of spinning forever. |
| Report URL in user-facing email | The user receives a "your report is ready" email with a direct link to the report URL. This enables re-access (they can share it with their business partner, revisit it, etc.) and reinforces the professional quality of the experience. | LOW | Same Resend edge function that sends admin notification. User email is in the submission data. Include the `report/:auditId` URL in the email body. |

---

### Anti-Features (Deliberately NOT Building)

Features that seem useful but create cost, complexity, or risk disproportionate to value.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| User accounts / authentication | Adds login screens, password reset flows, session management, and Supabase Auth configuration — all to solve the problem of "let me see my old report." UUIDs in the report URL already solve report access without auth. Adding auth increases form abandonment (friction at the point of highest intent). | Persist the report URL in the user email. UUID links are sufficient for the use-case. |
| Admin dashboard (CRUD UI for leads) | A dashboard requires building list views, search, filtering, pagination, and secure admin authentication. This milestone's lead volume doesn't justify it. Email notifications + Supabase Dashboard (table view) covers the same need with zero development effort. | Admin checks Supabase Dashboard or inbox. V2 consideration once lead volume warrants it. |
| PDF report generation server-side | `pdf-lib` and `pdfkit` have Deno compatibility issues (blocked file system access). PDF libraries risk hitting the 20MB Edge Function bundle size limit. PDF generation is expensive relative to its conversion impact — it's a "nice to have" that consultants want but prospects rarely use. | Let the browser print/save-as-PDF using `window.print()` with a print-friendly CSS media query on the report page. No server dependency. |
| Real-time streaming of AI report | Streaming requires Server-Sent Events (SSE) or WebSockets from the Edge Function, complex UI handling for partial content, and degraded error recovery (partial streams are hard to retry). GPT-4.1 mini returns a full 2000-token report in 5–15s — not long enough to justify streaming complexity. | Full response: edge function waits for complete LLM response, writes to DB, user polls for `status = complete`. |
| Multi-step email sequences / drip campaigns | Email nurture sequences require a CRM integration (HubSpot, ActiveCampaign) or a marketing automation platform. This is a v2+ concern. Building drip logic into Supabase Edge Functions creates unmaintainable custom CRM logic. | Single transactional email (user gets report link, admin gets lead notification). Connect to a real CRM/marketing automation tool in v2. |
| A/B testing different report formats | Experiment infrastructure (variant assignment, holdout tracking, statistical significance tooling) is weeks of work. The report structure is already validated by the plan. Get one version right and shipping, then test with real traffic. | Ship one well-crafted AI report. Run A/B tests after there is baseline conversion data. |
| Webhook notifications to third-party CRMs | Zapier/Make integrations, HubSpot webhooks, and Salesforce pushes require per-integration maintenance and auth credential management. Not needed until v2 when lead volume is higher. | Admin manually exports from Supabase or copies leads from email notifications into their CRM. |

---

## Feature Dependencies

```
[Email Capture (Step 1)]
    └──enables──> [Audit Persistence (INSERT to Supabase)]
                      └──triggers──> [Edge Function: generate-report]
                                         ├──calls──> [AI Report Generation (GPT-4.1 mini)]
                                         │               └──writes──> [audit_reports table]
                                         │                               └──enables──> [Shareable Report URL]
                                         └──calls──> [Email Notifications (Resend)]
                                                         ├──sends──> [Admin Notification Email]
                                                         └──sends──> [User Report-Ready Email]

[Rate Limiting]
    └──guards──> [Edge Function: generate-report]

[Niche-Specific Prompt Context]
    └──enhances──> [AI Report Generation]

[Score-Aware Recommendations]
    └──enhances──> [AI Report Generation]

[Async Polling (/generating page)]
    └──depends-on──> [audit_reports.status column]
                          └──set-by──> [Edge Function: generate-report]

[Partner Attribution in Admin Email]
    └──depends-on──> [Audit Persistence (ref/utm_source stored in submission)]
```

### Dependency Notes

- **Audit Persistence requires Email Capture:** An anonymous audit with no contact info has no lead value. Email is already collected in Step 1; the dependency is that it must be present and validated before the INSERT fires.
- **Shareable Report URL requires Audit Persistence:** The UUID in the URL is the Supabase primary key from the INSERT. Client-only UUIDs (localStorage) are not shareable.
- **AI Report Generation requires Audit Persistence (not the reverse):** The webhook fires *after* the INSERT. The submission record must exist before report generation begins. Do not try to generate the report before persisting the submission — if the edge function fails, the data would be lost.
- **Email Notifications depend on AI Report Generation completing:** The user email ("your report is ready") should include the report URL and only send after the report is written to the database. The admin email can send immediately on submission (before report is ready) as an early heads-up.
- **Async Polling requires `status` column:** The `/generating` page needs something to poll. The `audit_reports` table needs a `status` field that the edge function sets to `complete` when done. Without this, polling has no signal.
- **Rate Limiting is a prerequisite for AI Report Generation in production:** Do not deploy the generate-report edge function without rate limiting. The OpenAI cost exposure is real and immediate.

---

## MVP Definition

### Launch With (v1) — This Milestone

Minimum needed to make the backend addition functional and the lead-gen loop work end-to-end.

- [ ] **Supabase INSERT on audit completion** — without persistence, nothing else works
- [ ] **Shareable report URL from DB UUID** — table stakes for any report that's meant to be shared or re-accessed
- [ ] **AI-generated report text (GPT-4.1 mini)** — core value proposition; templates feel generic; this is the feature that justifies the backend addition
- [ ] **Admin notification email on completion** — the reason the business built this tool; leads need to reach a human
- [ ] **Rate limiting (email-based, 3/24h)** — non-negotiable before production; protects the OpenAI budget
- [ ] **User report-ready email with report link** — closes the funnel loop; user can re-access and share

### Add After Validation (v1.x)

Add these once the core loop is validated with real users.

- [ ] **Async polling on /generating page** — trigger: user feedback that the "generating" wait feels disconnected; improves conversion from report generation to consultation booking
- [ ] **Score-aware AI prompt improvements** — trigger: reviewing real reports and finding the AI is not prioritizing low-scoring areas well; one iteration of prompt engineering
- [ ] **Partner attribution in admin email** — trigger: first referral partner is activated; currently their leads look identical to organic leads in the inbox

### Future Consideration (v2+)

Defer until product-market fit is established and lead volume warrants the investment.

- [ ] **Admin lead dashboard** — trigger: email notification volume makes inbox management unworkable (rough threshold: 20+ audits/day)
- [ ] **CRM integration (HubSpot / Zapier)** — trigger: admin is manually copying leads from email into a CRM; build the bridge when that pain is documented
- [ ] **PDF download (browser-based print)** — trigger: user requests documented; ship `@media print` CSS optimization as a quick win
- [ ] **Multi-step email sequences** — trigger: connecting to a marketing automation platform is a business decision, not a feature decision

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Audit persistence (Supabase INSERT) | HIGH | LOW | P1 |
| Shareable report URL | HIGH | LOW | P1 |
| AI-generated personalized report text | HIGH | MEDIUM | P1 |
| Admin notification email | HIGH | LOW | P1 |
| User report-ready email | HIGH | LOW | P1 |
| Rate limiting on submission | LOW (user-invisible) | MEDIUM | P1 (risk mitigation) |
| Niche-specific AI prompt context | MEDIUM | LOW | P1 (zero cost add-on) |
| Score-aware AI recommendations | MEDIUM | LOW | P1 (zero cost add-on) |
| Async polling (/generating page) | MEDIUM | MEDIUM | P2 |
| Partner attribution in admin email | LOW | LOW | P2 |
| PDF download (browser print) | LOW | LOW | P2 |
| Admin lead dashboard | LOW | HIGH | P3 |
| CRM integration | MEDIUM | HIGH | P3 |
| Multi-step email sequences | MEDIUM | HIGH | P3 |

**Priority key:**
- P1: Must have for this milestone launch
- P2: Should have, add when possible without delaying launch
- P3: Future milestone; not this sprint

---

## Competitor Feature Analysis

Representative tools in adjacent categories: ScoreApp (scorecard marketing), Outgrow (interactive assessments), My Web Audit (agency audit SaaS).

| Feature | ScoreApp | Outgrow | My Web Audit | BizAudit Approach |
|---------|----------|---------|--------------|-------------------|
| Lead/email capture | Before results (gated) | Progressive forms, gated results | Embedded widget, email required | Step 1 already collects email; no separate gate needed — email in data before any AI cost is incurred |
| Persistence | Cloud storage, leads dashboard | Cloud storage, analytics dashboard | Cloud storage, lead intelligence | Supabase Postgres; no user-facing dashboard this milestone |
| AI personalization | AI-written category feedback and next-step recommendations | Personalized outcome pages, dynamic content | Business intelligence, industry-specific | GPT-4.1 mini with niche context and actual score data in prompt |
| Admin notification | CRM sync (HubSpot, Salesforce) | Team notifications, configurable frequency | Real-time notifications, email open tracking | Resend transactional email to fixed admin address; immediate on submission |
| Shareable report | Not standard (dashboard-based) | Export data, no permalink report | Shareable web links, PDF download | `/report/:auditId` permalink; UUID is not guessable |
| PDF export | Not standard | Data export (CSV/Excel) | PDF format option | Browser `window.print()` deferred to v1.x |
| User email | Not confirmed | Automated triggered emails | Email open tracking | User gets "report ready" email with report URL via Resend |
| Rate limiting | Via CRM / pricing tiers | Via pricing tiers | Not exposed | Email-based rate limiting in Edge Function (3 per 24h per email) |

---

## Sources

- [Interact Quiz Conversion Rate Report 2026](https://www.tryinteract.com/blog/quiz-conversion-rate-report/) — 40.1% start-to-lead conversion benchmark; "email before results" placement best practice (MEDIUM confidence — single source but directly relevant)
- [Perspective: Best Quiz Funnel Software 2026](https://www.perspective.co/article/quiz-funnel-software) — mobile-first layouts, inline opt-in, dynamic result pages as table stakes (MEDIUM confidence)
- [ScoreApp features](https://www.scoreapp.com/features/) — AI-generated feedback, CRM sync, automated triggered emails (MEDIUM confidence — web search verified, feature page partially accessible)
- [Outgrow review — Blogging Wizard](https://bloggingwizard.com/outgrow-review/) — lead forms, results pages, admin notifications, analytics (MEDIUM confidence)
- [My Web Audit features](https://www.mywebaudit.com/features) — real-time admin notifications, shareable links, email delivery, multiple report formats (MEDIUM confidence — fetched directly)
- [66audit CodeCanyon](https://codecanyon.net/item/66audit-ai-seo-auditing-tool-saas/59553493) — shareable/private audit links, email reports, instant alerts (MEDIUM confidence)
- [Supabase Rate Limiting Edge Functions](https://supabase.com/docs/guides/functions/examples/rate-limiting) — Upstash Redis pattern for Edge Function rate limiting (HIGH confidence — official docs)
- [Joe Muller on X](https://x.com/BosonJoe/status/1834263200625299740) — documented case of OpenAI budget drain via unprotected Supabase Edge Function (MEDIUM confidence — single primary source but highly relevant cautionary example)
- [Resend transactional email best practices — MailerSend](https://www.mailersend.com/blog/transactional-email-best-practices) — immediate delivery, authentication (SPF/DKIM/DMARC), personalization, brand consistency (MEDIUM confidence)
- STACK.md (same research session) — Edge Function constraints (20MB bundle, 400s timeout, PDF library issues), Resend free tier limits, anon RLS policy pattern (HIGH confidence — verified against Supabase official docs)

---

*Feature research for: BizAudit — backend additions (persistence, AI reports, lead tracking, email notifications)*
*Researched: 2026-02-19*

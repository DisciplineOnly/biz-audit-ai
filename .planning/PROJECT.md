# BizAudit

## What This Is

A multi-step business audit tool that walks business owners through 8 steps of questions about their operations, then generates a personalized AI-driven analysis report with shareable URLs. Targets two niches — Home Services and Real Estate Teams. Claude Haiku 4.5 writes niche-specific recommendations based on actual scores. The report ends with a Cal.com embed to book a consultation call, making the audit both a diagnostic tool and a lead generation funnel.

## Core Value

Business owners complete the audit and receive a personalized, AI-driven analysis that makes them want to book a consultation — the report must feel specific to *their* business, not generic.

## Requirements

### Validated

- ✓ 8-step form wizard with niche-aware questions (home services, real estate) — existing
- ✓ Client-side scoring engine across 7 business categories (0-100 scale) — existing
- ✓ Report generation with gaps, quick wins, and strategic recommendations — existing
- ✓ Cal.com booking embed for consultation scheduling — existing
- ✓ localStorage persistence with auto-save and resume capability — existing
- ✓ Partner/referral code tracking via URL parameters — existing
- ✓ Responsive UI with Tailwind CSS and shadcn/ui components — existing
- ✓ Form validation on step transitions — existing
- ✓ Supabase backend persists completed audit results — v1.0
- ✓ Email capture at audit completion (no user accounts) — v1.0
- ✓ Lead tracking — completed audits stored with contact info and scores — v1.0
- ✓ Admin email notification on audit completion — v1.0
- ✓ AI-generated personalized report content via Claude Haiku 4.5 — v1.0
- ✓ Shareable report URLs (persisted reports accessible via link) — v1.0

### Active

- [ ] User email with report link after AI generation (EMAIL-02 — blocked on custom Resend domain)
- [ ] Custom Resend domain for production email deliverability
- [ ] End-to-end verification with real submissions (Phase 6 scope — dropped from v1.0)

### Out of Scope

- User accounts / authentication — email capture only, no login system
- Admin dashboard — v2 consideration, email notifications sufficient for now
- Additional niches beyond home services and real estate — not this milestone
- Mobile app — web-first
- Real-time chat or messaging — not relevant to audit flow
- Server-side PDF generation — browser print-to-PDF sufficient
- Streaming AI output — full report returns in 5-15s, complexity not justified

## Context

Shipped v1.0 with ~9,200 lines changed across 38 files (TypeScript/React).
Tech stack: React/Vite/TypeScript SPA + Supabase (Postgres, Edge Functions) + Claude Haiku 4.5 + Resend + Upstash Redis.
Backend: 3 edge functions (generate-report, send-notification, fetch-report), 3 migrations, RLS security.
Rate limiting: dual-vector (3/email/24h + 10/IP/24h) via Upstash Redis fixedWindow.
Email: admin notifications via Resend sandbox domain (onboarding@resend.dev).
Known limitation: user email (EMAIL-02) deferred pending custom Resend domain verification.

## Constraints

- **Backend**: Supabase (Postgres + Edge Functions) — MCP tooling available
- **No auth**: Email capture only, no user accounts or login flows
- **Report structure**: Keep existing report layout (overall score, category scorecard, gaps, quick wins, strategic recommendations) — AI improves the text, not the structure
- **Niches**: Home Services and Real Estate Teams only
- **Hosting**: Vercel or Netlify for frontend static hosting
- **AI model**: Claude Haiku 4.5 via Anthropic API (edge function, not client-side)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Supabase for backend | MCP tools available, Postgres + Edge Functions covers all needs | ✓ Good — shipped v1.0 |
| Email capture, no accounts | Reduces friction for business owners completing the audit | ✓ Good — zero auth friction |
| AI reports via Edge Functions | Keep report structure, use LLM to write personalized text based on form answers | ✓ Good — Claude Haiku 4.5 produces quality niche-specific content |
| Email notifications (not dashboard) | Simpler to implement, sufficient for current lead volume | ✓ Good — admin email working |
| Client-side UUID generation | supabase-js v2 .select().single() returns null in browser; crypto.randomUUID() is correct pattern | ✓ Good — reliable ID generation |
| Database Webhook for email trigger | Edge Function webhook type eliminates manual URL/auth config | ✓ Good — automatic on INSERT |
| Dual-vector rate limiting (email + IP) | Prevents abuse from both vectors; fixedWindow for predictable reset | ✓ Good — deployed and enforced |
| fetch-report edge function (service_role) | Preserves SEC-02 (no anon SELECT policy) while enabling shareable URLs | ✓ Good — security preserved |
| Defer EMAIL-02 (user email) | Requires custom Resend domain verification (DNS propagation); not blocking for MVP | ⚠️ Revisit — initiate domain verification |
| Drop Phase 6 (Verification) | Manual QA and audit sufficient for MVP launch | ⚠️ Revisit — consider for v1.1 |

---
*Last updated: 2026-02-21 after v1.0 milestone*

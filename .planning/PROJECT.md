# BizAudit

## What This Is

A multi-step business audit tool that walks business owners through 8 steps of questions about their operations, then generates a detailed analysis report identifying pain points and gaps. Currently targets two niches — Home Services and Real Estate Teams. The report ends with a Cal.com embed to book a consultation call, making the audit both a diagnostic tool and a lead generation funnel.

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

### Active

- [ ] Supabase backend to persist completed audit results
- [ ] Email capture at audit completion (no user accounts)
- [ ] Lead tracking — store completed audits with contact info and scores
- [ ] Email notification sent to admin when an audit is completed
- [ ] AI-generated personalized report content (same report structure, LLM-written text specific to their answers)
- [ ] Shareable report URLs (persisted reports accessible via link)

### Out of Scope

- User accounts / authentication — email capture only, no login system
- Admin dashboard — v2 consideration, email notifications sufficient for now
- Additional niches beyond home services and real estate — not this milestone
- Mobile app — web-first
- Real-time chat or messaging — not relevant to audit flow

## Context

BizAudit is a brownfield React/Vite/TypeScript SPA currently running entirely client-side. The scoring engine and report generation use template-based logic with hardcoded scoring lookup tables. The app is functional but lacks data persistence — completed audits vanish when the browser clears localStorage. The transition to Supabase adds persistence, lead tracking, and enables AI-powered report generation via edge functions.

Frontend will be hosted on Vercel or Netlify. Supabase provides the backend (Postgres database, edge functions for AI report generation and email notifications).

## Constraints

- **Backend**: Supabase (Postgres + Edge Functions) — already has MCP tooling available
- **No auth**: Email capture only, no user accounts or login flows
- **Report structure**: Keep existing report layout (overall score, category scorecard, gaps, quick wins, strategic recommendations) — AI improves the text, not the structure
- **Niches**: Home Services and Real Estate Teams only for this milestone
- **Hosting**: Vercel or Netlify for frontend static hosting

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Supabase for backend | MCP tools available, Postgres + Edge Functions covers all needs | — Pending |
| Email capture, no accounts | Reduces friction for business owners completing the audit | — Pending |
| AI reports via Edge Functions | Keep report structure, use LLM to write personalized text based on form answers | — Pending |
| Email notifications (not dashboard) | Simpler to implement, sufficient for current lead volume | — Pending |

---
*Last updated: 2026-02-19 after initialization*

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server on port 8080
npm run build        # Production build
npm run build:dev    # Development build
npm run lint         # ESLint
npm run test         # Run tests once (vitest)
npm run test:watch   # Run tests in watch mode
```

## Architecture

BizAudit is a React/Vite/TypeScript SPA with a Supabase backend — a multi-step business audit wizard that scores business operations across 7 categories, generates an AI-powered report via Claude Haiku 4.5, and persists results with shareable URLs. It targets two niches: Home Services and Real Estate Teams.

**Routes** (`src/App.tsx`):
- `/` — Landing page with niche selection
- `/audit` — 8-step form wizard (query params: `?niche=`, `?resume=true`)
- `/generating` — Loading transition (submits audit, triggers AI report generation)
- `/report/:auditId` — Generated report with scores and recommendations (loads from Supabase or navigation state)

**Frontend modules:**
- `src/types/audit.ts` — `AuditFormState` interface, `auditReducer` (Redux-style with `useReducer`), action types (`UPDATE_STEP1`..`UPDATE_STEP8`, `SET_NICHE`, `COMPLETE_STEP`, `RESTORE`), `initialFormState`, and `AIReportData` type
- `src/lib/scoring.ts` — Scoring engine: lookup tables map form answers to 0-3 points, `computeScores()` normalizes to 0-100 across 7 weighted categories, `generateMockReport()` produces template-based gaps/wins/recommendations (fallback when AI unavailable)
- `src/lib/supabase.ts` — Supabase client (requires `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` env vars)
- `src/lib/submitAudit.ts` — Inserts audit to Supabase with client-generated UUID via `crypto.randomUUID()` (anon role has INSERT-only RLS, no SELECT)
- `src/lib/fetchReport.ts` — Invokes `fetch-report` edge function to load audit + AI report data for shareable URLs

**Pages:**
- `src/pages/Loading.tsx` — Orchestrates `submitAudit()` then `generate-report` edge function call with `Promise.all` for 8s minimum animation. Handles 429 rate limit responses and retry logic
- `src/pages/Report.tsx` — Dual data source: navigation state (fast path from form) or Supabase fetch (shareable URL). Uses `useQuery` with 4s polling for pending reports, 90s timeout. AI content prioritized via nullish coalescing over template content

**Form steps** (`src/components/audit/Step1-8*.tsx`): Each step receives `StepProps` (state, dispatch, isHS) and renders niche-conditional fields. Reusable form primitives live in `AuditFormComponents.tsx`.

**Edge functions** (`supabase/functions/`):
- `generate-report` — Calls Claude Haiku 4.5 with niche-aware prompt, scores, and sanitized form answers. Persists AI report to `audit_reports` table. Rate limited: 3/email/24h + 10/IP/24h via Upstash Redis
- `send-notification` — Triggered by Database Webhook on `report_status = 'completed'`. Sends HTML admin email via Resend with scores, contact info, and report link
- `fetch-report` — Service-role read of `audits` + `audit_reports` tables. Returns audit data + AI report for shareable URLs (preserves RLS — no anon SELECT policy)
- `_shared/cors.ts` — Shared CORS headers module

**Database** (Supabase Postgres):
- `audits` table — form_data (JSONB), scores (JSONB), niche, contact info, report_status, email_status. RLS: anon INSERT only, no SELECT
- `audit_reports` table — AI-generated report content keyed by audit_id. No anon RLS policies (service_role only)
- Migrations in `supabase/migrations/`

**State persistence**: localStorage keys `ep_audit_state`, `ep_audit_state_scores`, `ep_audit_state_form`. Auto-saves on every state change. Partner/referral codes stored in sessionStorage as `ep_partner_code`.

## Key Patterns

- **Path alias**: `@/` maps to `./src/` (configured in tsconfig.json and vite.config.ts)
- **UI components**: shadcn/ui in `src/components/ui/` — do not edit these directly, use `npx shadcn-ui@latest add <component>` to add new ones
- **Styling**: Tailwind CSS with HSL CSS variables for brand colors (navy, coral, score-red/orange/yellow/green). Use the `cn()` utility from `@/lib/utils` for conditional classes
- **Niche branching**: `isHS` boolean (home_services vs real_estate) drives conditional rendering throughout steps and scoring
- **Supabase RLS**: anon role can INSERT audits but cannot SELECT — client generates UUIDs via `crypto.randomUUID()`. Shareable URLs use `fetch-report` edge function with service_role
- **Edge function patterns**: Anthropic/Supabase admin clients instantiated inside `Deno.serve` handler (per_worker mode). Always return 200 from webhook-triggered functions to prevent retries. PII excluded from LLM prompts by omission
- **AI report fallback**: Report.tsx uses nullish coalescing (`aiReport?.gaps ?? templateReport.criticalGaps`) — template content displays if AI unavailable
- **Rate limiting**: Upstash Redis `fixedWindow` — 3 per email per 24h + 10 per IP per 24h on generate-report. 429 response handled in Loading.tsx with user-facing message

## Environment

Copy `.env.example` to `.env` and fill in Supabase credentials. Only `VITE_`-prefixed variables are exposed to the client.

Edge function secrets (stored in Supabase, not in `.env`): `ANTHROPIC_API_KEY`, `RESEND_API_KEY`, `ADMIN_EMAIL`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`.

## Testing

Vitest with jsdom environment. Test files go in `src/**/*.{test,spec}.{ts,tsx}`. Setup file at `src/test/setup.ts` provides `@testing-library/jest-dom` matchers and `matchMedia` polyfill.

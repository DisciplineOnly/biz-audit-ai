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

BizAudit is a React/Vite/TypeScript SPA with a Supabase backend — a multi-step business audit wizard that scores business operations across 7 categories, generates an AI-powered report via Claude Haiku 4.5, and persists results with shareable URLs. It targets two niches (Home Services and Real Estate Teams) with **17 sub-niches** and full **Bulgarian (bg) + English (en) localization**.

### Niches & Sub-Niches

Home Services has 12 sub-niches in 3 operational groups:
- **Reactive**: HVAC, Plumbing, Electrical, Garage Doors
- **Recurring**: Pest Control, Landscaping, Cleaning
- **Project-Based**: Roofing, Painting, General Contracting, Construction, Interior Design

Real Estate has 5 sub-niches: Residential Sales, Commercial/Office, Property Management, New Construction, Luxury/Resort.

Each sub-niche has custom CRM options, tool recommendations, lead sources, KPIs, and scoring weight overrides — configured in `src/config/subNicheConfig.ts`.

### Routes (`src/App.tsx`)

All routes support an optional `/:lang?` prefix for language routing (e.g. `/en/audit`). Bulgarian is the default language — `/bg/...` redirects to `/...`.

- `/:lang?/` — Landing page with niche + sub-niche selection (`src/pages/Index.tsx`)
- `/:lang?/audit` — 8-step form wizard (`src/pages/AuditForm.tsx`, query params: `?niche=`, `?resume=true`)
- `/:lang?/generating` — Loading transition, submits audit + triggers AI report generation (`src/pages/Loading.tsx`)
- `/:lang?/report/:auditId` — Generated report with scores and recommendations (`src/pages/Report.tsx`)
- `/:lang?/*` — 404 handler (`src/pages/NotFound.tsx`)

Routes are wrapped in `<LangLayout />` which handles language detection from URL and i18n setup.

### Frontend Modules

- `src/types/audit.ts` — `AuditFormState` interface (includes `subNiche` field), `auditReducer` (actions: `UPDATE_STEP1`..`UPDATE_STEP8`, `SET_NICHE`, `SET_SUB_NICHE`, `COMPLETE_STEP`, `RESTORE`), `initialFormState`, `AIReportData` type, `HSSubNiche`/`RESubNiche`/`SubNiche` types
- `src/config/subNicheConfig.ts` — Sub-niche registry (17 entries), per-group option overrides (`SUB_NICHE_OPTIONS`), Bulgarian market overrides (`BG_SUB_NICHE_OPTIONS`), scoring weight overrides (`SUB_NICHE_WEIGHTS`), helpers: `getSubNicheGroup()`, `getSubNicheOptions()`, `getSubNicheOptionsForLang()`, `getWeightsForSubNiche()`
- `src/lib/scoring.ts` — Scoring engine: lookup tables map form answers to 0-3 points, `computeScores()` accepts optional `subNiche` param and applies weight overrides via `getWeightsForSubNiche()`, normalizes to 0-100 across 7 weighted categories. `generateMockReport()` produces template-based gaps/wins/recommendations with Bulgarian support (`lang` param)
- `src/lib/supabase.ts` — Supabase client (requires `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` env vars)
- `src/lib/submitAudit.ts` — Inserts audit to Supabase with client-generated UUID via `crypto.randomUUID()`, includes `language` and `sub_niche` fields
- `src/lib/fetchReport.ts` — Invokes `fetch-report` edge function to load audit + AI report data (returns `language` and `sub_niche` for context)
- `src/lib/i18n.ts` — i18next initialization with HTTP backend, loads from `public/locales/{lang}/{namespace}.json`
- `src/hooks/useLang.ts` — Language detection hook from URL params

### Pages

- `src/pages/Index.tsx` — Landing page with niche and sub-niche selection
- `src/pages/AuditForm.tsx` — 8-step form wizard with niche/sub-niche conditional fields
- `src/pages/Loading.tsx` — Orchestrates `submitAudit()` then `generate-report` edge function call with `Promise.all` for 8s minimum animation. Handles 429 rate limit responses and retry logic
- `src/pages/Report.tsx` — Dual data source: navigation state (fast path from form) or Supabase fetch (shareable URL). Uses `useQuery` with 4s polling for pending reports, 90s timeout. AI content prioritized via nullish coalescing over template content
- `src/pages/NotFound.tsx` — 404 handler with language-aware redirect

### Form Steps

`src/components/audit/Step1-8*.tsx`: Each step receives `StepProps` (state, dispatch, isHS) and renders niche-conditional fields. Step 1 includes `SubNicheSelector.tsx` for sub-niche selection. CRM options, tools, and lead sources are sub-niche and language dependent (via `getSubNicheOptionsForLang()`). Reusable form primitives live in `AuditFormComponents.tsx`.

### Edge Functions (`supabase/functions/`)

- `generate-report` — Calls Claude Haiku 4.5 (`claude-haiku-4-5-20251001`) with niche/sub-niche-aware prompt, scores, and sanitized form answers. Persists AI report to `audit_reports` table. Rate limited: 3/email/24h + 10/IP/24h via Upstash Redis
- `send-notification` — Triggered by Database Webhook on `report_status = 'completed'`. Sends HTML admin email via Resend with scores, contact info, language, sub-niche, and report link
- `fetch-report` — Service-role read of `audits` + `audit_reports` tables. Returns audit data + AI report + language/sub-niche for shareable URLs (preserves RLS — no anon SELECT policy)
- `_shared/cors.ts` — Shared CORS headers module

### Database (Supabase Postgres)

- `audits` table — form_data (JSONB), scores (JSONB), niche, sub_niche, language, contact info, report_status, email_status. RLS: anon INSERT only, no SELECT
- `audit_reports` table — AI-generated report content (JSONB) keyed by audit_id, cascade delete. No anon RLS policies (service_role only)
- Migrations in `supabase/migrations/`

### Internationalization (i18n)

- URL-driven: `/en/...` = English, `/...` = Bulgarian (default)
- `LangLayout` component wraps routes, redirects `/bg/...` → `/...`
- `LanguageToggle` component for switching languages
- Locales in `public/locales/{en,bg}/` with namespaces: `common`, `landing`, `steps`, `generating`, `report`
- Bulgarian market overrides: Viber as communication tool, OLX.bg/bazar.bg/imot.bg as lead sources, localized KPI labels
- `language` field persisted to database for report generation consistency

### State Persistence

localStorage keys: `ep_audit_state`, `ep_audit_state_scores`, `ep_audit_state_form`. Auto-saves on every state change. Partner/referral codes stored in sessionStorage as `ep_partner_code`.

## Key Patterns

- **Path alias**: `@/` maps to `./src/` (configured in tsconfig.json and vite.config.ts)
- **UI components**: shadcn/ui in `src/components/ui/` — do not edit these directly, use `npx shadcn-ui@latest add <component>` to add new ones
- **Styling**: Tailwind CSS with HSL CSS variables for brand colors (navy, coral, score-red/orange/yellow/green). Use the `cn()` utility from `@/lib/utils` for conditional classes
- **Niche branching**: `isHS` boolean (home_services vs real_estate) drives conditional rendering throughout steps and scoring
- **Sub-niche grouping**: HS sub-niches map to 3 operational groups (reactive/recurring/project_based) with shared option sets; RE sub-niches each have their own options. Scoring weights apply at group level
- **Supabase RLS**: anon role can INSERT audits but cannot SELECT — client generates UUIDs via `crypto.randomUUID()`. Shareable URLs use `fetch-report` edge function with service_role
- **Edge function patterns**: Anthropic/Supabase admin clients instantiated inside `Deno.serve` handler (per_worker mode). Always return 200 from webhook-triggered functions to prevent retries. PII excluded from LLM prompts by omission. Data sanitized (HTML tags stripped, emojis removed, max length enforced)
- **AI report fallback**: Report.tsx uses nullish coalescing (`aiReport?.gaps ?? templateReport.criticalGaps`) — template content displays if AI unavailable
- **Rate limiting**: Upstash Redis `fixedWindow` — 3 per email per 24h + 10 per IP per 24h on generate-report. 429 response handled in Loading.tsx with user-facing message
- **Language preference hierarchy**: URL path (`/en/...` or default BG) → i18n config → stored in database for consistency

## Environment

Copy `.env.example` to `.env` and fill in Supabase credentials. Only `VITE_`-prefixed variables are exposed to the client.

Edge function secrets (stored in Supabase, not in `.env`): `ANTHROPIC_API_KEY`, `RESEND_API_KEY`, `ADMIN_EMAIL`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`.

## Testing

Vitest with jsdom environment. Test files go in `src/**/*.{test,spec}.{ts,tsx}`. Setup file at `src/test/setup.ts` provides `@testing-library/jest-dom` matchers and `matchMedia` polyfill.

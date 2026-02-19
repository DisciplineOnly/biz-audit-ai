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

BizAudit is a React/Vite/TypeScript SPA — a multi-step business audit wizard that scores business operations across 7 categories and generates a report. It targets two niches: Home Services and Real Estate Teams.

**Routes** (`src/App.tsx`):
- `/` — Landing page with niche selection
- `/audit` — 8-step form wizard (query params: `?niche=`, `?resume=true`)
- `/generating` — Loading transition
- `/report/:auditId` — Generated report with scores and recommendations

**Core modules:**
- `src/types/audit.ts` — `AuditFormState` interface, `auditReducer` (Redux-style with `useReducer`), action types (`UPDATE_STEP1`..`UPDATE_STEP8`, `SET_NICHE`, `COMPLETE_STEP`, `RESTORE`), and `initialFormState`
- `src/lib/scoring.ts` — Scoring engine: lookup tables map form answers to 0-3 points, `computeScores()` normalizes to 0-100 across 7 weighted categories, `generateMockReport()` produces gaps/wins/recommendations
- `src/lib/supabase.ts` — Supabase client (requires `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` env vars)
- `src/lib/submitAudit.ts` — Inserts audit to Supabase with client-generated UUID (anon role has INSERT-only RLS, no SELECT)

**Form steps** (`src/components/audit/Step1-8*.tsx`): Each step receives `StepProps` (state, dispatch, isHS) and renders niche-conditional fields. Reusable form primitives live in `AuditFormComponents.tsx`.

**State persistence**: localStorage keys `ep_audit_state`, `ep_audit_state_scores`, `ep_audit_state_form`. Auto-saves on every state change. Partner/referral codes stored in sessionStorage as `ep_partner_code`.

## Key Patterns

- **Path alias**: `@/` maps to `./src/` (configured in tsconfig.json and vite.config.ts)
- **UI components**: shadcn/ui in `src/components/ui/` — do not edit these directly, use `npx shadcn-ui@latest add <component>` to add new ones
- **Styling**: Tailwind CSS with HSL CSS variables for brand colors (navy, coral, score-red/orange/yellow/green). Use the `cn()` utility from `@/lib/utils` for conditional classes
- **Niche branching**: `isHS` boolean (home_services vs real_estate) drives conditional rendering throughout steps and scoring
- **Supabase RLS**: anon role can INSERT audits but cannot SELECT — client generates UUIDs to avoid needing a return query

## Environment

Copy `.env.example` to `.env` and fill in Supabase credentials. Only `VITE_`-prefixed variables are exposed to the client.

## Testing

Vitest with jsdom environment. Test files go in `src/**/*.{test,spec}.{ts,tsx}`. Setup file at `src/test/setup.ts` provides `@testing-library/jest-dom` matchers and `matchMedia` polyfill.

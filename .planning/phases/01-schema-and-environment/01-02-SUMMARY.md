---
phase: 01-schema-and-environment
plan: 02
subsystem: database
tags: [supabase, typescript, vite, environment, client-sdk]

# Dependency graph
requires: []
provides:
  - Supabase client singleton (src/lib/supabase.ts) with fail-fast env var check
  - submitAudit() function mapping AuditFormState + AuditScores to audits table columns
  - .env.example template documenting required VITE_ variables
  - Typed ImportMetaEnv interface for VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY
affects:
  - Phase 2 (AI report generation) — uses submitAudit to persist form data before edge function call
  - Phase 3 (email/webhook) — supabase singleton used for any client-side DB reads
  - Phase 5 (Loading.tsx integration) — caller of submitAudit(), responsible for ensuring niche is set

# Tech tracking
tech-stack:
  added:
    - "@supabase/supabase-js ^2.97.0"
  patterns:
    - "Singleton export pattern: createClient once in src/lib/supabase.ts, import everywhere"
    - "Fail-fast env check: throw at module load time, not inside user actions"
    - "Insert with .select('id').single() to retrieve UUID — supabase-js v2 returns null data without .select()"
    - "Column mapping: camelCase TS types -> snake_case DB columns"

key-files:
  created:
    - src/lib/supabase.ts
    - src/lib/submitAudit.ts
    - .env.example
  modified:
    - src/vite-env.d.ts
    - package.json
    - package-lock.json
    - .gitignore

key-decisions:
  - "Fail-fast pattern: throw at module load if VITE_ vars missing, not buried in user action handlers"
  - "Only VITE_SUPABASE_PUBLISHABLE_KEY (not service_role/secret) exposed to frontend — SEC-03 compliant"
  - "submitAudit chains .select('id').single() to capture UUID — required pattern for supabase-js v2"
  - "niche null guard deferred to caller (Loading.tsx in Phase 5) — DB CHECK constraint is final guard"

patterns-established:
  - "Singleton pattern: all Supabase access via single createClient instance, never instantiate elsewhere"
  - "Env validation: validate VITE_ vars at module initialization for clear error messages"
  - "TypeScript env types: ImportMetaEnv in vite-env.d.ts provides compile-time safety for env vars"

requirements-completed: [DATA-01, DATA-02, SEC-03]

# Metrics
duration: 4min
completed: 2026-02-19
---

# Phase 1 Plan 02: Supabase Client SDK + submitAudit Function Summary

**@supabase/supabase-js singleton with fail-fast env guard and typed submitAudit() inserting AuditFormState + AuditScores with UUID return**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-19T05:54:08Z
- **Completed:** 2026-02-19T05:58:15Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Installed @supabase/supabase-js ^2.97.0 as production dependency
- Created Supabase singleton with fail-fast initialization (throws if VITE_ vars missing at module load, not during user action)
- Created submitAudit() that maps all 9 AuditFormState fields to audits table columns and chains .select('id').single() to return the UUID
- Scaffolded .env.example template and updated .gitignore to block .env from git
- Typed vite-env.d.ts with ImportMetaEnv interface for both allowed VITE_ variables
- TypeScript compilation passes with no errors; production build succeeds (1679 modules)

## Task Commits

Each task was committed atomically:

1. **Task 1: Install @supabase/supabase-js and scaffold env files** - `8f650cc` (feat)
2. **Task 2: Create Supabase client singleton and submitAudit function** - `a5c78a5` (feat)

**Plan metadata:** (pending — created after this summary)

## Files Created/Modified

- `src/lib/supabase.ts` — Supabase createClient singleton; throws clear error if VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY missing
- `src/lib/submitAudit.ts` — Async insert function: maps formState + scores to 9 audits table columns, chains .select('id').single(), returns UUID string
- `.env.example` — Two-line template documenting required environment variables (values empty, committed to git)
- `src/vite-env.d.ts` — ImportMetaEnv typed interface restricting VITE_ vars to the two allowed keys
- `.gitignore` — Added `.env` entry to prevent secret leakage
- `package.json` — Added @supabase/supabase-js ^2.97.0 to dependencies
- `package-lock.json` — Lock file updated with 500 new packages from supabase-js and its transitive deps

## Column Mapping: AuditFormState to audits Table

| DB Column | TypeScript Source | Notes |
|-----------|-------------------|-------|
| `niche` | `formState.niche` | TEXT with CHECK ('home_services'\|'real_estate'); null guard deferred to caller |
| `business_name` | `formState.step1.businessName` | TEXT NOT NULL |
| `contact_name` | `formState.step1.contactName` | TEXT NOT NULL |
| `contact_email` | `formState.step1.email` | TEXT NOT NULL |
| `contact_phone` | `formState.step1.phone ?? null` | TEXT nullable |
| `partner_code` | `formState.partnerCode ?? null` | TEXT nullable |
| `overall_score` | `scores.overall` | INTEGER CHECK (0-100) |
| `form_data` | `formState` (full object) | JSONB — all 8 steps for AI generation in Phase 2 |
| `scores` | `scores` (full object) | JSONB — all category scores |

## Decisions Made
- **Fail-fast env check:** Throw at module load time if VITE_ vars missing — gives immediate, clear error instead of cryptic Supabase network error during user action
- **Only publishable key in frontend:** SEC-03 requires no service_role or secret keys in any VITE_ variable; only `VITE_SUPABASE_PUBLISHABLE_KEY` is exposed
- **.select('id').single() required:** Without .select(), supabase-js v2 returns null data after insert — documented in research as a known pitfall
- **niche null guard deferred to caller:** submitAudit does not guard against null niche; the DB CHECK constraint is the final guard; Loading.tsx (Phase 5) is responsible for ensuring niche is set before calling

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None — TypeScript compilation passed on first attempt. No type errors in the column mapping. Build succeeded immediately.

Pre-existing npm engine warnings (Node v21 vs vitest requirement for v18/v20/v22) are out-of-scope and were present before this plan.

## User Setup Required

The user must create a local `.env` file from the `.env.example` template before running the app:

```
VITE_SUPABASE_URL=https://qyktrwpgfyvgdnexzcpr.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_aGBmVyDoU9Mbmlp939p1Ig_Hm9kvb0-
```

File location: `D:/Claude/BizAudit/.env` (local only, gitignored, never commit)

## Next Phase Readiness

- Supabase client SDK wired and TypeScript-typed — Phase 2 (AI edge function) can import `supabase` from `@/lib/supabase`
- submitAudit() ready for integration in Loading.tsx (Phase 5) — accepts completed form state and computed scores
- Both Plan 01 (DB schema) and Plan 02 (client code) complete — Phase 1 finished

---
*Phase: 01-schema-and-environment*
*Completed: 2026-02-19*

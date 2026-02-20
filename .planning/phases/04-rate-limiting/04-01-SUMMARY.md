---
phase: 04-rate-limiting
plan: 01
subsystem: api
tags: [upstash, redis, rate-limiting, edge-function, deno, supabase]

# Dependency graph
requires:
  - phase: 02-ai-report-edge-function
    provides: generate-report edge function that this plan adds rate limiting to

provides:
  - Dual-vector rate limiting guard (email 3/24h + IP 10/24h) on generate-report edge function using Upstash Redis fixedWindow
  - getClientIp() helper extracting first value from x-forwarded-for header
  - 429 response with rateLimited:true and friendly approximate time hint

affects:
  - 04-02 (rate limit deployment and testing)
  - 05-frontend-integration (wiring generate-report into Loading.tsx — rate limit auto-enforces on real traffic)

# Tech tracking
tech-stack:
  added:
    - npm:@upstash/ratelimit (Deno/Supabase Edge runtime compatible via npm: specifier)
    - npm:@upstash/redis (Deno/Supabase Edge runtime compatible via npm: specifier)
  patterns:
    - Rate limit clients instantiated inside Deno.serve handler (per_worker mode requirement, consistent with Anthropic/Supabase pattern from 02-01)
    - Parallel rate limit checks via Promise.all to avoid serial latency
    - Approximate time hint from result.reset timestamp (never expose raw timestamp to client)
    - Both checks return same error message — do not reveal which limit triggered

key-files:
  created: []
  modified:
    - supabase/functions/generate-report/index.ts

key-decisions:
  - "Rate limit guard runs before Anthropic and Supabase calls — rejects abuse before any expensive work"
  - "Email matching is case-sensitive (John@gmail.com and john@gmail.com are different identifiers)"
  - "Same 429 message for both email and IP limit hits — does not reveal which triggered"
  - "Redis and Ratelimit instances created inside handler per per_worker runtime requirement (established in 02-01)"
  - "fixedWindow chosen over sliding window — simpler, predictable reset time for user-facing time hint"

patterns-established:
  - "Rate limit guard pattern: extract identifiers, instantiate clients inside handler, parallel Promise.all, unified error message"
  - "Time hint mapping: <=1h -> 'in about 1 hour', <20h -> 'in about N hours', else 'tomorrow'"

requirements-completed: [SEC-01]

# Metrics
duration: 2min
completed: 2026-02-20
---

# Phase 4 Plan 01: Rate Limiting Summary

**Dual-vector rate limiting guard (email 3/24h + IP 10/24h) added to generate-report edge function using Upstash Redis fixedWindow, running before any Anthropic or Supabase calls**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-02-20T11:45:30Z
- **Completed:** 2026-02-20T11:46:53Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Added `npm:@upstash/ratelimit` and `npm:@upstash/redis` imports to generate-report edge function
- Implemented `getClientIp()` helper that extracts the first IP from `x-forwarded-for` header
- Added rate limit guard block that checks email (3/24h) and IP (10/24h) limits in parallel before any Anthropic API call or Supabase write
- 429 response includes `rateLimited: true` and a friendly time hint ("in about 1 hour", "in about N hours", "tomorrow") computed from the reset timestamp
- Email matching is case-sensitive; same message for both email and IP limit hits

## Task Commits

1. **Task 1: Add Upstash Redis rate limiting guard to generate-report edge function** - `731654c` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `supabase/functions/generate-report/index.ts` - Added Upstash imports, getClientIp() helper, and full rate limit guard block before Anthropic instantiation

## Decisions Made

- Email matching is case-sensitive per product decision in CONTEXT.md — email passed directly to `limit()` without normalization
- Same 429 message used for both email and IP limit hits to avoid revealing which vector triggered
- `fixedWindow` chosen for predictable reset time suitable for user-facing time hint
- Redis and Ratelimit instances created inside the Deno.serve handler to comply with per_worker runtime mode (same pattern as Anthropic/Supabase clients established in Phase 2)
- `failedResetMs` computed as `Math.max` of failed check resets so the hint reflects the longer of the two waits when both limits trigger simultaneously

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

**External services require manual configuration before rate limiting enforces on deployed function.** Two Upstash Redis environment variables must be added to the Supabase project secret store:

- `UPSTASH_REDIS_REST_URL` — REST URL from Upstash Redis console
- `UPSTASH_REDIS_REST_TOKEN` — REST token from Upstash Redis console

These will be addressed in Plan 02 (deployment and testing).

## Next Phase Readiness

- Rate limit guard code is complete and correct
- Enforcement requires: (a) Upstash Redis credentials deployed to Supabase secrets (04-02), and (b) generate-report wired into Loading.tsx submission flow (Phase 5)
- Build passes with no client-side regressions confirmed

---
*Phase: 04-rate-limiting*
*Completed: 2026-02-20*

## Self-Check: PASSED

- FOUND: supabase/functions/generate-report/index.ts
- FOUND: .planning/phases/04-rate-limiting/04-01-SUMMARY.md
- FOUND: commit 731654c (feat(04-01): add dual-vector rate limiting guard)

---
phase: 10-database-and-backend-extension
plan: 01
subsystem: database
tags: [postgres, supabase, migration, unicode, sanitization, i18n, deno]

# Dependency graph
requires:
  - phase: 06-language-infrastructure
    provides: useLang() hook with lang/prefix for URL-based language detection
  - phase: 08-sub-niche-specialization
    provides: subNiche field in AuditFormState and sub-niche configuration
provides:
  - language and sub_niche columns on audits table via migration
  - submitAudit accepts language parameter and persists both fields
  - fetch-report returns language and sub_niche to frontend
  - Unicode-aware sanitization preserving Cyrillic text for AI prompts
affects: [11-bulgarian-content, generate-report, fetch-report]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Unicode property escapes (\\p{L}, \\p{N}, \\p{Emoji_Presentation}) with /gu flag for multi-script sanitization"
    - "Nullable migration columns (no DEFAULT, no backfill) for backward compatibility with legacy rows"

key-files:
  created:
    - supabase/migrations/20260222120000_add_language_and_sub_niche.sql
  modified:
    - src/lib/submitAudit.ts
    - src/pages/Loading.tsx
    - src/lib/fetchReport.ts
    - supabase/functions/fetch-report/index.ts
    - supabase/functions/generate-report/index.ts

key-decisions:
  - "Both columns nullable with no DEFAULT — old rows untouched, no backfill needed"
  - "\\p{Emoji_Presentation} for emoji stripping — does not match ASCII digits or # which have emoji variants"
  - "\\p{L}\\p{N} replaces \\w — JavaScript \\w is ASCII-only even with /u flag"

patterns-established:
  - "Unicode-aware sanitization: use \\p{L}\\p{N} with /gu flag instead of \\w for multi-script text"
  - "Nullable schema extension: add columns without DEFAULT or NOT NULL for backward compatibility"

requirements-completed: [DB-01, DB-03]

# Metrics
duration: 2min
completed: 2026-02-22
---

# Phase 10 Plan 01: Database & Backend Extension Summary

**Nullable language/sub_niche columns on audits table, wired through submit and fetch paths, with Unicode-aware sanitization preserving Cyrillic for AI prompts**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-22T19:52:35Z
- **Completed:** 2026-02-22T19:54:53Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments
- Migration adds nullable language and sub_niche columns to audits table (no backfill, legacy-safe)
- submitAudit now accepts language parameter and persists both language and sub_niche to Supabase
- fetch-report edge function returns language and sub_niche, typed as string | null in FetchReportResult
- sanitizeText and sanitizeBusinessName use Unicode property escapes to preserve Cyrillic while stripping emoji

## Task Commits

Each task was committed atomically:

1. **Task 1: Create migration and wire submitAudit with language and sub_niche** - `2b473a5` (feat)
2. **Task 2: Update fetch-report edge function and FetchReportResult type** - `275dedf` (feat)
3. **Task 3: Fix sanitizeText and sanitizeBusinessName for Cyrillic and emoji** - `d4d1fb9` (fix)

## Files Created/Modified
- `supabase/migrations/20260222120000_add_language_and_sub_niche.sql` - Adds nullable language and sub_niche columns to audits table
- `src/lib/submitAudit.ts` - Accepts language parameter, includes language and sub_niche in insert payload
- `src/pages/Loading.tsx` - Extracts lang from useLang() and passes to submitAudit
- `src/lib/fetchReport.ts` - FetchReportResult type extended with nullable language and sub_niche fields
- `supabase/functions/fetch-report/index.ts` - SELECT query includes language and sub_niche columns
- `supabase/functions/generate-report/index.ts` - sanitizeText and sanitizeBusinessName use \p{L}\p{N} with /gu flag

## Decisions Made
- Both columns nullable with no DEFAULT — old audit rows remain untouched, no backfill migration needed
- Used \p{Emoji_Presentation} (not \p{Emoji}) for emoji stripping — avoids matching ASCII digits and # which have emoji variants but are primarily text
- Replaced \w with \p{L}\p{N} — JavaScript's \w remains ASCII-only even with /u flag, so explicit Unicode property escapes are required

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. The migration will be applied automatically on the next `supabase db push` or deployment.

## Next Phase Readiness
- language and sub_niche columns ready for Phase 11 Bulgarian content
- Cyrillic text flows through sanitization intact to AI prompts
- fetch-report returns language field for frontend to detect audit language on shareable URLs
- Phase 10 Plan 02 can proceed (no dependencies between plans in this wave)

## Self-Check: PASSED

All 6 files verified present. All 3 commit hashes verified in git log.

---
*Phase: 10-database-and-backend-extension*
*Completed: 2026-02-22*

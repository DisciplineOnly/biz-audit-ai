---
phase: 10-database-and-backend-extension
plan: 02
subsystem: email-notification
tags: [edge-function, email, i18n, sub-niche, deno]

# Dependency graph
requires:
  - phase: 10-database-and-backend-extension
    plan: 01
    provides: language and sub_niche columns on audits table
  - phase: 08-sub-niche-specialization
    provides: SUB_NICHE_LABELS registry pattern established in generate-report
provides:
  - Language and sub-niche display in admin notification email
  - Language-aware report URLs in both admin and user emails
  - Enriched email subject with sub-niche when available
affects: [send-notification]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Conditional email rows with null omission for legacy audit backward compatibility"
    - "Language-aware URL construction: /en/ prefix for English, no prefix for Bulgarian (default)"

key-files:
  created: []
  modified:
    - supabase/functions/send-notification/index.ts

key-decisions:
  - "Bulgarian default has no URL prefix (/report/:id), English uses /en/report/:id — matches app routing behavior"
  - "Duplicated SUB_NICHE_LABELS in send-notification (same as generate-report) — edge functions deploy independently"
  - "Fallback to raw key (record.language / record.sub_niche) when label not in map — future-proofs against new values"

patterns-established:
  - "Language-aware URL construction: langPrefix = record.language === 'en' ? '/en' : ''"
  - "Conditional email rows: compute display value, emit <tr> only if non-null"

requirements-completed: [DB-02]

# Metrics
duration: 2min
completed: 2026-02-22
---

# Phase 10 Plan 02: Send-Notification Language/Sub-niche Update Summary

**Admin email displays language name and sub-niche label for new audits, with language-aware report URLs in both admin and user emails**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-22T19:57:23Z
- **Completed:** 2026-02-22T19:59:13Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- AuditRecord interface extended with nullable language and sub_niche fields
- LANGUAGE_LABELS map (English, Bulgarian) and SUB_NICHE_LABELS map (17 sub-niches) added with sync comments
- Admin email Contact section shows conditional Language and Sub-niche rows (omitted for legacy audits)
- Both admin and user email report URLs use /en/ prefix for English audits, no prefix for Bulgarian
- Admin email subject line enriched with sub-niche when available (e.g., "Home Services / HVAC")
- All null cases handled gracefully — legacy audits render without language/sub-niche rows

## Task Commits

Each task was committed atomically:

1. **Task 1: Add language and sub-niche to AuditRecord type and label maps** - `0a7f918` (feat)
2. **Task 2: Update admin and user email templates with language/sub-niche display and language-aware URLs** - `fe6b678` (feat)

## Files Created/Modified
- `supabase/functions/send-notification/index.ts` - AuditRecord type extended, label maps added, admin email Contact section with conditional Language/Sub-niche rows, language-aware report URLs in both email templates, enriched subject line

## Decisions Made
- Bulgarian default has no URL prefix, English uses /en/ prefix — matches actual app routing (LangLayout redirects /bg/* to /*)
- Duplicated SUB_NICHE_LABELS map in send-notification to avoid deployment coupling with generate-report (established pattern from Phase 9)
- Fallback `?? record.language` / `?? record.sub_niche` in display logic future-proofs against new values not yet in label maps

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - the send-notification edge function will be deployed with the next `supabase functions deploy send-notification`. No new secrets or configuration required.

## Next Phase Readiness
- Phase 10 complete — both plans (01 and 02) finished
- language and sub_niche columns persisted, displayed in admin email, and reflected in report URLs
- Ready for Phase 11 (Bulgarian content) which will populate these fields with real data

## Self-Check: PASSED

All 1 modified file verified present. All 2 commit hashes verified in git log.

---
*Phase: 10-database-and-backend-extension*
*Completed: 2026-02-22*

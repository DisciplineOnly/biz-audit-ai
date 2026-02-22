# Phase 10: Database and Backend Extension - Context

**Gathered:** 2026-02-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Completed audits persist language and sub-niche as first-class data. The admin notification email includes both fields. Bulgarian free-text (Cyrillic) passes through sanitization intact to the AI prompt. No new user-facing features — this is backend plumbing that Phase 11 depends on.

</domain>

<decisions>
## Implementation Decisions

### Admin email format
- Placement: Claude's discretion — pick best position in existing email template
- Sub-niche display: Human-readable labels only (e.g., "HVAC" not "hvac")
- Language display: Full name (e.g., "English", "Bulgarian") — no flags, no codes
- Report link: Language-aware URL — `/bg/report/:id` for Bulgarian audits, `/report/:id` for English
- Legacy audits: Omit language/sub-niche lines entirely if data is null (don't show defaults)

### Sanitization scope
- Protection level: Claude's discretion — determine right security balance for AI prompt pipeline
- Per-field vs universal: Claude's discretion — pick based on field types and security needs
- Emoji: Strip emoji from free-text fields, but keep all natural-language scripts (Cyrillic, Latin, etc.)
- Logging: Silent — strip without logging

### Backward compatibility
- Old audit rows: Leave untouched — new columns are nullable, code handles nulls gracefully
- No backfill — don't set default values on existing rows
- Missing sub-niche on submission: Claude's discretion — decide based on form validation flow
- fetch-report edge function: Return both language and sub-niche to the frontend (needed for report page rendering)

### Data wiring
- Language source: Claude's discretion — pick most reliable source between i18next and URL param
- Storage approach: Claude's discretion — pick best database design (top-level columns vs JSONB)
- Edge function data: Claude's discretion — pick between request body and DB read based on existing patterns
- RLS policy: Keep INSERT-only for anon — no change to security model, continue using fetch-report for reads

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. User wants clean, minimal changes that wire the existing language/sub-niche data through to persistence and admin visibility.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 10-database-and-backend-extension*
*Context gathered: 2026-02-22*

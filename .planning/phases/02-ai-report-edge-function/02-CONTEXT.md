# Phase 2: AI Report Edge Function - Context

**Gathered:** 2026-02-19
**Status:** Ready for planning

<domain>
## Phase Boundary

A deployed Supabase edge function (`generate-report`) that accepts audit form data and scores, calls Claude Haiku 4.5, and returns personalized report text (executive summary, gaps, quick wins, strategic recommendations). Must be testable independently via HTTP (curl/Postman) before any frontend changes. The edge function does NOT store the report — it returns it to the caller. A `report_status` column on the audits table tracks whether AI generation succeeded or failed.

</domain>

<decisions>
## Implementation Decisions

### Prompt & tone
- Advisor tone — warm but honest. Encouraging with clear direction, not aggressive or hedging
- Never recommend third-party tools or vendors. The audit is a lead generation funnel — recommendations should identify problems and impact, steering the reader toward needing custom solutions (the consultation call)
- Light industry benchmark references — "Most successful teams in your space have automated this" style. No hard numbers or competitor names
- Each gap/recommendation includes an explicit CTA nudging the reader to book a consultation — not just at the bottom, but per item. AI generates the CTA text per item

### Response structure
- Score-driven item count: more gaps for lower scores (3-5), fewer for higher scores (1-2). Report length reflects how much work is needed
- AI generates the executive summary paragraph (personalized to their answers and scores), not just gaps/wins/recommendations
- Three sections of AI content: executive summary, gaps (critical issues), quick wins (30-day actions), strategic recommendations (90-day initiatives)
- Each item includes a priority field (high/medium/low) for frontend badging/sorting
- Each item includes an AI-generated CTA string personalized to the specific gap or recommendation

### Failure & fallback behavior
- Retry once on Claude API failure, then return error. Keeps loading screen under ~20 seconds
- On failure, the edge function returns an error status — it does NOT generate fallback content
- Frontend handles the failure UX: displays a graceful message like "Thank you for your time! We'll analyze your data and send you a detailed report by email" — hides the error, preserves the lead
- Audit data is already persisted in Supabase (Phase 1's submitAudit), so no data is lost on AI failure
- A `report_status` column on the audits table tracks state: 'pending', 'completed', 'failed'. This lets the owner query for failed audits and regenerate reports manually later
- The edge function updates this status column after the AI call resolves

### Input sanitization
- Business name: sanitized (strip special chars, limit length) but included in prompt for personalization
- Free-text fields (tech frustrations, biggest challenge): truncated to ~500 chars, HTML/special chars stripped, included in prompt as user context
- PII excluded: do NOT send email, phone, or contact name to the LLM. Only business name, niche, scores, and form answers
- No input validation in the edge function — trust the frontend's existing step validation and DB constraints as guards
- No prompt-level injection defense — sanitization is the protection layer

### Claude's Discretion
- Exact prompt structure and system message wording
- JSON schema field naming conventions
- Sanitization implementation details (regex vs library)
- Retry delay timing

</decisions>

<specifics>
## Specific Ideas

- The report should make the business owner feel like "this was written specifically about MY business" — not generic advice
- CTA examples per item: "Let us automate your follow-up sequence — book a call" or "We can build a custom scheduling system for your team"
- The "we'll email your report" failure message doubles as a lead capture safety net — the business owner still feels served even when AI fails

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-ai-report-edge-function*
*Context gathered: 2026-02-19*

# Phase 5: Frontend Integration - Context

**Gathered:** 2026-02-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Wire the React SPA to the Supabase backend so that: (1) Loading.tsx calls the generate-report edge function during the loading screen, (2) completed audits persist to Supabase via submitAudit, (3) Report.tsx fetches full report data from Supabase for shareable URLs, and (4) AI-generated content replaces template-generated content in the report sections. This phase also activates the Phase 4 rate limiting guard on real user traffic.

</domain>

<decisions>
## Implementation Decisions

### Loading screen timing
- Use a minimum wait (~8s) combined with real API response wait — redirect only when BOTH the minimum animation time AND the API response are complete
- Keep the current 8 decorative step labels cycling for visual engagement; real API work happens behind the scenes
- Fire submitAudit (DB insert) and generate-report (AI call) in parallel for faster overall completion

### Loading screen errors
- If generate-report fails (network error, 500, timeout), show an error message on the loading screen with a "Retry" button
- If the user gives up on retry, continue to the report page with template-generated content as fallback

### Shareable report loading
- When someone opens /report/:uuid in a fresh browser (no localStorage/state), fetch all report data from Supabase
- Show a skeleton of the report layout while fetching (placeholder bars where content will appear)
- Fetch form_data, scores, AND AI content from Supabase — render the complete report entirely from DB data (executive summary, scorecard, gaps, wins, recs)
- If the AI report hasn't finished generating yet, show a "Your report is being generated..." message and poll Supabase every few seconds until the AI report is available
- If the UUID doesn't exist, show a friendly branded 404 with a "Start a New Audit" CTA

### Rate limit handling
- Save audit to DB first (submitAudit), then call generate-report — if 429, the audit row exists but has no AI report
- On 429: block the user on the loading screen with a message like "You've submitted too many audits today. Please try again in X hours."
- Do NOT show a report link or template fallback on rate limit — just the block message with a try-again-later instruction
- The saved audit row is retained (preserves lead data) but no report is accessible to the user

### AI content format
- AI returns structured JSON (title, description, impact per item) that maps to the existing card/list components
- Report page renders AI content using the same visual components as the current template content — consistent look
- Competitor Benchmark section remains client-side score-driven logic (no AI involvement)

### Claude's Discretion
- Whether AI failure shows a silent fallback or subtle indicator (template vs AI-personalized)
- Whether the AI also generates the executive summary or keeps the current template-driven version (depends on what the edge function currently returns)
- Exact skeleton component design for report loading state
- Polling interval and timeout for "report generating" state
- Retry button styling and placement on loading screen errors

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-frontend-integration*
*Context gathered: 2026-02-20*

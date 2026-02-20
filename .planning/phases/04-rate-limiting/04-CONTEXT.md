# Phase 4: Rate Limiting - Context

**Gathered:** 2026-02-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Email-based and IP-based submission rate limiting enforced on the audit submission endpoint before frontend goes public. The endpoint rejects abuse with a friendly error. 3 submissions per email per 24 hours, 10 submissions per IP per 24 hours.

</domain>

<decisions>
## Implementation Decisions

### Blocked user experience
- Friendly limit notice with approximate timing: "You've already submitted 3 audits today. Try again in about X hours."
- Approximate timing only (e.g., "in about 8 hours", "try again tomorrow") — do not expose exact countdown or internal rate limit window details
- Error appears as a toast notification (dismissible snackbar), not inline on the form
- Rate limit check happens on submit only — no early check when email is entered

### Edge cases & exceptions
- All submissions count toward the limit, no correction/resubmission exceptions
- No admin bypass mechanism — test with different emails or disable via Supabase dashboard if needed
- Limits are hardcoded: 3 per email per 24h, 10 per IP per 24h — no config table or env var needed
- Email matching is case-sensitive — John@gmail.com and john@gmail.com are treated as different emails

### Multi-vector abuse
- Dual rate limiting: email-based (3/24h) AND IP-based (10/24h) as secondary defense
- IP limit is generous (10/24h) to accommodate shared networks (offices, co-working spaces)
- Same friendly error message for both email and IP limit hits — do not reveal which check triggered the rejection
- IP limit is also hardcoded, consistent with email limit approach

### Claude's Discretion
- Rate limit counter storage mechanism (separate table, column on audits, etc.)
- How to extract client IP in edge function context
- 24-hour window implementation (rolling vs fixed)
- Toast notification styling and positioning (follow existing app patterns)

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

*Phase: 04-rate-limiting*
*Context gathered: 2026-02-20*

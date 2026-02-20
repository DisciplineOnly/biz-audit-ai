# Phase 3: Email and Webhook - Context

**Gathered:** 2026-02-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Automated notification emails (admin + user) triggered when an audit's AI report completes. A send-notification edge function is invoked via Database Webhook when report_status changes to 'complete'. Uses Resend for delivery. Emails are fully decoupled from the core audit submission flow.

</domain>

<decisions>
## Implementation Decisions

### Email content & design
- Clean minimal HTML styling — simple typography, no heavy branding (Stripe/Linear transactional email style)
- **Admin email** includes full summary: contact name, email, phone, niche, overall score, all per-category scores, AI-generated top recommendations, and report link
- **User email** includes overall score, 1-2 key findings inline as a teaser, report link, and a prominent CTA button to book a consultation
- Prominent consultation booking CTA in user email — this is the conversion goal

### Sending identity
- Send from Resend's default subdomain (onboarding@resend.dev) — no custom DNS verification needed
- From name: "E&PSystems" for both admin and user emails
- No reply-to address — noreply behavior, users should not reply to automated emails

### Trigger timing
- Both admin and user emails sent AFTER AI report generation completes (not on INSERT)
- Database Webhook triggers on report_status UPDATE to 'complete' — decoupled from generate-report edge function
- Admin email destination stored as Supabase secret (ADMIN_EMAIL) — changeable without code deploy

### Failure behavior
- Email sending is best-effort: log errors and move on, no retries
- Email failures never block or affect the audit submission or report generation flow (fully decoupled)
- Single email_status column on audits table tracks delivery: 'pending', 'sent', 'failed', 'partial' (if one email succeeds and the other fails)

### Claude's Discretion
- Exact HTML email template structure and spacing
- Resend SDK configuration details
- Database Webhook configuration specifics
- Which specific findings/recommendations to include as "teaser" in user email

</decisions>

<specifics>
## Specific Ideas

- Admin email should give enough context to follow up with the lead without needing to click through to the report
- User email teaser should create curiosity to click through to the full report
- Consultation CTA should be a clear button, not just a text link

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-email-webhook*
*Context gathered: 2026-02-20*

# Phase 3: Email and Webhook - Research

**Researched:** 2026-02-20
**Domain:** Resend email API, Supabase Database Webhooks, HTML transactional email
**Confidence:** HIGH (core patterns verified via official Resend and Supabase docs)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Email content & design
- Clean minimal HTML styling — simple typography, no heavy branding (Stripe/Linear transactional email style)
- Admin email includes full summary: contact name, email, phone, niche, overall score, all per-category scores, AI-generated top recommendations, and report link
- User email includes overall score, 1-2 key findings inline as a teaser, report link, and a prominent CTA button to book a consultation
- Prominent consultation booking CTA in user email — this is the conversion goal

#### Sending identity
- Send from Resend's default subdomain (onboarding@resend.dev) — no custom DNS verification needed
- From name: "E&PSystems" for both admin and user emails
- No reply-to address — noreply behavior, users should not reply to automated emails

#### Trigger timing
- Both admin and user emails sent AFTER AI report generation completes (not on INSERT)
- Database Webhook triggers on report_status UPDATE to 'complete' — decoupled from generate-report edge function
- Admin email destination stored as Supabase secret (ADMIN_EMAIL) — changeable without code deploy

#### Failure behavior
- Email sending is best-effort: log errors and move on, no retries
- Email failures never block or affect the audit submission or report generation flow (fully decoupled)
- Single email_status column on audits table tracks delivery: 'pending', 'sent', 'failed', 'partial' (if one email succeeds and the other fails)

### Claude's Discretion
- Exact HTML email template structure and spacing
- Resend SDK configuration details
- Database Webhook configuration specifics
- Which specific findings/recommendations to include as "teaser" in user email

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| EMAIL-01 | Admin receives email notification when a new audit is completed, including contact name, email, niche, overall score, and report link | Resend fetch API pattern confirmed; webhook payload provides full `record` with all audits columns; admin email stored in Supabase secret ADMIN_EMAIL |
| EMAIL-02 | User receives email with a link to their completed report after AI generation finishes | Webhook payload provides `record.contact_email` for delivery address; CRITICAL BLOCKER: onboarding@resend.dev can only send to verified email addresses — see Critical Issue #1 below |
</phase_requirements>

---

## Summary

Phase 3 adds a `send-notification` Supabase edge function triggered by a Database Webhook when `report_status` is updated to the completion value. The function calls the Resend API via HTTP fetch (no npm SDK required) to send two emails: an admin summary and a user notification. The edge function pattern is identical to `generate-report` — `Deno.serve()`, env vars via `Deno.env.get()`, and Supabase admin client initialized inside the handler.

There are two blocking issues requiring planner decisions before implementation can proceed. First: a `report_status` value mismatch between the existing migration (`'completed'`) and the CONTEXT.md decision (`'complete'`). Second: Resend's `onboarding@resend.dev` sender address can only deliver to the account owner's own verified email address, not to arbitrary user-submitted addresses. Sending user emails (EMAIL-02) to real audit submitters requires either a verified custom domain or the planner must acknowledge that user emails will fail without domain verification.

**Primary recommendation:** Resolve both critical issues in the first plan task before writing any edge function code.

---

## Critical Issues (Planner Must Resolve)

### Critical Issue #1: report_status Value Mismatch

**What exists:** The migration `20260219120000_add_report_status_to_audits.sql` defines:
```sql
CHECK (report_status IN ('pending', 'completed', 'failed'))
```

The `generate-report` edge function sets `report_status = 'completed'` on success.

**What CONTEXT.md says:** "Database Webhook triggers on report_status UPDATE to 'complete'"

**The conflict:** `'complete'` is not a valid value in the current CHECK constraint. A webhook listening for `record.report_status = 'complete'` will never fire because `generate-report` writes `'completed'`.

**Resolution options for planner:**
- Option A: Add a new migration that updates the CHECK constraint to include `'complete'` and update `generate-report` to write `'complete'` instead of `'completed'`. This aligns code with CONTEXT intent but modifies Phase 2 artifacts.
- Option B: Configure the webhook trigger/filter to fire on `'completed'` (not `'complete'`). No migration needed, no Phase 2 changes. CONTEXT.md wording was imprecise — `'completed'` is the canonical value.

**Recommendation:** Option B. Treat `'completed'` as the correct value throughout. `'complete'` in CONTEXT.md was conversational shorthand. Do NOT modify Phase 2's working migration or edge function.

---

### Critical Issue #2: Resend onboarding@resend.dev Recipient Restriction

**What CONTEXT.md says:** "Send from Resend's default subdomain (onboarding@resend.dev) — NO custom DNS verification needed"

**What Resend actually allows (VERIFIED via GitHub issue #454):** When using `onboarding@resend.dev`, you can **only send to your own verified email address** (the email used to create the Resend account). Sending to arbitrary email addresses — including audit submitters — will fail with an error.

**Source:** https://github.com/resend/resend-node/issues/454 — confirmed by Resend contributor: "for development you can send emails from `onboarding@resend.dev` but to your own email only, if you try sending from `resend.dev` to other emails you'll get an error."

**Impact by email type:**
- Admin email (EMAIL-01): The admin's address is stored as `ADMIN_EMAIL` in Supabase secrets. If the Resend account owner's verified email equals the `ADMIN_EMAIL` value, this works. Otherwise fails.
- User email (EMAIL-02): Arbitrary `contact_email` from audit submitters — will fail for anyone who is not the Resend account owner's verified email.

**Resolution options for planner:**
- Option A (MVP): Verify a custom domain in Resend (DNS TXT/MX records). Unlocks sending to any address. Required for EMAIL-02 to work in production with real users. Free tier supports this.
- Option B (Testing only): Use `onboarding@resend.dev` for development/testing where both admin and test user emails are the Resend account owner's address. Document the custom domain requirement for production.
- Option C: Accept EMAIL-02 cannot deliver to arbitrary users with `onboarding@resend.dev`. Only admin email (EMAIL-01) is deliverable. This satisfies the "best-effort" constraint but EMAIL-02 will always fail in production.

**Recommendation:** The planner should flag this to the user. The CONTEXT decision to avoid DNS verification is incompatible with delivering user emails to arbitrary addresses. For v1 to work in production, a verified domain is required. For local/staging testing only, Option B is sufficient.

---

## Standard Stack

### Core
| Library/Tool | Version | Purpose | Why Standard |
|--------------|---------|---------|--------------|
| Resend REST API | v1 (fetch) | Send HTML emails | No npm SDK needed in Deno; native fetch is the official Supabase edge function pattern |
| Supabase Database Webhooks | Built-in (pg_net) | Trigger edge function on row UPDATE | Official Supabase mechanism; async, non-blocking |
| Supabase Admin Client | npm:@supabase/supabase-js@2 | Read audit data, update email_status | Same pattern as generate-report |

### Supporting
| Tool | Purpose | When to Use |
|------|---------|-------------|
| Supabase Secrets | Store RESEND_API_KEY, ADMIN_EMAIL | Always — never hardcode credentials |
| Supabase migrations | Add email_status column | Required to track send status |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| fetch to Resend API | npm:resend SDK | SDK adds dependency; official Supabase docs use fetch directly; both work |
| Database Webhook | Calling send-notification from generate-report | Webhook keeps email fully decoupled; if generate-report crashes after status update, emails still fire |

**Installation (no npm install needed):**
The edge function uses Deno's native `fetch()` to call Resend. No package installation required.

---

## Architecture Patterns

### Recommended Project Structure
```
supabase/
├── functions/
│   ├── _shared/
│   │   └── cors.ts              # already exists
│   └── send-notification/
│       └── index.ts             # new edge function
├── migrations/
│   ├── 20260219055745_create_audits_table.sql      # exists
│   ├── 20260219120000_add_report_status_to_audits.sql  # exists
│   └── YYYYMMDDHHMMSS_add_email_status_to_audits.sql  # new migration
```

### Pattern 1: Edge Function as Webhook Receiver

**What:** `send-notification` uses `Deno.serve()` to accept the webhook POST, extracts the record from the payload, sends two emails via fetch to Resend, then updates `email_status` on the audit row.

**When to use:** Whenever a Supabase Database Webhook calls an edge function — standard Supabase pattern.

```typescript
// Source: Supabase official docs + generate-report pattern
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL')!

Deno.serve(async (req: Request) => {
  try {
    // Webhook sends POST with JSON body
    const payload = await req.json()

    // Payload structure for UPDATE events:
    // { type: 'UPDATE', table: 'audits', schema: 'public',
    //   record: { id, contact_name, contact_email, ... report_status: 'completed' },
    //   old_record: { ... report_status: 'pending' } }

    const record = payload.record

    // Guard: only process if this is a completion event
    if (record.report_status !== 'completed') {
      return new Response('skipped', { status: 200 })
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Send emails (best-effort — log errors, don't throw)
    let adminSent = false
    let userSent = false

    try {
      await sendEmail({
        to: ADMIN_EMAIL,
        subject: `New Audit: ${record.contact_name} (${record.niche})`,
        html: buildAdminEmail(record),
      })
      adminSent = true
    } catch (err) {
      console.error('Admin email failed:', err)
    }

    try {
      await sendEmail({
        to: record.contact_email,
        subject: 'Your Business Audit Results Are Ready',
        html: buildUserEmail(record),
      })
      userSent = true
    } catch (err) {
      console.error('User email failed:', err)
    }

    // Update email_status
    const emailStatus = adminSent && userSent ? 'sent'
      : !adminSent && !userSent ? 'failed'
      : 'partial'

    await supabaseAdmin
      .from('audits')
      .update({ email_status: emailStatus })
      .eq('id', record.id)

    return new Response(JSON.stringify({ emailStatus }), { status: 200 })
  } catch (error) {
    console.error('send-notification error:', error)
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500 })
  }
})
```

### Pattern 2: Resend API Call via fetch

**What:** Direct HTTP POST to Resend API — the official pattern for Deno/edge environments.

**Source:** https://resend.com/docs/send-with-supabase-edge-functions (official Resend docs)

```typescript
// Source: https://resend.com/docs/send-with-supabase-edge-functions
async function sendEmail(params: { to: string; subject: string; html: string }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: 'E&PSystems <onboarding@resend.dev>',
      to: [params.to],
      subject: params.subject,
      html: params.html,
    }),
  })

  if (!res.ok) {
    const errorBody = await res.text()
    throw new Error(`Resend API error ${res.status}: ${errorBody}`)
  }

  return await res.json()
}
```

### Pattern 3: Database Webhook Configuration

**What:** Configure via Supabase Dashboard → Database → Webhooks. No SQL needed.

**Dashboard steps:**
1. Database → Webhooks → Create a new hook
2. Name: `on_report_completed`
3. Table: `audits`
4. Events: `UPDATE` only
5. Method: POST
6. URL: `https://<project-ref>.supabase.co/functions/v1/send-notification`
7. HTTP Headers: Add `Authorization: Bearer <service_role_key>`
8. (Optional) Timeout: 5000ms

**Important:** The webhook fires on ALL UPDATE events for the audits table. The edge function must check `record.report_status === 'completed'` internally and return 200 early if it's not a completion event.

**Local development URL:** `http://host.docker.internal:54321/functions/v1/send-notification`

### Pattern 4: Edge Function JWT Configuration

**What:** Database Webhooks send the service_role key as a Bearer token. The edge function must accept this.

**config.toml option** (not required if passing service_role key):
```toml
[functions.send-notification]
verify_jwt = false
```

**Preferred approach:** Pass `Authorization: Bearer <service_role_key>` header in the webhook configuration. The JWT verification passes because service_role is a valid JWT. No `verify_jwt = false` needed.

### Pattern 5: Migration for email_status Column

```sql
-- Source: based on existing audits migration pattern
ALTER TABLE public.audits
  ADD COLUMN email_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (email_status IN ('pending', 'sent', 'failed', 'partial'));
```

### Anti-Patterns to Avoid

- **Throwing on email failure:** Email errors must be caught and logged — never propagate to the webhook response. The webhook system may retry on 5xx responses.
- **Initializing Resend client outside handler:** Follow generate-report's pattern — initialize Supabase client inside `Deno.serve()` handler.
- **Assuming webhook only fires on 'completed' status:** The webhook fires on ALL audits table UPDATE events. Always guard with `if (record.report_status !== 'completed') return`.
- **Sending PII in error logs:** Log error messages only, not full record data. `contact_email` is PII.
- **Using npm:resend in Deno:** The npm SDK has TypeScript type issues in Deno. Use native fetch to the Resend REST API directly.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Email deliverability | SMTP server, custom mailer | Resend API | SPF/DKIM/DMARC complexity, bounce handling, spam scoring |
| Webhook triggering | pg_cron + polling | Supabase Database Webhooks | Native Supabase feature, async, non-blocking |
| HTML email rendering | React Email, MJML | Inline-style HTML tables (hand-written) | No build step needed in edge function; template is static |

**Key insight:** Email infrastructure (SPF, DKIM, bounce handling, unsubscribe management) is a solved problem. Resend handles all of it. The edge function only needs to build HTML strings and make one fetch call per email.

---

## Common Pitfalls

### Pitfall 1: Webhook Fires on Every UPDATE, Not Just Completion

**What goes wrong:** If you don't guard on `record.report_status === 'completed'`, the function fires when `generate-report` sets status to `'generating'`, when it updates to `'failed'`, and on any future status updates. This sends duplicate or incorrect emails.

**Why it happens:** Supabase Database Webhooks have no built-in column-value filtering — they trigger on any UPDATE to the specified table.

**How to avoid:** Always add an early return guard as the first operation after parsing the payload.

**Warning signs:** Receiving multiple admin emails per audit submission.

---

### Pitfall 2: Resend onboarding@resend.dev Recipient Restriction

**What goes wrong:** The `send-notification` function runs, calls Resend API, but API returns an error for the user's `contact_email` address. User never receives their email.

**Why it happens:** `onboarding@resend.dev` can only deliver to the Resend account owner's verified email address. Any other recipient triggers an API error.

**How to avoid:** Either verify a custom domain in Resend (required for production EMAIL-02 delivery), or during testing use the Resend account owner's email as both ADMIN_EMAIL and the test submitter's email.

**Warning signs:** Resend API returning 422 or 403 errors with messages about unverified recipients or sandbox restrictions.

---

### Pitfall 3: report_status 'complete' vs 'completed' Mismatch

**What goes wrong:** Webhook filter or edge function guard checks for `'complete'` but `generate-report` writes `'completed'`. Emails never send.

**Why it happens:** CONTEXT.md used `'complete'` as shorthand; the actual migration CHECK constraint and generate-report code use `'completed'`.

**How to avoid:** Use `'completed'` as the canonical completion value everywhere — in the edge function guard, in any webhook filter logic, and in documentation.

**Warning signs:** Webhook fires but email_status stays 'pending' because the guard early-returns.

---

### Pitfall 4: Webhook Retry Behavior on 5xx

**What goes wrong:** If the edge function returns a 5xx status, Supabase may retry the webhook. This can cause duplicate emails.

**Why it happens:** pg_net and webhook systems often retry failed requests.

**How to avoid:** Always return 200 from the webhook handler, even when email sending fails. Only return 5xx for catastrophic unrecoverable errors (like JSON parse failure). Log errors instead of propagating them.

**Warning signs:** Admin receives two emails for one audit.

---

### Pitfall 5: HTML Email Styling Stripped by Gmail/Outlook

**What goes wrong:** Email renders without styling because `<style>` block CSS is stripped.

**Why it happens:** Gmail strips `<head>` and `<style>` blocks. Outlook uses Word's rendering engine which ignores many CSS properties.

**How to avoid:** Use only inline `style=""` attributes on every element. No `<style>` block, no CSS classes. Use `table` layout, not flexbox or grid.

**Warning signs:** Email appears as unstyled text in Gmail preview.

---

## Code Examples

Verified patterns from official sources:

### Resend API Call (Official Supabase/Resend Pattern)
```typescript
// Source: https://resend.com/docs/send-with-supabase-edge-functions
const res = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
  },
  body: JSON.stringify({
    from: 'E&PSystems <onboarding@resend.dev>',
    to: ['recipient@example.com'],
    subject: 'Subject line',
    html: '<strong>Email body</strong>',
  }),
})

if (!res.ok) {
  throw new Error(`Resend ${res.status}: ${await res.text()}`)
}
```

### Webhook Payload Type (UPDATE Event)
```typescript
// Source: https://supabase.com/docs/guides/database/webhooks
interface WebhookPayload {
  type: 'UPDATE'
  table: string
  schema: string
  record: {
    id: string
    contact_name: string
    contact_email: string
    contact_phone: string | null
    niche: string
    overall_score: number
    scores: Record<string, unknown>
    form_data: Record<string, unknown>
    report_status: string
    email_status: string
    created_at: string
  }
  old_record: {
    report_status: string
    // ... other fields
  }
}
```

### Minimal HTML Email Structure (Inbox-Safe)
```html
<!-- Source: synthesized from transactional email best practices (Mailgun, Litmus) -->
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Email</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f5f5f5;">
    <tr>
      <td align="center" style="padding:40px 0;">
        <table width="600" cellpadding="0" cellspacing="0" border="0"
               style="max-width:600px;background-color:#ffffff;border-radius:8px;padding:40px;">
          <tr>
            <td style="font-size:24px;font-weight:600;color:#111;padding-bottom:24px;">
              Email heading
            </td>
          </tr>
          <tr>
            <td style="font-size:15px;color:#444;line-height:1.6;padding-bottom:24px;">
              Body paragraph
            </td>
          </tr>
          <!-- CTA Button (table-based for Outlook compatibility) -->
          <tr>
            <td style="padding-bottom:32px;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background-color:#1a56db;border-radius:6px;">
                    <a href="{{URL}}"
                       style="display:inline-block;padding:14px 28px;color:#ffffff;
                              text-decoration:none;font-size:15px;font-weight:600;">
                      View Your Report
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

### Supabase Secret Storage (User Setup Step)
```bash
# Store secrets — user must run these in Supabase Dashboard or CLI
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxx
supabase secrets set ADMIN_EMAIL=admin@example.com
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Send from generate-report after AI completes | Database Webhook triggers separate edge function | This project decision | Full decoupling — AI failure doesn't block emails; database state drives emails |
| npm:resend SDK import | Native fetch to Resend REST API | Current (Deno best practice) | No dependency, simpler, officially documented |
| `serve()` from std/http | `Deno.serve()` built-in | Deno 1.35+ | Simpler, no import needed, current standard |

**Deprecated/outdated:**
- `serve` from `https://deno.land/std@0.190.0/http/server.ts`: Older Resend docs show this; the project already uses `Deno.serve()` in `generate-report` — use that pattern.

---

## Open Questions

1. **Custom domain verification for EMAIL-02**
   - What we know: `onboarding@resend.dev` cannot deliver to arbitrary email addresses (confirmed via Resend GitHub)
   - What's unclear: Whether user is willing to verify a custom domain in Resend, and which domain
   - Recommendation: Planner must present this as a user decision before EMAIL-02 can work in production

2. **report_status 'completed' vs 'complete'**
   - What we know: Migration and code use `'completed'`; CONTEXT says `'complete'`
   - What's unclear: Whether to update the migration/code or just use `'completed'` everywhere
   - Recommendation: Use `'completed'` everywhere (Option B) — no migration changes needed to Phase 2

3. **AI recommendations in user email teaser (Claude's Discretion)**
   - What we know: User email should include "1-2 key findings as teaser"
   - What's unclear: The `form_data` JSONB column stores form answers, but AI-generated report content is NOT stored in the database. The `scores` JSONB stores numeric scores only.
   - Recommendation: Teaser must be derived from `scores` (show top 1-2 weakest category scores), NOT from AI report text which is never persisted to the DB. The planner should clarify this — or Phase 3 must add an `ai_report` JSONB column to the audits table (significant scope expansion).

---

## Sources

### Primary (HIGH confidence)
- https://resend.com/docs/send-with-supabase-edge-functions — Official Resend+Supabase guide; fetch pattern confirmed
- https://supabase.com/docs/guides/database/webhooks — Official Supabase webhook docs; payload format confirmed
- https://supabase.com/docs/guides/functions/examples/auth-send-email-hook-react-email-resend — `import { Resend } from 'npm:resend@4.0.0'` pattern (npm SDK alternative)
- https://supabase.com/docs/guides/functions/function-configuration — `verify_jwt = false` config option

### Secondary (MEDIUM confidence)
- https://github.com/resend/resend-node/issues/454 — Confirmed `onboarding@resend.dev` only sends to owner's verified email (Resend contributor statement)
- https://supabase.com/docs/guides/functions/auth — Edge function JWT verification options

### Tertiary (LOW confidence)
- WebSearch synthesis on HTML email best practices (table layout, inline styles, 600px width) — cross-validated with multiple sources

---

## Metadata

**Confidence breakdown:**
- Resend fetch API pattern: HIGH — verified via official Resend docs and Supabase example
- onboarding@resend.dev restriction: HIGH — confirmed by Resend contributor on GitHub
- Webhook payload format: HIGH — documented in official Supabase docs with TypeScript types
- Webhook Authorization setup: MEDIUM — described in search results and community discussions; exact dashboard UI steps not deeply verified
- HTML email patterns: MEDIUM — synthesized from multiple sources, standard practice
- "AI teaser from scores not DB" finding: HIGH — code inspection shows no ai_report column in migrations

**Research date:** 2026-02-20
**Valid until:** 2026-03-22 (stable Resend API; Supabase webhook format is stable)

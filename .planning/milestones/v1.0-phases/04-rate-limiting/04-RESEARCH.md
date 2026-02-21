# Phase 4: Rate Limiting - Research

**Researched:** 2026-02-20
**Domain:** Supabase Edge Function rate limiting (email + IP, dual-vector)
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Blocked user experience:**
- Friendly limit notice with approximate timing: "You've already submitted 3 audits today. Try again in about X hours."
- Approximate timing only (e.g., "in about 8 hours", "try again tomorrow") — do not expose exact countdown or internal rate limit window details
- Error appears as a toast notification (dismissible snackbar), not inline on the form
- Rate limit check happens on submit only — no early check when email is entered

**Edge cases & exceptions:**
- All submissions count toward the limit, no correction/resubmission exceptions
- No admin bypass mechanism — test with different emails or disable via Supabase dashboard if needed
- Limits are hardcoded: 3 per email per 24h, 10 per IP per 24h — no config table or env var needed
- Email matching is case-sensitive — John@gmail.com and john@gmail.com are treated as different emails

**Multi-vector abuse:**
- Dual rate limiting: email-based (3/24h) AND IP-based (10/24h) as secondary defense
- IP limit is generous (10/24h) to accommodate shared networks (offices, co-working spaces)
- Same friendly error message for both email and IP limit hits — do not reveal which check triggered the rejection
- IP limit is also hardcoded, consistent with email limit approach

### Claude's Discretion
- Rate limit counter storage mechanism (separate table, column on audits, etc.)
- How to extract client IP in edge function context
- 24-hour window implementation (rolling vs fixed)
- Toast notification styling and positioning (follow existing app patterns)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SEC-01 | Rate limiting enforced on audit submissions (max 3 per email address per 24 hours) | Upstash Redis + @upstash/ratelimit with fixedWindow("24 h") covers email-based limiting; IP-based limiting uses same library with separate identifier prefix; both checks run in generate-report edge function before any processing |
</phase_requirements>

---

## Summary

Rate limiting for BizAudit needs to be enforced server-side in the `generate-report` Supabase Edge Function (the primary submission endpoint). The function already receives the user's email (via `formState.step1.email`) and can extract the client IP from the `x-forwarded-for` header set by Supabase's infrastructure. Two separate checks must run: email-based (3/24h) and IP-based (10/24h), both returning the same 429 response with a friendly message.

The recommended storage mechanism is **Upstash Redis with `@upstash/ratelimit`**. Supabase's own documentation recommends this approach for edge function rate limiting. The alternative — querying the existing `audits` Postgres table for recent submission counts — is possible and zero-dependency but has race condition risks, requires service-role reads in the guard path, and couples submission counting to the business data table. Redis gives atomic increment semantics, automatic TTL-based expiry, and a battle-tested abstraction.

For the client (React) side, the app already mounts both `<Toaster />` (radix-based) and `<Sonner />` (sonner-based) in `App.tsx`. The project uses `sonner` for toasts going forward (shadcn's current recommendation). The 429 error from the edge function must propagate through `submitAudit` → `Loading.tsx` and display as an error state. The user needs a path back to retry (e.g., redirect to audit form with message).

**Primary recommendation:** Use `npm:@upstash/ratelimit` + `npm:@upstash/redis` in the `generate-report` edge function. Add email check with `email:${contact_email}` prefix and IP check with `ip:${clientIp}` prefix. Both use `fixedWindow(limit, "24 h")`. Return 429 with `{ rateLimited: true, message: "..." }` when either check fails. Handle the 429 in `Loading.tsx` and show an error with approximate timing hint.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @upstash/ratelimit | 2.0.8 (latest) | Rate limiting algorithms (fixed/sliding window, token bucket) with Redis backend | Supabase's own docs recommend this; built for serverless/edge HTTP environments; atomic Redis operations prevent race conditions |
| @upstash/redis | latest | HTTP-based Redis client for Deno/edge runtimes | Works in Deno via npm: imports; no TCP connection needed; designed for serverless |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| sonner | already installed | Toast notification display | Already in App.tsx as `<Sonner />`; use `toast.error()` from `sonner` package for rate limit error |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Upstash Redis | Query `audits` table directly via service-role | Zero external dependency, uses existing Postgres — but has race condition between count-check and INSERT, no atomic increment, and couples rate limit state to business data; viable only if external service is unacceptable |
| Upstash Redis | Cloudflare rate limiting | Only available if project is behind Cloudflare proxy; not currently in use |
| fixedWindow | slidingWindow | Sliding window smoother at boundaries but significantly more expensive in Redis operations; for 24h limit with low traffic, fixed window is correct choice |

**Installation (add to Supabase secrets, not npm):**
```bash
# Upstash is imported via npm: specifier in edge function — no npm install needed
# Secrets to add in Supabase Dashboard → Project Settings → Edge Functions → Secrets:
UPSTASH_REDIS_REST_URL=<from Upstash console>
UPSTASH_REDIS_REST_TOKEN=<from Upstash console>
```

---

## Architecture Patterns

### Where Rate Limiting Lives

Rate limiting runs at the **start** of the `generate-report` edge function handler, before any Anthropic or Supabase calls. The check must happen before expensive work.

```
Client (Loading.tsx)
  ↓  calls submitAudit() → Supabase INSERT to audits table
  ↓  calls generate-report edge function
       ↓  [RATE LIMIT CHECK — email + IP]
       ↓  if allowed → call Anthropic, upsert audit_reports, update report_status
       ↓  if blocked → return 429 { rateLimited: true, message: "..." }
Client receives 429
  ↓  Loading.tsx catches error from generate-report invocation
  ↓  shows error message (toast or inline error on loading screen)
```

**Note:** `submitAudit()` (the Postgres INSERT) currently runs before generate-report. Rate limit check in generate-report does NOT prevent the audit row from being inserted. This is acceptable — the INSERT is lightweight and the audit data is already collected. If rate limiting must also block the INSERT, rate limiting must move earlier (to a dedicated pre-check endpoint or the client must check before calling submitAudit). Given the CONTEXT.md decision that "all submissions count toward the limit, no correction/resubmission exceptions," the simpler approach is: rate limit check in generate-report, and the INSERT can proceed regardless (the audit row exists but no AI report is generated).

**Alternative architecture (stricter):** Add a new dedicated `check-rate-limit` edge function invoked before `submitAudit()` in Loading.tsx. This prevents even the DB row from being written for blocked requests. This is cleaner but adds complexity. Either approach is valid; the generate-report-only approach is simpler.

### Pattern 1: Dual-Key Rate Limiting in Edge Function

**What:** Two separate rate limiter instances with different limits, keyed on different identifiers.
**When to use:** Any time you need multi-vector limiting (email AND IP independently).

```typescript
// Source: https://supabase.com/docs/guides/functions/examples/rate-limiting
//         https://github.com/upstash/ratelimit-js

import { Ratelimit } from 'npm:@upstash/ratelimit'
import { Redis } from 'npm:@upstash/redis'

// Initialize once (outside handler in per_worker mode, OR inside handler)
// Note: This project uses per_worker mode — instantiate inside handler (see STATE.md decision)
const redis = new Redis({
  url: Deno.env.get('UPSTASH_REDIS_REST_URL')!,
  token: Deno.env.get('UPSTASH_REDIS_REST_TOKEN')!,
})

// Email limiter: 3 per 24h
const emailRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.fixedWindow(3, '24 h'),
  prefix: 'bizaudit:email',
})

// IP limiter: 10 per 24h
const ipRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.fixedWindow(10, '24 h'),
  prefix: 'bizaudit:ip',
})

// In handler:
const emailResult = await emailRatelimit.limit(contactEmail)
const ipResult = await ipRatelimit.limit(clientIp)

if (!emailResult.success || !ipResult.success) {
  // Calculate approximate hours remaining
  // result.reset is a Unix timestamp (milliseconds) when the window resets
  const resetMs = Math.max(emailResult.reset, ipResult.reset)
  const hoursRemaining = Math.ceil((resetMs - Date.now()) / (1000 * 60 * 60))
  const timeHint = hoursRemaining <= 1
    ? 'in about 1 hour'
    : hoursRemaining < 20
    ? `in about ${hoursRemaining} hours`
    : 'tomorrow'

  return new Response(
    JSON.stringify({
      rateLimited: true,
      message: `You've already submitted 3 audits today. Try again ${timeHint}.`,
    }),
    { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}
```

### Pattern 2: IP Extraction from X-Forwarded-For

**What:** Extract client IP from the `x-forwarded-for` header set by Supabase's infrastructure.
**When to use:** IP-based rate limiting in any Supabase edge function.

```typescript
// Source: https://github.com/orgs/supabase/discussions/7884
function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (!forwarded) return 'unknown'
  // First value is the original client IP (leftmost in proxy chain)
  return forwarded.split(/\s*,\s*/)[0].trim()
}

// Usage:
const clientIp = getClientIp(req)
// Use 'unknown' as fallback — Ratelimit.limit('unknown') will apply a shared bucket
// which is acceptable; shared-IP scenarios hit the same bucket
```

**X-Forwarded-For spoofing risk:** Supabase's API gateway populates this header from the actual client connection, not from user-supplied headers. Based on the GitHub discussion (#7884), Supabase infrastructure sets this header. However, this is MEDIUM confidence — not verified by official security documentation. For a 10/24h IP limit, the spoofing risk is low-impact (attacker gains 10 more submissions per fake IP, not access to data). Accept this risk.

### Pattern 3: Sonner Toast for Rate Limit Error

**What:** Show dismissible error toast when generate-report returns 429.
**When to use:** The loading screen detects rate-limited response.

```typescript
// The app already has <Sonner /> mounted in App.tsx
// Import from the project's sonner wrapper:
import { toast } from '@/components/ui/sonner'

// On 429 detection:
toast.error("Submission limit reached", {
  description: "You've already submitted 3 audits today. Try again in about 8 hours.",
  duration: 8000,  // 8 seconds — long enough to read
})
```

**Note:** Loading.tsx currently uses inline `setError()` not toast. The CONTEXT.md decision says "error appears as a toast notification." Loading.tsx needs to be updated to call `toast.error()` instead of (or in addition to) `setError()` for the rate limit case specifically.

### Anti-Patterns to Avoid

- **Counting audits table rows for rate limiting:** Race condition between SELECT COUNT and INSERT; two concurrent requests can both pass the check before either commits; not atomic.
- **Storing rate limit state in audits columns:** Couples rate limiting to business data; complicates cleanup; doesn't handle the email-already-in-table-but-within-limit case.
- **Checking rate limit client-side only:** Bypassable by anyone with browser DevTools; security must be server-side.
- **Exposing exact reset timestamp in error message:** CONTEXT.md explicitly requires approximate timing only — never expose `result.reset` raw timestamp.
- **Instantiating Ratelimit/Redis outside Deno.serve handler in per_worker mode:** STATE.md records this as a gotcha from Phase 2 — clients must be instantiated inside the handler.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Atomic counter increment with TTL | Postgres-backed rate_limit table with manual count + cleanup cron | @upstash/ratelimit + Redis | Race conditions in Postgres without advisory locks; Redis INCR is atomic by design; automatic TTL handles cleanup |
| Rolling window calculation | Manual timestamp comparison: `SELECT COUNT(*) WHERE created_at > NOW() - INTERVAL '24h'` | fixedWindow algorithm in @upstash/ratelimit | Not atomic; race window between check and increment; requires index on created_at; cleanup overhead |
| Approximate time hint | Complex duration calculation | `Math.ceil((result.reset - Date.now()) / 3600000)` | result.reset gives exact window boundary; simple math gives hours; round up to avoid "0 hours" edge case |

**Key insight:** Redis INCR with EXPIRE is the textbook atomic rate limiting primitive. @upstash/ratelimit wraps this correctly. The "count rows in Postgres" approach seems simple but has a TOCTOU (time-of-check to time-of-use) race that allows bursts under concurrent load.

---

## Common Pitfalls

### Pitfall 1: Ratelimit Instances Instantiated Outside Handler (per_worker mode)
**What goes wrong:** `Ratelimit` and `Redis` objects initialized at module scope throw errors or use stale environment variables in per_worker edge runtime.
**Why it happens:** Per_worker mode runs one worker per vCPU; module-scope initialization happens once per worker start, before env vars may be available.
**How to avoid:** Instantiate `Redis` and `Ratelimit` inside `Deno.serve(async (req) => { ... })`. Confirmed pattern from Phase 2 decision in STATE.md.
**Warning signs:** `Deno.env.get()` returns undefined at startup; cryptic Redis connection errors.

### Pitfall 2: X-Forwarded-For Returns Multiple IPs or 'unknown'
**What goes wrong:** IP bucket becomes effectively shared when IP is 'unknown', or first IP in list is a Supabase internal proxy address.
**Why it happens:** Not all requests have X-Forwarded-For; proxy chains can have multiple hops.
**How to avoid:** Always split on comma and take index [0]. Fall back to 'unknown' string — this means all unknown-IP requests share one bucket (conservative: they'd hit 10/24h shared limit, which is acceptable). Do not skip IP check on 'unknown' — that would allow bypass.
**Warning signs:** All requests appear to come from same IP in logs; test with curl to verify header is present.

### Pitfall 3: Rate Limit Check Doesn't Block DB Row Creation
**What goes wrong:** Audit row is inserted to Postgres before generate-report is called; if rate limit fires in generate-report, the DB row exists with no AI report.
**Why it happens:** Loading.tsx calls `submitAudit()` then calls `generate-report`; rate limit only guards generate-report.
**How to avoid:** This is an accepted architectural tradeoff (see CONTEXT.md: "all submissions count"). The orphaned audit row does no harm — it has no report but admin is not notified (webhook only fires on `report_status = 'completed'`). Document and accept. If stricter enforcement needed, add pre-check endpoint.
**Warning signs:** Audit rows in DB with `report_status = 'pending'` and no corresponding `audit_reports` entry.

### Pitfall 4: fixedWindow Resets at Fixed UTC Boundary, Not 24h From First Request
**What goes wrong:** User submits at 11pm, window resets at midnight (1 hour later), not 24 hours later. User can submit again after 1 hour.
**Why it happens:** fixedWindow aligns to clock boundaries (e.g., midnight UTC), not rolling from first request.
**How to avoid:** This is documented behavior and acceptable per CONTEXT.md (approximate timing, not exact). The message "try again tomorrow" or "in about N hours" is accurate enough. If strict rolling window required, use `slidingWindow` instead (more expensive).
**Warning signs:** Users hitting limit at 11:59pm can resubmit at 12:01am; this is expected with fixedWindow.

### Pitfall 5: 429 Response Not Caught Properly in Loading.tsx
**What goes wrong:** generate-report 429 is logged as console error but user sees generic "Failed to save audit" message instead of rate limit message.
**Why it happens:** Loading.tsx's current error handling is generic; it doesn't check HTTP status codes from edge function.
**How to avoid:** Add specific 429 detection in Loading.tsx when invoking generate-report. Check `response.status === 429` and read `json.message` to display the friendly message.
**Warning signs:** Rate limit errors showing generic error text; missing toast notification.

### Pitfall 6: Upstash Free Tier Command Exhaustion
**What goes wrong:** Rate limit checks stop working after 500K Redis commands/month.
**Why it happens:** Each `ratelimit.limit()` call uses ~2-3 Redis commands. At 500K/month = ~16K/day. For dual check (email + IP) = ~8K rate-limit events per day before exhaustion.
**How to avoid:** For a low-traffic pre-launch site, free tier is adequate. Monitor in Upstash dashboard. Free tier includes 500K commands/month (verified March 2025 pricing update).
**Warning signs:** Redis errors in edge function logs; rate limit appears to stop enforcing.

---

## Code Examples

Verified patterns from official sources:

### Complete Rate Limit Guard Block for generate-report

```typescript
// Source: https://supabase.com/docs/guides/functions/examples/rate-limiting
//         https://github.com/upstash/ratelimit-js
//         https://github.com/orgs/supabase/discussions/7884

import { Ratelimit } from 'npm:@upstash/ratelimit'
import { Redis } from 'npm:@upstash/redis'

function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (!forwarded) return 'unknown'
  return forwarded.split(/\s*,\s*/)[0].trim()
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const contactEmail: string = body.formState?.step1?.email ?? 'unknown'
    const clientIp = getClientIp(req)

    // Instantiate inside handler (per_worker mode requirement — see STATE.md)
    const redis = new Redis({
      url: Deno.env.get('UPSTASH_REDIS_REST_URL')!,
      token: Deno.env.get('UPSTASH_REDIS_REST_TOKEN')!,
    })

    const emailRatelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.fixedWindow(3, '24 h'),
      prefix: 'bizaudit:email',
    })

    const ipRatelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.fixedWindow(10, '24 h'),
      prefix: 'bizaudit:ip',
    })

    // Run both checks (email case-sensitive per CONTEXT.md decision)
    const [emailResult, ipResult] = await Promise.all([
      emailRatelimit.limit(contactEmail),
      ipRatelimit.limit(clientIp),
    ])

    if (!emailResult.success || !ipResult.success) {
      // result.reset is Unix timestamp in milliseconds when window resets
      const resetMs = Math.max(
        emailResult.success ? 0 : emailResult.reset,
        ipResult.success ? 0 : ipResult.reset
      )
      const hoursRemaining = Math.ceil((resetMs - Date.now()) / (1000 * 60 * 60))
      const timeHint =
        hoursRemaining <= 1 ? 'in about 1 hour'
        : hoursRemaining < 20 ? `in about ${hoursRemaining} hours`
        : 'tomorrow'

      return new Response(
        JSON.stringify({
          rateLimited: true,
          // Same message for both email and IP — CONTEXT.md: don't reveal which check triggered
          message: `You've already submitted 3 audits today. Try again ${timeHint}.`,
        }),
        {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // ... rest of existing generate-report logic
  } catch (error) {
    // ... existing error handling
  }
})
```

### Loading.tsx Rate Limit Error Handling

```typescript
// In Loading.tsx, after generate-report invocation:
// Using sonner toast (already mounted as <Sonner /> in App.tsx)
import { toast } from '@/components/ui/sonner'

// When generate-report returns 429:
const response = await fetch(`${supabaseUrl}/functions/v1/generate-report`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${anonKey}` },
  body: JSON.stringify({ auditId, formState, scores }),
})

if (response.status === 429) {
  const data = await response.json()
  toast.error('Submission limit reached', {
    description: data.message ?? "You've already submitted 3 audits today.",
    duration: 8000,
  })
  // Navigate back to allow retry with different email or wait
  setTimeout(() => navigate('/audit?resume=true'), 3000)
  return
}
```

### Supabase Secret Setup (CLI)

```bash
# Add Upstash credentials as Supabase project secrets
supabase secrets set UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
supabase secrets set UPSTASH_REDIS_REST_TOKEN=your-token-here

# Or via Supabase dashboard: Project Settings → Edge Functions → Secrets
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| deno.land/x/upstash_redis import URL | `npm:@upstash/redis` via npm: specifier | 2023-2024 | Cleaner import, no version pinning in URL required |
| useToast (radix-based) | sonner via shadcn/ui sonner component | 2024 | Project already has both; CONTEXT.md says use toast pattern (sonner is current recommendation) |
| Manual Postgres rate_limit table | @upstash/ratelimit + Redis | Established pattern | Atomic, auto-expiry, no cleanup cron needed |

**Deprecated/outdated:**
- `https://cdn.skypack.dev/@upstash/ratelimit@0.4.4` import: Supabase's own example code uses this old format. Use `npm:@upstash/ratelimit` instead (same as generate-report and send-notification use `npm:@supabase/supabase-js@2`).
- `useToast` hook pattern: shadcn/ui now recommends sonner. The project already has sonner installed and `<Sonner />` mounted in App.tsx.

---

## Open Questions

1. **Where exactly does generate-report get invoked from Loading.tsx?**
   - What we know: Loading.tsx calls `submitAudit()` (Postgres INSERT) but the generate-report edge function call is not visible in Loading.tsx. Phase 2 built the edge function but Loading.tsx only shows submitAudit().
   - What's unclear: The generate-report invocation may be missing from Loading.tsx (possibly planned for Phase 5), or may use `supabase.functions.invoke()` that wasn't visible in grep results.
   - Recommendation: Planner must verify whether generate-report is currently invoked from Loading.tsx and if not, whether Phase 4 needs to add that invocation alongside the rate limiting. This affects what files get modified.

2. **X-Forwarded-For trust in Supabase infrastructure**
   - What we know: Supabase updated their infrastructure to populate X-Forwarded-For with client IP (confirmed in GitHub discussion #7884). First value is client IP.
   - What's unclear: Whether Supabase's gateway strips/overwrites any user-supplied X-Forwarded-For header before passing to edge function (spoofing prevention).
   - Recommendation: Use X-Forwarded-For for IP rate limiting at the stated limits (10/24h). Even if spoofable, impact is minimal (10 extra submissions per fake IP, not data access). Accept the risk. Note in code comments.

3. **Upstash Redis database creation required before deployment**
   - What we know: UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set as Supabase secrets before the edge function will work.
   - What's unclear: Whether the user has an Upstash account / whether this is a blocking manual step.
   - Recommendation: Planner must include a human checkpoint for Upstash account creation and secret configuration in the plan.

---

## Sources

### Primary (HIGH confidence)
- https://supabase.com/docs/guides/functions/examples/rate-limiting — Official Supabase rate limiting guide (Upstash Redis recommended approach)
- https://github.com/upstash/ratelimit-js — Official @upstash/ratelimit library (verified fixedWindow syntax, result.reset property)
- https://github.com/orgs/supabase/discussions/7884 — X-Forwarded-For header in Supabase edge functions (first IP = client IP)
- `D:\Claude\BizAudit\supabase\functions\generate-report\index.ts` — Existing edge function (per_worker pattern, handler instantiation)
- `D:\Claude\BizAudit\src\App.tsx` — Confirms `<Sonner />` already mounted; sonner available
- `D:\Claude\BizAudit\src\components\ui\sonner.tsx` — Project's sonner wrapper; exports `toast`

### Secondary (MEDIUM confidence)
- https://upstash.com/docs/redis/sdks/ratelimit-ts/algorithms — fixedWindow vs slidingWindow tradeoffs
- https://upstash.com/pricing/redis — Free tier: 500K commands/month, 256MB, up to 10 databases free
- https://upstash.com/docs/redis/sdks/ratelimit-ts/gettingstarted — result.reset is Unix timestamp in ms; result.success boolean

### Tertiary (LOW confidence)
- X-Forwarded-For spoofing risk for Supabase specifically — general security knowledge, not Supabase-specific official doc

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Supabase official docs recommend Upstash; @upstash/ratelimit is the standard library
- Architecture: HIGH — Pattern matches existing edge function structure; per_worker instantiation confirmed from STATE.md
- Pitfalls: MEDIUM — fixedWindow behavior and per_worker rule verified; X-Forwarded-For spoofing risk is general knowledge applied to Supabase context
- Toast/client: HIGH — sonner already installed and mounted in App.tsx; import path verified in source

**Research date:** 2026-02-20
**Valid until:** 2026-03-22 (30 days — Upstash API stable; Supabase edge function patterns stable)

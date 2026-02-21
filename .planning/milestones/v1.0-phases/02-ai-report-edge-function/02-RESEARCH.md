# Phase 2: AI Report Edge Function - Research

**Researched:** 2026-02-19
**Domain:** Supabase Edge Functions (Deno), Anthropic Claude API, prompt engineering, JSON sanitization
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Prompt & tone**
- Advisor tone — warm but honest. Encouraging with clear direction, not aggressive or hedging
- Never recommend third-party tools or vendors. The audit is a lead generation funnel — recommendations should identify problems and impact, steering the reader toward needing custom solutions (the consultation call)
- Light industry benchmark references — "Most successful teams in your space have automated this" style. No hard numbers or competitor names
- Each gap/recommendation includes an explicit CTA nudging the reader to book a consultation — not just at the bottom, but per item. AI generates the CTA text per item

**Response structure**
- Score-driven item count: more gaps for lower scores (3-5), fewer for higher scores (1-2). Report length reflects how much work is needed
- AI generates the executive summary paragraph (personalized to their answers and scores), not just gaps/wins/recommendations
- Three sections of AI content: executive summary, gaps (critical issues), quick wins (30-day actions), strategic recommendations (90-day initiatives)
- Each item includes a priority field (high/medium/low) for frontend badging/sorting
- Each item includes an AI-generated CTA string personalized to the specific gap or recommendation

**Failure & fallback behavior**
- Retry once on Claude API failure, then return error. Keeps loading screen under ~20 seconds
- On failure, the edge function returns an error status — it does NOT generate fallback content
- Frontend handles the failure UX: displays a graceful message like "Thank you for your time! We'll analyze your data and send you a detailed report by email" — hides the error, preserves the lead
- Audit data is already persisted in Supabase (Phase 1's submitAudit), so no data is lost on AI failure
- A `report_status` column on the audits table tracks state: 'pending', 'completed', 'failed'. This lets the owner query for failed audits and regenerate reports manually later
- The edge function updates this status column after the AI call resolves

**Input sanitization**
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

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AI-01 | Edge function calls Claude Haiku 4.5 to generate personalized report text based on form answers | Anthropic SDK `npm:@anthropic-ai/sdk` supports Deno; model ID `claude-haiku-4-5-20251001`; `client.messages.create()` pattern verified |
| AI-02 | AI prompt includes niche context (home services vs real estate) for industry-specific framing | Niche value lives on `AuditFormState.niche` — pass as `home_services` or `real_estate` in system/user message; category labels differ by niche (e.g., "Scheduling & Dispatch" vs "Lead Management") |
| AI-03 | AI prompt includes actual category scores (0-100) so recommendations reference specific weak areas | `AuditScores.categories` array has `{category, label, score, weight}` for all 7 categories; sort by score ascending to highlight weakest; score thresholds map to item count |
| AI-04 | Generated report text replaces template-based content while keeping the existing report structure (gaps, quick wins, strategic recommendations) | Existing `AuditReport` interface in `src/types/audit.ts` defines the target shape; AI output must map to `criticalGaps`, `quickWins`, `strategicRecs`; edge function adds `priority` and `cta` fields per item |
| SEC-04 | User-provided free-text fields sanitized before inclusion in LLM prompts to prevent prompt injection | `step2.techFrustrations` and `step8.biggestChallenge` are the two free-text fields; `step1.businessName` sanitized but included; regex-based strip + truncate is sufficient per locked decisions |
</phase_requirements>

---

## Summary

This phase builds a Supabase Edge Function written in Deno TypeScript that accepts the serialized `AuditFormState` and `AuditScores` objects, calls the Anthropic Claude Haiku 4.5 API, and returns a structured JSON report. The function also updates a `report_status` column on the `audits` table (requiring a database migration to add that column).

The primary technical challenge is prompt design: the AI must produce a consistently structured JSON response that matches the existing `AuditReport` type shape, while generating genuinely personalized content. The function must handle the full lifecycle — sanitize inputs, build the prompt, call Claude, parse and validate the JSON response, update the database status column, and return the report.

The security boundary is clear: the Anthropic API key is stored in Supabase project secrets and accessed via `Deno.env.get('ANTHROPIC_API_KEY')` — it never appears in the client bundle. The function requires JWT auth (`verify_jwt: true`) since it is called from the browser with the user's anon key, and the SUPABASE_SERVICE_ROLE_KEY (available by default in all edge functions) is used to update the `report_status` column, bypassing the anon RLS restriction on UPDATE operations.

**Primary recommendation:** Deploy via MCP `deploy_edge_function` with `verify_jwt: true`. Store `ANTHROPIC_API_KEY` via Supabase secrets. Use `npm:@anthropic-ai/sdk` with model `claude-haiku-4-5-20251001`. Add `report_status` column via a new migration before deploying the function.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@anthropic-ai/sdk` | latest (^0.61+) | Anthropic API client | Official SDK; Deno-native with `npm:` prefix; handles retries, error typing, timeouts |
| `@supabase/supabase-js` | ^2.49.x (already in project) | DB update from edge function | Official client; available via `npm:@supabase/supabase-js`; uses `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS for the status update |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `jsr:@supabase/functions-js/edge-runtime.d.ts` | latest | Type definitions for Deno edge runtime | Import at top of edge function for type hints |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `npm:@anthropic-ai/sdk` | Raw `fetch()` to `https://api.anthropic.com` | SDK handles retries, error types, and API versioning header automatically. Raw fetch is simpler for review but loses all of that. SDK is worth the import. |
| `npm:@supabase/supabase-js` in edge function | `SUPABASE_DB_URL` with direct Postgres | supabase-js is simpler for a single `UPDATE` and is already part of the project idiom. Direct Postgres requires importing a postgres driver. |

**Installation:** No npm install needed — Deno resolves `npm:` prefix imports automatically. No `package.json` changes in the project root.

---

## Architecture Patterns

### Recommended Project Structure

```
supabase/
├── functions/
│   ├── _shared/
│   │   └── cors.ts           # Shared CORS headers (standard pattern)
│   └── generate-report/
│       └── index.ts          # Edge function entrypoint
└── migrations/
    ├── 20260219055745_create_audits_table.sql   # Phase 1 (existing)
    └── YYYYMMDDHHMMSS_add_report_status.sql     # Phase 2 migration
```

### Pattern 1: Edge Function Entrypoint Structure

**What:** The standard Deno edge function boilerplate: CORS preflight handler, JSON body parse, main logic, error return.
**When to use:** Always — this is the Supabase-documented pattern.

```typescript
// supabase/functions/generate-report/index.ts
// Source: Supabase CORS guide — https://supabase.com/docs/guides/functions/cors

import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    // ... main logic ...
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
```

### Pattern 2: Anthropic SDK in Deno

**What:** Import via `npm:` specifier, instantiate client with env var, call `messages.create()`.
**When to use:** Any edge function calling the Claude API.

```typescript
// Source: Anthropic TypeScript SDK docs — https://platform.claude.com/docs/en/api/sdks/typescript
// Source: Deno import syntax confirmed at same page

import Anthropic from 'npm:@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: Deno.env.get('ANTHROPIC_API_KEY')!,
})

const message = await anthropic.messages.create({
  model: 'claude-haiku-4-5-20251001',
  max_tokens: 2048,
  system: systemPrompt,
  messages: [{ role: 'user', content: userPrompt }],
})

// Response text is in message.content[0].text (for non-streaming)
const text = message.content[0].type === 'text' ? message.content[0].text : ''
```

**Key facts about the model:**
- Exact Claude API ID: `claude-haiku-4-5-20251001`
- Claude API alias (also valid): `claude-haiku-4-5`
- Pricing: $1/MTok input, $5/MTok output — lowest cost in the Claude 4 generation
- Max output: 64K tokens — far more than needed for a report
- Context window: 200K tokens — no concern for audit payloads
- Latency: "fastest" classification — suited for synchronous loading-screen invocation

### Pattern 3: Supabase Client with Service Role Inside Edge Function

**What:** Use `SUPABASE_SERVICE_ROLE_KEY` (auto-injected in all edge functions) to perform privileged DB operations that bypass RLS.
**When to use:** Any time the edge function needs to write to a table that the anon role cannot UPDATE (which is the case here — anon has INSERT-only on `audits`).

```typescript
// Source: Supabase Edge Functions secrets guide
// https://supabase.com/docs/guides/functions/secrets

import { createClient } from 'npm:@supabase/supabase-js@2'

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

// Update report_status — bypasses RLS
const { error } = await supabaseAdmin
  .from('audits')
  .update({ report_status: 'completed' })
  .eq('id', auditId)
```

**Important:** `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are auto-injected into all hosted edge functions. No secrets setup needed for these three.

### Pattern 4: Report Status Migration

**What:** Add `report_status` column to the existing `audits` table via a new migration.
**When to use:** Before deploying the edge function — the function writes to this column.

```sql
-- Migration: add_report_status_to_audits
ALTER TABLE public.audits
  ADD COLUMN report_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (report_status IN ('pending', 'completed', 'failed'));
```

**Note:** This `ALTER TABLE` does not violate the "RLS enabled at creation" constraint from Phase 1 — it does not touch RLS configuration.

### Pattern 5: Secrets Management

**What:** Store `ANTHROPIC_API_KEY` in Supabase project secrets so it is available to the edge function as `Deno.env.get('ANTHROPIC_API_KEY')` but is never bundled into client JS.
**When to use:** Any non-Supabase third-party API key used in edge functions.

```
# Via Supabase CLI (not needed if using MCP deploy_edge_function)
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
```

Via the MCP `deploy_edge_function` tool, secrets are set separately in the Supabase dashboard or via MCP's project secrets management before calling deploy.

### Pattern 6: One-Retry Pattern for Claude API

**What:** Wrap the `anthropic.messages.create()` call in a try/catch. On failure, wait briefly and retry once. On second failure, throw.
**When to use:** Satisfies the locked decision: "retry once on Claude API failure, then return error."

```typescript
async function callClaudeWithRetry(
  anthropic: Anthropic,
  params: Anthropic.MessageCreateParams,
): Promise<Anthropic.Message> {
  try {
    return await anthropic.messages.create(params)
  } catch (firstError) {
    // Wait 2 seconds then retry once
    await new Promise(resolve => setTimeout(resolve, 2000))
    try {
      return await anthropic.messages.create(params)
    } catch (secondError) {
      throw secondError // Bubble up to caller
    }
  }
}
```

**Timing note:** With Claude Haiku 4.5 typical latency of 3-8 seconds and a 2-second retry delay, worst-case is ~18-20 seconds — within the ~20 second budget stated in the decision.

**Note:** The Anthropic SDK has its own built-in retry logic (default `maxRetries: 2` for connection errors, 408, 409, 429, >=500). To avoid double-retrying, configure the SDK with `maxRetries: 0` and handle retries manually, OR rely on the SDK's built-in retries. Given the 20-second budget constraint, relying on SDK retries with `maxRetries: 1` and the SDK's exponential backoff (typically 1-2s) is the simplest approach.

### Pattern 7: JSON Output from Claude

**What:** Instruct Claude to return a strict JSON object, parse it, and handle parse failures.
**When to use:** Any time the edge function needs structured output from the LLM.

```typescript
// System prompt: "You must respond with ONLY valid JSON. No markdown fences, no explanation."
// Then parse:
let reportData: AiReportOutput
try {
  reportData = JSON.parse(responseText)
} catch {
  throw new Error('Claude returned invalid JSON: ' + responseText.slice(0, 200))
}
```

**Key insight:** Claude Haiku 4.5 reliably follows JSON-only instructions when the system message explicitly forbids markdown fences and prose. Do not ask Claude to include explanatory text alongside JSON — it will add wrapping text and break the parse.

### Pattern 8: Input Sanitization (SEC-04)

**What:** Strip HTML/special characters from free-text fields and truncate before including in prompt. Sanitize business name for personalization.
**When to use:** For `step2.techFrustrations`, `step8.biggestChallenge`, and `step1.businessName`.

```typescript
// Per locked decisions: regex-based strip + truncate is the approach

function sanitizeText(input: string | undefined, maxLen: number = 500): string {
  if (!input) return ''
  return input
    .replace(/<[^>]*>/g, '')          // Strip HTML tags
    .replace(/[^\w\s.,!?-]/g, ' ')    // Strip special chars except common punctuation
    .replace(/\s+/g, ' ')             // Normalize whitespace
    .trim()
    .slice(0, maxLen)
}

function sanitizeBusinessName(name: string | undefined): string {
  if (!name) return 'Your Business'
  return name
    .replace(/<[^>]*>/g, '')
    .replace(/[^\w\s.,&'-]/g, ' ')    // Allow & and ' common in business names
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100)
}
```

**PII exclusion:** Do NOT pass `step1.email`, `step1.phone`, or `step1.contactName` to the LLM. Only `step1.businessName` (sanitized) is included for personalization.

### Pattern 9: Calling the Edge Function from the Browser

**What:** Use `supabase.functions.invoke()` with the anon key. The function's `verify_jwt: true` gate checks the JWT from the publishable key.
**When to use:** The Loading.tsx page needs to invoke the function after `submitAudit()` succeeds.

```typescript
// src/lib/generateReport.ts (will be created in a later frontend plan)
import { supabase } from '@/lib/supabase'

const { data, error } = await supabase.functions.invoke('generate-report', {
  body: { auditId, formState, scores },
})
```

**Note:** Phase 2 only deploys the edge function. Frontend wiring (Loading.tsx calling this function) is deferred to a later phase. Phase 2 success criterion is curl/Postman testability.

### Anti-Patterns to Avoid

- **`verify_jwt: false`:** This exposes the function to unauthenticated callers from the internet. All audit data would be reachable by anyone who discovers the function URL. Use `verify_jwt: true` — the publishable key provides a valid JWT for browser callers.
- **Exposing PII in the prompt:** Sending email, phone, or contact name to the LLM violates the locked PII-exclusion decision and creates unnecessary data exposure.
- **Parsing Claude's response without JSON-only instruction:** Claude will add markdown code fences (```json) by default. The system message MUST explicitly say "respond with ONLY valid JSON, no markdown, no explanation."
- **Using `SUPABASE_ANON_KEY` for the status update:** Anon key respects RLS; the `audits` table has no UPDATE policy for anon. The update will silently succeed (no error) but write nothing. Always use `SUPABASE_SERVICE_ROLE_KEY` for privileged writes from edge functions.
- **Streaming the Claude response:** Not needed — the full report JSON must be parsed atomically. Streaming is for token-by-token display, which is explicitly out of scope per requirements.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| API key management | Custom env var scheme | Supabase secrets (`Deno.env.get()`) | Auto-injected, never in bundle, rotatable independently |
| HTTP retry logic | Custom retry loop with full error handling | `@anthropic-ai/sdk` with `maxRetries: 1` | SDK handles connection errors, 429, >=500 with backoff |
| CORS headers | Custom header logic | `_shared/cors.ts` pattern | Standard Supabase pattern, consistent across functions |
| Prompt injection defense | Custom parser/sanitizer library | Regex strip + truncate | Locked decision; no library dependency needed |
| JSON schema validation | Zod or ajv | Manual key presence checks | Simple report structure doesn't warrant a validation library |

---

## Common Pitfalls

### Pitfall 1: Claude Returns Markdown-Wrapped JSON

**What goes wrong:** `JSON.parse()` throws because Claude's response is ` ```json\n{...}\n``` ` instead of bare `{...}`.
**Why it happens:** Default Claude behavior includes markdown formatting. Without explicit instruction, it wraps code in fences.
**How to avoid:** System message must include: "Respond with ONLY valid JSON. Do not include markdown code fences, preamble, or explanation. The entire response must be parseable by JSON.parse()."
**Warning signs:** Parse error on a string that starts with a backtick.

### Pitfall 2: `SUPABASE_SERVICE_ROLE_KEY` Not Available in Local Dev

**What goes wrong:** The status UPDATE works in production but silently does nothing locally (returns empty data, no error).
**Why it happens:** Local dev with `supabase functions serve` does inject these secrets, but requires them in `supabase/functions/.env` for local-only keys. The three built-in secrets (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) ARE auto-injected by `supabase start`.
**How to avoid:** For local testing, run `supabase start` before `supabase functions serve`. The built-in secrets will be present. `ANTHROPIC_API_KEY` must be added to `supabase/functions/.env` (gitignored).
**Warning signs:** Status column never updates in local testing; no error in function logs.

### Pitfall 3: Edge Function Timeout from Claude API Latency

**What goes wrong:** The function times out with a 546 error or the client receives a 504 from the gateway before Claude responds.
**Why it happens:** Claude Haiku 4.5 typically responds in 3-8 seconds. With one retry and 2-second delay, worst case is ~18 seconds. The edge function request idle timeout is 150 seconds — this is not the concern. The concern is the browser-side fetch timeout or the `supabase.functions.invoke()` default timeout.
**How to avoid:** The existing Loading.tsx redirects at 14.5 seconds. Phase 2 does not wire the frontend — when it does, the Loading page must wait for the function to resolve (or timeout) before navigating. The 14.5-second hardcoded timer will need adjustment in the frontend integration phase.
**Warning signs:** Users see the report page but AI content is missing; function logs show success after the client navigated away.

### Pitfall 4: `report_status` Column Missing When Function Tries to Update

**What goes wrong:** The edge function tries to `UPDATE audits SET report_status = 'completed'` but the column doesn't exist. Supabase-js returns an error; the status update silently fails (or throws depending on error handling).
**Why it happens:** The migration to add `report_status` wasn't applied before deploying the function.
**How to avoid:** Apply the `add_report_status` migration before deploying the function. Verify with `SELECT column_name FROM information_schema.columns WHERE table_name = 'audits'`.
**Warning signs:** Supabase-js error message: "column 'report_status' of relation 'audits' does not exist".

### Pitfall 5: `verify_jwt: true` Rejects curl/Postman Test Calls

**What goes wrong:** Testing the function with curl returns 401 Unauthorized because `verify_jwt: true` requires a valid JWT in the Authorization header.
**Why it happens:** `verify_jwt: true` checks the Bearer token against the project's JWT secret.
**How to avoid:** When testing with curl/Postman, include the Authorization header with the publishable anon key: `Authorization: Bearer <SUPABASE_ANON_KEY>`. The anon JWT is the publishable key value.
**Warning signs:** curl returns `{"message":"JWT expired"}` or `{"message":"Invalid token"}`.

### Pitfall 6: Incorrect JSON Schema Causes Silent Prompt Compliance Failure

**What goes wrong:** The AI output contains all required fields but with different names than expected (e.g., `description` vs `body`, `cta_text` vs `cta`). Frontend breaks when trying to render AI content.
**Why it happens:** Prompt specified field names ambiguously; Claude chose reasonable but different names.
**How to avoid:** The prompt must include a concrete JSON example/template with exact field names. Use an explicit schema in the system message with exact field names: `title`, `description`, `priority`, `cta`.
**Warning signs:** Report renders with `undefined` values for AI content fields.

---

## Code Examples

Verified patterns from official sources:

### Complete Edge Function Skeleton

```typescript
// supabase/functions/generate-report/index.ts
// Sources:
//   Supabase Edge Functions: https://supabase.com/docs/guides/functions
//   CORS pattern: https://supabase.com/docs/guides/functions/cors
//   Anthropic SDK Deno: https://platform.claude.com/docs/en/api/sdks/typescript
//   Secrets: https://supabase.com/docs/guides/functions/secrets

import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { corsHeaders } from '../_shared/cors.ts'
import Anthropic from 'npm:@anthropic-ai/sdk'
import { createClient } from 'npm:@supabase/supabase-js@2'

const MODEL = 'claude-haiku-4-5-20251001'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const anthropic = new Anthropic({
    apiKey: Deno.env.get('ANTHROPIC_API_KEY')!,
    maxRetries: 1,  // One retry built into SDK; SDK handles backoff
  })

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  try {
    const { auditId, formState, scores } = await req.json()

    // Set status to pending (already default, but explicit on re-run)
    await supabaseAdmin
      .from('audits')
      .update({ report_status: 'pending' })
      .eq('id', auditId)

    // Sanitize inputs
    const sanitizedName = sanitizeBusinessName(formState.step1?.businessName)
    const sanitizedFrustrations = sanitizeText(formState.step2?.techFrustrations, 500)
    const sanitizedChallenge = sanitizeText(formState.step8?.biggestChallenge, 500)

    // Build prompt
    const { system, user } = buildPrompt({
      niche: formState.niche,
      businessName: sanitizedName,
      scores,
      techFrustrations: sanitizedFrustrations,
      biggestChallenge: sanitizedChallenge,
    })

    // Call Claude
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2048,
      system,
      messages: [{ role: 'user', content: user }],
    })

    const responseText = message.content[0]?.type === 'text'
      ? message.content[0].text
      : ''

    const reportData = JSON.parse(responseText)

    // Update status to completed
    await supabaseAdmin
      .from('audits')
      .update({ report_status: 'completed' })
      .eq('id', auditId)

    return new Response(JSON.stringify({ success: true, report: reportData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    // Update status to failed (best-effort — don't throw if auditId unavailable)
    try {
      const { auditId } = await req.clone().json().catch(() => ({}))
      if (auditId) {
        await supabaseAdmin
          .from('audits')
          .update({ report_status: 'failed' })
          .eq('id', auditId)
      }
    } catch {}

    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
```

### Shared CORS Headers

```typescript
// supabase/functions/_shared/cors.ts
// Source: https://supabase.com/docs/guides/functions/cors

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
```

### AI Report JSON Schema

The prompt must specify exact field names. The following is the recommended output structure that maps to the existing `AuditReport` type plus the new `priority` and `cta` fields:

```typescript
// Target JSON structure for Claude to produce:
interface AiReportOutput {
  executiveSummary: string  // 2-4 sentences, personalized paragraph

  gaps: Array<{
    title: string       // Short headline
    description: string // 2-3 sentences explaining the specific gap
    impact: string      // One-liner on business impact
    priority: 'high' | 'medium' | 'low'
    cta: string         // e.g. "We can automate your follow-up — book a call"
  }>

  quickWins: Array<{
    title: string
    description: string // Actionable steps
    timeframe: string   // e.g. "Can be live in 24-48 hours"
    priority: 'high' | 'medium' | 'low'
    cta: string
  }>

  strategicRecommendations: Array<{
    title: string
    description: string
    roi: string         // e.g. "Estimated 15-25 additional leads per month"
    priority: 'high' | 'medium' | 'low'
    cta: string
  }>
}
```

**Score-driven item count logic (to include in prompt):**
- Overall score < 40: 4-5 gaps, 3 quick wins, 3 strategic recs
- Overall score 40-65: 3 gaps, 3 quick wins, 3 strategic recs
- Overall score > 65: 2 gaps, 2 quick wins, 2 strategic recs

### Migration: Add report_status Column

```sql
-- Migration name: add_report_status_to_audits
-- Source: Standard ALTER TABLE pattern; no RLS impact

ALTER TABLE public.audits
  ADD COLUMN report_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (report_status IN ('pending', 'completed', 'failed'));
```

### curl Test Command (after deployment)

```bash
# Source: Supabase Edge Functions invocation docs
curl -X POST \
  "https://qyktrwpgfyvgdnexzcpr.supabase.co/functions/v1/generate-report" \
  -H "Authorization: Bearer <SUPABASE_ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "auditId": "test-audit-id",
    "formState": {
      "niche": "home_services",
      "step1": { "businessName": "Acme Plumbing" },
      "step2": { "techFrustrations": "Our scheduling software crashes constantly" },
      "step8": { "biggestChallenge": "Getting repeat customers to call us back" }
    },
    "scores": {
      "overall": 45,
      "technology": 33,
      "leads": 50,
      "scheduling": 42,
      "communication": 58,
      "followUp": 25,
      "operations": 67,
      "financial": 38,
      "categories": [
        { "category": "followUp", "label": "Follow-Up & Retention", "score": 25, "weight": 15 },
        { "category": "technology", "label": "Technology & Software", "score": 33, "weight": 10 }
      ]
    }
  }'
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `supabase functions deploy` via CLI only | Deploy via Supabase MCP `deploy_edge_function` | 2025 | No CLI needed; can deploy from code session directly |
| `deno_version = 1` | `deno_version = 2` | 2025 | Project already configured for Deno 2 in config.toml |
| OpenAI SDK in edge functions | `npm:@anthropic-ai/sdk` in Deno | Ongoing | SDK supports Deno v1.28+ via `npm:` prefix; identical usage pattern |
| Model IDs with date stamps required | Alias IDs available (`claude-haiku-4-5`) | 2025 | Use dated snapshot `claude-haiku-4-5-20251001` for stability — aliases may point to newer models |

**Deprecated/outdated:**
- `deno.land/x/` imports for Anthropic: No official Anthropic package exists at `deno.land/x/`. Only `npm:@anthropic-ai/sdk` is the correct import path in Deno.
- `esm.sh` for Anthropic SDK: Works but unofficial. Use `npm:` prefix for reliability.

---

## Open Questions

1. **ANTHROPIC_API_KEY provisioning workflow**
   - What we know: Must be set as a Supabase project secret before the function can call Claude.
   - What's unclear: The user must obtain an API key from https://console.anthropic.com. Planner must include a prerequisite check.
   - Recommendation: Add a user-setup step: "Obtain Anthropic API key from console.anthropic.com and set it via Supabase MCP or dashboard secrets."

2. **`report_status` UPDATE RLS — does service role bypass work?**
   - What we know: `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS per Supabase docs. The anon INSERT policy covers the initial insert. No UPDATE policy exists for anon.
   - What's unclear: Whether service role UPDATE works on the specific project without an additional policy.
   - Recommendation: Rely on service role bypass — this is the documented and standard pattern for privileged operations in edge functions. Verify in the execution step.

3. **Prompt token budget for Haiku 4.5**
   - What we know: Claude Haiku 4.5 has 200K context window and 64K max output. A full `AuditFormState` JSON is roughly 2-5 KB (~500-1500 tokens). The AI output with 3-5 items across 3 sections will be ~1000-2000 tokens.
   - What's unclear: Total cost per call not pre-calculated but estimates are: input ~2K tokens ($0.002) + output ~2K tokens ($0.010) = ~$0.012/report. Acceptable.
   - Recommendation: Set `max_tokens: 2048` as a reasonable ceiling; this is well within budget.

4. **What happens if `auditId` is invalid or the audit row was deleted?**
   - What we know: The UPDATE will match zero rows and return no error (Supabase silently returns empty data).
   - What's unclear: Whether the planner should add a verification step.
   - Recommendation: Trust that the caller passes a valid `auditId` from Phase 1's submitAudit — no defensive check needed in Phase 2.

---

## Sources

### Primary (HIGH confidence)

- Supabase Docs: Edge Functions — https://supabase.com/docs/guides/functions
  - Topics: Deno runtime, deployment via MCP, local dev, function structure
- Supabase Docs: Edge Function Limits — https://supabase.com/docs/guides/functions/limits
  - Topics: 150s request idle timeout, 400s wall clock, 2s CPU limit, 256MB memory
- Supabase Docs: Environment Variables (Secrets) — https://supabase.com/docs/guides/functions/secrets
  - Topics: Auto-injected `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`; custom secrets via `Deno.env.get()`
- Supabase Docs: CORS — https://supabase.com/docs/guides/functions/cors
  - Topics: Preflight handler, corsHeaders object, browser invocation pattern
- Anthropic TypeScript SDK Docs — https://platform.claude.com/docs/en/api/sdks/typescript
  - Topics: Deno support (`npm:@anthropic-ai/sdk`), `messages.create()`, `maxRetries`, error types, timeout behavior
- Anthropic Models Overview — https://platform.claude.com/docs/en/about-claude/models/overview
  - Topics: `claude-haiku-4-5-20251001` exact API ID, pricing ($1/$5 per MTok), 64K max output, 200K context
- Existing codebase: `D:/Claude/BizAudit/src/types/audit.ts` — `AuditFormState`, `AuditScores`, `AuditReport` interfaces; free-text fields at `step2.techFrustrations` and `step8.biggestChallenge`
- Existing codebase: `D:/Claude/BizAudit/src/lib/scoring.ts` — 7 category names and their niche-specific labels
- Existing codebase: `D:/Claude/BizAudit/supabase/config.toml` — `deno_version = 2`; project configured for Deno 2

### Secondary (MEDIUM confidence)

- Supabase MCP `list_projects` — confirmed project ID `qyktrwpgfyvgdnexzcpr` (AiAudit), region `eu-central-1`, status `ACTIVE_HEALTHY`
- Phase 1 01-01-SUMMARY.md — confirms audits table schema: 11 columns, no `report_status` column yet
- Phase 1 01-VERIFICATION.md — confirms `submitAudit` uses `crypto.randomUUID()` client-side; function is complete and non-stub

### Tertiary (LOW confidence)

- None — all critical claims verified against official docs.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — `npm:@anthropic-ai/sdk` with Deno import confirmed via official Anthropic SDK docs; model ID `claude-haiku-4-5-20251001` confirmed via official models overview
- Architecture: HIGH — Edge function patterns, CORS, secrets, service role all verified against Supabase official docs; report_status migration is standard ALTER TABLE
- Pitfalls: HIGH — JSON parse pitfall and verify_jwt pitfall verified against official behavior; status column timing is a logical dependency verified from project state
- Open questions: MEDIUM — API key provisioning is a user action; service role bypass is documented behavior

**Research date:** 2026-02-19
**Valid until:** 2026-03-21 (30 days — Supabase edge function patterns stable; Anthropic model ID stable as dated snapshot)

# Phase 1: Schema and Environment - Research

**Researched:** 2026-02-19
**Domain:** Supabase Postgres schema design, RLS policy configuration, supabase-js client setup, Vite environment variables
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DATA-01 | Completed audit submissions are persisted to Supabase Postgres with all form answers, scores, and contact info | Table schema design maps AuditFormState (8 steps) + AuditScores to JSONB columns; supabase-js `.from().insert()` returns inserted row including UUID |
| DATA-02 | Each audit generates a unique UUID that serves as a permanent, shareable report URL | Postgres `gen_random_uuid()` as primary key default; Supabase insert returns the `id` column via `.select()` chained on insert |
| SEC-02 | RLS policies prevent anonymous users from reading other users' audit data | Enable RLS at table creation; INSERT policy on `anon` role with `WITH CHECK (true)`; no SELECT policy = zero rows returned for anon reads |
| SEC-03 | Service role key and API keys stored only in Supabase secrets, never in client-side code | Only `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in `.env`; never `service_role` or `sb_secret_` in any VITE_ variable |
</phase_requirements>

---

## Summary

This phase creates the Supabase backend table and wires it to the existing React/Vite SPA. The core challenge is designing a schema that fits the nested, niche-specific `AuditFormState` (8 steps, two niches: `home_services` and `real_estate`) while keeping the insert simple and the RLS airtight.

The recommended approach stores the full form answers and scores as JSONB columns rather than normalizing into many columns. This sidesteps the niche-branching complexity (optional fields vary by niche across all 8 steps), allows future schema evolution without migrations, and keeps the insert a single row operation. Contact info and the overall score are promoted to dedicated columns for queryability.

The security architecture is straightforward: enable RLS at table creation (not as an afterthought — see CVE-2025-48757 precedent in prior decisions), create one `INSERT` policy for the `anon` role, and create no `SELECT` policy for `anon`. With RLS enabled and no SELECT policy, the Supabase Data API returns zero rows for any anon read — which is exactly what success criterion 3 requires. The client gets only the `VITE_SUPABASE_PUBLISHABLE_KEY`; the service role key never touches the browser.

**Primary recommendation:** Use a two-column JSONB schema (`form_data`, `scores`) with promoted scalar fields (`id`, `niche`, `business_name`, `contact_email`, `overall_score`, `created_at`). Enable RLS in the same `CREATE TABLE` statement. Create one anon INSERT policy immediately after.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/supabase-js` | ^2.x (currently 2.49.x) | Supabase client for browser | Official client; handles PostgREST, auth, realtime |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None additional | — | No extra libraries needed | supabase-js covers all Phase 1 needs |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| JSONB for answers/scores | Normalized columns per field | Normalized = 50+ columns, complex migrations when form changes, niche branching is messy. JSONB wins for evolving survey data. |
| Publishable key (`sb_publishable_...`) | Legacy JWT `anon` key | Both work identically for RLS purposes. Publishable key is the current recommendation per Supabase docs (Feb 2026). Either is valid since this is a new project. |

**Installation:**
```bash
npm install @supabase/supabase-js
```

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── lib/
│   ├── supabase.ts       # createClient singleton
│   ├── scoring.ts        # (existing)
│   └── utils.ts          # (existing)
├── types/
│   └── audit.ts          # (existing) — AuditFormState, AuditScores, AuditReport
```

No new folders needed. The supabase client is a single file in the existing `src/lib/` directory.

### Pattern 1: Supabase Client Singleton

**What:** Create the client once and export it; never recreate per component.
**When to use:** Always. Recreating the client per render/call leaks connections and resets state.

```typescript
// src/lib/supabase.ts
// Source: Supabase official docs — https://supabase.com/docs/guides/api/api-keys
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseKey)
```

### Pattern 2: Insert and Return UUID

**What:** Chain `.select()` on an insert to get the generated UUID back in a single round-trip.
**When to use:** Any time you need the server-assigned primary key after insert.

```typescript
// Source: Supabase JS docs — supabase.from().insert().select()
const { data, error } = await supabase
  .from('audits')
  .insert({
    niche: formState.niche,
    business_name: formState.step1.businessName,
    contact_email: formState.step1.email,
    overall_score: scores.overall,
    form_data: formState,
    scores: scores,
  })
  .select('id')
  .single()

if (error) throw error
const auditId = data.id  // UUID for the report URL
```

### Pattern 3: RLS — Insert-Only for Anon, Zero Reads

**What:** Enable RLS and create exactly one INSERT policy for the `anon` role. Do NOT create a SELECT policy for `anon`. The result: anon users can write, but reading returns zero rows.

**Verified behavior (from Supabase RLS docs):**
> "Once you have enabled RLS, no data will be accessible via the API when using the public anon key, until you create policies."

This means no SELECT policy = no rows returned. No "deny" policy needed — absence of a permitting policy is the denial.

```sql
-- Source: https://supabase.com/docs/guides/database/postgres/row-level-security

-- Step 1: Create table with RLS enabled inline
CREATE TABLE public.audits (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  niche       TEXT NOT NULL,
  business_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  overall_score INTEGER NOT NULL,
  form_data   JSONB NOT NULL,
  scores      JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Step 2: Enable RLS immediately — same migration block
ALTER TABLE public.audits ENABLE ROW LEVEL SECURITY;

-- Step 3: Allow anon to insert (no WITH CHECK restriction — any data accepted)
CREATE POLICY "anon_insert_audits"
ON public.audits
FOR INSERT
TO anon
WITH CHECK (true);

-- No SELECT policy for anon = zero rows returned on read
-- No UPDATE, DELETE policies = those operations blocked
```

**Why `WITH CHECK (true)` does not trigger the Security Advisor warning:**
The advisor lint `0024_permissive_rls_policy` flags `USING (true)` on SELECT (and missing WITH CHECK on INSERT). An INSERT-only policy with `WITH CHECK (true)` is the correct pattern for anonymous write-only tables. The linter flags SELECT policies with `USING (true)` as dangerous because they expose all rows — not INSERT policies.

### Pattern 4: Environment Variable Convention (Vite)

**What:** Vite only exposes variables prefixed `VITE_` to the browser bundle.
**Constraint (from prior decisions + SEC-03):** Only two VITE_ variables allowed.

```bash
# .env (gitignored — never commit this file)
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...

# .env.example (commit this — no values)
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

Access in TypeScript:
```typescript
import.meta.env.VITE_SUPABASE_URL       // string | undefined
import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY  // string | undefined
```

### Anti-Patterns to Avoid

- **VITE_SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_SECRET:** Any `sb_secret_` or `service_role` JWT in a VITE_ variable exposes full database bypass-RLS access to every browser. Hard fail on SEC-03.
- **RLS enabled after table population:** The CVE-2025-48757 pattern — tables exposed without RLS even briefly can leak data. Enable RLS in the same CREATE TABLE migration.
- **Creating a SELECT policy with `USING (true)` for anon:** This would make all audit rows readable by anyone with the publishable key. Triggers Security Advisor warning AND violates SEC-02.
- **Recreating the supabase client per component:** Causes connection leaks and breaks session state (not applicable here since no auth, but still bad practice).
- **Not calling `.select('id')` after insert:** The insert without `.select()` returns `null` data by default in supabase-js v2. DATA-02 requires the UUID back.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| UUID generation | Custom UUID v4 in JS | `gen_random_uuid()` as column default | Server-generated UUIDs are authoritative, not spoofable by client |
| Insert + read back UUID | Two-query pattern (insert then select) | `.insert().select('id').single()` | Single round-trip; atomic; no race condition |
| RLS enforcement | Application-layer filtering | Postgres RLS policies | Database-enforced; applies to all clients including direct API calls |
| Env var validation | Complex runtime checks | Fail-fast throw at module load | Catches misconfiguration at startup, not buried in a user action |

**Key insight:** The database enforces security. Application-layer security is defense-in-depth, not the primary gate.

---

## Common Pitfalls

### Pitfall 1: RLS Enabled But No INSERT Policy = Submissions Fail Silently

**What goes wrong:** Developer enables RLS (correctly) but forgets to create the INSERT policy. Every `supabase.from('audits').insert()` call returns a PostgREST 403 error. The browser sees a Supabase error response.
**Why it happens:** RLS enabled + no policy = all operations blocked for the role, including INSERT.
**How to avoid:** Create the INSERT policy in the same SQL migration as the table creation and RLS enablement.
**Warning signs:** Supabase insert returns `{ error: { code: '42501', message: 'new row violates row-level security policy' } }`

### Pitfall 2: `.insert()` Without `.select()` Returns null data

**What goes wrong:** `const { data } = await supabase.from('audits').insert({...})` — data is `null`. Developer tries to read `data.id` and gets a TypeError.
**Why it happens:** supabase-js v2 changed insert behavior — data is only returned when `.select()` is chained.
**How to avoid:** Always chain `.select('id').single()` when the UUID is needed.
**Warning signs:** `data` is `null` despite no `error`.

### Pitfall 3: Security Advisor Warnings from Permissive SELECT Policy

**What goes wrong:** Developer adds `CREATE POLICY "read_all" ON audits FOR SELECT TO anon USING (true)` to "make things work," which lets any anon user read all audit rows.
**Why it happens:** Misunderstanding of RLS — thinking a SELECT policy is needed for anything to work.
**How to avoid:** Only create an INSERT policy. Absence of SELECT policy = no rows returned (not an error for the reader — just empty results).
**Warning signs:** Security Advisor flags `0024_permissive_rls_policy` on the audits table.

### Pitfall 4: Free Tier Project Pauses After 7 Days Inactivity

**What goes wrong:** Development halts over a weekend; Supabase project is paused; all API calls return 503; developer wastes time diagnosing.
**Why it happens:** Supabase free tier pauses inactive projects.
**How to avoid:** Confirm paid tier before starting Phase 1 (noted in prior decisions as an open prerequisite). Paid tier projects do not pause.
**Warning signs:** Supabase API returns `503 Service Unavailable`; dashboard shows project as "Paused."

### Pitfall 5: `anon` vs Anonymous Auth User Confusion

**What goes wrong:** Developer reads Supabase docs on `signInAnonymously()` and thinks that's required for the insert to work. It is not.
**Why it happens:** Supabase has two different concepts both called "anonymous": the `anon` Postgres role (used by publishable key with no auth) vs. an anonymous Auth user (created by `signInAnonymously()`, uses `authenticated` Postgres role).
**How to avoid:** For this phase, no auth of any kind is required. The `anon` Postgres role is automatically used when the client makes a request with only the publishable key and no active session. The INSERT policy targets `TO anon` accordingly.
**Warning signs:** Docs or blog posts referencing `signInAnonymously()` — not needed here.

---

## Code Examples

Verified patterns from official sources:

### Complete Table Migration (single SQL block)

```sql
-- Source: Supabase RLS docs + Securing Your API docs
-- https://supabase.com/docs/guides/database/postgres/row-level-security

CREATE TABLE public.audits (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  niche         TEXT        NOT NULL CHECK (niche IN ('home_services', 'real_estate')),
  business_name TEXT        NOT NULL,
  contact_name  TEXT        NOT NULL,
  contact_email TEXT        NOT NULL,
  contact_phone TEXT,
  partner_code  TEXT,
  overall_score INTEGER     NOT NULL CHECK (overall_score BETWEEN 0 AND 100),
  form_data     JSONB       NOT NULL,
  scores        JSONB       NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS at creation time (CVE-2025-48757 precedent: never add RLS later)
ALTER TABLE public.audits ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to insert audit submissions
CREATE POLICY "anon_can_insert_audits"
ON public.audits
FOR INSERT
TO anon
WITH CHECK (true);

-- No SELECT policy for anon = reads return zero rows (SEC-02 compliant)
```

### Vite TypeScript Environment Variable Types (optional but clean)

```typescript
// src/vite-env.d.ts — extend the existing file
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

### Supabase Client Module

```typescript
// src/lib/supabase.ts
// Source: Supabase JS docs createClient pattern
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing Supabase config. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are set in .env'
  )
}

export const supabase = createClient(supabaseUrl, supabaseKey)
```

### Audit Submission Function

```typescript
// Example: submitting completed audit to Supabase
// Source: supabase-js insert + select pattern
import { supabase } from '@/lib/supabase'
import { AuditFormState, AuditScores } from '@/types/audit'

export async function submitAudit(
  formState: AuditFormState,
  scores: AuditScores
): Promise<string> {
  const { data, error } = await supabase
    .from('audits')
    .insert({
      niche: formState.niche,
      business_name: formState.step1.businessName,
      contact_name: formState.step1.contactName,
      contact_email: formState.step1.email,
      contact_phone: formState.step1.phone,
      partner_code: formState.partnerCode,
      overall_score: scores.overall,
      form_data: formState,
      scores: scores,
    })
    .select('id')
    .single()

  if (error) {
    throw new Error(`Audit submission failed: ${error.message}`)
  }

  return data.id  // UUID — use as shareable report URL segment
}
```

### RLS Verification Query (manual test after setup)

```sql
-- Run this as an API call with only the anon key to verify SEC-02
-- Expected: empty array []
SELECT * FROM public.audits;

-- Run this to verify INSERT works
INSERT INTO public.audits (niche, business_name, contact_name, contact_email, overall_score, form_data, scores)
VALUES ('home_services', 'Test Co', 'Test User', 'test@test.com', 72, '{}', '{}')
RETURNING id;
-- Expected: returns a UUID row
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `anon` JWT key (long-lived) | Publishable key (`sb_publishable_...`) | Early 2025 | Publishable key is now recommended; `anon` JWT still works but is legacy |
| `service_role` JWT key | Secret key (`sb_secret_...`) | Early 2025 | Same capability; secret key is independently rotatable |
| `insert().then(select)` (two queries) | `.insert().select().single()` (one query) | supabase-js v2.x | Single round-trip; no race condition |
| `.insert()` returning data by default | `.insert()` returns null; need `.select()` | supabase-js v2.0 | Breaking change from v1; always chain `.select()` |

**Deprecated/outdated:**
- `supabase.from().insert({ returning: 'representation' })`: v1 API, does not exist in v2.
- `anon` and `service_role` JWT-based keys: Still functional but Supabase now recommends publishable/secret keys for new projects. Both are listed in `get_publishable_keys` MCP output.

---

## Open Questions

1. **Which Supabase project to use?**
   - What we know: Two existing projects exist in the org (`AffiliatePortal` — active; `AffiliateLanding` — inactive). Neither is named for BizAudit.
   - What's unclear: Whether a new Supabase project needs to be created for BizAudit, or if one of the existing projects should be used.
   - Recommendation: Create a new Supabase project named `BizAudit` rather than sharing with AffiliatePortal. Isolation prevents RLS scope confusion and billing attribution. Confirm the org is on a paid plan to avoid free-tier pausing.

2. **Paid tier confirmation**
   - What we know: Prior decisions flag this as a prerequisite ("Confirm paid tier before Phase 1").
   - What's unclear: Whether the BizAudit project will be on the free or paid plan.
   - Recommendation: Planner must include a verification step: check project status before any database work. Free tier projects pause after 7 days inactivity during development.

3. **`form_data` JSONB size**
   - What we know: The `AuditFormState` serializes to roughly 2-5 KB of JSON depending on niche/completeness.
   - What's unclear: Whether JSONB indexing or size limits will matter.
   - Recommendation: No concern at this scale. JSONB max is 1 GB per value. No indexing needed in Phase 1.

4. **TypeScript Database Types**
   - What we know: Supabase can generate TypeScript types via `supabase gen types typescript` or the MCP `generate_typescript_types` tool.
   - What's unclear: Whether generated types are needed in Phase 1.
   - Recommendation: Skip for Phase 1. The insert payload is typed by `AuditFormState` from the existing codebase. Add generated DB types in a later phase if needed.

---

## Sources

### Primary (HIGH confidence)

- Supabase Docs: Row Level Security — https://supabase.com/docs/guides/database/postgres/row-level-security
  - Topics: enabling RLS, INSERT policies, anon role, `WITH CHECK`, `USING`, behavior when no policy exists
- Supabase Docs: Securing Your API — https://supabase.com/docs/guides/api/securing-your-api
  - Topics: why RLS must be enabled on public schema tables
- Supabase Docs: Understanding API Keys — https://supabase.com/docs/guides/api/api-keys
  - Topics: publishable key vs anon key vs service_role, which to use client-side, security considerations
- Supabase Docs: Database Advisor lint 0024 — https://supabase.com/docs/guides/database/database-advisors?lint=0024_permissive_rls_policy
  - Topics: what triggers Security Advisor warnings, which patterns to avoid
- Supabase Docs: Hardening the Data API — https://supabase.com/docs/guides/database/hardening-data-api
  - Topics: public schema exposure, RLS as shared responsibility
- Supabase MCP `list_projects` — verified two existing projects (AffiliatePortal, AffiliateLanding); neither is BizAudit

### Secondary (MEDIUM confidence)

- Existing codebase: `D:/Claude/BizAudit/src/types/audit.ts` — full `AuditFormState` structure with 8 steps, two niches, all optional fields verified by direct read
- Existing codebase: `D:/Claude/BizAudit/src/lib/scoring.ts` — `AuditScores` structure, `computeScores()` output verified
- Existing codebase: `D:/Claude/BizAudit/package.json` — no `@supabase/supabase-js` currently installed (confirmed absent from dependencies)

### Tertiary (LOW confidence)

- CVE-2025-48757: Referenced in prior decisions as precedent for "enable RLS at creation, not later." Not independently verified via official CVE database in this research session — treated as a project constraint, not a research finding.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — `@supabase/supabase-js` verified as the single required package; no alternatives needed
- Architecture: HIGH — Table schema, RLS pattern, and client singleton all verified against official Supabase docs via MCP
- Pitfalls: HIGH — All five pitfalls verified against official documentation behavior (RLS blocking behavior, insert returning null, Security Advisor lint rules)
- Open questions: MEDIUM — Project selection and paid tier confirmation require human decision; schema size/typing questions are LOW risk

**Research date:** 2026-02-19
**Valid until:** 2026-03-19 (30 days — Supabase API key docs stable; RLS behavior stable)

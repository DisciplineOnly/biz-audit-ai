# Phase 10: Database and Backend Extension - Research

**Researched:** 2026-02-22
**Domain:** Supabase Postgres migrations, Deno edge functions, text sanitization
**Confidence:** HIGH

## Summary

Phase 10 is backend plumbing with three clear deliverables: (1) add `language` and `sub_niche` columns to the `audits` table and wire them through the insert/fetch paths, (2) add language and sub-niche display to the admin notification email, and (3) fix `sanitizeText()` so Cyrillic characters pass through intact to the AI prompt.

The current `sanitizeText()` regex `/[^\w\s.,!?'-]/g` uses JavaScript's `\w` which only matches `[A-Za-z0-9_]` -- this strips ALL Cyrillic and non-Latin characters. The fix is straightforward: replace `\w` with a Unicode-aware pattern that preserves natural-language scripts while still stripping control characters, HTML entities, and injection payloads. The `sanitizeBusinessName()` function has the same issue and needs the same fix.

The database changes are a single migration adding two nullable columns. The frontend already has `subNiche` in `AuditFormState` and language is derivable from the i18n instance or URL. The edge functions need minimal wiring -- `submitAudit.ts` adds the two new fields to the insert, `generate-report` already reads `subNiche` from the request body, `fetch-report` adds the new columns to its select, and `send-notification` reads them from the webhook record.

**Primary recommendation:** Use a single Supabase migration for both columns, wire `language` and `sub_niche` through `submitAudit.ts`, update all three edge functions, and fix sanitization with a Unicode-aware regex that allows `\p{L}` (any letter in any script).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Admin email format:
  - Placement: Claude's discretion -- pick best position in existing email template
  - Sub-niche display: Human-readable labels only (e.g., "HVAC" not "hvac")
  - Language display: Full name (e.g., "English", "Bulgarian") -- no flags, no codes
  - Report link: Language-aware URL -- `/bg/report/:id` for Bulgarian audits, `/report/:id` for English (NOTE: current routing uses no prefix for Bulgarian and `/en/` for English)
  - Legacy audits: Omit language/sub-niche lines entirely if data is null (don't show defaults)
- Sanitization scope:
  - Protection level: Claude's discretion
  - Per-field vs universal: Claude's discretion
  - Emoji: Strip emoji from free-text fields, but keep all natural-language scripts (Cyrillic, Latin, etc.)
  - Logging: Silent -- strip without logging
- Backward compatibility:
  - Old audit rows: Leave untouched -- new columns are nullable, code handles nulls gracefully
  - No backfill -- don't set default values on existing rows
  - Missing sub-niche on submission: Claude's discretion -- decide based on form validation flow
  - fetch-report edge function: Return both language and sub-niche to the frontend (needed for report page rendering)
- Data wiring:
  - Language source: Claude's discretion -- pick most reliable source between i18next and URL param
  - Storage approach: Claude's discretion -- pick best database design (top-level columns vs JSONB)
  - Edge function data: Claude's discretion -- pick between request body and DB read based on existing patterns
  - RLS policy: Keep INSERT-only for anon -- no change to security model, continue using fetch-report for reads

### Claude's Discretion
- Admin email placement of language/sub-niche fields
- Protection level of sanitization
- Per-field vs universal sanitization approach
- Language source (i18next vs URL param)
- Storage approach (top-level columns vs JSONB)
- Edge function data source
- Missing sub-niche handling

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DB-01 | Audit records store the language and sub-niche used during the audit | Migration adds `language` and `sub_niche` columns to `audits` table. `submitAudit.ts` includes both fields in INSERT. `fetch-report` returns both in its SELECT. |
| DB-02 | Admin notification email includes the language and sub-niche of the completed audit | `send-notification` reads `language` and `sub_niche` from the webhook record. `buildAdminEmailHtml()` renders human-readable labels. Language-aware report URL uses the stored language value. |
| DB-03 | `sanitizeText()` correctly handles Cyrillic characters (no stripping of Bulgarian input) | Replace `\w` with Unicode-aware `\p{L}\p{N}` pattern. Same fix for `sanitizeBusinessName()`. Strip emoji via Unicode emoji ranges. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Supabase Postgres | (hosted) | Migration for new columns | Project's existing database |
| Supabase Edge Functions (Deno) | v2 | Edge function updates | Project's existing runtime |
| supabase-js | 2.x | Client-side DB operations | Already installed, used in submitAudit |

### Supporting
No new libraries needed. All changes use existing project dependencies.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Top-level `language`/`sub_niche` columns | Store inside `form_data` JSONB | JSONB requires extraction operators in queries; top-level columns are indexable, queryable, and consistent with existing schema pattern (`niche`, `business_name`, etc.) |
| URL param for language source | i18next `i18n.language` | URL is the single source of truth in this project (per Phase 6 design). However, at submission time the i18n language is already synced with the URL by `LangLayout`, so either works. URL param via `useLang()` is more explicit and already used in Loading.tsx |

**Recommendation:** Top-level columns and `useLang()` hook as language source.

## Architecture Patterns

### Pattern 1: Database Migration -- Add Nullable Columns
**What:** Single migration adding two nullable TEXT columns to the existing `audits` table
**When to use:** When extending an existing table with optional data that old rows don't have

```sql
-- Migration: add language and sub-niche columns
ALTER TABLE public.audits
  ADD COLUMN language TEXT,
  ADD COLUMN sub_niche TEXT;
```

**Why nullable without defaults:** The CONTEXT.md decision is "old audit rows: leave untouched, no backfill." Nullable columns with no DEFAULT avoid touching existing rows. Code must handle null gracefully (legacy audits).

**No CHECK constraint on language:** Only two values today (`en`, `bg`), but adding a CHECK constraint limits future extensibility. The frontend already enforces valid values. Same reasoning applies to `sub_niche` -- the 17 valid values are enforced by the frontend's TypeScript types and Step 1 validation.

### Pattern 2: Frontend Language Source via useLang()
**What:** Pass `lang` from the `useLang()` hook through to `submitAudit()`
**When to use:** When the frontend needs to persist the active language at submission time

The `useLang()` hook derives language from the URL parameter (the single source of truth established in Phase 6). At submission time in `AuditForm.tsx`, the language is available via `useLang()`. Pass it through `submitAudit()` to persist alongside the form data.

```typescript
// In AuditForm.tsx (or Loading.tsx where submitAudit is called)
const { lang } = useLang();

// Updated submitAudit signature
export async function submitAudit(
  formState: AuditFormState,
  scores: AuditScores,
  language: string
): Promise<string> {
  // ... insert includes language and formState.subNiche
}
```

**Key observation:** `submitAudit()` is called in `Loading.tsx` (line 177), not `AuditForm.tsx`. The `useLang()` hook is already imported in `Loading.tsx` (line 16). The language value needs to be passed from `Loading.tsx` to `submitAudit()`.

### Pattern 3: Webhook Record for Edge Function Data
**What:** `send-notification` reads `language` and `sub_niche` directly from the webhook `record` payload
**When to use:** When the Database Webhook already delivers the full row

The `send-notification` edge function receives the full `audits` row via the Database Webhook payload (`payload.record`). Adding `language` and `sub_niche` to the table means they arrive automatically in `record` -- no extra DB query needed.

```typescript
// In send-notification/index.ts
interface AuditRecord {
  // ... existing fields ...
  language: string | null    // NEW
  sub_niche: string | null   // NEW
}
```

### Pattern 4: Unicode-Aware Sanitization
**What:** Replace ASCII-only `\w` with Unicode property escapes `\p{L}` and `\p{N}`
**When to use:** When sanitizing user input that may contain non-Latin scripts

```typescript
// BEFORE (strips Cyrillic):
.replace(/[^\w\s.,!?'-]/g, ' ')

// AFTER (preserves all Unicode letters and digits):
.replace(/[^\p{L}\p{N}\s.,!?'-]/u, ' ')
```

The `/u` flag enables Unicode mode, which makes `\p{L}` (any Unicode letter) and `\p{N}` (any Unicode digit) work. Deno (V8 engine) fully supports Unicode property escapes.

### Pattern 5: Emoji Stripping
**What:** Remove emoji characters while preserving natural-language scripts
**When to use:** Per CONTEXT.md decision -- "Strip emoji from free-text fields"

```typescript
// Strip emoji: Unicode ranges for emoji, dingbats, symbols, pictographs
.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{20E3}]/gu, '')
```

Alternative simpler approach: use the Unicode `\p{Emoji_Presentation}` property (supported in V8/Deno):
```typescript
.replace(/\p{Emoji_Presentation}/gu, '')
```

**Recommendation:** Use `\p{Emoji_Presentation}` for clarity, with a test to verify behavior. This strips visual emoji while preserving text characters like `#`, `*`, and digit keycaps that have emoji variants but are primarily text.

### Pattern 6: Language-Aware Report URL in Email
**What:** Build the report URL using the stored `language` field
**When to use:** Admin and user notification emails need the correct language-prefixed URL

```typescript
// Current (hardcoded, no language awareness):
const reportUrl = `https://bizaudit.epsystems.dev/report/${record.id}`

// Updated (language-aware):
const langPrefix = record.language === 'en' ? '/en' : ''
const reportUrl = `https://bizaudit.epsystems.dev${langPrefix}/report/${record.id}`
```

**Important:** The project's URL scheme is: Bulgarian = no prefix (default), English = `/en/` prefix. This matches the `useLang()` hook and `LangLayout` component behavior. The CONTEXT.md says `/bg/report/:id` for Bulgarian, but the actual app routing redirects `/bg/*` to `/*` (see `LangLayout.tsx` line 13-16). So the correct URL for Bulgarian is `/report/:id` (no prefix), not `/bg/report/:id`.

### Pattern 7: Human-Readable Labels in Admin Email
**What:** Map stored keys to display labels for the admin email
**When to use:** Displaying `sub_niche` and `language` in email body

```typescript
// Sub-niche labels -- same map already exists in generate-report/index.ts
const SUB_NICHE_LABELS: Record<string, string> = {
  hvac: 'HVAC', plumbing: 'Plumbing', /* ... */
};

// Language labels
const LANGUAGE_LABELS: Record<string, string> = {
  en: 'English',
  bg: 'Bulgarian',
};
```

**Consideration for DRY:** The `SUB_NICHE_LABELS` map is duplicated from `generate-report`. In edge functions, each function deploys independently, so shared code must go in the `_shared/` directory. However, this is a small static map (17 entries) and the sync comment pattern is already established (see Phase 9 decision). Keep the duplication with sync comments.

### Anti-Patterns to Avoid
- **Adding a NOT NULL column without a DEFAULT to an existing table:** This will fail if any rows exist. Use nullable columns (per CONTEXT.md decision).
- **Reading language from `form_data` JSONB:** Language is not currently stored in `AuditFormState`. Adding it there would require changing the reducer, actions, and type definitions. Instead, pass it as a separate parameter.
- **Using `\w` for Unicode text matching:** `\w` is ASCII-only in JavaScript/Deno. Always use `\p{L}` and `\p{N}` with the `/u` flag for internationalized text.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Unicode character classification | ASCII character ranges | `\p{L}`, `\p{N}`, `\p{Emoji_Presentation}` Unicode property escapes | Unicode has thousands of code points across scripts; property escapes handle them all correctly |
| Sub-niche label resolution | Inline conditionals | Static lookup map (`SUB_NICHE_LABELS`) | 17 sub-niches make conditionals unmaintainable; map is O(1) and self-documenting |

**Key insight:** The sanitization fix is the only technically tricky part of this phase. Everything else is mechanical wiring (add column, pass field, display field).

## Common Pitfalls

### Pitfall 1: JavaScript \w Does Not Match Unicode
**What goes wrong:** `\w` in JavaScript regex matches only `[A-Za-z0-9_]`. Cyrillic, Arabic, CJK, and all other non-Latin characters are stripped by `/[^\w...]/g`.
**Why it happens:** JavaScript's regex engine uses ASCII semantics for `\w` even with the `/u` flag. The `/u` flag enables `\p{}` property escapes but does NOT change `\w` behavior.
**How to avoid:** Use `\p{L}` (Unicode Letter) and `\p{N}` (Unicode Number) with the `/u` flag instead of `\w`.
**Warning signs:** Any regex using `\w` on user input that may contain non-ASCII text.

### Pitfall 2: Emoji Property Escape Variations
**What goes wrong:** `\p{Emoji}` matches too broadly -- it includes ASCII digits (0-9), `#`, and `*` because they have emoji variants (keycap sequences).
**Why it happens:** Unicode defines several emoji-related properties with different scopes.
**How to avoid:** Use `\p{Emoji_Presentation}` (characters that default to emoji display) or `\p{Extended_Pictographic}` (broader but excludes text characters). Test with actual emoji and Cyrillic input.
**Warning signs:** Stripping digits or common punctuation when you only intended to strip emoji.

### Pitfall 3: Migration Column Order and Webhook Payloads
**What goes wrong:** After adding columns via migration, the Database Webhook sends the updated row including new columns. If the `send-notification` function deploys BEFORE the migration runs, it will receive `null` for the new columns. If it runs AFTER, the TypeScript interface needs updating.
**Why it happens:** Migration and edge function deployment are separate steps.
**How to avoid:** Deploy in order: (1) migration first, (2) edge functions second. Design edge function code to handle null values for both columns (which it should anyway for legacy rows).
**Warning signs:** TypeScript errors about missing properties; email shows "null" or "undefined".

### Pitfall 4: Report URL Language Mismatch with Routing
**What goes wrong:** CONTEXT.md says `/bg/report/:id` for Bulgarian, but the app's actual routing redirects `/bg/*` to `/*`. If the email uses `/bg/report/:id`, the user will see a redirect flash.
**Why it happens:** The CONTEXT.md decision was made before checking the app's routing behavior.
**How to avoid:** Use the app's actual URL scheme: no prefix for Bulgarian (default), `/en/` prefix for English. The email URL should match what the user would see after the redirect resolves.
**Warning signs:** Email links causing visible redirects; users bookmarking the redirected URL instead of the email URL.

### Pitfall 5: submitAudit Signature Change Breaking Callers
**What goes wrong:** Adding a `language` parameter to `submitAudit()` requires updating all call sites.
**Why it happens:** TypeScript will catch this at compile time, but it's easy to forget in edge cases.
**How to avoid:** There is exactly one call site: `Loading.tsx` line 177. The `lang` value is already available in `Loading.tsx` via the `useLang()` hook (line 16). Update the single call site.
**Warning signs:** TypeScript compile errors after changing the function signature.

## Code Examples

### Example 1: Updated sanitizeText (Cyrillic-safe)
```typescript
// Source: Verified in Deno/V8 — Unicode property escapes supported since V8 6.4
function sanitizeText(input: string | undefined, maxLen: number = 500): string {
  if (!input) return ''
  return input
    .replace(/<[^>]*>/g, '')                    // strip HTML tags
    .replace(/\p{Emoji_Presentation}/gu, '')    // strip emoji (keep text chars)
    .replace(/[^\p{L}\p{N}\s.,!?'-]/gu, ' ')   // keep letters (any script), digits, common punctuation
    .replace(/\s+/g, ' ')                       // normalize whitespace
    .trim()
    .slice(0, maxLen)
}
```

### Example 2: Updated sanitizeBusinessName (Cyrillic-safe)
```typescript
function sanitizeBusinessName(name: string | undefined): string {
  if (!name) return 'Your Business'
  return name
    .replace(/<[^>]*>/g, '')                    // strip HTML tags
    .replace(/\p{Emoji_Presentation}/gu, '')    // strip emoji
    .replace(/[^\p{L}\p{N}\s.,&'-]/gu, ' ')    // keep letters, digits, & for business names
    .replace(/\s+/g, ' ')                       // normalize whitespace
    .trim()
    .slice(0, 100)
}
```

### Example 3: Updated submitAudit with language and sub_niche
```typescript
export async function submitAudit(
  formState: AuditFormState,
  scores: AuditScores,
  language: string
): Promise<string> {
  const id = crypto.randomUUID()

  const { error } = await supabase
    .from('audits')
    .insert({
      id,
      niche: formState.niche,
      sub_niche: formState.subNiche ?? null,
      language,
      business_name: formState.step1.businessName,
      contact_name: formState.step1.contactName,
      contact_email: formState.step1.email,
      contact_phone: formState.step1.phone ?? null,
      partner_code: formState.partnerCode ?? null,
      overall_score: scores.overall,
      form_data: formState,
      scores: scores,
    })

  if (error) {
    throw new Error(`Audit submission failed: ${error.message}`)
  }

  return id
}
```

### Example 4: Admin Email Language/Sub-niche Section
```typescript
// In buildAdminEmailHtml — add after the Niche row in the contact table
const LANGUAGE_LABELS: Record<string, string> = { en: 'English', bg: 'Bulgarian' };
const languageDisplay = record.language ? LANGUAGE_LABELS[record.language] ?? record.language : null;
const subNicheDisplay = record.sub_niche ? (SUB_NICHE_LABELS[record.sub_niche] ?? record.sub_niche) : null;

// Conditional rows (omit if null — legacy audit handling)
const languageRow = languageDisplay
  ? `<tr><td style="...">Language</td><td style="...">${escapeHtml(languageDisplay)}</td></tr>`
  : '';
const subNicheRow = subNicheDisplay
  ? `<tr><td style="...">Sub-niche</td><td style="...">${escapeHtml(subNicheDisplay)}</td></tr>`
  : '';
```

### Example 5: fetch-report Updated SELECT
```typescript
// Add language and sub_niche to the select
const { data: audit, error: auditError } = await supabaseAdmin
  .from('audits')
  .select('id, niche, business_name, form_data, scores, report_status, created_at, language, sub_niche')
  .eq('id', auditId)
  .single()
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `\w` for word characters | `\p{L}\p{N}` with `/u` flag | ES2018 / V8 6.4 | Enables proper Unicode text handling in regex |
| Manual emoji ranges | `\p{Emoji_Presentation}` | ES2018 / V8 6.4 | Cleaner, maintained by Unicode Consortium |

**Deprecated/outdated:**
- Using `\w` for internationalized text: was never correct for non-ASCII, but commonly used. The Unicode property escape alternative has been available since 2018.

## Open Questions

1. **Report URL in email for Bulgarian audits**
   - What we know: App routing redirects `/bg/*` to `/*` (Bulgarian is the default, no prefix). CONTEXT.md says "Language-aware URL -- `/bg/report/:id` for Bulgarian audits."
   - What's unclear: Whether the user wants the email URL to be `/bg/report/:id` (which will redirect) or just `/report/:id` (the final resolved URL).
   - Recommendation: Use `/report/:id` for Bulgarian (no prefix) and `/en/report/:id` for English. This matches the app's actual routing behavior and avoids a redirect. Flag for user review during planning.

2. **Missing sub-niche on submission**
   - What we know: Step 1 validation requires `subNiche` (line 30 of AuditForm.tsx: `if (!state.subNiche) errors.push(...)`). Users cannot proceed past Step 1 without selecting a sub-niche.
   - What's unclear: Whether there are edge cases (direct URL manipulation, restored state from before Phase 8, etc.) where a submission could arrive without a sub-niche.
   - Recommendation: Store `null` if not present (nullable column handles this). The validation gate means this is unlikely in normal flow, and the code already handles null throughout (e.g., generate-report's `subNicheKey` fallback).

## Sources

### Primary (HIGH confidence)
- `supabase/functions/generate-report/index.ts` -- current sanitizeText implementation, sub-niche label map, prompt building
- `supabase/functions/send-notification/index.ts` -- current admin email HTML template, webhook payload handling
- `supabase/functions/fetch-report/index.ts` -- current SELECT query, response shape
- `supabase/migrations/*.sql` -- current database schema (3 migration files)
- `src/lib/submitAudit.ts` -- current insert operation
- `src/types/audit.ts` -- AuditFormState with subNiche field
- `src/hooks/useLang.ts` -- language derivation from URL
- `src/components/LangLayout.tsx` -- /bg/* redirect behavior
- `src/pages/Loading.tsx` -- submitAudit call site, generate-report invocation
- `src/config/subNicheConfig.ts` -- SUB_NICHE_REGISTRY with all 17 sub-niches
- `src/lib/fetchReport.ts` -- FetchReportResult interface

### Secondary (MEDIUM confidence)
- V8 Unicode property escapes: Supported since V8 6.4 (2018). Deno uses V8, so `\p{L}`, `\p{N}`, `\p{Emoji_Presentation}` are available.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies, all changes use existing project infrastructure
- Architecture: HIGH -- patterns directly observed in the codebase, mechanical wiring
- Pitfalls: HIGH -- the Cyrillic stripping issue is confirmed by reading the actual regex; Unicode property escape behavior is well-documented

**Research date:** 2026-02-22
**Valid until:** 2026-03-22 (stable domain -- no rapidly changing dependencies)

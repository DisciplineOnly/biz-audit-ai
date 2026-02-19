# Stack Research

**Domain:** Business Audit SaaS — Supabase backend + AI report generation added to existing React SPA
**Researched:** 2026-02-19
**Confidence:** HIGH (Supabase/client integration), MEDIUM (LLM model selection), HIGH (email)

> **Scope note:** This document covers only the *new* backend/AI layer being added. The existing React 18 / Vite 5 / TypeScript 5 / Tailwind 3 / shadcn/ui frontend is already in place and not re-researched here.

---

## Recommended Stack

### Core Backend — Supabase

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| @supabase/supabase-js | ^2.97.0 | Client-side SDK — database reads/writes, edge function invocation | Official client; v2 is the current stable major. The singleton pattern (`createClient` exported once from a module) prevents multiple instances during React render cycles. Latest as of 2026-02-19. |
| Supabase Edge Functions | Deno runtime (managed) | Server-side TypeScript — AI report generation, email dispatch | Runs on Deno V8 isolates; no Node.js server to manage. Deployed via Supabase CLI. Free tier: 500K invocations/month. Paid: 400s wall-clock timeout. |
| Supabase Postgres | 15.x (managed) | Persistent storage for audit submissions, generated reports, lead emails | Already included in Supabase project. No separate database to provision. Row Level Security (RLS) enforces per-row access without application-layer guards. |
| Supabase Database Webhooks | pg_net extension (managed) | Trigger edge functions automatically on INSERT | Thin wrapper around pg_net; fires *after* a DB change, asynchronously — does not block the insert. Configured via Supabase Dashboard without writing raw trigger SQL. |

### AI Report Generation

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| openai (npm) | ^6.22.0 | OpenAI API client inside Edge Functions | Official SDK; supports both Node.js and Deno runtimes. Vercel AI SDK is NOT recommended here — it requires Vercel Edge Runtime, which is incompatible with Supabase's Deno environment. |
| GPT-4.1 mini (model) | gpt-4.1-mini | LLM for generating personalized audit report text | Released April 2025. Beats GPT-4o on most benchmarks, 1M token context window (vs 128K for gpt-4o-mini), 83% cheaper than full GPT-4.1. Knowledge cutoff June 2024. Better instruction-following than gpt-4o-mini. At ~$0.40/$1.60 per M tokens (input/output), a 2000-token report costs < $0.004. |
| OpenAI Structured Outputs | response_format: json_schema | Guarantee valid JSON from LLM (section-by-section report) | Supported on gpt-4.1-mini. Eliminates JSON parse errors that plague prompt-only approaches. Use for the report schema; free-text sections can still contain rich prose within the schema fields. |

### Email

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Resend (npm) | ^6.9.2 | Transactional email from Edge Functions | Official Supabase integration partner. The Supabase docs use Resend in all email examples. Free tier: 3,000 emails/month, 100/day. Can call via raw fetch (no npm needed in Deno) or via `npm:resend` import. Requires verified sender domain. |

### Supporting Libraries (Frontend additions)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @tanstack/react-query | ^5.83.0 | Already in package.json — use for Supabase async calls | Already installed. Wrap Supabase calls in `useQuery`/`useMutation`. Provides caching, loading states, and error handling without manual `useState`. |
| zod | ^3.25.76 | Already in package.json — validate audit form data before DB insert | Already installed. Define a `AuditSubmissionSchema` and validate client-side before calling Supabase. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Supabase CLI | Local Edge Function dev, migrations, secrets management | `npx supabase init` if not already done. `supabase functions serve --env-file .env.local` for local function testing. Required for deployment: `supabase functions deploy`. |
| Supabase Dashboard | Database webhooks config, RLS policy editor, secrets UI | Configure DB webhooks via Dashboard rather than raw SQL — simpler for INSERT→edge-function patterns. |
| .env.local | Store `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` | Vite reads `VITE_` prefixed vars. Do NOT commit. The publishable key (formerly "anon key") is safe to expose client-side — RLS is the security layer. |
| supabase/functions/.env | Store `OPENAI_API_KEY`, `RESEND_API_KEY` | Edge Function secrets. Local: passed via `--env-file`. Production: `supabase secrets set OPENAI_API_KEY=...`. Never exposed to browser. |

---

## Installation

```bash
# Frontend — Supabase client (add to existing project)
npm install @supabase/supabase-js

# Supabase CLI (dev dependency or global)
npm install -D supabase

# Initialize Supabase in project (creates supabase/ folder)
npx supabase init

# Edge function dependencies are imported inside the Deno functions themselves
# using npm: specifier — no npm install needed for server-side packages:
# import OpenAI from "npm:openai@^6";
# import { Resend } from "npm:resend@^6";
```

---

## Client Setup Pattern

```typescript
// src/lib/supabase.ts — singleton, reused everywhere
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,   // no user accounts — disable auth session storage
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
})
```

This SPA has no user accounts, only email capture. Disabling auth session management keeps the client lean and avoids localStorage pollution.

## Edge Function Pattern (AI Report Generation)

```typescript
// supabase/functions/generate-report/index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import OpenAI from "npm:openai@^6";

const openai = new OpenAI({ apiKey: Deno.env.get("OPENAI_API_KEY") });

Deno.serve(async (req: Request) => {
  const { auditData } = await req.json();

  const completion = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: JSON.stringify(auditData) },
    ],
    response_format: {
      type: "json_schema",
      json_schema: { name: "audit_report", schema: REPORT_SCHEMA },
    },
  });

  const report = JSON.parse(completion.choices[0].message.content!);

  return new Response(JSON.stringify(report), {
    headers: { "Content-Type": "application/json" },
  });
});
```

## RLS Policy for Anonymous Insert (no user accounts)

```sql
-- Enable RLS on audit_submissions table
ALTER TABLE audit_submissions ENABLE ROW LEVEL SECURITY;

-- Allow anon role to INSERT (email capture, audit data)
CREATE POLICY "anon_can_insert"
ON audit_submissions
FOR INSERT
TO anon
WITH CHECK (true);

-- No SELECT policy for anon = anon cannot read any rows
-- Service role (edge functions) can read all rows — no policy needed for service role
```

The `anon` role is the publishable key role. Anyone with the key can insert — but cannot read other submissions. Edge functions run as service role and bypass RLS entirely.

## Database Webhook → Edge Function Pattern

```
User completes audit → React calls supabase.from('audit_submissions').insert(data)
                      → Postgres INSERT fires
                      → Database Webhook (pg_net) calls generate-report edge function
                      → Edge function calls OpenAI, stores report in audit_reports table
                      → Edge function calls Resend, sends email to user
```

Configure in Supabase Dashboard: Database → Webhooks → Create new webhook on `audit_submissions` INSERT event, targeting `https://<project>.supabase.co/functions/v1/generate-report`.

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| GPT-4.1 mini | GPT-4o mini | Only if you need extreme cost minimization and lower intelligence is acceptable. 2.7x cheaper but significantly weaker instruction-following. |
| GPT-4.1 mini | Claude 3.5 Haiku (@anthropic-ai/sdk ^0.76.0) | If you want Anthropic over OpenAI. Similar capability tier. Requires different SDK (`npm:@anthropic-ai/sdk`) and slightly different API shape. No meaningful advantage for this use case. |
| GPT-4.1 mini | GPT-4.1 (full) | Only if report quality is demonstrably insufficient after testing mini. ~8-10x more expensive. |
| Resend | Supabase built-in SMTP | Supabase SMTP is for auth emails only (password reset etc.). Resend is for custom transactional emails from edge functions. |
| Resend | SendGrid / Postmark | Resend has the tightest Supabase integration, cleaner API, and generous free tier. Use alternatives only if Resend's domain verification is a blocker. |
| Database Webhooks (pg_net) | Direct client invocation of edge function | Direct call from React works but means the browser waits for LLM generation (~5–15s). Webhook pattern decouples: insert returns immediately, report is generated async. |
| OpenAI SDK direct | Vercel AI SDK | Vercel AI SDK is optimized for Next.js + Vercel Edge Runtime. Supabase Edge Functions use Deno — the Vercel AI SDK's streaming primitives don't map cleanly. OpenAI SDK supports Deno natively. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Vercel AI SDK (`ai` npm package) inside Supabase Edge Functions | Designed for Vercel's Node.js edge runtime. Deno compatibility is partial and undocumented for this use case. Introduces unnecessary abstraction when you only need one LLM provider. | `npm:openai` directly in Deno |
| LangChain | Massive dependency tree, 20MB bundle limit on edge functions would be a risk, significant overhead for a single-prompt use case. Overkill for structured report generation. | Direct OpenAI SDK |
| Supabase Auth (user accounts) | Project spec says "no user accounts." Adding auth for email-capture-only flow adds complexity with zero benefit. Email is captured as plain data. | Simple table insert with anon RLS |
| Server-side PDF generation in Edge Functions | pdf-lib and pdfkit have Deno compatibility issues (file system access blocked). 20MB function size limit is tight with PDF libraries. | Generate HTML report client-side; let browser print/save as PDF if needed. Or use a dedicated PDF API service (Doppio, Puppeteer-based) only if PDF download is a hard requirement. |
| `@supabase/ssr` package | Only needed for SSR frameworks (Next.js, SvelteKit). This is a Vite SPA — `@supabase/supabase-js` alone is correct. | `@supabase/supabase-js` with `persistSession: false` |
| OpenAI Assistants API | Deprecated. Shuts down August 26, 2026. | Chat Completions API with structured outputs |

---

## Stack Patterns by Variant

**If report generation must be synchronous (user waits on screen):**
- Call edge function directly from React using `supabase.functions.invoke('generate-report', { body: auditData })`
- Show loading state while waiting (~5–15s for GPT-4.1 mini)
- Skip the database webhook pattern
- Risk: if user closes tab, report is lost

**If report must be delivered only via email (fully async):**
- Use database webhook pattern (INSERT → webhook → edge function → email)
- React shows "Check your email" immediately after insert
- No polling needed
- Recommended for this use case

**If you need to poll for report readiness (hybrid):**
- Store report status in `audit_reports` table (`status: 'pending' | 'complete' | 'error'`)
- React polls with `useQuery` refetchInterval until status is `complete`
- User stays on page but isn't blocked

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| @supabase/supabase-js@^2.97.0 | Node.js 20+, all modern browsers | Node.js 18 support dropped at v2.79.0. Vite SPA doesn't run on Node.js anyway — browser-side only. |
| openai@^6 (Deno, npm: specifier) | Supabase Edge Functions Deno runtime | Import as `npm:openai@^6` inside edge functions. Do NOT import from `https://deno.land/x/openai` — that pinned version (v4.24.0) in older Supabase docs is outdated. |
| resend@^6.9.2 | Deno via npm: specifier | Import as `npm:resend@^6` or use raw `fetch` to Resend API — both work in Deno. |
| GPT-4.1 mini | Structured Outputs (json_schema response_format) | Confirmed supported. gpt-4o-mini also supports structured outputs. |

---

## Key Constraints to Design Around

| Constraint | Limit | Impact |
|-----------|-------|--------|
| Edge Function wall-clock timeout | 400s (paid) / 150s (free) | GPT-4.1 mini typically responds in 5–15s for a 2000-token report. Well within limits. No streaming needed. |
| Edge Function CPU time | 2s per request (async I/O excluded) | OpenAI call is async I/O (excluded from CPU time). The 2s limit applies to CPU-bound work only. |
| Edge Function memory | 256 MB | Not a concern for text-only report generation. |
| Edge Function bundle size | 20 MB | Avoid LangChain and large libraries. OpenAI SDK + Resend are small. |
| Resend free tier | 3,000 emails/month, 100/day | Adequate for early traction. Upgrade at ~$20/month for 50K emails. |
| Supabase free tier | 500K edge function invocations/month | Each audit completion = 1 invocation. 500K audits/month before hitting limit. |
| Resend sender domain | Must be verified | Cannot use `gmail.com` or unverified domains. Need a real domain with DNS access. |

---

## Sources

- [supabase/supabase-js GitHub](https://github.com/supabase/supabase-js) — v2.97.0 latest confirmed
- [Supabase React Quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/reactjs) — official setup pattern
- [Supabase Edge Functions docs](https://supabase.com/docs/guides/functions) — Deno runtime, architecture
- [Supabase Edge Function Limits](https://supabase.com/docs/guides/functions/limits) — 400s timeout, 256MB memory, 20MB bundle (HIGH confidence, fetched directly)
- [Supabase Send Emails example](https://supabase.com/docs/guides/functions/examples/send-emails) — Resend pattern (HIGH confidence, fetched directly)
- [Supabase OpenAI example](https://supabase.com/docs/guides/ai/examples/openai) — edge function + OpenAI pattern (HIGH confidence, fetched directly)
- [Supabase Database Webhooks](https://supabase.com/docs/guides/database/webhooks) — pg_net webhook on INSERT (HIGH confidence, fetched directly)
- [Supabase RLS docs](https://supabase.com/docs/guides/database/postgres/row-level-security) — anon INSERT policy (HIGH confidence, fetched directly)
- [openai npm](https://www.npmjs.com/package/openai) — v6.22.0 confirmed current (HIGH confidence)
- [resend npm](https://www.npmjs.com/package/resend) — v6.9.2 confirmed current (HIGH confidence)
- [GPT-4.1 mini launch](https://openai.com/index/gpt-4-1/) — model capabilities, pricing (MEDIUM confidence — search-verified)
- [OpenAI SDK vs Vercel AI SDK comparison](https://strapi.io/blog/openai-sdk-vs-vercel-ai-sdk-comparison) — runtime compatibility analysis (MEDIUM confidence)
- [Supabase + TanStack Query pattern](https://makerkit.dev/blog/saas/supabase-react-query) — integration approach (MEDIUM confidence)

---

*Stack research for: BizAudit — Supabase backend + AI report generation added to existing React/Vite SPA*
*Researched: 2026-02-19*

# Architecture Research

**Domain:** Supabase backend integration with existing React/Vite SPA
**Researched:** 2026-02-19
**Confidence:** HIGH (primary patterns verified against Supabase official docs; edge function/OpenAI patterns confirmed against official examples)

## Standard Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                        BROWSER (Vercel/Netlify CDN)              │
│                                                                  │
│  ┌──────────────┐  ┌─────────────────┐  ┌───────────────────┐   │
│  │  AuditForm   │  │    Loading      │  │     Report        │   │
│  │  (8-step UI) │  │  (fake spinner) │  │   (display)       │   │
│  └──────┬───────┘  └────────┬────────┘  └─────────┬─────────┘   │
│         │                   │                     │             │
│         └──────────┬────────┘                     │             │
│                    │                              │             │
│         ┌──────────▼──────────────────────────────▼──────────┐  │
│         │              supabase-js client                      │  │
│         │   (publishable key / anon key, no user JWT)         │  │
│         └──────────────────────┬───────────────────────────────┘  │
└────────────────────────────────│──────────────────────────────────┘
                                 │  HTTPS
┌────────────────────────────────▼──────────────────────────────────┐
│                        SUPABASE PLATFORM                           │
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                     API Gateway / PostgREST                  │  │
│  └──────┬────────────────────────────┬───────────────────────┘  │
│         │ (RLS anon INSERT)          │ (Edge Function invoke)    │
│  ┌──────▼──────────┐      ┌──────────▼──────────────────────┐   │
│  │    Postgres DB   │      │           Edge Functions         │   │
│  │                  │      │                                  │   │
│  │  audits          │      │  generate-report                 │   │
│  │  ┌────────────┐  │      │  (calls OpenAI, returns JSON)    │   │
│  │  │ id (uuid)  │  │      │                                  │   │
│  │  │ email      │  │      │  send-notification               │   │
│  │  │ niche      │  │      │  (calls Resend API, admin email) │   │
│  │  │ form_data  │  │      │                                  │   │
│  │  │ scores     │  │      └─────────────────────────────────┘   │
│  │  │ ai_report  │  │                                            │
│  │  │ partner_cd │  │      ┌─────────────────────────────────┐   │
│  │  │ created_at │  │      │      Database Webhook            │   │
│  │  └────────────┘  │◄─────│  ON INSERT to audits            │   │
│  │                  │      │  → triggers send-notification    │   │
│  └──────────────────┘      └─────────────────────────────────┘   │
│                                                                    │
│  External Services called from Edge Functions:                     │
│    OpenAI API (GPT-4o / gpt-4o-mini)                              │
│    Resend API (transactional email)                                │
└────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| React SPA (browser) | Form collection, client-side scoring, UX orchestration | Existing AuditForm + Loading + Report pages |
| supabase-js client | Single interface to all Supabase services from browser | `createClient(url, publishableKey)`, imported once in `src/lib/supabase.ts` |
| `audits` Postgres table | Persist every completed audit with contact info, scores, AI report | Single table with JSONB columns for `form_data`, `scores`, `ai_report` |
| `generate-report` Edge Function | Receive form data + scores, call LLM, return personalized report JSON | Deno function invoked directly from browser via `supabase.functions.invoke()` |
| `send-notification` Edge Function | Send admin email notification when new audit is stored | Deno function triggered by Database Webhook on INSERT to `audits` |
| Database Webhook | Fire `send-notification` automatically when a row is inserted | Supabase Dashboard webhook, event = INSERT, table = audits |
| RLS policy on `audits` | Allow anon INSERT (write-only for public), block SELECT for anon | `CREATE POLICY "anon can insert" ON audits FOR INSERT TO anon WITH CHECK (true)` |

---

## Recommended Project Structure

```
src/
├── lib/
│   ├── scoring.ts          # existing — client-side scoring engine
│   ├── utils.ts            # existing — cn() helper
│   └── supabase.ts         # NEW — createClient singleton
├── services/
│   └── audit.ts            # NEW — submitAudit(), fetchReport() wrappers
├── types/
│   └── audit.ts            # existing + extend with AuditRecord type
├── pages/
│   ├── AuditForm.tsx       # modify — call submitAudit() on completion
│   ├── Loading.tsx         # modify — await generate-report edge function
│   └── Report.tsx          # modify — read AI report text if available
├── components/             # existing — unchanged
└── hooks/
    └── use-audit-submit.ts # NEW — loading/error state for submission

supabase/
├── functions/
│   ├── generate-report/
│   │   └── index.ts        # Edge function: receive form+scores, call LLM, return JSON
│   └── send-notification/
│       └── index.ts        # Edge function: receive audit row, send email via Resend
└── migrations/
    └── 20260219_create_audits.sql
```

### Structure Rationale

- **`src/lib/supabase.ts`:** Single `createClient` call. Import this everywhere instead of constructing the client inline. Prevents duplicate connections.
- **`src/services/audit.ts`:** Abstracts all Supabase calls behind typed functions. When the API changes, only this file needs to update. Keeps page components free of SDK details.
- **`supabase/functions/`:** Supabase CLI convention. Each function is a directory with `index.ts`. Deployed via `supabase functions deploy`.
- **`supabase/migrations/`:** Schema tracked in version control. Applied via `supabase db push` or the MCP `apply_migration` tool.

---

## Architectural Patterns

### Pattern 1: Direct Edge Function Invocation (LLM Report Generation)

**What:** Browser calls the `generate-report` edge function directly and awaits the response before navigating to the report page. The Loading page's existing spinner covers the wait time.

**When to use:** When the result is needed immediately by the user (report content) and the operation is long-running (1–5 seconds).

**Trade-offs:** The Loading screen already exists and takes ~14 seconds — the LLM call (2–4 seconds) fits inside this window. The user never perceives additional latency.

**Example:**
```typescript
// src/services/audit.ts
import { supabase } from "@/lib/supabase";
import { AuditFormState, AuditScores } from "@/types/audit";

export async function generateAIReport(
  formState: AuditFormState,
  scores: AuditScores
): Promise<AuditReportContent> {
  const { data, error } = await supabase.functions.invoke("generate-report", {
    body: { formState, scores },
  });
  if (error) throw error;
  return data as AuditReportContent;
}
```

```typescript
// supabase/functions/generate-report/index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import OpenAI from "https://deno.land/x/openai@v4.24.0/mod.ts";

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, content-type",
      },
    });
  }

  const { formState, scores } = await req.json();
  const openai = new OpenAI({ apiKey: Deno.env.get("OPENAI_API_KEY") });

  const prompt = buildPrompt(formState, scores); // construct LLM prompt from audit data

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" }, // structured JSON output
  });

  const reportContent = JSON.parse(completion.choices[0].message.content!);

  return new Response(JSON.stringify(reportContent), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
});
```

**CORS note (HIGH confidence):** Edge functions require manual CORS handling. The OPTIONS preflight response must be returned before any logic runs. This is the most common edge function failure point.

---

### Pattern 2: Insert-then-Webhook (Email Notification)

**What:** Browser inserts the completed audit record to Postgres via the supabase-js client. A Supabase Database Webhook fires automatically on INSERT, calling the `send-notification` edge function with the new row's data. The browser does not wait for email delivery.

**When to use:** For side effects (notifications, analytics) that the user does not need to see complete. Decouples email delivery from the user's browser session.

**Trade-offs:** The browser INSERT and email are decoupled — if the edge function fails, the audit is still saved. Email failures can be retried or monitored server-side without affecting the user.

**Example:**
```typescript
// src/services/audit.ts
export async function persistAudit(
  formState: AuditFormState,
  scores: AuditScores,
  aiReport: AuditReportContent
): Promise<string> {
  const { data, error } = await supabase
    .from("audits")
    .insert({
      email: formState.step1.email,
      niche: formState.niche,
      form_data: formState,        // JSONB
      scores: scores,              // JSONB
      ai_report: aiReport,        // JSONB
      partner_code: formState.partnerCode,
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id; // UUID — becomes the shareable report URL
}
```

```typescript
// supabase/functions/send-notification/index.ts
Deno.serve(async (req: Request) => {
  const payload = await req.json();
  // payload.record contains the inserted audits row
  const { email, niche, scores } = payload.record;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
    },
    body: JSON.stringify({
      from: "audits@yourdomain.com",
      to: Deno.env.get("ADMIN_EMAIL"),
      subject: `New audit: ${email} (${niche})`,
      html: buildAdminEmailHtml({ email, niche, scores }),
    }),
  });

  return new Response("ok", { status: 200 });
});
```

---

### Pattern 3: Anon INSERT with RLS (No-Auth Data Collection)

**What:** The browser uses the publishable/anon key to insert records. RLS is enabled with a permissive INSERT policy for the `anon` role, and a restrictive SELECT policy (anon cannot read other users' records).

**When to use:** Any time you accept public submissions without user authentication. This is the correct pattern for lead capture / form submission apps.

**Trade-offs:** Anyone with the publishable key can INSERT rows. This is expected and acceptable — the key is public by design. Rate limiting at the Supabase project level provides additional protection. SELECT access remains locked.

**Example:**
```sql
-- supabase/migrations/20260219_create_audits.sql

CREATE TABLE audits (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email        TEXT NOT NULL,
  niche        TEXT NOT NULL CHECK (niche IN ('home_services', 'real_estate')),
  form_data    JSONB NOT NULL,
  scores       JSONB NOT NULL,
  ai_report    JSONB,
  partner_code TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE audits ENABLE ROW LEVEL SECURITY;

-- Allow public (unauthenticated) INSERT — email capture pattern
CREATE POLICY "public can submit audits"
  ON audits FOR INSERT
  TO anon
  WITH CHECK (true);

-- Block anon SELECT — audit data is not public
-- (Only service_role / admin can read all rows)
-- No SELECT policy needed — RLS with no SELECT policy = blocked for anon
```

---

## Data Flow

### Audit Submission Flow (Complete Path)

```
[User clicks "Generate My AI Audit Report"]
    │
    ▼
[AuditForm.tsx: computeScores(state)] — client-side scoring (unchanged)
    │
    ▼
[navigate to /generating with { formState, scores }]
    │
    ▼
[Loading.tsx: supabase.functions.invoke("generate-report", { body: { formState, scores } })]
    │  (2–4 second LLM call — hidden by existing 14-second loading screen)
    ▼
[Edge Function: generate-report]
    │  builds prompt → calls OpenAI API → parses JSON response
    ▼
[aiReport returned to Loading.tsx]
    │
    ▼
[Loading.tsx: supabase.from("audits").insert({ ...formState, scores, aiReport })]
    │  returns audit UUID
    ▼
[Database INSERT committed to Postgres]
    │
    ├──► [Database Webhook fires → send-notification edge function]
    │         calls Resend API → admin email sent (async, browser not waiting)
    │
    ▼
[navigate to /report/[uuid] with { auditId, formState, scores, aiReport }]
    │
    ▼
[Report.tsx: renders AI report text instead of generateMockReport() template text]
```

### Report Access Flow (Shareable URL)

```
[User opens /report/[uuid] directly (shared link)]
    │
    ▼
[Report.tsx: no navigation state available]
    │
    ▼
[supabase.from("audits").select("*").eq("id", uuid).single()]
    │  Note: Requires a SELECT policy for the requesting role, OR
    │  a server-side fetch via service_role (more secure).
    │  Recommended: use a separate "fetch-report" edge function
    │  that validates the UUID and returns the row via service_role.
    ▼
[Render report from persisted ai_report JSONB]
```

**Note on shareable reports:** The anon RLS SELECT block means the browser cannot read back the audit row using the publishable key unless a SELECT policy is added. Two options: (1) add `FOR SELECT TO anon WITH CHECK (id = <id>)` using a URL-embedded UUID as the credential — acceptable since UUID is unguessable, or (2) create a `fetch-report` edge function that uses the service_role key server-side. Option 1 is simpler for this use case.

### State Management (What Changes vs. What Stays)

```
Current (client-only):
  AuditForm → computeScores → generateMockReport → Report (all in-memory/localStorage)

After Supabase integration:
  AuditForm → computeScores → Loading [invoke generate-report] → [insert to DB] → Report
                                  ↑ new async path                ↑ new persistence

  generateMockReport() can be kept as fallback if edge function fails.
```

---

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| OpenAI API | Called from `generate-report` edge function via Deno fetch / openai npm package | API key stored as Supabase secret (`OPENAI_API_KEY`), never exposed to browser |
| Resend API | Called from `send-notification` edge function via fetch | API key stored as Supabase secret (`RESEND_API_KEY`); admin email in `ADMIN_EMAIL` secret |
| Supabase Postgres | Accessed via supabase-js `from().insert()` in browser and via `createClient` with service_role in edge functions | anon key for browser writes; service_role key for edge function reads/writes |
| Supabase Edge Functions | Invoked from browser via `supabase.functions.invoke()` | CORS headers required in every edge function response |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Browser → Postgres | supabase-js INSERT via PostgREST REST API | Publishable/anon key, RLS enforced |
| Browser → Edge Function | `supabase.functions.invoke()` (HTTP POST) | Publishable/anon key in Authorization header; CORS required |
| Postgres → Edge Function | Database Webhook (pg_net HTTP POST) | Configured in Supabase Dashboard; fires on INSERT event; no browser involved |
| Edge Function → OpenAI | Deno `fetch()` or openai npm package | API key from `Deno.env.get("OPENAI_API_KEY")` |
| Edge Function → Resend | Deno `fetch()` to `https://api.resend.com/emails` | API key from `Deno.env.get("RESEND_API_KEY")` |
| Edge Function → Postgres | supabase-js with service_role key (if needed) | Edge functions have `SUPABASE_SERVICE_ROLE_KEY` auto-injected |

---

## Build Order (Dependencies)

The components have a strict dependency chain. Build in this order:

```
1. Postgres schema (audits table + RLS policies)
        ↓ required by
2. supabase-js client singleton (src/lib/supabase.ts)
        ↓ required by
3. generate-report edge function (LLM call)
        ↓ tested and working before
4. send-notification edge function (Resend email)
        ↓ wired via
5. Database Webhook (INSERT on audits → send-notification)
        ↓ all backend ready, then
6. Audit submission service (src/services/audit.ts)
        ↓ integrated into
7. Loading.tsx modification (invoke generate-report, then insert)
        ↓ final piece
8. Report.tsx modification (display AI report text; fallback to template)
```

**Rationale for this order:**
- The schema must exist before any code can write to it.
- The edge functions must be deployed before the frontend can call them.
- The webhook must be configured after `send-notification` is deployed (the dashboard webhook list only shows deployed functions).
- The frontend modifications are last — they depend on all backend components being testable in isolation first.
- Report.tsx is last because it is the lowest-risk change: the existing `generateMockReport()` can remain as a fallback, making this a progressive enhancement rather than a breaking change.

---

## Scalability Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0–500 audits/month | No changes needed. Single `audits` table, free Supabase tier handles it comfortably. Edge function cold starts are 50–200ms and irrelevant at this volume. |
| 500–10k audits/month | Add an index on `email` and `created_at` for admin queries. Consider Supabase Pro tier for increased edge function invocation limits. |
| 10k+ audits/month | Add `niche` index. Consider separating `ai_report` into its own table if JSONB column bloat becomes an issue. Evaluate OpenAI cost per completion at scale. |

### Scaling Priorities

1. **First bottleneck:** OpenAI API latency/cost. The LLM call is the slowest and most expensive operation. Mitigate with `gpt-4o-mini` (fast, cheap, sufficient quality for structured JSON) and a tight `max_tokens` budget. Cache common prompt segments.
2. **Second bottleneck:** Edge function cold starts under burst traffic. Supabase Edge Functions use Deno V8 isolates — cold starts are fast (~50ms) but warm up takes a few hundred ms under sudden load. Not a concern at BizAudit's expected volume.

---

## Anti-Patterns

### Anti-Pattern 1: Calling OpenAI from the Browser

**What people do:** Put the OpenAI API key in the frontend environment variables (`.env`) and call the OpenAI API directly from the browser.

**Why it's wrong:** `VITE_OPENAI_API_KEY` is bundled into the JavaScript that ships to every user. The API key is fully exposed. Any visitor can extract it and run arbitrary completions on your bill.

**Do this instead:** All LLM calls go through the `generate-report` edge function. The key lives in Supabase Secrets and is only accessible server-side via `Deno.env.get("OPENAI_API_KEY")`.

---

### Anti-Pattern 2: Skipping RLS on the audits Table

**What people do:** Create the `audits` table, do not enable RLS, and use the publishable/anon key from the browser. This "works" in development.

**Why it's wrong:** Without RLS, any user with the anon key (which is public) can SELECT, UPDATE, or DELETE any audit record. All collected business data, email addresses, and scores are world-readable via the PostgREST endpoint.

**Do this instead:** Enable RLS immediately after `CREATE TABLE`. Add only the policies you need: `FOR INSERT TO anon WITH CHECK (true)`. Anon SELECT remains blocked (no policy = no access).

---

### Anti-Pattern 3: Using the Service Role Key in the Frontend

**What people do:** Use `SUPABASE_SERVICE_ROLE_KEY` as the client key in supabase-js to bypass RLS and simplify development.

**Why it's wrong:** The service role key bypasses all RLS policies and grants admin-level database access. Exposing it in the browser is equivalent to giving every user root access to your database.

**Do this instead:** Browser uses the publishable/anon key only. Service role key is used exclusively inside edge functions (auto-injected by Supabase runtime as `SUPABASE_SERVICE_ROLE_KEY`) or server-side scripts.

---

### Anti-Pattern 4: Putting All Logic in Loading.tsx

**What people do:** Add all supabase calls inline in the Loading page component alongside the existing timer and navigation logic.

**Why it's wrong:** Loading.tsx already manages a fake timer, progress state, and navigation redirect. Adding async API calls inline makes error handling fragile (what if the LLM call fails at second 3 of 14?) and makes the code untestable.

**Do this instead:** Extract API calls to `src/services/audit.ts`. Loading.tsx imports `generateAIReport()` and `persistAudit()` and handles loading/error state cleanly. The service layer can be tested independently.

---

## Key API Keys: Anon Key vs. Publishable Key

Supabase is transitioning from JWT-based `anon` keys to a new `sb_publishable_...` format (HIGH confidence — verified against Supabase changelog). For new projects created after this change:

- `sb_publishable_...` key replaces the old `anon` JWT key
- Both work identically with supabase-js `createClient()`
- RLS still applies — the same `anon` Postgres role is assumed
- Use whichever key your project provides; behavior is the same for this architecture

```typescript
// src/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY  // or VITE_SUPABASE_ANON_KEY for older projects
);
```

---

## Sources

- [Supabase Edge Functions Architecture](https://supabase.com/docs/guides/functions/architecture) — verified 2026-02-19
- [Supabase JavaScript: functions.invoke()](https://supabase.com/docs/reference/javascript/functions-invoke) — verified 2026-02-19
- [Supabase: Sending Emails with Edge Functions and Resend](https://supabase.com/docs/guides/functions/examples/send-emails) — verified 2026-02-19
- [Supabase: OpenAI GPT completions from Edge Functions](https://supabase.com/docs/guides/ai/examples/openai) — verified 2026-02-19
- [Supabase: Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security) — verified 2026-02-19
- [Supabase: Database Webhooks](https://supabase.com/docs/guides/database/webhooks) — verified 2026-02-19
- [Supabase: Securing Edge Functions](https://supabase.com/docs/guides/functions/auth) — verified 2026-02-19
- [Supabase API Keys Discussion (publishable key transition)](https://github.com/orgs/supabase/discussions/29260) — MEDIUM confidence (GitHub Discussion, not official doc)
- [Bejamas: Send emails with Supabase database triggers](https://bejamas.com/hub/guides/send-emails-supabase-edge-functions-database-triggers) — MEDIUM confidence (community guide, patterns verified against official docs)
- [Resend: Send emails with Supabase Edge Functions](https://resend.com/docs/send-with-supabase-edge-functions) — HIGH confidence (Resend official docs)

---

*Architecture research for: Supabase backend integration with BizAudit React SPA*
*Researched: 2026-02-19*

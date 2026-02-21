# Phase 5: Frontend Integration - Research

**Researched:** 2026-02-20
**Domain:** React SPA wiring — Supabase edge function invocation, shareable URL data fetching, AI report rendering, loading screen orchestration
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Loading screen timing**
- Use a minimum wait (~8s) combined with real API response wait — redirect only when BOTH the minimum animation time AND the API response are complete
- Keep the current 8 decorative step labels cycling for visual engagement; real API work happens behind the scenes
- Fire submitAudit (DB insert) and generate-report (AI call) in parallel for faster overall completion

**Loading screen errors**
- If generate-report fails (network error, 500, timeout), show an error message on the loading screen with a "Retry" button
- If the user gives up on retry, continue to the report page with template-generated content as fallback

**Shareable report loading**
- When someone opens /report/:uuid in a fresh browser (no localStorage/state), fetch all report data from Supabase
- Show a skeleton of the report layout while fetching (placeholder bars where content will appear)
- Fetch form_data, scores, AND AI content from Supabase — render the complete report entirely from DB data (executive summary, scorecard, gaps, wins, recs)
- If the AI report hasn't finished generating yet, show a "Your report is being generated..." message and poll Supabase every few seconds until the AI report is available
- If the UUID doesn't exist, show a friendly branded 404 with a "Start a New Audit" CTA

**Rate limit handling**
- Save audit to DB first (submitAudit), then call generate-report — if 429, the audit row exists but has no AI report
- On 429: block the user on the loading screen with a message like "You've submitted too many audits today. Please try again in X hours."
- Do NOT show a report link or template fallback on rate limit — just the block message with a try-again-later instruction
- The saved audit row is retained (preserves lead data) but no report is accessible to the user

**AI content format**
- AI returns structured JSON (title, description, impact per item) that maps to the existing card/list components
- Report page renders AI content using the same visual components as the current template content — consistent look
- Competitor Benchmark section remains client-side score-driven logic (no AI involvement)

### Claude's Discretion
- Whether AI failure shows a silent fallback or subtle indicator (template vs AI-personalized)
- Whether the AI also generates the executive summary or keeps the current template-driven version (depends on what the edge function currently returns)
- Exact skeleton component design for report loading state
- Polling interval and timeout for "report generating" state
- Retry button styling and placement on loading screen errors

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DATA-03 | Report page loads audit data from Supabase instead of localStorage when accessed via shareable URL | Requires: (1) a new `fetch-report` edge function with service_role to bypass anon RLS, (2) a new migration adding anon SELECT policy on `audits` OR confirmed edge function approach, (3) Report.tsx refactored to detect "no state" case and fetch from Supabase instead of falling through to the generic error message |
</phase_requirements>

---

## Summary

Phase 5 wires three things together: (1) `Loading.tsx` must call the `generate-report` edge function (currently only calls `submitAudit`), (2) `Report.tsx` must fetch full audit + AI report data from Supabase when opened via a shareable URL with no navigation state, and (3) both components must gracefully handle failure paths (errors, rate limits, missing UUIDs, pending AI generation).

The codebase is in good shape. All backend infrastructure is deployed and working. The frontend components exist but are wired to localStorage/navigation state only. The primary work is orchestrating the async calls in `Loading.tsx` and adding a Supabase data fetch path in `Report.tsx`. A new `fetch-report` edge function is needed to serve report data with service_role (since anon has no SELECT on `audits` or `audit_reports` — adding a direct anon SELECT policy is the simpler alternative, but the existing project decisions explicitly deferred this to Phase 5 with a preference for a fetch-report function).

The AI JSON schema is already fully defined by the `generate-report` edge function and matches what the `Report.tsx` template components already render by shape (title, description, impact/timeframe/roi). The executive summary is returned by the AI as a string field (`executiveSummary`). The `cta` field per item is new — the planner must decide whether to render it.

**Primary recommendation:** Build a `fetch-report` edge function with service_role for shareable URL reads. This keeps anon RLS intact (SEC-02), avoids a migration to add SELECT policies, and is consistent with the existing pattern where all DB reads happen via service_role edge functions.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/supabase-js` | ^2.97.0 (already installed) | Supabase client for edge function invocation and DB reads | Already in project; used for `submitAudit` |
| `sonner` | ^1.7.4 (already installed) | Toast notifications | Already in project via `<Sonner />` in App.tsx; used for rate limit 429 message |
| `@radix-ui/react-skeleton` (via shadcn Skeleton) | already in project | Skeleton placeholders while fetching | `src/components/ui/skeleton.tsx` exists — `animate-pulse rounded-md bg-muted` |
| `react-router-dom` | ^6.30.1 (already installed) | `useParams`, `useNavigate`, `useLocation` | Already in use across all pages |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@tanstack/react-query` | ^5.83.0 (already installed) | Data fetching with loading/error states and polling | For `Report.tsx` shareable URL fetch — `useQuery` with `refetchInterval` for polling |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `useQuery` with `refetchInterval` | Manual `setInterval` + `useState` | `useQuery` handles caching, deduplication, and cleanup automatically; manual interval requires careful cleanup |
| `fetch-report` edge function | Direct anon SELECT policy on `audits` | Edge function keeps RLS intact; anon SELECT policy is simpler but adds a permissive read path not originally planned |

**Installation:** No new packages needed — all dependencies already installed.

---

## Architecture Patterns

### Recommended Project Structure

No new directories needed. Changes confined to:
```
src/
├── pages/
│   ├── Loading.tsx          # Add generate-report invocation + rate limit handling
│   └── Report.tsx           # Add Supabase fetch path + AI content rendering
├── lib/
│   └── fetchReport.ts       # NEW: client-side function to call fetch-report edge function
supabase/
└── functions/
    └── fetch-report/
        └── index.ts         # NEW: edge function that reads audits + audit_reports with service_role
```

### Pattern 1: Parallel Async with Minimum Wait — Loading.tsx

**What:** Fire `submitAudit` and `generate-report` in parallel with `Promise.all`. Use `Promise.race` between the API calls and a minimum-timer promise to ensure the animation runs for at least 8 seconds before redirect.

**When to use:** Any loading screen that has a minimum animation time AND a real async operation.

**Current state:** `Loading.tsx` fires `submitAudit` without awaiting it (fire-and-forget via `.then/.catch`), then uses a hard 14.5s `setTimeout` to redirect. This must be refactored to `await Promise.all([submitAudit(), minTimer])` before redirect — so redirect is blocked until BOTH complete.

**Example:**
```typescript
// Loading.tsx — orchestration logic
const MIN_WAIT_MS = 8000;

const minTimer = new Promise<void>(resolve => setTimeout(resolve, MIN_WAIT_MS));

let reportData: AIReportData | null = null;
let rateLimitError: RateLimitError | null = null;
let aiError: Error | null = null;

// submitAudit runs first to get the UUID needed for generate-report
const auditId = await submitAudit(formState, scores);

// Then fire generate-report + remaining min timer in parallel
const generateReportCall = supabase.functions
  .invoke('generate-report', {
    body: { auditId, formState, scores }
  });

const [generateResult] = await Promise.all([generateReportCall, minTimer]);

const { data, error } = generateResult;

if (error || !data?.success) {
  if (data?.rateLimited) {
    // Show rate limit block — do NOT navigate
    setRateLimited(true);
    setRateLimitMessage(data.message);
    return;
  }
  // Non-429 failure: show retry UI
  setAiError(error?.message || 'Report generation failed');
  return;
}

reportData = data.report;
// Navigate to report, passing AI data in location state
navigate(`/report/${auditId}`, {
  state: { formState, scores, auditId, aiReport: reportData }
});
```

**Critical note on invocation:** The `generate-report` edge function requires `auditId` in its request body. `submitAudit` must complete before `generate-report` can be called (sequential dependency — not parallel). The locked decision says "fire in parallel" but this refers to NOT waiting for generate-report before showing the report when both happen to finish together. Practically: `submitAudit` must run first (to get auditId), then `generate-report` runs while the min timer continues.

**Revised parallel strategy:** Start `minTimer` immediately. Run `submitAudit` (needs to resolve first for auditId). Then start `generate-report`. Wait for `Promise.all([generateReport, minTimer])`. Redirect when both are done.

### Pattern 2: Supabase Edge Function Invocation from React

**What:** Use `supabase.functions.invoke()` to call deployed edge functions from the React client. Returns `{ data, error }`.

**When to use:** Calling any Supabase Edge Function from frontend React code.

```typescript
// Source: supabase-js v2 official pattern
import { supabase } from '@/lib/supabase';

const { data, error } = await supabase.functions.invoke('generate-report', {
  body: {
    auditId,
    formState,
    scores,
  },
});

// data is the JSON response body from the edge function
// error is a FunctionsHttpError if status >= 400
// For 429: error will be FunctionsHttpError with status 429
//   Access body: const body = await error.context.json()
//   body.rateLimited === true, body.message === "You've already submitted 3 audits today..."
```

**Important:** `supabase.functions.invoke()` throws a `FunctionsHttpError` for 4xx/5xx responses. The `error` is not a plain `Error` but has `.context` property with the original Response. To read the 429 JSON body: `await error.context.json()`.

**Confirmed pattern from supabase-js v2:**
```typescript
import { FunctionsHttpError } from '@supabase/supabase-js';

if (error instanceof FunctionsHttpError) {
  const body = await error.context.json();
  if (body.rateLimited) {
    // handle 429
  }
}
```

### Pattern 3: fetch-report Edge Function for Shareable URLs

**What:** A new edge function `fetch-report` that accepts `?auditId=<uuid>` (GET) or `{ auditId }` (POST), reads from both `audits` and `audit_reports` using the service_role key, and returns the combined data.

**Why needed:** The `audits` table has no anon SELECT policy (SEC-02). The `audit_reports` table has no anon SELECT policy either. The anon publishable key cannot read either table. A service_role edge function bypasses RLS entirely.

**Alternative rejected:** Adding an anon SELECT policy `USING (true)` would expose all rows to anyone with the anon key (which is in the JS bundle). Adding `USING (id = requested_uuid)` via PostgREST URL filters is possible but requires passing the UUID as a query param — this works but is more complex than the pattern already established by `generate-report`. The fetch-report edge function approach is consistent with existing architecture.

```typescript
// supabase/functions/fetch-report/index.ts
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { auditId } = await req.json()

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Fetch audit row (form_data, scores, niche, business_name)
    const { data: audit, error: auditError } = await supabaseAdmin
      .from('audits')
      .select('id, niche, business_name, form_data, scores, report_status, created_at')
      .eq('id', auditId)
      .single()

    if (auditError || !audit) {
      return new Response(
        JSON.stringify({ error: 'not_found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch AI report (may not exist yet if still pending)
    const { data: reportRow } = await supabaseAdmin
      .from('audit_reports')
      .select('report')
      .eq('audit_id', auditId)
      .single()

    return new Response(
      JSON.stringify({
        audit,
        aiReport: reportRow?.report ?? null,
        reportStatus: audit.report_status, // 'pending' | 'completed' | 'failed'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

### Pattern 4: Report.tsx — Dual Data Source with Polling

**What:** `Report.tsx` checks for navigation state first (fast path — fresh from Loading.tsx). If no state (shareable URL), call `fetch-report` edge function. If `reportStatus === 'pending'`, poll every few seconds.

**When to use:** Any page that can be reached both via navigation (with state) and direct URL.

```typescript
// Report.tsx — data loading logic
const { auditId } = useParams();
const location = useLocation();
const locationState = location.state as {
  formState?: AuditFormState;
  scores?: AuditScores;
  auditId?: string;
  aiReport?: AIReportData;
} | null;

// Fast path: navigation state present (just came from Loading.tsx)
const hasNavigationState = !!(locationState?.formState && locationState?.scores);

// Slow path: fetch from Supabase (shareable URL)
const { data, isLoading, error } = useQuery({
  queryKey: ['report', auditId],
  queryFn: () => fetchReport(auditId!),
  enabled: !hasNavigationState && !!auditId,
  refetchInterval: (query) => {
    // Poll if report is still being generated
    if (query.state.data?.reportStatus === 'pending') return 4000;
    return false; // stop polling when completed or failed
  },
  refetchIntervalInBackground: false,
});
```

**Polling timeout consideration:** If `reportStatus` stays `'pending'` indefinitely (edge function crashed without updating status), polling would continue forever. Set a maximum poll count or elapsed time: after ~60 seconds of polling, show a "Report generation is taking longer than expected" message.

### Pattern 5: AI Content Rendering in Report.tsx

**What:** The `generate-report` edge function returns a JSON object with shape:
```json
{
  "executiveSummary": "string",
  "gaps": [{ "title": "string", "description": "string", "impact": "string", "priority": "high|medium|low", "cta": "string" }],
  "quickWins": [{ "title": "string", "description": "string", "timeframe": "string", "priority": "high|medium|low", "cta": "string" }],
  "strategicRecommendations": [{ "title": "string", "description": "string", "roi": "string", "priority": "high|medium|low", "cta": "string" }]
}
```

**Mapping to existing Report.tsx components:**
- `gaps` → renders into "Critical Gaps" section (currently uses `criticalGaps` from `generateMockReport()`)
  - Existing shape: `{ title, description, impact }` — AI adds `priority` and `cta` (new fields)
- `quickWins` → "Quick Wins" section (currently uses `quickWins` from `generateMockReport()`)
  - Existing shape: `{ title, description, timeframe }` — AI adds `priority` and `cta`
- `strategicRecommendations` → "Strategic Recommendations" section (currently uses `strategicRecs`)
  - Existing shape: `{ title, description, roi }` — AI adds `priority` and `cta`
- `executiveSummary` → "Executive Summary" section (currently template-driven prose)

**The `cta` field:** Each AI item includes a CTA string. The planner must decide whether to render it in the report cards. Recommended: render as a subtle link/button below each card's impact line. This is "Claude's Discretion."

**Fallback strategy:** If `aiReport` is null (AI failed, function timed out, edge function had an error), continue using `generateMockReport(formState, scores)` for gaps/wins/recs. Executive summary stays as the template prose. This is the graceful degradation path.

### Anti-Patterns to Avoid

- **Firing generate-report in true parallel with submitAudit:** `generate-report` requires the `auditId` returned by `submitAudit`. They must be sequential. The "parallel" part is running `generate-report` concurrently with the remaining portion of `minTimer`.
- **Reading audit data with anon key directly:** `supabase.from('audits').select(...)` with the anon client will return zero rows (RLS blocks it). Must use a service_role edge function.
- **Polling without a timeout:** Polling `report_status === 'pending'` forever risks infinite loops if the edge function crashed without updating status to `'completed'` or `'failed'`. Add a maximum elapsed time (~60–90 seconds) before showing a timeout message.
- **Passing formState as navigation state to Report.tsx for shareable URLs:** Navigation state is in-memory only — it disappears when the user closes the tab and returns via a bookmark. The shareable URL path must work without navigation state.
- **Using React Query for the Loading.tsx edge function call:** Loading.tsx is a transition page that fires once and navigates away. Plain `async/await` with `useState` for error/loading is simpler and appropriate here. React Query is for `Report.tsx` where caching and polling are valuable.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Toast notification for rate limit | Custom toast component | `toast()` from `sonner` (already in `App.tsx` as `<Sonner />`) | Already wired; one import and one call |
| Skeleton loading state | Custom shimmer CSS | `<Skeleton>` from `src/components/ui/skeleton.tsx` | Already in project, uses `animate-pulse` |
| Polling with cleanup | `setInterval` in `useEffect` | `useQuery` `refetchInterval` from `@tanstack/react-query` (already installed) | Handles cleanup, caching, and deduplication |
| Edge function HTTP call | `fetch()` with manual CORS/auth headers | `supabase.functions.invoke()` | Automatically adds `apikey` and `Authorization` headers from the Supabase client |

**Key insight:** All needed UI primitives (Skeleton, Sonner toast, React Query) are already installed and wired. Zero new npm installs required.

---

## Common Pitfalls

### Pitfall 1: 429 Response from supabase.functions.invoke

**What goes wrong:** `supabase.functions.invoke()` for a 429 response sets `error` to a `FunctionsHttpError` instance, not a plain `Error`. The `error.message` is unhelpful. The rate limit details are in the response body.

**Why it happens:** `supabase-js` wraps non-2xx responses as `FunctionsHttpError` objects. The `.context` property holds the original `Response` object.

**How to avoid:**
```typescript
import { FunctionsHttpError } from '@supabase/supabase-js';

const { data, error } = await supabase.functions.invoke('generate-report', { body: { ... } });

if (error instanceof FunctionsHttpError) {
  const body = await error.context.json();
  if (body.rateLimited) {
    setRateLimitMessage(body.message); // "You've already submitted 3 audits today. Try again in X hours."
    return; // Block on loading screen, do NOT navigate
  }
}
```

**Warning signs:** `error` is truthy but `error.message` is "Edge Function returned a non-2xx status code."

### Pitfall 2: generate-report Receives the Same auditId That submitAudit Already Inserted

**What goes wrong:** If `submitAudit` succeeds but `generate-report` is called with the same `auditId` value, and then the user retries (clicking "Retry"), `submitAudit` runs again — creating a duplicate audit row with a new UUID while `generate-report` is retried with the OLD auditId.

**Why it happens:** `submitAudit` calls `crypto.randomUUID()` internally every time it's called.

**How to avoid:** On retry, call ONLY `generate-report` (with the previously captured `auditId`) — do NOT re-call `submitAudit`. The audit row already exists from the first attempt. Store `auditId` in a ref (`useRef`) before the retry logic, not in state that gets reset.

**Warning signs:** Duplicate audit rows appearing in the database after error+retry flows.

### Pitfall 3: Navigation State Lost on Direct URL Access

**What goes wrong:** `location.state` is `null` when the user opens `/report/:uuid` directly (bookmark, email link, incognito window). If `Report.tsx` only falls through to "No report data found" — the shareable URL shows an error instead of the report.

**Why it happens:** React Router's `useLocation().state` is populated only when navigating programmatically with `navigate('/path', { state: {...} })` in the same browser session.

**How to avoid:** Always check `location.state` first, then fall through to Supabase fetch. The `useQuery` call should be `enabled: !hasNavigationState && !!auditId`.

**Warning signs:** Shareable URLs return "No report data found" instead of loading data.

### Pitfall 4: report_status Stuck on 'pending'

**What goes wrong:** If the `generate-report` edge function crashes hard before updating `report_status` to `'completed'` or `'failed'`, the `audit_reports` row is never created. The `fetch-report` edge function returns `reportStatus: 'pending'` forever. `Report.tsx` polls indefinitely.

**Why it happens:** The edge function has best-effort error handling (`report_status: 'failed'` update is wrapped in try/catch and errors are swallowed). If the Supabase update itself fails (network issue), status stays `'pending'`.

**How to avoid:** Add a maximum poll duration in `Report.tsx`. After ~60 seconds of polling with `reportStatus === 'pending'`, stop polling and show a "report is taking longer than expected" state with a refresh button.

**Warning signs:** Report page spinner that never resolves.

### Pitfall 5: Executive Summary — AI vs Template

**What goes wrong:** The `generate-report` edge function does return `executiveSummary` as a string. The current `Report.tsx` renders a multi-paragraph template-driven executive summary section with inline dynamic data. If AI report is present, which wins?

**Why it matters:** The AI summary is 2–4 sentences of personalized prose. The current template is a 4-paragraph block with bolded scores. They cannot be mixed without visual inconsistency.

**How to avoid:** When `aiReport` is present, render `aiReport.executiveSummary` as a single paragraph replacing the entire template block. When `aiReport` is null (fallback), render the existing 4-paragraph template. This is clean binary switching with no mixing.

---

## Code Examples

### Invoking generate-report from Loading.tsx

```typescript
// Source: supabase-js v2 functions.invoke pattern
// File: src/pages/Loading.tsx

import { supabase } from '@/lib/supabase';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { toast } from 'sonner';

// Sequential: submitAudit must resolve first for auditId
const MIN_WAIT_MS = 8000;
const startTime = Date.now();

try {
  const auditId = await submitAudit(formState, scores);
  auditIdRef.current = auditId;

  // Min timer for remaining time after submitAudit
  const elapsed = Date.now() - startTime;
  const remaining = Math.max(0, MIN_WAIT_MS - elapsed);
  const minTimer = new Promise<void>(r => setTimeout(r, remaining));

  const generateCall = supabase.functions.invoke('generate-report', {
    body: { auditId, formState, scores },
  });

  const [{ data, error }] = await Promise.all([generateCall, minTimer]);

  if (error instanceof FunctionsHttpError) {
    const body = await error.context.json();
    if (body?.rateLimited) {
      setRateLimitMessage(body.message);
      setIsRateLimited(true);
      return; // Stay on loading screen — no navigate
    }
    throw error; // Non-429 HTTP error — show retry
  }

  if (error || !data?.success) {
    throw new Error(error?.message || 'Report generation failed');
  }

  navigate(`/report/${auditId}`, {
    state: { formState, scores, auditId, aiReport: data.report },
  });

} catch (err) {
  setAiError((err as Error).message);
  // Show Retry button — retry calls generateReport only (not submitAudit again)
}
```

### fetchReport client helper

```typescript
// Source: project pattern from submitAudit.ts
// File: src/lib/fetchReport.ts

import { supabase } from '@/lib/supabase';

export interface FetchReportResult {
  audit: {
    id: string;
    niche: string;
    business_name: string;
    form_data: AuditFormState;
    scores: AuditScores;
    report_status: 'pending' | 'completed' | 'failed';
    created_at: string;
  };
  aiReport: AIReportData | null;
  reportStatus: 'pending' | 'completed' | 'failed';
}

export async function fetchReport(auditId: string): Promise<FetchReportResult> {
  const { data, error } = await supabase.functions.invoke('fetch-report', {
    body: { auditId },
  });

  if (error) {
    // FunctionsHttpError for 404 (not found UUID)
    if (error instanceof FunctionsHttpError && error.context?.status === 404) {
      throw new Error('not_found');
    }
    throw new Error(error.message);
  }

  return data as FetchReportResult;
}
```

### Report.tsx dual data source

```typescript
// File: src/pages/Report.tsx

const { auditId } = useParams();
const location = useLocation();
const locationState = location.state as {
  formState?: AuditFormState;
  scores?: AuditScores;
  auditId?: string;
  aiReport?: AIReportData;
} | null;

const hasNavigationState = !!(locationState?.formState && locationState?.scores);
const [pollStartTime] = useState(() => Date.now());
const POLL_TIMEOUT_MS = 90_000; // 90 seconds

const { data: fetchedData, isLoading, isError } = useQuery({
  queryKey: ['report', auditId],
  queryFn: () => fetchReport(auditId!),
  enabled: !hasNavigationState && !!auditId,
  retry: 1,
  refetchInterval: (query) => {
    const data = query.state.data;
    if (!data) return false;
    if (data.reportStatus === 'pending') {
      // Stop polling after timeout
      if (Date.now() - pollStartTime > POLL_TIMEOUT_MS) return false;
      return 4000; // poll every 4s
    }
    return false;
  },
  refetchIntervalInBackground: false,
});

// Resolve data from navigation state OR fetched data
const formState = locationState?.formState ?? fetchedData?.audit?.form_data ?? null;
const scores = locationState?.scores ?? fetchedData?.audit?.scores ?? null;
const aiReport = locationState?.aiReport ?? fetchedData?.aiReport ?? null;
```

### AI content rendering (gaps example)

```typescript
// In Report.tsx — Critical Gaps section
// Source: existing Report.tsx pattern + AI schema from generate-report/index.ts

interface AIGapItem {
  title: string;
  description: string;
  impact: string;
  priority: 'high' | 'medium' | 'low';
  cta: string;
}

// Resolve which gaps to render
const { criticalGaps: templateGaps } = generateMockReport(formState, scores);
const gaps: Array<{ title: string; description: string; impact: string }> =
  aiReport?.gaps ?? templateGaps;

// Render — same JSX as existing, props unchanged
{gaps.map((gap, i) => (
  <div key={i} className="bg-card rounded-2xl border border-border p-6">
    {/* existing gap card JSX */}
  </div>
))}
```

### Skeleton loading state for shareable URL

```typescript
// Report.tsx skeleton while fetching
// Source: src/components/ui/skeleton.tsx

import { Skeleton } from '@/components/ui/skeleton';

if (isLoading) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header skeleton */}
      <div style={{ backgroundColor: "hsl(var(--navy))" }} className="py-4 px-6">
        <div className="max-w-5xl mx-auto">
          <Skeleton className="h-8 w-32 bg-white/10" />
        </div>
      </div>
      {/* Hero skeleton */}
      <div style={{ backgroundColor: "hsl(var(--navy))" }} className="py-12 px-6">
        <div className="max-w-5xl mx-auto space-y-4">
          <Skeleton className="h-10 w-64 bg-white/10" />
          <Skeleton className="h-4 w-48 bg-white/10" />
        </div>
      </div>
      {/* Content skeleton */}
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-6">
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    </div>
  );
}
```

### Branded 404 for missing UUID

```typescript
// Report.tsx — 404 state (UUID not found in DB)
if (isError && fetchedData === undefined) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-6"
      style={{ backgroundColor: "hsl(var(--navy))" }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
        style={{ backgroundColor: "hsl(var(--coral))" }}>
        E&P
      </div>
      <h1 className="text-2xl font-bold text-white">Report Not Found</h1>
      <p className="text-white/60 text-center max-w-md">
        This audit link is invalid or has expired. Start a new audit to generate a fresh report.
      </p>
      <Link to="/" className="px-6 py-3 rounded-xl text-white font-semibold"
        style={{ backgroundColor: "hsl(var(--coral))" }}>
        Start a New Audit
      </Link>
    </div>
  );
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `.select('id').single()` after insert | `crypto.randomUUID()` client-side | Phase 1 (01-03) | No SELECT round-trip needed; UUID generated before insert |
| Mock report from `generateMockReport()` | AI report from edge function + fallback to mock | This phase | Real personalization; template is fallback only |
| Hard `setTimeout(14500)` redirect | `await Promise.all([generateReport, minTimer])` | This phase | Redirect blocked until API + min timer both resolve |

---

## Open Questions

1. **Should `cta` fields from AI be rendered in report cards?**
   - What we know: The `generate-report` edge function includes a `cta` string in each gap/win/rec item. The existing `Report.tsx` card components have no CTA slot.
   - What's unclear: Adding CTAs to each card may be visually noisy or push the consultation CTA at the bottom.
   - Recommendation: Render `cta` as a subtle text link below each card's impact/roi line. Keep it lightweight (no button, just underlined text). This is Claude's Discretion.

2. **Retry behavior: should it re-call submitAudit or just generate-report?**
   - What we know: The locked decision says "Save audit to DB first (submitAudit), then call generate-report." On first attempt, submitAudit always runs. On retry (clicking "Retry" after generate-report fails), the audit row already exists.
   - What's unclear: Does the retry button trigger the full flow or just the edge function call?
   - Recommendation: Store `auditId` in a `useRef` after the first `submitAudit` call. On retry, skip `submitAudit` entirely and re-invoke `generate-report` with the stored `auditId`. Prevents duplicate rows.

3. **Polling timeout UX: what to show after 90 seconds?**
   - What we know: CONTEXT.md says "poll Supabase every few seconds until the AI report is available." No explicit timeout defined.
   - What's unclear: What happens after timeout? Infinite spinner? Error state? Template fallback?
   - Recommendation: After 90 seconds of `reportStatus === 'pending'`, stop polling and show: "Your report is taking longer than expected. Try refreshing the page, or contact support if this persists." Do NOT silently show template fallback for the polling timeout case (user expects AI report; showing template without explanation is confusing).

4. **Should `fetch-report` be a GET or POST?**
   - What we know: `supabase.functions.invoke()` defaults to POST. GET with query params is possible but requires the edge function to parse `new URL(req.url).searchParams`.
   - Recommendation: POST with `{ auditId }` in body — consistent with `generate-report` pattern. No body parsing needed in GET.

---

## Sources

### Primary (HIGH confidence)

- Codebase direct inspection — `src/pages/Loading.tsx`, `src/pages/Report.tsx`, `src/lib/submitAudit.ts`, `src/lib/supabase.ts`, `supabase/functions/generate-report/index.ts`, all migrations, `src/types/audit.ts`
- `package.json` — confirmed all required packages already installed
- `.planning/STATE.md` — confirmed accumulated decisions (crypto.randomUUID pattern, per_worker instantiation, SEC-02 anon SELECT block)
- `05-CONTEXT.md` — locked user decisions constraining implementation

### Secondary (MEDIUM confidence)

- supabase-js v2 `functions.invoke()` + `FunctionsHttpError` pattern: from existing project usage pattern in `submitAudit.ts` and STATE.md notes about `supabase-js v2` behavior
- `@tanstack/react-query` v5 `refetchInterval` as a function: standard documented API; project already uses React Query (`App.tsx` wraps in `QueryClientProvider`)

### Tertiary (LOW confidence)

- None — all claims verified against codebase or project documentation.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already installed, no new dependencies
- Architecture: HIGH — patterns directly derived from existing codebase inspection
- Pitfalls: HIGH — derived from existing STATE.md decisions and accumulated project notes
- Open questions: MEDIUM — judgment calls requiring planner decision; options are clear

**Research date:** 2026-02-20
**Valid until:** 2026-03-22 (30 days; stable — no fast-moving external dependencies)

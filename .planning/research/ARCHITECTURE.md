# Architecture Research

**Domain:** i18n URL routing, sub-niche branching, and Bulgarian AI reports integrated into existing BizAudit React SPA
**Researched:** 2026-02-21
**Confidence:** HIGH (patterns derived from direct codebase inspection; i18n routing approach verified against react-i18next official docs and React Router v6 discussion threads; DB patterns are straightforward Postgres ALTER TABLE)

---

## What This Document Covers

This file answers the v1.1 integration question: how do URL-based language routing, sub-niche form branching, and Bulgarian AI reports plug into the existing architecture without rewriting working code.

The existing v1.0 system overview (Supabase integration, RLS, edge function patterns) lives in the v1.0 research ARCHITECTURE.md and remains valid. This document focuses solely on the delta for v1.1.

---

## System Overview: v1.1 Layer Additions

```
┌────────────────────────────────────────────────────────────────────────┐
│                         BROWSER (React SPA)                             │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  i18n Layer (react-i18next)                                       │   │
│  │  - I18nextProvider wraps entire app                               │   │
│  │  - useTranslation(ns) hook provides t() to all components         │   │
│  │  - Language detected from URL path prefix (/bg/ vs default en)    │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                ↓                                         │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │  React Router v6 (BrowserRouter — unchanged)                    │     │
│  │                                                                  │     │
│  │  EXISTING routes unchanged:                                      │     │
│  │    /           → Index                                            │     │
│  │    /audit      → AuditForm                                        │     │
│  │    /generating → Loading                                          │     │
│  │    /report/:id → Report                                           │     │
│  │                                                                  │     │
│  │  NEW routes added as siblings:                                    │     │
│  │    /bg/        → Index (Bulgarian)                                │     │
│  │    /bg/audit   → AuditForm (Bulgarian)                            │     │
│  │    /bg/generating → Loading (Bulgarian)                           │     │
│  │    /bg/report/:id → Report (Bulgarian)                            │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                ↓                                         │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  AuditFormState (useReducer — extended)                          │    │
│  │                                                                   │    │
│  │  NEW fields added to existing state:                              │    │
│  │    subNiche: SubNiche | null         (HS sub-niche selection)     │    │
│  │    language: 'en' | 'bg'            (drives scoring + AI prompt) │    │
│  │                                                                   │    │
│  │  isHS boolean stays — niche branching unchanged                   │    │
│  │  subNiche adds a second branching axis within each niche          │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                ↓                                         │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │  Scoring Engine (scoring.ts — extended)                         │     │
│  │                                                                  │     │
│  │  computeScores(state) signature stays the same                   │     │
│  │  Sub-niche weight modifiers applied after base scoring           │     │
│  │  getSubNicheWeights(niche, subNiche) returns weight overrides    │     │
│  └────────────────────────────────────────────────────────────────┘     │
└────────────────────────────────────────────────────────────────────────┘
                               ↓ HTTPS
┌────────────────────────────────────────────────────────────────────────┐
│                         SUPABASE BACKEND                                 │
│                                                                          │
│  audits table — TWO new columns added via migration:                     │
│    language TEXT DEFAULT 'en' CHECK (language IN ('en', 'bg'))          │
│    sub_niche TEXT (nullable — null means "not specified")                │
│                                                                          │
│  generate-report edge function — extended:                               │
│    Receives language + sub_niche in request body                         │
│    Builds Bulgarian system prompt when language = 'bg'                   │
│    Includes sub_niche context in user prompt                             │
│    Claude Haiku 4.5 responds in Bulgarian or English based on prompt     │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Component Responsibilities: New vs Modified

### New Components

| Component | Location | Responsibility |
|-----------|----------|----------------|
| `LanguageRouter` | `src/components/LanguageRouter.tsx` | Reads language from URL path, calls `i18n.changeLanguage()`, renders children |
| `useLanguage` hook | `src/hooks/useLanguage.ts` | Returns current language and `navigateWithLang()` helper for language-aware navigation |
| Translation namespaces | `src/locales/en/` and `src/locales/bg/` | JSON files keyed by namespace (common, steps, report, landing) |
| `SubNicheSelector` | `src/components/audit/SubNicheSelector.tsx` | Card grid rendered inside Step 1 after niche selection; dispatches `SET_SUB_NICHE` |

### Modified Components

| Component | What Changes | What Stays the Same |
|-----------|-------------|---------------------|
| `App.tsx` | Wraps BrowserRouter with I18nextProvider; adds `/bg/*` route branch | Route structure otherwise identical |
| `src/types/audit.ts` | Adds `SubNiche` type, `language` field, `subNiche` field to `AuditFormState`; adds `SET_SUB_NICHE` and `SET_LANGUAGE` actions to `AuditAction` | All existing step types, auditReducer cases, AuditScores, AIReportData |
| `src/lib/scoring.ts` | Adds `getSubNicheWeights()` function; `computeScores()` applies weight overrides from it | All lookup tables, `calcCategory()`, `scoreMap()`, everything else |
| `Step1BusinessInfo.tsx` | Adds `SubNicheSelector` component below industry dropdown; updates industry list to include Construction, Interior Design, Cleaning for HS | Contact fields, validation, all RE fields |
| `AuditForm.tsx` | Reads language from URL, stores in state; passes `subNiche` in stepProps; validates sub-niche selected before proceeding from step 1 | Step navigation logic, localStorage persistence, all 8 step renders |
| `Loading.tsx` | Passes `language` and `subNiche` in the `generate-report` edge function request body | Timer logic, progress bar, retry/skip, all existing error handling |
| `generate-report/index.ts` | Reads `language` from request body; builds Bulgarian system prompt when `language = 'bg'`; includes `subNiche` in form context sent to Claude | Rate limiting, sanitization, Supabase persistence, all existing logic |
| `supabase/migrations/` | New migration adds `language` and `sub_niche` columns to `audits` table | All existing columns untouched |
| `src/lib/submitAudit.ts` | Includes `language` and `sub_niche` in the INSERT payload | All existing fields |

---

## Recommended Project Structure Changes

Only the additions and changes relative to the existing structure:

```
src/
├── locales/
│   ├── en/
│   │   ├── common.json       # Shared UI: buttons, nav, errors
│   │   ├── landing.json      # Landing page: hero, niche cards, how-it-works
│   │   ├── steps.json        # All 8 step titles, labels, options, placeholders
│   │   └── report.json       # Report page: section headings, score labels, CTAs
│   └── bg/
│       ├── common.json       # Bulgarian translations of common.json
│       ├── landing.json      # Bulgarian translations of landing.json
│       ├── steps.json        # Bulgarian translations + BG-market options
│       └── report.json       # Bulgarian translations of report.json
│
├── lib/
│   ├── i18n.ts               # NEW — i18next init, namespace config, language detection
│   ├── scoring.ts            # MODIFY — add getSubNicheWeights()
│   ├── submitAudit.ts        # MODIFY — include language and sub_niche in payload
│   └── (all others unchanged)
│
├── hooks/
│   └── useLanguage.ts        # NEW — language + navigateWithLang()
│
├── components/
│   ├── LanguageRouter.tsx    # NEW — URL-to-i18n sync wrapper
│   └── audit/
│       ├── SubNicheSelector.tsx  # NEW — sub-niche card selection inside Step 1
│       └── (all existing step components modified to use t())
│
├── types/
│   └── audit.ts              # MODIFY — add SubNiche, language, SET_SUB_NICHE, SET_LANGUAGE
│
└── pages/
    ├── Index.tsx             # MODIFY — use t() for all text
    ├── AuditForm.tsx         # MODIFY — language detection, sub-niche validation
    ├── Loading.tsx           # MODIFY — pass language + subNiche to edge function
    └── Report.tsx            # MODIFY — use t() for section headings and score labels

supabase/
├── functions/
│   └── generate-report/
│       └── index.ts          # MODIFY — Bulgarian prompt, sub_niche context
└── migrations/
    └── [timestamp]_add_language_and_subniche.sql  # NEW
```

### Structure Rationale

- **`src/locales/`:** i18next convention; namespaces map to page/domain boundaries (landing, steps, report, common) rather than components. This allows loading only the namespaces needed per page. Steps translations are one namespace because all 8 steps load together in AuditForm.
- **`src/lib/i18n.ts`:** Singleton init. Import in `main.tsx` before rendering. Do not import in individual components.
- **`LanguageRouter.tsx`:** Thin wrapper that reads the `/:lang` URL param and syncs i18n, not a full route — lives inside the existing router structure.

---

## Architectural Patterns

### Pattern 1: URL Path Prefix for Language (No Subdomain, No Query Param)

**What:** English routes at `/`, `/audit`, etc. Bulgarian routes at `/bg/`, `/bg/audit`, etc. The `/bg/` prefix is the single source of truth for language. i18n library is synced to match the URL on every render.

**When to use:** Two-language SPA where SEO for both languages matters and the URL should be human-readable and shareable in the correct language. Avoids cookie/localStorage state mismatch on shared links.

**Trade-offs:** Requires duplicating route definitions in App.tsx (four routes become eight). Language switches require a full navigation to the equivalent `/bg/` path. localStorage save/resume must encode language in saved state.

**Implementation:**

```typescript
// src/App.tsx — route duplication pattern
<BrowserRouter>
  <I18nextProvider i18n={i18n}>
    <Routes>
      {/* English (default) — no prefix */}
      <Route path="/" element={<Index />} />
      <Route path="/audit" element={<AuditForm />} />
      <Route path="/generating" element={<Loading />} />
      <Route path="/report/:auditId" element={<Report />} />

      {/* Bulgarian — /bg/ prefix */}
      <Route path="/bg" element={<LanguageRouter lang="bg" />}>
        <Route index element={<Index />} />
        <Route path="audit" element={<AuditForm />} />
        <Route path="generating" element={<Loading />} />
        <Route path="report/:auditId" element={<Report />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  </I18nextProvider>
</BrowserRouter>
```

```typescript
// src/components/LanguageRouter.tsx
import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";

export function LanguageRouter({ lang }: { lang: string }) {
  const { i18n } = useTranslation();
  useEffect(() => {
    if (i18n.language !== lang) {
      i18n.changeLanguage(lang);
    }
  }, [lang, i18n]);
  return <Outlet />;
}
```

```typescript
// src/hooks/useLanguage.ts
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";

export function useLanguage() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const lang = i18n.language as "en" | "bg";

  function navigateWithLang(path: string, options?: Parameters<typeof navigate>[1]) {
    const prefix = lang === "bg" ? "/bg" : "";
    navigate(`${prefix}${path}`, options);
  }

  function switchLanguage(newLang: "en" | "bg") {
    const currentPath = location.pathname;
    const withoutPrefix = currentPath.replace(/^\/bg/, "") || "/";
    const newPath = newLang === "bg" ? `/bg${withoutPrefix}` : withoutPrefix;
    navigate(newPath);
  }

  return { lang, navigateWithLang, switchLanguage };
}
```

---

### Pattern 2: Namespace-per-Domain Translation Files

**What:** Translation strings split into four namespaces: `common` (shared), `landing` (Index page), `steps` (AuditForm + all step components), `report` (Report page). Each namespace is a separate JSON file per language.

**When to use:** When different parts of the app load independently and content is large enough that a single file becomes unwieldy. `steps.json` will be the largest (all form labels, all answer options, all sub-niche variations).

**Trade-offs:** All namespaces load upfront since this is a SPA (no code splitting at the namespace level). Organizational benefit is clarity of ownership and easier translation workflow, not performance.

**File structure:**

```json
// src/locales/en/steps.json (abbreviated example)
{
  "step1": {
    "title": "Tell Us About Your Business",
    "subtitle": "Basic info to personalize your audit report",
    "businessName": "Business Name",
    "hs": {
      "subNiche": {
        "label": "What type of trade business?",
        "options": {
          "hvac": "HVAC",
          "plumbing": "Plumbing",
          "electrical": "Electrical"
        }
      },
      "industry": "Industry / Trade",
      "industries": ["HVAC", "Plumbing", "Electrical", "Roofing", "Landscaping",
                     "Pest Control", "Garage Doors", "Painting", "General Contracting",
                     "Construction", "Interior Design", "Cleaning", "Other"]
    }
  }
}
```

```json
// src/locales/bg/steps.json (Bulgarian market CRM options example)
{
  "step2": {
    "crm": {
      "options": ["Salesforce", "HubSpot", "Bitrix24", "AmoCRM", "Zoho CRM",
                  "Excel/Google Sheets", "Без CRM система", "Друго"]
    }
  }
}
```

**Usage in components:**

```typescript
// Inside any step component
import { useTranslation } from "react-i18next";

export function Step1BusinessInfo({ state, dispatch, isHS }: StepProps) {
  const { t } = useTranslation("steps");
  // ...
  return (
    <StepHeader
      step={1}
      title={t("step1.title")}
      subtitle={t("step1.subtitle")}
    />
  );
}
```

---

### Pattern 3: Sub-Niche as State Field, Not Route Param

**What:** `subNiche` is stored in `AuditFormState` (alongside `niche`), not encoded in the URL. Sub-niche selection happens in Step 1. All subsequent steps read `state.subNiche` to conditionally render sub-niche-specific content.

**When to use:** When branching is internal to a multi-step form and does not need to be linkable or shareable at the sub-niche level. The niche is already in the URL (`?niche=home_services`); sub-niche adds detail within that.

**Trade-offs:** Sub-niche is not in the URL, so sharing the audit URL mid-flow does not restore sub-niche. This is acceptable because: (a) the audit is not shareable mid-flow; (b) sub-niche is selected in Step 1 and persisted to localStorage via existing auto-save.

**State extension:**

```typescript
// src/types/audit.ts additions
export type HSSubNiche =
  | "hvac" | "plumbing" | "electrical" | "roofing" | "landscaping"
  | "pest_control" | "garage_doors" | "painting" | "general_contracting"
  | "construction" | "interior_design" | "cleaning";

export type RESubNiche =
  | "residential_sales" | "commercial_office" | "property_management"
  | "new_construction" | "luxury_resort";

export type SubNiche = HSSubNiche | RESubNiche;

// Added to AuditFormState
export interface AuditFormState {
  // ... existing fields ...
  subNiche: SubNiche | null;  // NEW
  language: "en" | "bg";     // NEW
}

// Added to AuditAction
export type AuditAction =
  // ... existing actions ...
  | { type: "SET_SUB_NICHE"; payload: SubNiche }
  | { type: "SET_LANGUAGE"; payload: "en" | "bg" }
```

**StepProps extension:**

```typescript
// AuditFormComponents.tsx — StepProps gains subNiche
export interface StepProps {
  state: AuditFormState;
  dispatch: React.Dispatch<AuditAction>;
  isHS: boolean;
  subNiche: SubNiche | null;  // NEW — passed from AuditForm
}
```

---

### Pattern 4: Sub-Niche Weight Modifiers on Top of Base Scoring

**What:** `computeScores()` runs as today (base scores per category). A `getSubNicheWeights()` function returns category weight overrides for a given sub-niche. Only the weights differ — the lookup tables stay the same.

**When to use:** When sub-niches differ in what matters most (e.g., Roofing cares less about scheduling software than HVAC does; Property Management cares more about financial operations than Residential Sales). Research drives which weights to adjust.

**Trade-offs:** Simple to implement and easy to tune after sub-niche research. Does not require separate lookup tables per sub-niche — only the final normalization weights change.

**Implementation:**

```typescript
// src/lib/scoring.ts additions

export type SubNicheWeightOverrides = Partial<{
  technology: number;
  leads: number;
  scheduling: number;
  communication: number;
  followUp: number;
  operations: number;
  financial: number;
}>;

export function getSubNicheWeights(
  niche: Niche,
  subNiche: SubNiche | null
): SubNicheWeightOverrides {
  if (!subNiche) return {}; // no overrides — use base weights

  const overrides: Record<string, SubNicheWeightOverrides> = {
    // HS sub-niches — research-driven (Phase 1 research will fill these in)
    roofing:     { leads: 0.25, scheduling: 0.10 }, // project-based, leads dominate
    hvac:        { scheduling: 0.20, followUp: 0.20 }, // recurring service, scheduling critical
    construction: { financial: 0.20, operations: 0.20 }, // contract/margin intensive
    property_management: { financial: 0.20, communication: 0.15 }, // RE sub-niche

    // Default: no overrides — base weights apply
  };

  return overrides[subNiche] ?? {};
}

export function computeScores(state: AuditFormState): AuditScores {
  // ... existing scoring logic unchanged ...

  // Apply sub-niche weight overrides
  const subNicheOverrides = getSubNicheWeights(state.niche!, state.subNiche);
  const weights = {
    technology:    subNicheOverrides.technology    ?? 0.10,
    leads:         subNicheOverrides.leads         ?? 0.20,
    scheduling:    subNicheOverrides.scheduling    ?? 0.15,
    communication: subNicheOverrides.communication ?? 0.10,
    followUp:      subNicheOverrides.followUp      ?? 0.15,
    operations:    subNicheOverrides.operations    ?? 0.15,
    financial:     subNicheOverrides.financial     ?? 0.15,
  };
  // NOTE: weights must sum to 1.0 — validate this in tests when overrides are set

  // ... overall score calculation unchanged ...
}
```

---

### Pattern 5: Language-Aware AI Prompt (Edge Function)

**What:** The `generate-report` edge function receives `language` and `subNiche` in the request body. When `language = 'bg'`, the system prompt instructs Claude to respond entirely in Bulgarian. Sub-niche is included in the user prompt as business context.

**When to use:** Always — the language field is required in every request (defaults to 'en' if missing for backward compatibility).

**Trade-offs:** Claude Haiku 4.5 can produce Bulgarian text of acceptable quality. The system prompt language instruction is the single lever — no translation layer needed server-side. The risk is inconsistent Bulgarian output quality; mitigated by a targeted system prompt.

**Implementation:**

```typescript
// supabase/functions/generate-report/index.ts additions

function buildPrompt(params: {
  niche: string;
  subNiche: string | null;
  language: string;          // NEW
  businessName: string;
  scores: AuditScores;
  formState: FormState;
  techFrustrations: string;
  biggestChallenge: string;
}): { system: string; user: string } {
  const { language, subNiche } = params;
  const isBulgarian = language === 'bg';

  const languageInstruction = isBulgarian
    ? `CRITICAL: Respond ENTIRELY in Bulgarian (Bulgarian language, Cyrillic script).
       Every word in your JSON response — executiveSummary, titles, descriptions,
       impacts, timeframes, ROI, and CTAs — must be in Bulgarian. Do not use English.`
    : `Respond in English.`;

  const subNicheContext = subNiche
    ? `Sub-niche: ${subNiche.replace(/_/g, ' ')}`
    : '';

  const system = `You are a business operations advisor generating a personalized audit report.
${languageInstruction}

Tone: Warm but honest...
[rest of existing system prompt unchanged]`;

  const user = `Generate a personalized business audit report for the following business.

Business: ${params.businessName}
Niche: ${params.niche === 'home_services' ? (isBulgarian ? 'Домашни услуги' : 'Home Services Business') : (isBulgarian ? 'Екип по недвижими имоти' : 'Real Estate Team')}
${subNicheContext}
Overall Score: ${params.scores.overall}/100
...
[rest of existing user prompt unchanged]`;

  return { system, user };
}
```

**Request body extension in Loading.tsx:**

```typescript
// src/pages/Loading.tsx
const generateCall = supabase.functions.invoke("generate-report", {
  body: {
    auditId,
    formState: formStateRef.current,
    scores: scoresRef.current,
    language: formStateRef.current?.language ?? 'en',      // NEW
    subNiche: formStateRef.current?.subNiche ?? null,      // NEW
  },
});
```

---

## Data Flow

### Sub-Niche Selection Flow (End-to-End)

```
[User lands on / (English) or /bg/ (Bulgarian)]
    |
    v
[Index.tsx: handleNicheSelect() — unchanged]
    |
    v
[navigate to /audit?niche=home_services  OR  /bg/audit?niche=home_services]
    |
    v
[AuditForm.tsx: detects /bg/ prefix from URL, dispatches SET_LANGUAGE 'bg']
[AuditForm: reads ?niche= param, dispatches SET_NICHE as before]
    |
    v
[Step 1 renders with SubNicheSelector below industry dropdown]
[User selects "HVAC" as sub-niche]
[dispatch SET_SUB_NICHE 'hvac']
    |
    v
[Steps 2-8: read state.subNiche — currently no branching needed]
[Step components render with t() for all labels (English or Bulgarian)]
[Bulgarian steps.json has BG-market CRM options, local tool names, etc.]
    |
    v
[AuditForm.tsx Step 8: computeScores(state) — scoring.ts reads subNiche]
[getSubNicheWeights('home_services', 'hvac') returns weight overrides]
[HVAC gets scheduling: 0.20, followUp: 0.20]
    |
    v
[navigate to /generating OR /bg/generating with { formState, scores }]
    |
    v
[Loading.tsx: submitAudit includes language='bg', sub_niche='hvac' in INSERT]
[Loading.tsx: generate-report called with language + subNiche in body]
    |
    v
[generate-report edge function: Bulgarian system prompt + HVAC context in user prompt]
[Claude Haiku 4.5: produces Bulgarian report JSON for HVAC business]
    |
    v
[navigate to /bg/report/:auditId with aiReport in navigation state]
    |
    v
[Report.tsx: renders AI content (Bulgarian text from Claude) + t() for section headings]
```

### Language Detection on Route Load

```
[User opens /bg/audit?niche=home_services&resume=true]
    |
    v
[React Router: matches /bg/* route, renders <LanguageRouter lang="bg">]
    |
    v
[LanguageRouter: useEffect → i18n.changeLanguage('bg')]
    |
    v
[AuditForm: mounts, reads URL location.pathname, checks for /bg/ prefix]
[dispatch SET_LANGUAGE 'bg' — stored in AuditFormState and localStorage]
    |
    v
[All step components: useTranslation('steps') returns Bulgarian t()]
[Step options, labels, placeholders all in Bulgarian from bg/steps.json]
```

### i18n Initialization

```typescript
// src/lib/i18n.ts
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import enCommon from "./locales/en/common.json";
import enLanding from "./locales/en/landing.json";
import enSteps from "./locales/en/steps.json";
import enReport from "./locales/en/report.json";

import bgCommon from "./locales/bg/common.json";
import bgLanding from "./locales/bg/landing.json";
import bgSteps from "./locales/bg/steps.json";
import bgReport from "./locales/bg/report.json";

i18n.use(initReactI18next).init({
  resources: {
    en: { common: enCommon, landing: enLanding, steps: enSteps, report: enReport },
    bg: { common: bgCommon, landing: bgLanding, steps: bgSteps, report: bgReport },
  },
  lng: "en",                    // default — LanguageRouter overrides for /bg/ routes
  fallbackLng: "en",            // falls back to English if Bulgarian key missing
  defaultNS: "common",
  interpolation: { escapeValue: false },
});

export default i18n;
```

---

## Database Schema Changes

### Migration: Add language and sub_niche columns

```sql
-- supabase/migrations/[timestamp]_add_language_and_subniche.sql

ALTER TABLE public.audits
  ADD COLUMN language  TEXT NOT NULL DEFAULT 'en'
    CHECK (language IN ('en', 'bg')),
  ADD COLUMN sub_niche TEXT;  -- nullable: null = not specified / pre-v1.1 audits

-- Index for admin queries by language (optional but useful for analytics)
CREATE INDEX audits_language_idx ON public.audits(language);
```

**Why nullable sub_niche:** All v1.0 audit rows have no sub-niche. Adding NOT NULL would require a default value that would be inaccurate for existing data. NULL means "user did not specify" and is distinguishable from any specific sub-niche value.

**Why DEFAULT 'en' for language:** Existing rows without the column get 'en' automatically. No backfill needed. New audits without a language in the payload default to 'en' at the DB level.

---

## Build Order

Dependencies are sequential. This order respects them:

```
Phase 1: i18n Infrastructure
  1a. Install react-i18next + i18next (npm install)
  1b. Create src/lib/i18n.ts with English resources (bg stubs can be empty)
  1c. Wrap App.tsx with I18nextProvider + add /bg/* routes + LanguageRouter
  1d. Add useLanguage hook + navigateWithLang helper
  1e. Smoke test: /bg/ route loads, i18n.language = 'bg'

  GATE: Route switching works before touching any form content.

Phase 2: English UI Translation Pass
  2a. Create en/common.json, en/landing.json, en/steps.json, en/report.json
       from all hardcoded strings in existing components
  2b. Replace hardcoded strings in Index.tsx, AuditForm.tsx, all Step components,
       Report.tsx with t('namespace.key') calls
  2c. App functions identically to before (en translations = original strings)

  GATE: English app passes all existing behavior — no regressions.

Phase 3: Type System + State Extensions
  3a. Add SubNiche type, subNiche field, language field to AuditFormState
  3b. Add SET_SUB_NICHE + SET_LANGUAGE actions to AuditAction + auditReducer
  3c. Extend StepProps to include subNiche
  3d. AuditForm.tsx: language detection from URL + dispatch SET_LANGUAGE on mount
  3e. AuditForm.tsx: pass subNiche in stepProps

  GATE: TypeScript compiles, existing form still works.

Phase 4: Sub-Niche Selection UI (Step 1)
  4a. Build SubNicheSelector component (card grid with niche-conditional options)
  4b. Add to Step1BusinessInfo below industry dropdown
  4c. Add validation: sub-niche required before advancing from Step 1
  4d. Add sub-niche question wording to en/steps.json

  GATE: Sub-niche selection works in English. State persists to localStorage.

Phase 5: Scoring Engine Sub-Niche Weights
  5a. Implement getSubNicheWeights() in scoring.ts (start with empty overrides)
  5b. Integrate weight application into computeScores()
  5c. Add unit tests: base weights unchanged when no sub-niche; overrides apply correctly
  5d. Research phase populates actual weight overrides per sub-niche

  GATE: Scoring engine compiles and existing test suite passes.

Phase 6: Database Migration + Backend Extension
  6a. Write and apply migration (add language + sub_niche columns)
  6b. Update submitAudit.ts to include language and sub_niche in INSERT payload
  6c. Update Loading.tsx to pass language + subNiche to generate-report
  6d. Update generate-report/index.ts: Bulgarian system prompt + sub_niche context

  GATE: English audit with sub-niche submits and generates English report. Database rows have correct language/sub_niche values.

Phase 7: Bulgarian Content
  7a. Create bg/common.json, bg/landing.json, bg/report.json translations
  7b. Create bg/steps.json with Bulgarian labels + BG-market options
      (BG-specific CRMs, local tools, BGN price ranges, local regulations)
  7c. Test complete Bulgarian flow: /bg/ → /bg/audit → /bg/generating → /bg/report
  7d. Verify Claude produces Bulgarian report output

  GATE: Full Bulgarian flow produces correct Bulgarian report.

Phase 8: User Email (EMAIL-02 carryover)
  8a. Custom Resend domain verification must complete before this phase
  8b. Update send-notification edge function to also send user email
  8c. User email uses language field to determine template language

  GATE: User receives email in correct language.
```

**Rationale for this order:**

- Phase 1 and 2 before any state changes — prove routing and t() work before touching form logic
- Phase 2 (English pass) before Phase 7 (Bulgarian content) — translation structure must be correct in English before duplicating to Bulgarian; bugs in key names are cheap to fix before the BG file exists
- Phase 3 (types) before Phase 4 (UI) — TypeScript will catch integration errors at compile time
- Phase 5 (scoring) can overlap with Phase 4 — no dependency
- Phase 6 (database + backend) before Phase 7 (Bulgarian) — must verify English pipeline works before adding language complexity to the edge function
- Phase 8 last — depends on external DNS verification outside the team's control

---

## Integration Points

### What AuditForm.tsx Must Do Differently

| Concern | Current Behavior | v1.1 Behavior |
|---------|-----------------|---------------|
| Language detection | Not present | Reads `location.pathname`, checks `/bg/` prefix, dispatches `SET_LANGUAGE` on mount |
| Navigation | `navigate('/generating', ...)` | `navigateWithLang('/generating', ...)` to preserve language prefix |
| Sub-niche validation | Not present | Step 1 must have `subNiche` set before advancing |
| stepProps | `{ state, dispatch, isHS }` | `{ state, dispatch, isHS, subNiche: state.subNiche }` |

### What Report.tsx Must Handle

The AI-generated report text (`aiReport.executiveSummary`, gaps, quickWins, strategicRecommendations) is already the correct language — Claude wrote it in Bulgarian or English. No t() needed for AI content. Use t() only for structural labels: "Critical Gaps", "Quick Wins", "Strategic Recommendations", score labels, CTA button text.

### localStorage Persistence

`AuditFormState` already serializes to localStorage. Adding `subNiche` and `language` fields means they persist automatically via the existing `RESTORE` action. Resume works correctly for both languages.

One edge case: if a user starts an audit in English (`/audit`), saves, then navigates to `/bg/audit?resume=true`, the restored state has `language: 'en'` but the URL is `/bg/`. AuditForm should override the restored language with the current URL's language on resume.

---

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Current (2 languages, ~20 sub-niches) | Static JSON imports — all translations bundled. No lazy loading needed. Total translation bundle is small (<50KB). |
| 5+ languages | Switch to lazy-loaded translations via `i18next-http-backend`. Fetch only the active language's JSON files at runtime. |
| 50+ sub-niches | Sub-niche weights stay in scoring.ts (no DB needed). Sub-niche-specific question branching would benefit from a config-driven question schema rather than hardcoded conditionals. |

---

## Anti-Patterns

### Anti-Pattern 1: Storing Language in a Cookie or localStorage Instead of the URL

**What people do:** Detect browser language or save language preference in localStorage, then ignore the URL.

**Why it's wrong:** Shareable report links (`/report/:auditId`) lose language context. A Bulgarian user shares their report URL with someone else, who sees it in English because their localStorage has `lang=en`. The URL is the only reliable source of truth for shared content.

**Do this instead:** URL is authoritative. `/bg/report/:id` always renders in Bulgarian. LanguageRouter syncs i18n to match the URL. Language in AuditFormState is derived from the URL on mount, not from a stored preference.

---

### Anti-Pattern 2: Translating Form Answer Option Values Stored in State

**What people do:** Store translated option strings (e.g., "Под 5 минути" in Bulgarian) directly in AuditFormState and scoring lookup tables.

**Why it's wrong:** The scoring lookup tables use English option strings as keys (`responseSpeedScore["Under 5 minutes"]`). If Bulgarian answers are stored as Bulgarian strings, every lookup returns `undefined` (falls back to score 1). The scoring engine breaks silently.

**Do this instead:** Store option values as language-neutral keys or English strings in state. Translate only the display labels in t(). The scoring lookup tables stay in English. Example: `StyledSelect` receives `options` as `{ value: "Under 5 minutes", label: t("step3.responseSpeed.under5") }` pairs instead of plain strings.

This is the most critical structural decision for the entire i18n implementation. Every dropdown and multi-checkbox in the 8 step components must separate display label from stored value.

---

### Anti-Pattern 3: Building Sub-Niche as a Separate Route

**What people do:** Encode sub-niche in the URL (`/audit/hvac` or `/audit?sub=hvac`) and create separate route components per sub-niche.

**Why it's wrong:** 12 HS sub-niches + 5 RE sub-niches = 17 route variants times 8 steps = massive duplication. The sub-niche only changes a fraction of each step's content. It belongs in state, not the URL.

**Do this instead:** Sub-niche in `AuditFormState`. Step components read `state.subNiche` for conditional rendering. This is the same pattern already used for `niche` (isHS branching), just one level deeper.

---

### Anti-Pattern 4: Sending Bulgarian Form Answer Strings to the AI Prompt Unchanged

**What people do:** Pass the raw Bulgarian form answers (from BG translation options) directly to the `generate-report` edge function, mixed with English scoring metadata.

**Why it's wrong:** The AI prompt context is a mix of languages. Claude may produce inconsistent output — sometimes English, sometimes Bulgarian, sometimes mixed. The prompt becomes harder to reason about.

**Do this instead:** The edge function builds its AI prompt from the form context using English-equivalent values (the neutral stored values, not the display strings). The language instruction in the system prompt tells Claude what language to respond in. The human-readable context (industry, sub-niche) is translated to the target language in `buildPrompt()` directly, not pulled from form state strings.

---

## Sources

- [react-i18next GitHub Issues #325 — language in URL path](https://github.com/i18next/react-i18next/issues/325) — MEDIUM confidence (community discussion, approach sound)
- [react-i18next official docs — Multiple namespaces](https://react.i18next.com/guides/multiple-translation-files) — HIGH confidence
- [i18next Namespaces documentation](https://www.i18next.com/principles/namespaces) — HIGH confidence
- [React Router v6 Discussion #10510 — Routing and i18n](https://github.com/remix-run/react-router/discussions/10510) — MEDIUM confidence (community discussion)
- [Supabase Postgres — JSONB and migrations](https://supabase.com/docs/guides/database/json) — HIGH confidence
- [Phrase Blog — Localizing React apps with i18next](https://phrase.com/blog/posts/localizing-react-apps-with-i18next/) — MEDIUM confidence (community guide, patterns standard)

---

*Architecture research for: v1.1 i18n, sub-niche branching, and Bulgarian AI reports — BizAudit*
*Researched: 2026-02-21*

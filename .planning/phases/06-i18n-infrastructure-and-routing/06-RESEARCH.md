# Phase 6: i18n Infrastructure and Routing - Research

**Researched:** 2026-02-21
**Domain:** i18next + React Router v6 language-prefix URL routing + value/label form separation
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Language Persistence & URL Routing**
- Bulgarian is the **default language** — `/` and `/bg/` both serve Bulgarian
- English is accessed via `/en/` prefix
- Language is determined by URL only — no localStorage persistence, no browser auto-detection
- "URL is king" — the URL always determines the active language
- Language widget switches language and updates URL (Claude's discretion on whether to redirect or use `navigate`)

**Mid-Audit Language Switching**
- Language toggle is **only visible on the landing page and Step 1**
- Once the user advances past Step 1, the language widget is **hidden entirely** (not disabled — removed from UI)
- No "Start Over" or reset option — users who want to switch language navigate to `/en/` manually and start fresh
- Form progress is not preserved across language switches (language is locked early enough that this is a non-issue)

**Bulgarian Adaptations**
- **Currency:** Euro (EUR/€) everywhere, both languages — not USD, not BGN
- **Platforms/tools:** Mix approach — keep universal platforms (Google, Facebook, etc.), add BG-specific ones (imot.bg, OLX.bg, Viber, etc.), remove US-only ones
- **Date formats:** Same format everywhere, no locale-specific date formatting
- **Niches:** Same two niches (Home Services, Real Estate) with identical sub-niche lists in both languages — just translate the names
- **AI reports:** Report language matches audit language — Bulgarian audit produces Bulgarian AI report, English audit produces English report

### Claude's Discretion
- Language toggle widget design and placement (flags, text labels, etc.)
- URL update behavior on language switch (redirect vs client-side navigation)
- Translation file namespace organization
- i18next configuration details

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| I18N-01 | User can access the app in Bulgarian via `/bg/` URL path prefix | Optional segment routing `/:lang?` in React Router v6.30+ covers both `/` (default BG) and `/bg/` alias |
| I18N-02 | User can switch between English and Bulgarian from any page via a language toggle | `useNavigate` + `useLocation` pattern replaces lang prefix in current pathname; widget hidden after Step 1 |
| I18N-03 | User's language selection persists across page navigation within the same session | URL carries language — React Router optional segment `/:lang?` propagated to all child routes ensures persistence |
| I18N-04 | All internal navigation links preserve the current language prefix | `useLang()` hook returns prefix; all `navigate()` calls and `<Link to>` values prepend prefix |
| I18N-05 | Form components store language-neutral values (not translated labels) so scoring works regardless of language | `{value, label}` API for `StyledSelect` and `MultiCheckbox` — value stored is always the English scoring key |
| I18N-06 | Shareable report URLs include language context so recipients see the report in the original language | `/bg/report/:id` or `/en/report/:id` — language stored in `audits` table `language` column (Phase 10), read from URL in Report page |
</phase_requirements>

---

## Summary

Phase 6 installs `i18next` + `react-i18next`, wires language-aware URL routing, and separates form value storage from display labels. The three distinct problems have clear, well-understood solutions.

**Problem 1 (i18next setup):** Install 4 packages, create `src/lib/i18n.ts`, import in `main.tsx`. No backend plugin — translations are static JSON in `src/locales/`. No browser language detection — URL is the only source of truth. i18next is initialized with `lng` set from the URL before the first render.

**Problem 2 (URL routing):** React Router v6.30 (already installed) supports optional path segments with `?` syntax. The App.tsx route tree wraps all routes under `/:lang?` — a single route tree, not duplicated. A `useLang()` hook extracts and validates the lang parameter (`'en'` or `undefined`/`'bg'`), determines active language, and returns a `langPrefix` string (`''` for Bulgarian default, `'/en'` for English). All `navigate()` and `<Link to>` calls prepend this prefix. Language toggle uses `useNavigate` + `useLocation` to swap the prefix on the current path.

**Problem 3 (value/label separation):** `StyledSelect` and `MultiCheckbox` currently accept `options: string[]` where the same string is both displayed and stored. With Bulgarian, the displayed label changes but the stored scoring value must stay as the English key. The fix: change both components to accept `options: Array<{value: string, label: string}>` and store `value` while displaying `label`. All call sites pass English string values; labels come from translation JSON. This is the highest-risk refactor due to breadth — 8 step files touch these components.

**Primary recommendation:** Use `/:lang?` optional segment in React Router (no duplication), initialize i18next synchronously from URL param before render, and refactor `StyledSelect`/`MultiCheckbox` to `{value, label}` API before any translation work begins.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| i18next | 25.8.13 | Core i18n framework — translation keys, plurals, interpolation | Industry standard; 8M+ weekly downloads; framework-agnostic core |
| react-i18next | 16.5.4 | React bindings for i18next — `useTranslation`, `Trans`, `I18nextProvider` | Official React adapter; hooks-first API; full TypeScript support |
| i18next-browser-languagedetector | 8.2.1 | Detection plugin — **used only to read from URL path** (all other detectors disabled) | Required for `path` detection method; configured to read-only from URL |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none — no i18next-http-backend) | — | Translations are static JSON bundled at build time | Bundled translations: no async loading, no network request, instant |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| i18next + react-i18next | react-intl (FormatJS) | react-intl has less ecosystem, less community help, heavier API surface |
| i18next + react-i18next | Lingui | Lingui requires compile step (babel plugin), adds dev complexity |
| Static JSON in src/locales/ | i18next-http-backend (load from /public) | HTTP backend adds async loading complexity; static import is simpler for 2 languages |

**Installation:**
```bash
npm install i18next react-i18next i18next-browser-languagedetector
```
Total: 3 packages. No backend plugin needed.

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── locales/
│   ├── bg/
│   │   └── translation.json    # Bulgarian (default language)
│   └── en/
│       └── translation.json    # English
├── lib/
│   └── i18n.ts                 # i18next initialization
├── hooks/
│   └── useLang.ts              # URL lang extraction + prefix helper
├── components/
│   └── LanguageToggle.tsx      # Lang switcher widget (landing + Step 1 only)
└── @types/
    └── i18next.d.ts            # TypeScript type-safety for translation keys
```

### Pattern 1: URL-Only Language Detection

The `i18next-browser-languagedetector` plugin supports a `path` detection method. However, because i18next is initialized before React renders, and the URL is already available at `window.location.pathname`, the cleanest approach for this project is to read the language from the URL directly in `i18n.ts` and pass it as `lng` to `i18n.init()`.

**Why not use the detector plugin's path method:**
The detector's default order includes localStorage and navigator. The user constraint says "URL is king — no localStorage." Configuring the detector to use `order: ['path']` alone works, but requires `lookupFromPathIndex: 1` because the app is served from root (index 0 would be empty or the actual path segment). Directly reading from `window.location.pathname` and calling `i18n.changeLanguage()` from a React effect in the route layout is simpler and avoids detector misconfiguration pitfalls.

**Recommended approach: Read URL in `i18n.ts`, default to Bulgarian:**

```typescript
// src/lib/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import bgTranslation from '../locales/bg/translation.json';
import enTranslation from '../locales/en/translation.json';

// Determine initial language from URL path
// / or /bg/* → 'bg' (default)
// /en/* → 'en'
const pathLang = window.location.pathname.split('/')[1];
const initialLng = pathLang === 'en' ? 'en' : 'bg';

i18n
  .use(initReactI18next)
  .init({
    lng: initialLng,
    fallbackLng: 'bg',      // Bulgarian is the default
    resources: {
      bg: { translation: bgTranslation },
      en: { translation: enTranslation },
    },
    interpolation: {
      escapeValue: false,   // React already escapes
    },
    debug: false,
  });

export default i18n;
```

```typescript
// src/main.tsx
import './lib/i18n';  // Import BEFORE App renders
import { createRoot } from 'react-dom/client';
import App from './App';
// ...
```

### Pattern 2: React Router Optional Segment Routing

React Router v6.18+ (and the project's v6.30.1) supports optional segments with `?`. This avoids duplicating the entire route tree.

**Confirmed syntax from official docs (v6.30.3):**
```jsx
// /:lang? matches:
// /          → params.lang === undefined (Bulgarian default)
// /bg/       → params.lang === 'bg'    (Bulgarian explicit — same as /)
// /en/       → params.lang === 'en'    (English)
<Route path="/:lang?" element={<LangLayout />}>
  <Route index element={<Index />} />
  <Route path="audit" element={<AuditForm />} />
  <Route path="generating" element={<Loading />} />
  <Route path="report/:auditId" element={<Report />} />
</Route>
```

**CRITICAL: The `LangLayout` wrapper component** must:
1. Extract `params.lang` via `useParams()`
2. Validate it is `'en'` or `'bg'` or `undefined`
3. Call `i18n.changeLanguage()` when the URL lang changes
4. Render `<Outlet />` to show children

```typescript
// src/components/LangLayout.tsx
import { useEffect } from 'react';
import { useParams, Outlet } from 'react-router-dom';
import i18n from '@/lib/i18n';

const SUPPORTED_LANGS = ['en', 'bg'];

export function LangLayout() {
  const { lang } = useParams<{ lang?: string }>();
  // undefined or 'bg' → Bulgarian; 'en' → English
  const activeLang = lang === 'en' ? 'en' : 'bg';

  useEffect(() => {
    if (i18n.language !== activeLang) {
      i18n.changeLanguage(activeLang);
    }
  }, [activeLang]);

  // Redirect invalid lang segments to root
  // e.g. /fr/ → /
  if (lang && !SUPPORTED_LANGS.includes(lang)) {
    // Handle via redirect or just render with default
    // Simplest: treat unknown as Bulgarian
  }

  return <Outlet />;
}
```

### Pattern 3: `useLang()` Hook — The Navigation Helper

All components that navigate or render links need the language prefix. A central hook prevents repetition.

```typescript
// src/hooks/useLang.ts
import { useParams } from 'react-router-dom';

export type Lang = 'bg' | 'en';

export function useLang(): { lang: Lang; prefix: string } {
  const { lang } = useParams<{ lang?: string }>();
  const activeLang: Lang = lang === 'en' ? 'en' : 'bg';
  // prefix: '' for Bulgarian (default), '/en' for English
  const prefix = activeLang === 'en' ? '/en' : '';
  return { lang: activeLang, prefix };
}
```

**Usage in components:**
```typescript
// In AuditForm.tsx, Loading.tsx, Report.tsx, Index.tsx
const { prefix } = useLang();

// Navigation — prepend prefix
navigate(`${prefix}/audit?niche=${niche}`);
navigate(`${prefix}/generating`, { state: { ... } });
navigate(`${prefix}/report/${auditId}`, { state: { ... } });
navigate(prefix || '/');  // home

// Links
<Link to={`${prefix}/`}>Home</Link>
```

**Language toggle (landing page and Step 1 only):**
```typescript
// src/components/LanguageToggle.tsx
import { useNavigate, useLocation } from 'react-router-dom';
import { useLang } from '@/hooks/useLang';

export function LanguageToggle() {
  const navigate = useNavigate();
  const location = useLocation();
  const { lang, prefix } = useLang();

  const switchTo = (newLang: Lang) => {
    if (newLang === lang) return;
    const newPrefix = newLang === 'en' ? '/en' : '';
    // Replace old prefix with new prefix in current path
    const pathWithoutPrefix = prefix
      ? location.pathname.replace(prefix, '') || '/'
      : location.pathname;
    const newPath = `${newPrefix}${pathWithoutPrefix}`;
    navigate(newPath + location.search);
  };

  return (
    <div>
      <button onClick={() => switchTo('bg')} disabled={lang === 'bg'}>BG</button>
      <button onClick={() => switchTo('en')} disabled={lang === 'en'}>EN</button>
    </div>
  );
}
```

### Pattern 4: Value/Label Separation in Form Components

**Current problem:** `StyledSelect` and `MultiCheckbox` accept `options: string[]` — the string is both the display label and the stored value. The scoring engine uses these stored string values as lookup keys in `Record<string, number>` maps.

**Required change:** When Bulgarian translations are applied (Phase 7), the displayed label must be in Bulgarian but the stored value must stay in English (for scoring). This requires a `{value, label}` API.

**Refactored StyledSelect:**
```typescript
// BEFORE
options: string[]
// <option value={opt}>{opt}</option>  ← value and label are the same

// AFTER
interface SelectOption {
  value: string;   // English scoring key — ALWAYS stored
  label: string;   // Displayed text — changes per language
}
options: SelectOption[]
// <option value={opt.value}>{opt.label}</option>  ← value separate from label
```

**Refactored MultiCheckbox:**
```typescript
// BEFORE
options: string[]
selected: string[]
// toggle: add/remove the opt string itself

// AFTER
options: SelectOption[]
selected: string[]    // ← STILL stores English values
// toggle: add/remove opt.value; display opt.label
// isSelected = selected.includes(opt.value)
```

**How call sites change:**
```typescript
// BEFORE (Step3LeadFunnel.tsx)
<MultiCheckbox
  options={HS_LEAD_SOURCES}    // string[]
  selected={step3.leadSources}
  onChange={(v) => update({ leadSources: v })}
/>

// AFTER — Phase 6 (English-only, values === labels)
// Pass {value: str, label: str} where value === label for now
<MultiCheckbox
  options={HS_LEAD_SOURCES.map(s => ({ value: s, label: s }))}
  selected={step3.leadSources}
  onChange={(v) => update({ leadSources: v })}
/>
// Phase 7 will replace .map() with t() calls on labels
```

**Scoring engine is unaffected** — it reads `state.step3.leadSources` which still contains English strings. The `Record<string, number>` lookup maps continue working.

### Pattern 5: TypeScript Type Safety for Translations

**Create `src/@types/i18next.d.ts`:**
```typescript
import 'i18next';
import translation from '../locales/en/translation.json';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: {
      translation: typeof translation;
    };
  }
}
```

This gives full autocomplete and compile-time checking on `t('some.key')` — typos become TypeScript errors.

### Anti-Patterns to Avoid

- **Never store translated labels as form values.** `state.step3.leadSources` must always contain English strings. If you store `'Реклама в Google'` instead of `'Google Search/SEO'`, scoring breaks silently.
- **Never use localStorage or browser navigator for language.** The constraint is URL-only. Using `i18next-browser-languagedetector` with default order can cause a brief flash where the wrong language renders.
- **Never call `navigate('/')` without prefix.** Any bare `navigate('/')` in a component sends an English user back to `/` (Bulgarian). All navigation must use `const { prefix } = useLang()` and prepend it.
- **Don't duplicate the route tree.** Using two full `<Routes>` blocks (one for `/` and one for `/:lang`) doubles maintenance. The optional segment `/:lang?` in v6.30 solves this cleanly.
- **Don't skip the LangLayout wrapper.** Without a layout component that calls `i18n.changeLanguage()` on route changes, navigating from `/en/` to `/` won't update the language.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Translation key lookup, plurals, interpolation | Custom t() function | i18next `t()` | Edge cases: plurals, context, nested keys, fallbacks |
| Browser path detection for initial language | Custom `window.location.parse()` | Read `window.location.pathname.split('/')[1]` directly in `i18n.ts` | One-liner; deterministic; no plugin complexity |
| React re-render on language change | Custom context + state | react-i18next's `useTranslation()` hook | Handles re-render subscription automatically |
| Language toggle URL manipulation | Custom regex replace | Simple string replace with `prefix` and `newPrefix` variables | Simple enough to hand-roll correctly; no library adds value |

**Key insight:** i18next handles the hard parts (key resolution, fallbacks, TypeScript types). URL routing and navigation are simple enough to implement with a custom `useLang()` hook and the existing React Router APIs.

---

## Common Pitfalls

### Pitfall 1: Detection Order Causes Wrong Language Flash

**What goes wrong:** If `i18next-browser-languagedetector` is used with default order `['querystring', 'localStorage', 'navigator', 'path']`, it finds localStorage or navigator data before checking the path. A user who previously visited `/en/` and has an English locale stored in localStorage navigates to `/` (Bulgarian) — they briefly see English before the React effect corrects it.

**Why it happens:** The detector picks the first match. Default order prioritizes localStorage over path.

**How to avoid:** Do NOT use the browser language detector plugin at all. Instead, read `window.location.pathname` directly in `i18n.ts` to set `lng`. Then call `i18n.changeLanguage()` in the `LangLayout` component's `useEffect` when the route parameter changes. This is synchronous at init time and reactive at navigation time.

**Warning signs:** Page flashes from one language to another on load; `i18n.language` doesn't match the URL on initial render.

### Pitfall 2: Scoring Breaks When Labels Are Stored as Values

**What goes wrong:** A developer updates `MultiCheckbox` or `StyledSelect` call sites to pass translated Bulgarian strings as both value and label. `state.step3.leadSources` now contains `['Реклама в Google']`. The scoring engine looks up `scoreMap('Реклама в Google', leadTrackingScore)` — key not found — falls through to `?? 1` default. All scores are artificially elevated.

**Why it happens:** The current API `options: string[]` makes it natural to store whatever is displayed. The distinction only becomes obvious when translations are applied in Phase 7.

**How to avoid:** Refactor `StyledSelect` and `MultiCheckbox` to `{value, label}` API in Phase 6 — before any Bulgarian translations are written. Add a test that verifies `computeScores()` returns the same result for the same logical selections regardless of what label strings are used.

**Warning signs:** All scores suspiciously hover near the default value (typically around 50-60 from `?? 1` fallbacks). `scoreMap()` returns `1` for all form values when run in Bulgarian context.

### Pitfall 3: `navigate('/')` Loses Language Context

**What goes wrong:** Components that call `navigate('/')` after a successful submission or on error return the user to `/` (Bulgarian). An English-language user gets sent to the Bulgarian landing page. This affects: `Loading.tsx` error handling, `AuditForm.tsx` back button, `Report.tsx` "Start a New Audit" link.

**Why it happens:** All existing navigation is hardcoded to bare paths. There are ~8 call sites across 4 files.

**How to avoid:** Do a full audit of all `navigate()` calls and `<Link to>` usages in `src/pages/` and update all of them to use `const { prefix } = useLang()` and prepend the prefix.

**Warning signs:** Clicking "Back" or "Home" from English routes lands on Bulgarian pages.

### Pitfall 4: Shareable Report URLs Lose Language

**What goes wrong:** When a user on `/en/report/abc123` copies the URL and shares it, the recipient opens it in English. But if `Loading.tsx` navigates to `/report/${auditId}` instead of `${prefix}/report/${auditId}`, the generated URL has no language prefix.

**Why it happens:** The URL for the shareable report is constructed in `Loading.tsx` at `navigate(`/report/${auditId}`, ...)`. If this bare path is what gets stored and shared, it will always load as Bulgarian (the default).

**How to avoid:** Ensure `Loading.tsx` uses `${prefix}/report/${auditId}` when navigating. Since the report URL is shareable, the language prefix in the URL IS the persistence mechanism. This directly satisfies I18N-06.

### Pitfall 5: `/bg/` Alias Ambiguity in Route Matching

**What goes wrong:** The user constraint says both `/` and `/bg/` serve Bulgarian. With the `/:lang?` pattern, `/bg/` matches with `params.lang === 'bg'`. The `LangLayout` treats `'bg'` the same as `undefined` (both → Bulgarian). However, if a user navigates from `/` to `/bg/`, or vice versa, the URL changes but `i18n.language` was already `'bg'`. This is fine functionally but could cause a double navigate if not handled.

**Why it happens:** The `LangLayout` effect fires whenever `params.lang` changes. `undefined` → `'bg'` → both mean Bulgarian, but they are different values.

**How to avoid:** In `useLang()`, normalize `undefined` and `'bg'` to the same canonical form. Don't redirect `/bg/` to `/` or vice versa — let both work. The language toggle should produce clean URLs: switching to Bulgarian from English goes to `''` (no prefix), not `/bg/`.

---

## Code Examples

Verified patterns from official sources:

### Complete App.tsx Route Structure
```typescript
// Source: React Router v6.30 official docs — optional segments
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LangLayout } from './components/LangLayout';

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/:lang?" element={<LangLayout />}>
            <Route index element={<Index />} />
            <Route path="audit" element={<AuditForm />} />
            <Route path="generating" element={<Loading />} />
            <Route path="report/:auditId" element={<Report />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);
```

### i18n.ts — URL-Driven Initialization
```typescript
// Source: i18next docs + pattern derived from project constraints
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import bgTranslation from '../locales/bg/translation.json';
import enTranslation from '../locales/en/translation.json';

const pathLang = window.location.pathname.split('/')[1];
const initialLng = pathLang === 'en' ? 'en' : 'bg';

i18n
  .use(initReactI18next)
  .init({
    lng: initialLng,
    fallbackLng: 'bg',
    resources: {
      bg: { translation: bgTranslation },
      en: { translation: enTranslation },
    },
    interpolation: { escapeValue: false },
  });

export default i18n;
```

### TypeScript Declaration File
```typescript
// Source: i18next official TypeScript docs — https://www.i18next.com/overview/typescript
// src/@types/i18next.d.ts
import 'i18next';
import translation from '../locales/en/translation.json';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: {
      translation: typeof translation;
    };
  }
}
```

### Translation JSON Structure (Minimal for Phase 6)
Phase 6 only needs to prove the wiring works — actual translation content is Phase 7. Start with a thin structure:

```json
// src/locales/en/translation.json
{
  "nav": {
    "home": "Home",
    "language": "Language"
  },
  "landing": {
    "title": "Get Your Free AI Business Audit"
  },
  "common": {
    "next": "Next Step",
    "back": "Back",
    "save": "Save Progress"
  }
}

// src/locales/bg/translation.json
{
  "nav": {
    "home": "Начало",
    "language": "Език"
  },
  "landing": {
    "title": "Вземете безплатен AI одит на бизнеса си"
  },
  "common": {
    "next": "Следваща стъпка",
    "back": "Назад",
    "save": "Запази напредъка"
  }
}
```

### StyledSelect with {value, label} API
```typescript
// Refactored AuditFormComponents.tsx
export interface SelectOption {
  value: string;   // Always English — stored in state, used by scoring
  label: string;   // Displayed — changes per language in Phase 7
}

export function StyledSelect({
  value,
  onChange,
  options,
  placeholder = 'Select an option...',
}: {
  value: string;
  onChange: (v: string) => void;
  options: SelectOption[];
  placeholder?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-11 px-3 rounded-xl border ..."
    >
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
```

### MultiCheckbox with {value, label} API
```typescript
// Refactored AuditFormComponents.tsx
export function MultiCheckbox({
  options,
  selected,
  onChange,
  columns = 2,
}: {
  options: SelectOption[];
  selected: string[];        // English values stored in state
  onChange: (selected: string[]) => void;
  columns?: number;
}) {
  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((s) => s !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  return (
    <div className={...}>
      {options.map((opt) => {
        const isSelected = selected.includes(opt.value);  // compare by value
        return (
          <label key={opt.value} onClick={() => toggle(opt.value)} ...>
            ...
            <span>{opt.label}</span>     {/* display label */}
          </label>
        );
      })}
    </div>
  );
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| React Router v5 `/:lang?` optional params | React Router v6 dropped optional params | v6.0 (Nov 2021) | Required route duplication workarounds |
| Route duplication workaround | React Router v6.18 re-added optional segments with `?` | v6.18 (Oct 2023) | Clean `/:lang?` syntax now works again |
| i18next with HTTP backend (async) | Static JSON import at build time | Ongoing pattern | Simpler for 2 languages; no loading states |
| Store display string as form value | `{value, label}` API | New in Phase 6 | Separates scoring key from display text |

**Deprecated/outdated:**
- `i18next-http-backend`: Not needed for this project — static JSON bundled with app is simpler for 2 languages and avoids async loading complexity.
- `i18next-browser-languagedetector`: Not used — URL is the only language source, and reading `window.location.pathname` directly in `i18n.ts` is more reliable than the detector plugin with custom order configuration.

---

## Open Questions

1. **`/bg/` redirect behavior**
   - What we know: Both `/` and `/bg/` serve Bulgarian. The optional segment routes match both.
   - What's unclear: Should the language toggle produce `/` (no prefix) when switching to Bulgarian, or `/bg/`? Both work. Canonical form matters for shareable URLs.
   - Recommendation: Language toggle should produce `/` (no prefix) for Bulgarian — cleaner URLs. `/bg/` is an alias that works but is not the canonical form. The `useLang()` hook normalizes both to the same `lang: 'bg'` output.

2. **`<Suspense>` around i18n**
   - What we know: react-i18next recommends `<Suspense>` when using async translation loading. With static JSON imports, init is synchronous.
   - What's unclear: Does synchronous `i18n.init()` with inline resources require `<Suspense>`?
   - Recommendation: With static JSON (no backend plugin), i18n is ready before the first render. No `<Suspense>` needed. If init is somehow async in practice, wrap `<App>` in `<Suspense fallback={null}>`.

3. **NotFound page language prefix**
   - What we know: The `<Route path="*">` catch-all is outside the `/:lang?` layout.
   - What's unclear: Does `/en/nonexistent` correctly fall through to the 404?
   - Recommendation: Move the catch-all inside the `/:lang?` layout, or add a separate `/:lang?/*` catch-all route. Test both `/nonexistent` and `/en/nonexistent` to confirm 404 behavior.

---

## Sources

### Primary (HIGH confidence)
- React Router v6.30.3 official docs — https://reactrouter.com/6.30.3/route/route — confirmed `/:lang?` optional segment syntax and `useParams` behavior
- React Router v6.30.3 changelog — https://reactrouter.com/6.30.3/start/changelog — confirmed optional segments added in v6.18.0
- i18next official TypeScript docs — https://www.i18next.com/overview/typescript — confirmed `CustomTypeOptions` interface and d.ts pattern
- i18next API docs — https://www.i18next.com/overview/api — confirmed `changeLanguage()`, `t()`, `init()` patterns
- react-i18next official docs — https://react.i18next.com/latest/using-with-hooks — confirmed `useTranslation` hook, `I18nextProvider`, static init pattern
- npm package versions verified: i18next@25.8.13, react-i18next@16.5.4, i18next-browser-languagedetector@8.2.1

### Secondary (MEDIUM confidence)
- GitHub Discussion #10510 (remix-run/react-router) — i18n routing patterns with optional segments, `useUrlLang()` hook pattern — verified against official docs
- GitHub Issue #8381 (remix-run/react-router) — history of optional segment removal in v6 and re-addition — corroborates changelog

### Tertiary (LOW confidence)
- Various blog posts on i18next + React Router — community patterns; verified against official docs where used

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — package versions confirmed from npm registry; i18next + react-i18next is the clear industry standard
- Architecture: HIGH — optional segments confirmed in official v6.30 docs; `{value, label}` pattern is straightforward TypeScript; `useLang()` hook is a clean abstraction
- Pitfalls: HIGH — scoring breakage from stored labels is a logical deduction from current code; navigation prefix pitfall is confirmed by codebase audit (8 files have bare `navigate()` calls)

**Research date:** 2026-02-21
**Valid until:** 2026-08-21 (stable libraries; i18next/react-router APIs are stable)

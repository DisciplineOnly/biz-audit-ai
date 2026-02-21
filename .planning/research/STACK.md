# Stack Research — v1.1 Localization & Sub-Niche Specialization

**Domain:** i18n infrastructure + Bulgarian translation + sub-niche data modeling for existing React/Vite/TypeScript SPA
**Researched:** 2026-02-21
**Confidence:** HIGH (i18n library choices), HIGH (routing pattern), MEDIUM (TypeScript type-safe setup), HIGH (AI report language param)

> **Scope note:** This document covers ONLY new additions for v1.1. The existing stack
> (React 18 / Vite 5 / TypeScript 5 / Tailwind 3 / shadcn/ui / Supabase / Claude Haiku 4.5 /
> react-router-dom v6.30.1) is validated and not re-researched.

---

## Recommended Stack

### Core New Dependencies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| i18next | ^25.8.13 | Core i18n engine — translation lookup, interpolation, pluralization, namespace management | Industry standard. 11M+ weekly downloads. Works in browser, Deno, and Node.js without configuration differences. The rest of the i18n stack is built on top of it. TypeScript v5 required (already satisfied). |
| react-i18next | ^16.5.4 | React bindings for i18next — `useTranslation()` hook, `<Trans>` component, `I18nextProvider` | Official React integration. v16 added React Compiler compatibility and React.memo support. Peer deps: React >=16.8.0, i18next >=23.2.3 — both satisfied. |
| i18next-resources-to-backend | ^1.2.1 | Lazy-load translation JSON files via Vite dynamic imports | Replaces i18next-http-backend for Vite projects. Uses `import('./locales/${lang}/${ns}.json')` — Vite code-splits the JSON files at build time so Bulgarian translations are NOT included in the initial bundle for English users. Avoids a public/locales HTTP fetch on every page load. |
| i18next-browser-languagedetector | ^8.2.1 | Detect language from URL path segment | Configured with `order: ['path', 'localStorage']` and `lookupFromPathIndex: 0`. Reads the `/bg/` prefix automatically, syncs to localStorage for persistence across navigations. |

### No New Backend Dependencies

The Supabase edge function `generate-report` does NOT need a new library. Bulgarian report generation is achieved by passing `language: 'bg'` in the request body and adding a single instruction line to the existing `buildPrompt()` system prompt. Claude Haiku 4.5 has strong Bulgarian capability — MEDIUM confidence (not benchmarked specifically for Bulgarian business prose, but Anthropic's multilingual support covers Bulgarian per their documentation).

### No New Routing Library

React Router v6 (already installed at ^6.30.1) handles language-prefixed URLs natively via optional segments (`/:lang?`). No additional library needed.

---

## Supporting Setup (No npm install)

### TypeScript Type Augmentation

Create `src/types/i18next.d.ts` to make `useTranslation()` type-safe with autocompletion:

```typescript
// src/types/i18next.d.ts
import "i18next";
import en from "../locales/en/common.json";
import en_form from "../locales/en/form.json";
import en_report from "../locales/en/report.json";

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "common";
    resources: {
      common: typeof en;
      form: typeof en_form;
      report: typeof en_report;
    };
  }
}
```

This approach provides compile-time errors when translation keys don't exist, and IDE autocompletion on `t('key')` calls. Only the English (source) locale is typed — Bulgarian translations are structurally identical JSON so no separate type declaration needed.

### Translation File Structure

```
src/locales/
  en/
    common.json     # UI chrome: nav, buttons, labels, landing page
    form.json       # All 8 audit steps, questions, answer options
    report.json     # Report page labels, section headings, CTA text
  bg/
    common.json
    form.json
    report.json
```

Three namespaces match three distinct lazy-load points: the form namespace loads when the user starts the audit, the report namespace loads when the report page renders. Common loads at app init.

### Sub-Niche Data Modeling — No New Library

Sub-niche specialization uses TypeScript discriminated union config objects — no library needed. The existing `isHS: boolean` pattern is expanded to a sub-niche key:

```typescript
// src/types/subniche.ts
export type HomeServicesSubNiche =
  | 'hvac' | 'plumbing' | 'electrical' | 'roofing'
  | 'landscaping' | 'pest_control' | 'garage_doors'
  | 'painting' | 'general_contracting' | 'construction'
  | 'interior_design' | 'cleaning';

export type RealEstateSubNiche =
  | 'residential_sales' | 'commercial' | 'property_management'
  | 'new_construction' | 'luxury_resort';

export type SubNiche = HomeServicesSubNiche | RealEstateSubNiche;
```

Sub-niche-specific question options live in config files (`src/config/subniches/`), not in component JSX. Components read from the config based on active sub-niche. This keeps translation keys consistent — the config maps sub-niche to answer option keys, translations map keys to display strings per language.

---

## Installation

```bash
# i18n core (4 packages total)
npm install i18next react-i18next i18next-resources-to-backend i18next-browser-languagedetector
```

That is the complete set of new frontend npm dependencies for v1.1.

---

## Integration with Existing React Router v6

The existing `App.tsx` uses `BrowserRouter` (not `createBrowserRouter`). This matters because `createBrowserRouter` + i18next has a known initialization-order issue when route metadata calls `i18n.t()` before i18next has initialized. `BrowserRouter` avoids this entirely.

### Routing Pattern — Nested Layout with Optional `:lang` Segment

```tsx
// App.tsx (updated)
<BrowserRouter>
  <Routes>
    {/* Language-scoped routes — both /bg/* and /* work */}
    <Route path="/:lang?" element={<LangLayout />}>
      <Route index element={<Index />} />
      <Route path="audit" element={<AuditForm />} />
      <Route path="generating" element={<Loading />} />
      <Route path="report/:auditId" element={<Report />} />
    </Route>
    <Route path="*" element={<NotFound />} />
  </Routes>
</BrowserRouter>
```

`LangLayout` is a thin wrapper component that:
1. Reads `params.lang` via `useParams()`
2. Validates it against `['bg']` (supported non-default locales)
3. Calls `i18n.changeLanguage(validLang ?? 'en')` on mount/change
4. Renders `<Outlet />` — no visible UI

The `:lang?` optional segment means `/` and `/bg/` both match. The `LangLayout` handles the redirect case: if `params.lang` is set but not in the supported list (e.g., `/about` would be misread as lang="about"), redirect to `/`.

**Why not `i18next-browser-languagedetector`'s path detection instead?** The detector reads `window.location.pathname` directly, which doesn't integrate with React Router's routing state. Using `useParams()` in a layout component is the React Router-idiomatic approach and avoids timing issues on client-side navigation.

### i18n Initialization

```typescript
// src/i18n.ts
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import resourcesToBackend from 'i18next-resources-to-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

i18next
  .use(LanguageDetector)
  .use(resourcesToBackend(
    (language: string, namespace: string) =>
      import(`./locales/${language}/${namespace}.json`)
  ))
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en', 'bg'],
    defaultNS: 'common',
    ns: ['common', 'form', 'report'],
    detection: {
      order: ['path', 'localStorage'],
      lookupFromPathIndex: 0,
      caches: ['localStorage'],
    },
    interpolation: { escapeValue: false }, // React already escapes
  });

export default i18next;
```

Import `./i18n` in `main.tsx` before rendering `<App />`. The `LangLayout` component takes over runtime language switching from React Router state.

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| i18next + react-i18next | next-intl | Only if you migrate to Next.js. next-intl is Next.js-specific and won't run in Vite. |
| i18next + react-i18next | react-intl (FormatJS) | Only if you need ICU message format compliance for complex pluralization rules or date/number formatting central to the product. BizAudit has minimal pluralization needs. react-intl is 22KB vs i18next's 15KB but provides less flexible lazy loading for Vite. |
| i18next + react-i18next | Lingui | Lingui is excellent but requires a Babel/SWC macro for message extraction. The existing Vite setup uses `@vitejs/plugin-react-swc` — Lingui SWC support is documented but less battle-tested than Babel. Adds build complexity for marginal benefit on a 2-language project. |
| i18next-resources-to-backend | i18next-http-backend | Use http-backend if translations live in `public/locales/` (CDN-served, editable without rebuild). For this project, rebuilding on translation changes is acceptable and the Vite dynamic import approach yields better performance (code-split, no separate HTTP request). |
| Optional `:lang?` segment in React Router | Separate route trees (`/` and `/bg/` defined separately) | Separate trees avoid the LangLayout validation logic but require duplicating all route definitions. As route count grows (sub-niche pages, more languages), duplication becomes unmaintainable. |
| TypeScript type augmentation with `i18next.d.ts` | No TypeScript typing (string keys) | Untyped keys allow silent translation misses. With 3 namespaces × 2 languages × ~200 keys per namespace, missing key bugs are common. The type augmentation setup is 20 lines of boilerplate with high payoff. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `i18next-browser-languagedetector` path detection as the SOLE language source | `window.location.pathname` is not updated after React Router client-side navigation until `window.history` settles. Race condition on fast navigations. | Use it for initial detection only; hand off to `LangLayout` + `i18n.changeLanguage()` for React Router-driven navigation |
| Separate `basename` per language on `BrowserRouter` (e.g., `basename="/bg"`) | React Router's `BrowserRouter` accepts a single static basename at mount time. You cannot swap basenames to switch languages at runtime — it remounts the entire router. | Optional `:lang?` segment with a layout component |
| Storing all translations in a single JSON file | One monolithic file means ALL languages load at startup. At 2 languages × 3 namespaces × ~200 keys each, the payload stays small today, but the pattern doesn't scale. | Three-namespace split with `i18next-resources-to-backend` lazy loading |
| react-router-i18n (npm package) | Low adoption (~500 weekly downloads), last updated 2019, targets React Router v4 API. Not maintained for v6. | Native React Router v6 optional segments + LangLayout |
| Translation management SaaS (Locize, Phrase, Crowdin) | Unnecessary overhead for a 2-language product where translation quality is manually reviewed. These services add external dependencies and monthly costs. | JSON files in `src/locales/`, translated via AI-assisted workflow reviewed by a native Bulgarian speaker |

---

## Stack Patterns by Scenario

**If a third language is added later (e.g., Romanian):**
- Add `'ro'` to `supportedLngs` in `i18n.ts`
- Add `src/locales/ro/` JSON files
- Add `'ro'` to the validation list in `LangLayout`
- Zero routing changes needed — `:lang?` already matches any path segment

**If sub-niche scoring weights differ significantly:**
- Keep the config in `src/config/subniches/scoring.ts` (a map of SubNiche → weight overrides)
- The existing `computeScores()` function in `scoring.ts` accepts a weights parameter — no architectural change, just add an override lookup

**If the edge function needs to return Bulgarian report content:**
- Pass `language: 'bg'` (or `'en'`) in the `generate-report` request body
- Add to system prompt: `"Generate the entire report in ${language === 'bg' ? 'Bulgarian' : 'English'}. Use natural, professional ${language === 'bg' ? 'Bulgarian' : 'English'} business language throughout."`
- No new packages or Deno dependencies needed — Claude Haiku 4.5 handles Bulgarian generation natively

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| i18next@25.8.13 | TypeScript >=5.0 | TypeScript 5 required. Project is on TS 5.8.3 — satisfied. |
| react-i18next@16.5.4 | React >=16.8, i18next >=23.2.3 | Project is on React 18.3.1 and i18next 25.x — both satisfied. |
| i18next-resources-to-backend@1.2.1 | Vite 4+, Webpack 5+, Deno | Vite 5.4.11 — satisfied. Dynamic import syntax `import(\`./locales/${l}/${n}.json\`)` requires template literal string so Vite can analyze the import pattern. |
| i18next-browser-languagedetector@8.2.1 | Browser only (window, document) | Not used in edge functions. Import only in `src/i18n.ts`. |
| react-router-dom@6.30.1 | Optional segment `/:lang?` syntax | Optional segments were added in React Router v6.5.0. v6.30.1 is well past this. |

---

## Sources

- [react-i18next npm](https://www.npmjs.com/package/react-i18next) — v16.5.4 current version (verified via `npm info` command, HIGH confidence)
- [i18next npm](https://www.npmjs.com/package/i18next) — v25.8.13 current version (verified via `npm info`, HIGH confidence)
- [i18next-browser-languagedetector npm](https://www.npmjs.com/package/i18next-browser-languagedetector) — v8.2.1 (verified via `npm info`, HIGH confidence)
- [i18next-resources-to-backend npm](https://www.npmjs.com/package/i18next-resources-to-backend) — v1.2.1 (verified via `npm info`, HIGH confidence)
- [i18next-browser-languageDetector README](https://github.com/i18next/i18next-browser-languageDetector) — `lookupFromPathIndex` configuration, detection order (HIGH confidence, official repo)
- [i18next TypeScript docs](https://www.i18next.com/overview/typescript) — CustomTypeOptions augmentation pattern (HIGH confidence, official docs)
- [react-i18next TypeScript docs](https://react.i18next.com/latest/typescript) — TypeScript >=5 requirement, augmentation approach (HIGH confidence, official docs)
- [react-i18next CHANGELOG](https://github.com/i18next/react-i18next/blob/master/CHANGELOG.md) — v16 breaking changes review (HIGH confidence, official repo)
- [React Router i18n discussion #10510](https://github.com/remix-run/react-router/discussions/10510) — optional segment pattern for language prefix (MEDIUM confidence, community discussion, maintainer participated)
- [i18next-resources-to-backend GitHub](https://github.com/i18next/i18next-resources-to-backend) — dynamic import usage pattern (HIGH confidence, official repo)
- [Lingui vs i18next comparison](https://lingui.dev/misc/i18next) — Lingui's own comparison (MEDIUM confidence, biased source but technically accurate)
- WebSearch: react-i18next vs react-intl vs Lingui comparison, npm-compare.com bundle sizes (MEDIUM confidence)
- WebSearch: BrowserRouter + language segment patterns, createBrowserRouter initialization ordering issue (MEDIUM confidence)

---

*Stack research for: BizAudit v1.1 — i18n infrastructure, Bulgarian translation, sub-niche data modeling*
*Researched: 2026-02-21*

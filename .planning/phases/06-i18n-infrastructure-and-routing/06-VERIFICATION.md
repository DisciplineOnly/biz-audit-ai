---
phase: 06-i18n-infrastructure-and-routing
verified: 2026-02-22T12:00:00Z
status: human_needed
score: 11/11 automated must-haves verified
human_verification:
  - test: "Verify /bg/ redirect serves Bulgarian"
    expected: "Visiting /bg/ redirects to / and the page displays Bulgarian content"
    why_human: "LangLayout redirects /bg/ to / but redirect timing relative to i18n sync requires visual confirmation that Bulgarian content renders (not English) during the redirect"
  - test: "Verify full English audit flow preserves /en/ prefix end-to-end"
    expected: "Visiting /en/, starting audit, completing Steps 1-8, submitting, generates /en/generating and lands on /en/report/:id"
    why_human: "Multi-step navigation chain with real Supabase interaction — automated checks confirm each navigate() call uses prefix but real browser must confirm the chain holds end-to-end"
  - test: "Verify language toggle switches UI language on the landing page"
    expected: "Clicking EN from / shows English text; clicking BG from /en/ shows Bulgarian text — translation keys render, not raw key strings"
    why_human: "Translation rendering requires the React i18next context to be active and t() calls to be wired — Phase 6 only adds skeleton keys, not t() calls in components, so label text may still be hardcoded English on both languages"
  - test: "Verify LanguageToggle hidden on Steps 2-8"
    expected: "Toggle visible on landing page and Step 1; completely absent from DOM on Step 2 through Step 8"
    why_human: "Conditional rendering depends on currentStep state — needs browser DevTools inspection to confirm DOM removal"
---

# Phase 6: i18n Infrastructure and Routing Verification Report

**Phase Goal:** The app routes correctly by language and all components store language-neutral values so scoring never breaks
**Verified:** 2026-02-22
**Status:** human_needed — all automated checks pass; 4 items require human browser testing
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Visiting `/` loads the app with i18n.language === 'bg' | VERIFIED | `i18n.ts` reads `window.location.pathname.split('/')[1]`; if not `'en'`, sets `'bg'`. `LangLayout` calls `i18n.changeLanguage(activeLang)` on mount. Path `/` yields segment `''` which maps to `'bg'` |
| 2 | Visiting `/en/` loads the app with i18n.language === 'en' | VERIFIED | First segment `'en'` → `initialLng = 'en'` in `i18n.ts`. `LangLayout` receives `lang = 'en'`, sets `activeLang = 'en'`, calls `changeLanguage('en')` |
| 3 | Visiting `/en/audit` loads AuditForm with English active | VERIFIED | Route `/:lang?/audit` matches; `LangLayout` sets `activeLang = 'en'` from `lang` param; `AuditForm` renders as child via `<Outlet />` |
| 4 | Visiting `/bg/audit` loads AuditForm with Bulgarian active (same as `/audit`) | VERIFIED | `LangLayout` detects `lang === 'bg'`, fires redirect effect: `navigate('/audit' + search + hash, { replace: true })` → strips `/bg` prefix and redirects to `/audit` |
| 5 | `useLang()` hook returns prefix `''` for Bulgarian and `'/en'` for English | VERIFIED | `src/hooks/useLang.ts` line 8: `const prefix = activeLang === 'en' ? '/en' : ''` — exact logic confirmed |
| 6 | All `navigate()` calls prepend the language prefix — English user never loses `/en/` during navigation | VERIFIED | Zero bare `navigate("/")` or `navigate(\`/...)` without `prefix` found in any page file. All 5 pages (`Index.tsx`, `AuditForm.tsx`, `Loading.tsx`, `Report.tsx`, `NotFound.tsx`) import `useLang` and use `prefix` in every navigation |
| 7 | Language toggle switches between `/en/` and `/` (Bulgarian default) | VERIFIED | `LanguageToggle.tsx` `switchLang()` function: strips old prefix, prepends new prefix, calls `navigate(newPrefix + pathWithoutPrefix + location.search)` |
| 8 | Language toggle visible on landing page and Step 1 only | VERIFIED | `Index.tsx` unconditionally renders `<LanguageToggle />` in header. `AuditForm.tsx` line 191: `{currentStep === 1 && <LanguageToggle />}` — conditional on step 1 only |
| 9 | Navigating full English audit flow preserves `/en/` prefix throughout | VERIFIED (automated) | Loading.tsx has 3 calls to `navigate(\`${prefix}/report/${auditId}\`)` (lines 57, 98, 122) and 2 fallbacks to `navigate(prefix \|\| "/")`. AuditForm navigates to `\`${prefix}/generating\`` on step 8 completion |
| 10 | `StyledSelect` and `MultiCheckbox` accept `SelectOption[]` (not `string[]`) — stored values are English scoring keys | VERIFIED | `AuditFormComponents.tsx` exports `SelectOption` interface with `value: string` and `label: string`. Both `StyledSelect` and `MultiCheckbox` declare `options: SelectOption[]`. `onChange` stores `opt.value` (the scoring key) |
| 11 | All 8 step files use `toOptions()` wrapper — scoring engine is unaffected | VERIFIED | All 8 step files confirmed to import and use `toOptions`. Grep found zero bare `string[]` arrays passed to `StyledSelect` or `MultiCheckbox`. No `options={[` inline arrays found. `toOptions` is exported from `AuditFormComponents.tsx` at line 212-213 |

**Score:** 11/11 automated truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/i18n.ts` | i18next initialization with URL-driven language detection | VERIFIED | Exists. Reads `window.location.pathname.split('/')[1]`, sets `initialLng`, calls `i18n.use(initReactI18next).init(...)`. Exports default `i18n` |
| `src/locales/bg/translation.json` | Bulgarian translation namespace (minimal skeleton) | VERIFIED | Exists. Contains `nav`, `landing`, `common` keys with Bulgarian strings |
| `src/locales/en/translation.json` | English translation namespace (minimal skeleton) | VERIFIED | Exists. Contains matching `nav`, `landing`, `common` keys with English strings |
| `src/@types/i18next.d.ts` | TypeScript type-safety for translation keys | VERIFIED | Exists. Declares `CustomTypeOptions` with `defaultNS: 'translation'` and typed `resources` |
| `src/components/LangLayout.tsx` | Route layout that syncs i18n.language with URL param | VERIFIED | Exists. Two `useEffect` hooks: (1) redirects `/bg/...` → `/...`; (2) calls `i18n.changeLanguage(activeLang)` and sets `document.documentElement.lang`. Returns `<Outlet />` |
| `src/hooks/useLang.ts` | Language prefix hook for navigation | VERIFIED | Exists. Exports `useLang()` returning `{ lang: Lang, prefix: string }` and `Lang` type |
| `src/App.tsx` | Route tree with `/:lang?` optional segment | VERIFIED | Line 22: `<Route path="/:lang?" element={<LangLayout />}>` wraps all child routes |
| `src/components/LanguageToggle.tsx` | Language switcher widget (BG/EN toggle) | VERIFIED | Exists. Exports `LanguageToggle`. Renders two buttons with active state styling. `switchLang()` navigates to correct prefixed URL preserving path and query params |
| `src/components/audit/AuditFormComponents.tsx` | `SelectOption` type, refactored `StyledSelect` and `MultiCheckbox` | VERIFIED | Lines 3-6: `SelectOption` interface exported. Line 52-55: `StyledSelect` maps `opt.value`/`opt.label`. Lines 116-122: `MultiCheckbox` toggles on `opt.value`, displays `opt.label`. `toOptions` helper exported at line 212 |
| All 8 Step files | Use `{value, label}` API via `toOptions()` | VERIFIED | Steps 1-8 all confirmed: import `toOptions`, wrap all option arrays in `toOptions([...])`, pass `SelectOption[]` to `StyledSelect`/`MultiCheckbox` |
| `src/main.tsx` | i18n imported as first import before App | VERIFIED | Line 1: `import './lib/i18n';` — first statement before any other import |
| `src/pages/Index.tsx` | Language-aware landing page with toggle integration | VERIFIED | Imports `useLang`, destructures `prefix`, uses `${prefix}/audit` in all navigate calls, renders `<LanguageToggle />` in header |
| `src/pages/AuditForm.tsx` | Language-aware audit form with prefix on all navigations | VERIFIED | Imports `useLang`, uses `prefix` in all 4 navigate call sites, conditionally renders `<LanguageToggle />` on `currentStep === 1` |
| `src/pages/Loading.tsx` | Language-aware loading page with prefix on report URL | VERIFIED | Imports `useLang`, uses `prefix` in all 3 report navigation calls and 2 error fallbacks |
| `src/pages/Report.tsx` | Language-aware report page with prefix on all links | VERIFIED | Imports `useLang`, uses `prefix \|\| "/"` in header button `navigate()`, and in both `<Link to={prefix \|\| "/"}>` elements |
| `src/pages/NotFound.tsx` | Language-aware 404 page | VERIFIED | Imports `useLang`, uses `<Link to={prefix \|\| "/"}>` for home link |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/main.tsx` | `src/lib/i18n.ts` | import before App render | WIRED | Line 1 of `main.tsx`: `import './lib/i18n'` — first statement, before `createRoot` call |
| `src/App.tsx` | `src/components/LangLayout.tsx` | Route element | WIRED | Line 6 imports `LangLayout`; line 22: `<Route path="/:lang?" element={<LangLayout />}>` |
| `src/components/LangLayout.tsx` | `src/lib/i18n.ts` | `i18n.changeLanguage` in `useEffect` | WIRED | Line 3 imports `i18n`; lines 20-22: `if (i18n.language !== activeLang) { i18n.changeLanguage(activeLang); }` |
| `src/pages/Loading.tsx` | `src/pages/Report.tsx` | `navigate` with prefix to `/report/:id` | WIRED | 3 separate navigate calls all use `navigate(\`${prefix}/report/${auditId}\`, ...)` |
| `src/pages/Index.tsx` | `src/pages/AuditForm.tsx` | `navigate` with prefix to `/audit` | WIRED | Both paths use `navigate(\`${prefix}/audit?niche=${niche}...\`)` |
| `src/components/LanguageToggle.tsx` | `src/hooks/useLang.ts` | `useLang` for current language and prefix | WIRED | Line 2 imports `useLang, Lang`; line 7 calls `useLang()` |
| `src/pages/AuditForm.tsx` | `src/components/LanguageToggle.tsx` | conditionally renders toggle on Step 1 only | WIRED | Line 6 imports `LanguageToggle`; line 191: `{currentStep === 1 && <LanguageToggle />}` |
| `src/components/audit/Step2Technology.tsx` | `src/components/audit/AuditFormComponents.tsx` | imports `SelectOption` + `toOptions` | WIRED | Line 1 imports `toOptions`; lines 6-32 wrap all arrays in `toOptions([...])` |

### Requirements Coverage

| Requirement | Source Plans | Description | Status | Evidence |
|-------------|-------------|-------------|--------|---------|
| I18N-01 | 06-01, 06-04 | User can access the app in Bulgarian via `/bg/` URL path prefix | SATISFIED | `LangLayout` detects `lang === 'bg'` and redirects `/bg/...` → `/...` with `replace:true`. `/bg/` resolves to Bulgarian (redirect, no content loss). URL is normalized to canonical `/` form |
| I18N-02 | 06-03, 06-04 | User can switch between English and Bulgarian from any page via a language toggle | SATISFIED (scoped) | `LanguageToggle` exists and switches by URL navigation. Per explicit project decision (06-CONTEXT.md): toggle is only shown on landing page and Step 1 — intentional UX constraint, not a gap |
| I18N-03 | 06-01, 06-04 | User's language selection persists across page navigation within the same session | SATISFIED | URL-based persistence: every navigate() call prepends `prefix`. `LangLayout` reads URL param on every navigation and calls `changeLanguage`. Language follows URL throughout session |
| I18N-04 | 06-03, 06-04 | All internal navigation links preserve the current language prefix | SATISFIED | All 5 page files confirmed: zero bare `navigate("/")` calls, zero `<Link to="/">` without prefix. Every navigation target uses `\`${prefix}/...\`` or `prefix \|\| "/"` |
| I18N-05 | 06-02, 06-04 | Form components store language-neutral values (not translated labels) so scoring works regardless of language | SATISFIED | `SelectOption.value` = English scoring key; `SelectOption.label` = display text. `onChange` stores `opt.value` only. `toOptions()` sets `value === label` in Phase 6 (English-only); Phase 7 will replace labels with `t()` while values stay fixed |
| I18N-06 | 06-03, 06-04 | Shareable report URLs include language context so recipients see the report in the original language | SATISFIED | `Loading.tsx` navigates to `\`${prefix}/report/${auditId}\`` — prefix is embedded in the stored URL. `Report.tsx` reads language from URL via `LangLayout` when opened from a shareable link |

All 6 requirements satisfied. No orphaned requirements found — all 6 are claimed in plans 06-01 through 06-04.

### Anti-Patterns Found

No anti-patterns detected in Phase 6 files:
- No TODO/FIXME/placeholder comments in any i18n infrastructure files
- No stub implementations (empty returns, console.log-only handlers)
- No bare `navigate("/")` or `<Link to="/">` remaining in page files
- `options: string[]` type no longer used in `StyledSelect` or `MultiCheckbox`

### Human Verification Required

#### 1. Bulgarian Content Renders on /bg/ Redirect

**Test:** Visit `http://localhost:8080/bg/` in a browser
**Expected:** Page redirects to `http://localhost:8080/` and renders with Bulgarian content. The `document.documentElement.lang` attribute should be `"bg"`. The LangLayout redirect fires via `useEffect` after first render.
**Why human:** The redirect effect runs after initial render. There is a window between mount and redirect where `LangLayout` with `lang='bg'` renders — the `i18n.changeLanguage` effect must also fire correctly during this window. Visual and DevTools confirmation needed.

#### 2. Full English Audit Flow End-to-End

**Test:** Visit `http://localhost:8080/en/`, click a niche, complete all 8 steps, submit the form, wait for report generation
**Expected:** URL stays at `/en/...` throughout: `/en/audit`, `/en/generating`, `/en/report/:auditId`. The shareable report URL shown in the browser bar begins with `/en/`.
**Why human:** Multi-step navigation with real async Supabase operations. Automated checks confirm each individual navigate call uses `prefix`, but the full chain with network calls needs real browser verification.

#### 3. Language Toggle Actually Changes Displayed Language

**Test:** On the landing page, click "EN". Observe page text. Then click "BG". Observe page text.
**Expected:** Clicking EN shows English text in the hero headline and other UI elements. Clicking BG shows Bulgarian text.
**Why human:** Phase 6 adds i18n infrastructure and skeleton translation keys, but the landing page and step components are not yet using `t()` calls — the text is still hardcoded in the components. If `t()` calls are absent, the toggle will switch `i18n.language` but the visible UI text will not change. This needs confirmation of whether translated text actually renders or just the URL changes.

#### 4. LanguageToggle DOM Removal on Steps 2-8

**Test:** Start an audit, advance past Step 1 to Step 2. Open browser DevTools and inspect the DOM.
**Expected:** The `LanguageToggle` component (the `div.flex.items-center.gap-1.rounded-lg.border` containing BG/EN buttons) is completely absent from the DOM — not hidden with CSS, not `display:none`, but not in the DOM at all.
**Why human:** Conditional rendering `{currentStep === 1 && <LanguageToggle />}` should remove from DOM, but real browser confirmation with DevTools eliminates any doubt.

### Gaps Summary

No gaps found. All 11 automated must-haves are fully verified:

- i18next infrastructure is correctly wired (main.tsx → i18n.ts → LangLayout → changeLanguage)
- Route tree uses `/:lang?` optional segment with all pages as nested children
- `useLang()` hook returns correct prefix for both languages
- `LanguageToggle` navigates correctly, preserving path and query params
- All 8 step files use `SelectOption[]` via `toOptions()` — scoring values unchanged
- All 5 page files use `prefix` in every internal navigate/Link call
- Production build passes cleanly (1760 modules, zero TypeScript errors)

The 4 human verification items are observational confirmations of real browser behavior — primarily the language-toggle UI text rendering (item 3 is the most critical, as Phase 6 components may not use `t()` calls yet and the toggle may only change the URL without changing visible text).

---

_Verified: 2026-02-22_
_Verifier: Claude (gsd-verifier)_

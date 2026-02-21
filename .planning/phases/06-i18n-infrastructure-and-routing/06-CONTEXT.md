# Phase 6: i18n Infrastructure and Routing - Context

**Gathered:** 2026-02-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Install i18next, wire language-aware URL routing, and fix component value/label separation so scoring never breaks across languages. Bulgarian is the default language; English is the secondary option.

</domain>

<decisions>
## Implementation Decisions

### Language Persistence & URL Routing
- Bulgarian is the **default language** — `/` and `/bg/` both serve Bulgarian
- English is accessed via `/en/` prefix
- Language is determined by URL only — no localStorage persistence, no browser auto-detection
- "URL is king" — the URL always determines the active language
- Language widget switches language and updates URL (Claude's discretion on whether to redirect or use `navigate`)

### Mid-Audit Language Switching
- Language toggle is **only visible on the landing page and Step 1**
- Once the user advances past Step 1, the language widget is **hidden entirely** (not disabled — removed from UI)
- No "Start Over" or reset option — users who want to switch language navigate to `/en/` manually and start fresh
- Form progress is not preserved across language switches (language is locked early enough that this is a non-issue)

### Bulgarian Adaptations
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

</decisions>

<specifics>
## Specific Ideas

- The app is Bulgarian-first — root URL `/` defaults to Bulgarian, not English
- `/bg/` is an alias that also works for Bulgarian (both `/` and `/bg/` serve BG)
- The language lock after Step 1 means no complex state management for mid-audit switching

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 06-i18n-infrastructure-and-routing*
*Context gathered: 2026-02-21*

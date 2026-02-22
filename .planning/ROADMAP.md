# Roadmap: BizAudit

## Milestones

- ✅ **v1.0 MVP** — Phases 1-5 (shipped 2026-02-21) | [Archive](milestones/v1.0-ROADMAP.md)
- ✅ **v1.1 Localization & Sub-Niche Specialization** — Phases 6-11 (completed 2026-02-22)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-5) — SHIPPED 2026-02-21</summary>

- [x] Phase 1: Schema and Environment (3/3 plans) — completed 2026-02-19
- [x] Phase 2: AI Report Edge Function (2/2 plans) — completed 2026-02-19
- [x] Phase 3: Email and Webhook (3/3 plans) — completed 2026-02-20
- [x] Phase 4: Rate Limiting (2/2 plans) — completed 2026-02-20
- [x] Phase 5: Frontend Integration (3/3 plans) — completed 2026-02-20
- [ ] Phase 6: Verification and Hardening — dropped

</details>

### ✅ v1.1 Localization & Sub-Niche Specialization (Completed 2026-02-22)

**Milestone Goal:** Bulgarian language support with market-adapted content and sub-niche specialization of form questions across both languages.

- [x] **Phase 6: i18n Infrastructure and Routing** — Install i18next, wire `/bg/*` URL routing, fix component value/label API before any translation work
- [x] **Phase 7: English Translation Pass** — Extract all hardcoded strings into English JSON namespaces; verify zero regressions
- [x] **Phase 8: Sub-Niche Config and Selection UI** — Config-driven option branching for all 17 sub-niches; selection card grid in Step 1
- [x] **Phase 9: Scoring Engine Sub-Niche Weights** — Config-driven weight overrides per sub-niche group; scoring identical across languages
- [x] **Phase 10: Database and Backend Extension** — Persist language and sub-niche; fix Cyrillic sanitization; wire fields through to edge function (completed 2026-02-22)
- [x] **Phase 11: Bulgarian Content and AI Reports** — Full Bulgarian translation namespaces, BG-market options, AI report in Bulgarian (completed 2026-02-22)

## Phase Details

### Phase 6: i18n Infrastructure and Routing
**Goal**: The app routes correctly by language and all components store language-neutral values so scoring never breaks
**Depends on**: Phase 5 (v1.0 complete)
**Requirements**: I18N-01, I18N-02, I18N-03, I18N-04, I18N-05, I18N-06
**Success Criteria** (what must be TRUE):
  1. Visiting `/bg/` loads the app with `i18n.language === 'bg'` and visiting `/` loads with `'en'` — no manual language switching required
  2. The language toggle on any page switches language and stays on the same page without redirecting to home
  3. Navigating through the full audit flow (Steps 1-8 → Generating → Report) in Bulgarian never drops the `/bg/` prefix from the URL
  4. Form selections (dropdowns, checkboxes) store stable English strings as values regardless of which language is active — scoring lookups return the same score in English and Bulgarian for the same selection
  5. A shared report URL (`/bg/report/:id`) opens in Bulgarian for the recipient
**Plans:** 4 plans
Plans:
- [x] 06-01-PLAN.md — i18next setup, URL routing, LangLayout, useLang hook
- [x] 06-02-PLAN.md — Value/label refactor for StyledSelect and MultiCheckbox
- [x] 06-03-PLAN.md — Navigation prefix updates and LanguageToggle component
- [x] 06-04-PLAN.md — Human verification checkpoint

### Phase 7: English Translation Pass
**Goal**: Every hardcoded string in the app is extracted into English JSON namespaces and the English experience is byte-for-byte identical to pre-v1.1
**Depends on**: Phase 6
**Requirements**: TRANS-02, TRANS-03, TRANS-06
**Success Criteria** (what must be TRUE):
  1. All 8 form step labels, descriptions, placeholders, and validation messages are served from `en/steps.json` via `t()` calls — no hardcoded English strings remain in step components
  2. The landing page, audit form, and report page render identically to v1.0 in English (no visual or behavioral regressions)
  3. The report page headings, section labels, and score display text are served from `en/report.json`
**Plans**: 6 plans
Plans:
- [x] 07-01-PLAN.md — i18n namespace restructure + landing page extraction
- [x] 07-02-PLAN.md — Audit form chrome + form component extraction
- [x] 07-03-PLAN.md — Steps 1-4 field label/hint/placeholder extraction
- [x] 07-04-PLAN.md — Steps 5-8 field label/hint/placeholder extraction
- [x] 07-05-PLAN.md — Loading page + Report page + scoring display label extraction
- [x] 07-06-PLAN.md — Verification checkpoint

### Phase 8: Sub-Niche Config and Selection UI
**Goal**: Users can select their specific sub-niche and all relevant form option lists adapt to that selection in English
**Depends on**: Phase 7
**Requirements**: SUBN-01, SUBN-02, SUBN-03, SUBN-04, SUBN-05, SUBN-06, SUBN-07, SUBN-08
**Success Criteria** (what must be TRUE):
  1. After selecting Home Services, the user sees a sub-niche card grid (HVAC, Plumbing, Electrical, Roofing, Landscaping, Pest Control, Garage Doors, Painting, General Contracting, Construction, Interior Design, Cleaning) and cannot advance to Step 2 without making a selection
  2. After selecting Real Estate, the user sees a sub-niche card grid (Residential Sales, Commercial/Office, Property Management, New Construction, Luxury/Resort) and cannot advance without a selection
  3. CRM and software options in Step 2 show tools relevant to the selected sub-niche group (e.g., ServiceTitan for HVAC, GorillaDesk for Pest Control, Buildertrend for Construction, Lasso for New Construction)
  4. Lead source options in Step 3 and KPI options in Step 7 reflect the selected sub-niche — a plumber and a landscaper see meaningfully different lists
  5. Sub-niche selection state is preserved in localStorage and survives page refresh; sub-niche selection works identically whether the UI is in English or Bulgarian
**Plans**: 5 plans
Plans:
- [x] 08-01-PLAN.md — SubNiche types, AuditFormState integration, config schema and registry
- [x] 08-02-PLAN.md — SubNicheSelector card grid component, Step 1 integration, validation
- [x] 08-03-PLAN.md — Populate all CRM, tools, lead source, and KPI option data from research
- [x] 08-04-PLAN.md — Wire Steps 2, 3, 7 to read options from sub-niche config
- [x] 08-05-PLAN.md — Verification checkpoint

### Phase 9: Scoring Engine Sub-Niche Weights
**Goal**: Scoring reflects sub-niche business priorities through config-driven weight overrides with no regressions on English scoring
**Depends on**: Phase 8
**Requirements**: SCORE-01, SCORE-02, SCORE-03
**Success Criteria** (what must be TRUE):
  1. Running `computeScores()` without a sub-niche produces the same results as v1.0 (base weights unchanged)
  2. Running `computeScores()` with a sub-niche applies the config-defined weight overrides — the applied weights sum to 1.0 and differ meaningfully from base where research indicates (e.g., Operations weighted higher for project-based trades)
  3. The same answers submitted in English and Bulgarian produce identical numerical scores — language does not affect score output
**Plans**: 3 plans
Plans:
- [x] 09-01-PLAN.md — Research-driven weight config, computeScores() integration, AuditForm wiring
- [x] 09-02-PLAN.md — AI prompt sub-niche context in generate-report edge function
- [x] 09-03-PLAN.md — Verification checkpoint

### Phase 10: Database and Backend Extension
**Goal**: Completed audits persist language and sub-niche, the admin email reports both fields, and Bulgarian free-text reaches the AI unstripped
**Depends on**: Phase 8
**Requirements**: DB-01, DB-02, DB-03
**Success Criteria** (what must be TRUE):
  1. A completed English audit row in the `audits` table has `language = 'en'` and `sub_niche = '<selected sub-niche>'` — both fields present and correct
  2. The admin notification email body includes the language and sub-niche of the audit (e.g., "Language: Bulgarian | Sub-niche: HVAC")
  3. A Bulgarian user's free-text input (Cyrillic characters) passes through `sanitizeText()` and arrives at the AI prompt intact — no Cyrillic characters are stripped
**Plans:** 2/2 plans complete
Plans:
- [x] 10-01-PLAN.md — DB migration + submitAudit/fetchReport wiring + sanitization fix
- [x] 10-02-PLAN.md — Admin email language/sub-niche display and language-aware URLs

### Phase 11: Bulgarian Content and AI Reports
**Goal**: Users accessing `/bg/` experience a fully Bulgarian product — UI, form options, and AI-generated report — with Bulgarian-market-specific content
**Depends on**: Phase 6, Phase 7, Phase 8, Phase 10
**Requirements**: TRANS-01, TRANS-04, TRANS-05, AI-01, AI-02, AI-03
**Success Criteria** (what must be TRUE):
  1. A user who visits `/bg/` sees the landing page entirely in Bulgarian including niche selection copy, value proposition, and CTA
  2. A Bulgarian user completing the audit sees platform options native to the Bulgarian market — imot.bg and homes.bg in Real Estate lead sources, OLX.bg and bazar.bg in Home Services, Viber in communication tools — instead of US-market options
  3. Revenue and pricing fields in Bulgarian offer EUR-denominated tiers at locally appropriate values (not dollar amounts)
  4. After submitting a Bulgarian audit, the AI-generated report arrives written entirely in Bulgarian, references the user's sub-niche specifically (e.g., "като ВиК бизнес"), and mentions Bulgarian platforms in recommendations
  5. The rate-limit error displayed to a Bulgarian user reads in Bulgarian (frontend translates a machine-readable code, not a hardcoded English string from the edge function)
**Plans**: 4 plans
Plans:
- [x] 11-01-PLAN.md — Populate all 5 Bulgarian translation files (common, landing, steps, generating, report)
- [x] 11-02-PLAN.md — Bulgarian market options (imot.bg, OLX.bg, Viber) and EUR revenue/GCI tiers
- [x] 11-03-PLAN.md — Language-aware AI report generation with Bulgarian prompt template and i18n rate-limit errors
- [x] 11-04-PLAN.md — Verification checkpoint

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Schema and Environment | v1.0 | 3/3 | Complete | 2026-02-19 |
| 2. AI Report Edge Function | v1.0 | 2/2 | Complete | 2026-02-19 |
| 3. Email and Webhook | v1.0 | 3/3 | Complete | 2026-02-20 |
| 4. Rate Limiting | v1.0 | 2/2 | Complete | 2026-02-20 |
| 5. Frontend Integration | v1.0 | 3/3 | Complete | 2026-02-20 |
| 6. i18n Infrastructure and Routing | v1.1 | 4/4 | Complete | 2026-02-22 |
| 7. English Translation Pass | v1.1 | 6/6 | Complete | 2026-02-22 |
| 8. Sub-Niche Config and Selection UI | v1.1 | 5/5 | Complete | 2026-02-22 |
| 9. Scoring Engine Sub-Niche Weights | v1.1 | 3/3 | Complete | 2026-02-22 |
| 10. Database and Backend Extension | v1.1 | 2/2 | Complete | 2026-02-22 |
| 11. Bulgarian Content and AI Reports | v1.1 | 4/4 | Complete | 2026-02-22 |

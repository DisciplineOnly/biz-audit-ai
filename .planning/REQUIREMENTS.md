# Requirements: BizAudit

**Defined:** 2026-02-21
**Core Value:** Business owners complete the audit and receive a personalized, AI-driven analysis that makes them want to book a consultation

## v1.1 Requirements

Requirements for v1.1 Localization & Sub-Niche Specialization. Each maps to roadmap phases.

### i18n Infrastructure

- [ ] **I18N-01**: User can access the app in Bulgarian via `/bg/` URL path prefix
- [ ] **I18N-02**: User can switch between English and Bulgarian from any page via a language toggle
- [ ] **I18N-03**: User's language selection persists across page navigation within the same session
- [ ] **I18N-04**: All internal navigation links preserve the current language prefix
- [ ] **I18N-05**: Form components store language-neutral values (not translated labels) so scoring works regardless of language
- [ ] **I18N-06**: Shareable report URLs include language context so recipients see the report in the original language

### Translation

- [ ] **TRANS-01**: User sees all landing page content in Bulgarian when accessing `/bg/`
- [ ] **TRANS-02**: User sees all 8 form steps fully translated to Bulgarian (labels, descriptions, placeholders, validation messages)
- [ ] **TRANS-03**: User sees the report page (scores, headings, section labels) in Bulgarian when the audit was completed in Bulgarian
- [ ] **TRANS-04**: Bulgarian form options reflect the local market (Bulgarian CRMs, tools, platforms — e.g., imot.bg, OLX.bg, Viber)
- [ ] **TRANS-05**: Bulgarian price/revenue ranges use BGN currency with locally appropriate tiers
- [ ] **TRANS-06**: Existing English experience remains identical after i18n refactor (no regressions)

### Sub-Niche Specialization

- [ ] **SUBN-01**: User can select a sub-niche within Home Services (HVAC, Plumbing, Electrical, Roofing, Landscaping, Pest Control, Garage Doors, Painting, General Contracting, Construction, Interior Design, Cleaning)
- [ ] **SUBN-02**: User can select a market segment within Real Estate (Residential Sales, Commercial/Office, Property Management, New Construction, Luxury/Resort)
- [ ] **SUBN-03**: CRM/software options in Step 2 adapt to the selected sub-niche
- [ ] **SUBN-04**: Lead source options in Step 3 adapt to the selected sub-niche
- [ ] **SUBN-05**: KPI options in Step 7 adapt to the selected sub-niche
- [ ] **SUBN-06**: Pricing model and payment options in Step 8 adapt to the selected sub-niche
- [ ] **SUBN-07**: Tool/technology checklist in Step 2 adapts to the selected sub-niche
- [ ] **SUBN-08**: Sub-niche selection works identically in both English and Bulgarian

### Scoring

- [ ] **SCORE-01**: Scoring engine applies sub-niche-specific weight adjustments where research indicates different priorities
- [ ] **SCORE-02**: Scoring produces identical results for the same answers regardless of language (English vs Bulgarian)
- [ ] **SCORE-03**: Sub-niche weight overrides are config-driven (not hardcoded conditionals)

### AI Reports

- [ ] **AI-01**: User who completed the audit in Bulgarian receives an AI-generated report entirely in Bulgarian
- [ ] **AI-02**: AI report references sub-niche-specific context in its recommendations (e.g., "as a plumbing business" not generic "home services")
- [ ] **AI-03**: AI report for Bulgarian users references Bulgarian-market tools and platforms in recommendations

### Backend

- [ ] **DB-01**: Audit records store the language and sub-niche used during the audit
- [ ] **DB-02**: Admin notification email includes the language and sub-niche of the completed audit
- [ ] **DB-03**: `sanitizeText()` correctly handles Cyrillic characters (no stripping of Bulgarian input)

## v1.2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Content Refinement

- **CONTENT-01**: Property Management sub-niche gets restructured Step 4/8 questions (current lead management framing is wrong for PM workflows)
- **CONTENT-02**: Scoring weights validated against real audit data and adjusted per sub-niche
- **CONTENT-03**: Bulgarian translation reviewed by native Bulgarian business-domain speaker

### Additional Languages

- **LANG-01**: Framework supports adding a third language with minimal effort (translation files + route only)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Auto-detect language from browser | URL-based routing is explicit and SEO-friendly; auto-detect adds complexity |
| Per-sub-niche form structure changes | Same 8-step structure for all; only answer options change per sub-niche |
| More than 2 languages | Bulgarian + English only for v1.1 |
| Sub-niche-specific landing pages | Single landing page with niche selection; sub-niche selected in Step 1 |
| Real-time translation API | All translations are static JSON files, not dynamic |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| I18N-01 | Phase 6 | Pending |
| I18N-02 | Phase 6 | Pending |
| I18N-03 | Phase 6 | Pending |
| I18N-04 | Phase 6 | Pending |
| I18N-05 | Phase 6 | Pending |
| I18N-06 | Phase 6 | Pending |
| TRANS-01 | Phase 11 | Pending |
| TRANS-02 | Phase 7 | Pending |
| TRANS-03 | Phase 7 | Pending |
| TRANS-04 | Phase 11 | Pending |
| TRANS-05 | Phase 11 | Pending |
| TRANS-06 | Phase 7 | Pending |
| SUBN-01 | Phase 8 | Pending |
| SUBN-02 | Phase 8 | Pending |
| SUBN-03 | Phase 8 | Pending |
| SUBN-04 | Phase 8 | Pending |
| SUBN-05 | Phase 8 | Pending |
| SUBN-06 | Phase 8 | Pending |
| SUBN-07 | Phase 8 | Pending |
| SUBN-08 | Phase 8 | Pending |
| SCORE-01 | Phase 9 | Pending |
| SCORE-02 | Phase 9 | Pending |
| SCORE-03 | Phase 9 | Pending |
| AI-01 | Phase 11 | Pending |
| AI-02 | Phase 11 | Pending |
| AI-03 | Phase 11 | Pending |
| DB-01 | Phase 10 | Pending |
| DB-02 | Phase 10 | Pending |
| DB-03 | Phase 10 | Pending |

**Coverage:**
- v1.1 requirements: 29 total
- Mapped to phases: 29
- Unmapped: 0

---
*Requirements defined: 2026-02-21*
*Last updated: 2026-02-21 — traceability complete, all 29 requirements mapped to Phases 6-11*

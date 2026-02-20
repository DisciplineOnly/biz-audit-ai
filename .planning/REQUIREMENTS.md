# Requirements: BizAudit

**Defined:** 2026-02-19
**Core Value:** Business owners complete the audit and receive a personalized, AI-driven analysis that makes them want to book a consultation

## v1 Requirements

Requirements for this milestone. Each maps to roadmap phases.

### Data Persistence

- [x] **DATA-01**: Completed audit submissions are persisted to Supabase Postgres with all form answers, scores, and contact info
- [x] **DATA-02**: Each audit generates a unique UUID that serves as a permanent, shareable report URL
- [ ] **DATA-03**: Report page loads audit data from Supabase instead of localStorage when accessed via shareable URL

### AI Report Generation

- [x] **AI-01**: Edge function calls Claude Haiku 4.5 to generate personalized report text based on form answers
- [x] **AI-02**: AI prompt includes niche context (home services vs real estate) for industry-specific framing
- [x] **AI-03**: AI prompt includes actual category scores (0-100) so recommendations reference specific weak areas
- [x] **AI-04**: Generated report text replaces template-based content while keeping the existing report structure (gaps, quick wins, strategic recommendations)

### Email Notifications

- [x] **EMAIL-01**: Admin receives email notification when a new audit is completed, including contact name, email, niche, overall score, and report link
- [x] **EMAIL-02**: User receives email with a link to their completed report after AI generation finishes

### Security

- [ ] **SEC-01**: Rate limiting enforced on audit submissions (max 3 per email address per 24 hours)
- [x] **SEC-02**: RLS policies prevent anonymous users from reading other users' audit data
- [x] **SEC-03**: Service role key and API keys stored only in Supabase secrets, never in client-side code
- [x] **SEC-04**: User-provided free-text fields sanitized before inclusion in LLM prompts to prevent prompt injection

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### UX Improvements

- **UX-01**: Async polling on /generating page — user stays on page while report generates, auto-redirects when ready
- **UX-02**: Partner/referral attribution included in admin notification email
- **UX-03**: Browser-based PDF download via print-friendly CSS media query

### Lead Management

- **LEAD-01**: Admin dashboard to view, search, and filter completed audits
- **LEAD-02**: CRM integration (HubSpot/Zapier) for automated lead routing

## Out of Scope

| Feature | Reason |
|---------|--------|
| User accounts / authentication | Adds friction to anonymous lead-gen flow; UUID links sufficient for report access |
| Server-side PDF generation | Deno compatibility issues in edge functions; browser print-to-PDF is sufficient |
| Streaming AI output | GPT-4.1 mini returns full report in 5-15s; complexity not justified |
| Multi-step email sequences | Requires CRM/marketing automation platform; single transactional emails sufficient for v1 |
| A/B testing report formats | Ship one version first, test with real traffic later |
| Additional niches | Home Services and Real Estate only for this milestone |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| DATA-01 | Phase 1 | Complete |
| DATA-02 | Phase 1 | Complete |
| DATA-03 | Phase 5 | Pending |
| AI-01 | Phase 2 | Complete |
| AI-02 | Phase 2 | Complete |
| AI-03 | Phase 2 | Complete |
| AI-04 | Phase 2 | Complete |
| EMAIL-01 | Phase 3 | Complete |
| EMAIL-02 | Phase 3 | Complete |
| SEC-01 | Phase 4 | Pending |
| SEC-02 | Phase 1 | Complete |
| SEC-03 | Phase 1 | Complete |
| SEC-04 | Phase 2 | Complete |

**Coverage:**
- v1 requirements: 13 total
- Mapped to phases: 13
- Unmapped: 0

---
*Requirements defined: 2026-02-19*
*Last updated: 2026-02-19 after 01-02 execution — DATA-01, DATA-02, SEC-03 marked complete*

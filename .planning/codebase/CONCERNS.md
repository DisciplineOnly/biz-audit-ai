# Codebase Concerns

**Analysis Date:** 2026-02-19

## Tech Debt

**Silent JSON Parse Failures:**
- Issue: Bare `catch {}` block in `AuditForm.tsx` swallows all errors when parsing saved state from localStorage
- Files: `src/pages/AuditForm.tsx` (line 74), `src/pages/Index.tsx` (line 29)
- Impact: Malformed data silently fails to restore, user loses progress without notification. No logging to detect corruption patterns
- Fix approach: Replace with explicit error handling that logs to console and notifies user. Consider using JSON schema validation (e.g., Zod) to validate restored state shape

**Inefficient Auto-Save Pattern:**
- Issue: Every form state change triggers full `localStorage.setItem()` call without debouncing
- Files: `src/pages/AuditForm.tsx` (lines 86-90)
- Impact: Hundreds of writes per session on large forms. localStorage writes are synchronous and can cause jank. No throttling between saves
- Fix approach: Implement debounced save (300-500ms) using `useCallback` with React useEffect dependencies

**Duplicate Score Mapping Objects:**
- Issue: Large inline scoring maps repeated across `src/lib/scoring.ts` (communicationScore, automationScore, etc.) defined as separate constants but with overlapping values
- Files: `src/lib/scoring.ts` (lines 84-108, 45-51, etc.)
- Impact: Hard to maintain scoring consistency. If a value changes (e.g., "Yes — automated"), it must be updated in 3+ places
- Fix approach: Create a unified scoring dictionary and compose specific maps from shared base options

**Missing Niche Type Validation:**
- Issue: Step 4 component uses optional fields (step4: {}) without enforcing which fields are required per niche
- Files: `src/types/audit.ts` (line 165), `src/components/audit/Step4Scheduling.tsx`
- Impact: If niche is neither "home_services" nor "real_estate", scoring function will accept empty step4, producing incorrect scores
- Fix approach: Use discriminated union types in TypeScript to enforce niche-specific field requirements at compile time

## Test Coverage Gaps

**No Testing Infrastructure:**
- What's not tested: Core business logic, state reducer, scoring calculations, form validation
- Files: `src/test/example.test.ts` (placeholder only), `src/lib/scoring.ts`, `src/types/audit.ts`
- Risk: Scoring algorithm changes without verification. Scoring weights and calculation logic are untested
- Priority: High - scoring directly impacts business outcomes and recommendations

**Missing Unit Tests for Scoring:**
- What's not tested:
  - `computeScores()` with edge cases (empty state, all 0 selections, mismatched niches)
  - Score calculation accuracy for both home services and real estate flows
  - `scoreMap()` fallback behavior with unrecognized values
  - `calcCategory()` with 0-length arrays
- Files: `src/lib/scoring.ts` (lines 178-546)
- Risk: Silent bugs in weighting (line 514-522) could make certain categories appear incorrectly scored
- Priority: High

**No Validation Tests:**
- What's not tested: Form validation rules in `validateStep()` function
- Files: `src/pages/AuditForm.tsx` (lines 28-49)
- Risk: Email regex validation (line 35) is simplistic; form submission might fail client-side but shouldn't
- Priority: Medium

**No Integration Tests:**
- What's not tested: Full form flow, state restoration from localStorage, navigation between steps, report generation
- Files: Multiple - entire flow from `Index.tsx` → `AuditForm.tsx` → `Report.tsx`
- Risk: UI changes could silently break the form flow without catching them
- Priority: Medium

## Known Bugs

**Email Validation Too Permissive:**
- Symptoms: Regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` accepts invalid emails like `a@b.c` (all single characters)
- Files: `src/pages/AuditForm.tsx` (line 35)
- Trigger: Enter single-character email like `a@b.c` and advance past Step 1
- Workaround: None - accept invalid emails; downstream may reject at send time

**Browser Storage Quota Risk:**
- Symptoms: If user repeatedly navigates between niche selections, localStorage can accumulate stale data
- Files: `src/pages/Index.tsx` (line 35 removes one key but may leave orphaned `_scores` and `_form` keys)
- Trigger: User selects home_services, fills in data, goes back, selects real_estate → real_estate session created but old keys remain
- Workaround: Manual browser storage clear; eventually quota exceeded blocks all saves

**Missing Report Data Fallback:**
- Symptoms: Report page shows "No report data found" if user navigates directly without location.state
- Files: `src/pages/Report.tsx` (lines 107-115)
- Trigger: User refreshes `/report/:auditId` page or shares link with fresh browser session
- Workaround: None - must restart form; auditId in URL is decorative only, not used to fetch real data

## Security Considerations

**Client-Side Data Persistence:**
- Risk: All form data and scores stored unencrypted in browser localStorage, visible in DevTools
- Files: `src/pages/AuditForm.tsx` (lines 88, 123-124), `src/pages/Report.tsx` (lines 93, 97)
- Current mitigation: Data is user-entered, not sensitive
- Recommendations:
  - Add flag to allow "private mode" that skips localStorage entirely
  - If backend is added in future, encrypt data at rest and in transit
  - Document data retention policy (localStorage persists until manually cleared)

**No CSRF Protection:**
- Risk: If backend endpoints are added, form submissions lack CSRF tokens
- Files: All fetch/POST operations will need token headers
- Current mitigation: No backend calls currently exist; all computation is client-side
- Recommendations:
  - If integrating with backend, add CSRF token generation and validation
  - Use credentials: 'include' with secure cookie-based session tokens

**No Input Sanitization:**
- Risk: Business name, contact name, email, phone fields are stored as-is in localStorage and rendered in Report
- Files: `src/components/audit/Step1BusinessInfo.tsx` (input fields), `src/pages/Report.tsx` (lines 161, 164-176)
- Current mitigation: No HTML execution (all text content rendered as plain text)
- Recommendations:
  - Add length limits to input fields to prevent localStorage quota exhaustion
  - Consider regex validation on phone field (currently accepts any text)

## Performance Bottlenecks

**Expensive Report Generation on Navigation:**
- Problem: Every time `Report.tsx` mounts, it recalculates all scores via `computeScores()` if not in location.state
- Files: `src/pages/Report.tsx` (line 98), `src/lib/scoring.ts`
- Cause: Relies on redundant calculation instead of caching; computeScores() walks through all 200+ lines of scoring logic
- Improvement path:
  - Memoize score calculation results in localStorage (already done for `_scores` key)
  - Use `useMemo` in Report component to prevent recalculation on re-renders
  - Consider moving scoreMap object lookups outside component scope

**Unoptimized DOM Rendering in Forms:**
- Problem: Step components render dropdown/select options via inline arrays without memoization
- Files: `src/components/audit/Step*.tsx` (all step files have inline option arrays)
- Cause: Every render of a Step component re-creates option arrays
- Improvement path:
  - Extract all option arrays to constants at module level
  - Use `React.memo()` on individual field components
  - Lazy-load step components only when active

**Large Scoring Weights Dictionary:**
- Problem: `generateMockReport()` creates large nested gapMap object (line 578) on every render
- Files: `src/lib/scoring.ts` (lines 578-628)
- Cause: Object recreated per render; should be module-level constant
- Improvement path: Move `gapMap` and `quickWins`/`strategicRecs` to module constants; filter at call time

## Fragile Areas

**Reducer Validation Gap:**
- Files: `src/types/audit.ts` (lines 198-234)
- Why fragile: `auditReducer` doesn't validate action payloads; accepts any shape. E.g., `UPDATE_STEP4` can receive empty object
- Safe modification: Add TypeScript validation to ensure action types match payload shapes. Consider using discriminated unions more strictly
- Test coverage: No tests verifying reducer correctness with invalid inputs

**Niche-Dependent Conditional Logic:**
- Files: Multiple - `src/pages/AuditForm.tsx` (line 92), `src/pages/Report.tsx` (line 119), `src/lib/scoring.ts` (throughout)
- Why fragile: String literal checks `isHS = state.niche === "home_services"` used in 15+ places. If niche value changes, many places break
- Safe modification: Extract `isHS` to a utility function; use enum or const for niche values
- Test coverage: No tests validating consistent behavior across both niches

**Hard-Coded Storage Keys:**
- Files: `src/pages/AuditForm.tsx` (line 15), `src/pages/Report.tsx` (line 7), `src/pages/Index.tsx` (line 5)
- Why fragile: `STORAGE_KEY = "ep_audit_state"` defined in 3 places independently; typos cause data loss
- Safe modification: Extract to `src/constants.ts` and import everywhere
- Test coverage: No tests verifying localStorage operations use correct keys

**Validation Function Logic:**
- Files: `src/pages/AuditForm.tsx` (lines 28-49)
- Why fragile: `validateStep()` has hardcoded step numbers in switch statement; adding new step requires modifying function
- Safe modification: Move validation rules to step components or create config-driven validation array
- Test coverage: No tests; invalid step numbers silently return empty errors

## Scaling Limits

**localStorage Quota:**
- Current capacity: 5-10MB per domain (varies by browser)
- Limit: With full 8-step form + multiple saved sessions, could approach 100KB per session. 50+ sessions = storage exceeded
- Scaling path:
  - Implement IndexedDB for larger data storage
  - Add session cleanup UI to remove old audits
  - Implement server-side storage for submitted audits

**Score Calculation Complexity:**
- Current capacity: Single `computeScores()` call completes in <5ms on modern hardware
- Limit: If audit questions expand to 200+ items, lookup performance could degrade
- Scaling path:
  - Index scoring maps as objects instead of doing string lookups
  - Consider moving scoring to Web Worker if calculation expands

## Dependencies at Risk

**React Router v6.30.1:**
- Risk: Notable version (released mid-2024); not latest (currently 6.28+). May have accumulated security patches
- Impact: If vulnerability found, apps using old version become vector
- Migration plan: Regular dependency audits; update to latest v6.x quarterly. Lock file commit prevents accidental downgrades

**No Backend Framework:**
- Risk: Application currently 100% client-side. Any server integration will require new dependencies (Express, Next.js, etc.)
- Impact: Significant refactor required to add authentication, data persistence, email sending
- Migration plan: Plan backend architecture before adding real integrations; consider moving to Next.js/React Server Components for easier SSR

## Missing Critical Features

**No Audit History:**
- Problem: Reports cannot be accessed after page refresh or browser session ends
- Blocks: Users cannot retrieve completed audits; must re-run form to see results
- Fix: Add server backend to persist auditId → formState mapping, or use IndexedDB with date-keyed records

**No Email Delivery:**
- Problem: No way to send report to user's email
- Blocks: Users cannot receive PDF or share results beyond copy-pasting URL
- Fix: Add backend email service integration (SendGrid, AWS SES) with template rendering

**No Print/PDF Export (Browser Only):**
- Problem: "Download PDF" button (line 147 in Report.tsx) only triggers browser print dialog
- Blocks: Users must manually print-to-PDF; no reliable report delivery
- Fix: Integrate server-side PDF generation (Puppeteer, wkhtmltopdf, or client library like html2pdf)

**No Analytics:**
- Problem: Cannot track conversion funnel (% who start → complete form → see report)
- Blocks: No visibility into drop-off rates, most skipped questions, or business metrics
- Fix: Add Google Analytics or Segment event tracking

**No Partner Tracking:**
- Problem: Partner code stored in sessionStorage (line 64 in AuditForm.tsx) but never reported or tracked
- Blocks: Cannot attribute completed audits to referral sources
- Fix: Send partner code with form submission or to analytics backend

---

*Concerns audit: 2026-02-19*

# Architecture

**Analysis Date:** 2026-02-19

## Pattern Overview

**Overall:** Single-Page Application (SPA) with multi-step form wizard pattern powered by React, using client-side state management with React hooks and localStorage for persistence.

**Key Characteristics:**
- Multi-step form wizard with 8 sequential steps for business audit questionnaire
- Niche-aware (home services vs. real estate) conditional rendering throughout
- Client-side scoring engine that computes business health scores based on form responses
- Local storage persistence for form state with auto-save on every change
- Report generation from captured form state and computed scores
- Session-based partner code tracking for referrals

## Layers

**Presentation Layer:**
- Purpose: Render pages and components for user interaction
- Location: `src/pages/`, `src/components/`
- Contains: Page components (`Index.tsx`, `AuditForm.tsx`, `Report.tsx`, `Loading.tsx`, `NotFound.tsx`), UI components from shadcn (`src/components/ui/`), audit-specific form step components (`src/components/audit/`)
- Depends on: State management layer (useReducer, localStorage), types from audit types, scoring engine
- Used by: Browser router

**State Management Layer:**
- Purpose: Manage form state across the multi-step wizard, handle validation, persist form data
- Location: `src/types/audit.ts` (types, initial state, reducer)
- Contains: `AuditFormState` interface defining all 8 steps, `auditReducer` function for state updates, action types
- Depends on: Nothing
- Used by: `AuditForm.tsx` (via `useReducer`), other step components

**Business Logic Layer:**
- Purpose: Score form responses and generate audit report content
- Location: `src/lib/scoring.ts`
- Contains: Scoring mappings (`responseSpeedScore`, `leadTrackingScore`, etc.), scoring functions (`computeScores`, `generateMockReport`), score visualization helpers (`getScoreColor`, `getScoreLabel`, `getBenchmark`)
- Depends on: Audit types from `src/types/audit.ts`
- Used by: `AuditForm.tsx` (when generating report), `Report.tsx` (when displaying scores)

**Data Persistence Layer:**
- Purpose: Store and retrieve form state and scores from localStorage
- Location: Embedded in `src/pages/AuditForm.tsx`, `src/pages/Report.tsx`, `src/pages/Index.tsx`
- Contains: localStorage keys (`STORAGE_KEY`), save/restore logic
- Depends on: Nothing
- Used by: Page components

**Routing Layer:**
- Purpose: Navigate between different pages of the application
- Location: `src/App.tsx` (BrowserRouter and Routes configuration)
- Contains: Route definitions for `/`, `/audit`, `/generating`, `/report/:auditId`, `*`
- Depends on: React Router, page components
- Used by: Navigation handlers in pages

## Data Flow

**Form Entry Flow:**

1. User lands on `Index.tsx` (landing page with niche selection)
2. User selects niche (home_services or real_estate) → partners code stored in sessionStorage
3. Router navigates to `/audit?niche=selected_niche`
4. `AuditForm.tsx` initializes `auditReducer` with `initialFormState`, sets niche from query param
5. User progresses through 8 steps, each calling dispatch with `UPDATE_STEPx` action
6. On each step change, form state auto-saves to localStorage via useEffect hook
7. User can save progress manually or resume from localStorage with `?resume=true`

**Score Computation Flow:**

1. User completes all 8 steps and clicks "Generate My AI Audit Report" button
2. `AuditForm.tsx` calls `computeScores(state)` from `src/lib/scoring.ts`
3. Scoring engine maps each answer to 0-3 point values using lookup tables (`responseSpeedScore`, etc.)
4. Category scores calculated: `calcCategory(scores)` normalizes points to 0-100 for 7 categories
5. Overall score computed as weighted average of 7 categories (leads=20%, operations/followUp=15%, etc.)
6. Scores and form state saved to localStorage and passed via navigation state
7. Router navigates to `/generating` → `/report/:auditId`

**Report Generation Flow:**

1. `Report.tsx` loads (via route parameter or direct URL with localStorage fallback)
2. Retrieves form state and scores from navigation state or localStorage
3. Calls `generateMockReport(formState, scores)` to produce:
   - Critical gaps (3 weakest categories with descriptions and impact)
   - Quick wins (3 actionable items for next 30 days)
   - Strategic recommendations (3 larger initiatives for 90 days)
4. Renders report UI with:
   - Overall score circle visualization
   - Category scorecard with progress bars
   - Executive summary narrative
   - Gap analysis, quick wins, strategic recommendations
   - Competitor benchmark badges
   - CTA for strategy call booking

**State Management:**
- Form state stored entirely in `AuditFormState` type
- Single source of truth in reducer (auditReducer)
- Side effects: auto-save to localStorage on every state change via `useEffect`
- Validation occurs on step transition, errors displayed at top of form
- No API calls (client-side only)

## Key Abstractions

**AuditFormState (src/types/audit.ts):**
- Purpose: Complete shape of form data across all 8 steps
- Examples: `step1` (business info), `step2` (technology), `step3` (leads), through `step8` (financial)
- Pattern: Nested object with step-specific fields, some niche-conditional (e.g., `step4.schedulingMethod` for home services, `step4.followUpPlan` for real estate)

**auditReducer (src/types/audit.ts):**
- Purpose: Pure function that applies form updates immutably
- Pattern: Redux-style reducer with action types (`UPDATE_STEP1`, `SET_NICHE`, `COMPLETE_STEP`, `RESTORE`)
- Handles multi-step progression, niche selection, and localStorage restoration

**Scoring System (src/lib/scoring.ts):**
- Purpose: Convert form answers into numeric scores (0-100) for 7 business categories
- Pattern: Lookup tables map answer strings to 0-3 point values, then normalized to percentage
- Examples:
  - `responseSpeedScore["Under 5 minutes"]` = 3 (fast response)
  - `responseSpeedScore["Next business day or later"]` = 0 (slow response)
- Handles niche-specific scoring (home services vs. real estate questions differ)

**FormField Components (src/components/audit/AuditFormComponents.tsx):**
- Purpose: Reusable form input wrappers with consistent styling
- Examples: `FormField`, `StyledInput`, `StyledSelect`, `StyledTextarea`, `MultiCheckbox`, `RatingButtons`
- Pattern: Compound components that handle label, hint, required indicator, and styling

**Step Components (src/components/audit/Step1-8*.tsx):**
- Purpose: Individual form sections for each of the 8 steps
- Pattern: Receive `StepProps` (state, dispatch, isHS), render conditionally based on niche
- Examples: `Step1BusinessInfo`, `Step2Technology`, `Step3LeadFunnel`, `Step4Scheduling`
- Each step uses FormField and styled input components to collect niche-specific data

## Entry Points

**src/main.tsx:**
- Location: Application bootstrap file
- Triggers: On page load, creates React root and renders App
- Responsibilities: Initialize React app with DOM mount

**src/App.tsx:**
- Location: Root router configuration
- Triggers: Rendered by main.tsx
- Responsibilities: Set up QueryClientProvider (TanStack Query, used for toast notifications), TooltipProvider, routes for all pages, BrowserRouter

**src/pages/Index.tsx:**
- Location: Landing page
- Triggers: User navigates to `/` or initial app load
- Responsibilities: Display niche selection cards, capture partner referral code from query params, initialize user journey

**src/pages/AuditForm.tsx:**
- Location: Main multi-step form
- Triggers: User clicks audit button from Index
- Responsibilities: Manage form state through 8 steps, validate on step transition, persist to localStorage, compute scores when complete, navigate to report

**src/pages/Report.tsx:**
- Location: Results page
- Triggers: After form completion (route `/report/:auditId`)
- Responsibilities: Display computed scores and generated report, handle PDF download/share, provide CTA for strategy call

## Error Handling

**Strategy:** Client-side validation on step transitions with error display at top of form. No server-side errors currently handled.

**Patterns:**
- Step validation function in `AuditForm.tsx` checks required fields before progression
- Validation errors collected in `errors` state and displayed in red banner
- Email validation uses regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- User cannot advance to next step without fixing validation errors
- localStorage fallback: if data cannot be parsed, catch block silently ignores and starts fresh

## Cross-Cutting Concerns

**Logging:** None implemented. Could be added via console in scoring or form submission.

**Validation:**
- Client-side only in `AuditForm.tsx` `validateStep` function
- Checks: business name, contact name, email format, at least one lead source, CRM selection, lead response speed

**Authentication:**
- No authentication system
- Partner code tracking via sessionStorage (`ep_partner_code`) for referral attribution
- Used when generating report (though not currently sent anywhere)

**Styling:**
- Tailwind CSS with custom HSL color variables (navy, coral, score colors)
- Uses `clsx` and `tailwind-merge` (via `cn` utility) for conditional class composition
- Responsive design with `sm:`, `md:`, responsive grid layouts

**State Persistence:**
- localStorage key: `ep_audit_state` (form state)
- localStorage key: `ep_audit_state_scores` (computed scores)
- localStorage key: `ep_audit_state_form` (form state backup before report generation)
- Auto-save on every state change via useEffect
- Resume capability via `?resume=true` query parameter

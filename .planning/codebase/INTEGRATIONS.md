# External Integrations

**Analysis Date:** 2026-02-19

## APIs & External Services

**Booking & Calendaring:**
- Cal.com - Strategy call booking integration
  - Location: `src/pages/Report.tsx` line 346
  - Implementation: Direct link to `https://cal.com/ep-systems`
  - Auth: URL-based (no API integration)
  - Purpose: Users can book free 30-minute strategy calls from report page

## Data Storage

**Databases:**
- Not applicable - Client-side only application

**File Storage:**
- Local filesystem only - No cloud file storage detected

**Client-Side State Storage:**
- localStorage:
  - `ep_audit_state` - Stores form data for entire audit session
  - `ep_audit_state_form` - Stores submitted form data
  - `ep_audit_state_scores` - Stores computed audit scores
  - Used for form persistence and resume functionality (`src/pages/AuditForm.tsx` lines 68-90)
- sessionStorage:
  - `ep_partner_code` - Stores partner referral code for tracking (`src/pages/Index.tsx` line 22)

## Authentication & Identity

**Auth Provider:**
- None - Application is fully public with no authentication

**Partner Tracking:**
- Partner codes passed via URL parameters (`?ref=` or `?partner=`)
- Stored in sessionStorage and displayed in hero section
- Tracked for referral attribution but no API backend integration

## Monitoring & Observability

**Error Tracking:**
- Not detected - No Sentry, LogRocket, or similar service integrated

**Logs:**
- Console logging only - No centralized logging infrastructure
- Lovable Tagger development utility (`lovable-tagger: 1.1.13`) for component tracking in development mode

## CI/CD & Deployment

**Hosting:**
- Static file hosting (Vite builds to `dist/`)
- No backend server required
- No specific hosting platform detected in codebase

**CI Pipeline:**
- Not detected - No GitHub Actions, GitLab CI, or similar configuration found

## Environment Configuration

**Required env vars:**
- None detected - Application is fully client-side

**Public Configuration:**
- Hardcoded paths:
  - Cal.com booking URL: `https://cal.com/ep-systems` (in `src/pages/Report.tsx`)
  - Company branding: "E&P Systems" (displayed in headers throughout app)
- Tailwind theme colors (navy, coral, score colors) defined in `tailwind.config.ts`

**Secrets location:**
- Not applicable - No secrets management required

## Webhooks & Callbacks

**Incoming:**
- None - Application does not expose webhooks

**Outgoing:**
- None - Application does not send webhooks
- Cal.com link opens in new tab (no server-to-server communication)

## Form Data Handling

**Submission Flow:**
- Form data collected through 8-step audit (`src/pages/AuditForm.tsx`)
- Validation: Email format validation (`src/pages/AuditForm.tsx` line 35)
- Storage: All form data stored locally via localStorage
- Scoring: Client-side computation via `src/lib/scoring.ts` using form answers
- Report Generation: Mock report generation (no API call) via `generateMockReport()` function

**Data Collected:**
- Step 1: Business name, contact name, email, phone, industry, employees, revenue
- Step 2: Primary CRM, software satisfaction
- Step 3: Lead sources, response speed
- Step 4: Scheduling/dispatch methods, route optimization
- Step 5: Communication channels
- Step 6: Follow-up practices
- Step 7: Operations details
- Step 8: Financial metrics

No external data transmission detected - all audit data remains in browser storage.

## Partner Integration Points

**Future Integration Ready:**
- TanStack React Query configured (`src/App.tsx` line 12) but not actively used
- Suggests application is prepared for future API integration
- Current flow is fully client-side with no backend API calls

---

*Integration audit: 2026-02-19*

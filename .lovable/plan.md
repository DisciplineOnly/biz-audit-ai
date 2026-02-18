
# AI Business Audit Tool for E&P Systems

## Overview
A multi-step lead generation audit tool that collects structured business data across 8 steps, computes scores, and generates a personalized AI-powered report using Claude. Supports two niches: Home Services & Trades and Real Estate Teams & Brokerages.

---

## Pages & Screens

### 1. Landing / Niche Selection Page
- Hero section with headline "Get Your Free AI Business Audit" and subheadline about finding money left on the table
- Two large clickable cards: 🔧 Home Services & Trades and 🏠 Real Estate Teams & Brokerages
- Dark navy (#1a2332) header background, white cards, red/coral (#e63946) accents
- Captures `?ref=` or `?partner=` URL parameters for affiliate tracking

### 2. Multi-Step Audit Form (Steps 1–8)
- **Progress bar** at top with "Step X of 8" and percentage
- **Clickable section tabs** across the top (BUSINESS, TECHNOLOGY, LEADS, SCHEDULING/LEAD MGMT, COMMUNICATION, FOLLOW-UP, OPERATIONS, FINANCIAL) — completed tabs are clickable, future tabs greyed out
- **Back** and **Next Step →** buttons on every step; final step has **⚡ Generate My AI Audit Report**
- Smooth fade/slide transitions between steps
- Inline validation errors on required fields before advancing
- Auto-save to localStorage on every step change; resume prompt on return visit
- All questions are niche-specific — Home Services and Real Estate get completely different question sets for Steps 2–8

**Step 1:** Business Info — name, contact, email, phone + niche-specific fields (industry/role, size, revenue, years, area/market)

**Step 2:** Technology & Software Stack — primary CRM/software, satisfaction rating (1–5 buttons), multi-select tool checklist, frustration textarea

**Step 3:** Lead Funnel & Marketing — lead sources (multi-select), response speed, lead tracking, conversion rate, missed call handling, reviews count, review automation

**Step 4:** Scheduling & Dispatching (Home Services) OR Lead Management & Follow-Up (Real Estate) — niche-specific scheduling/dispatching questions or lead nurture/drip/tracking questions

**Step 5:** Customer/Client Communication — reminders, notifications, after-hours handling, internal comms, client portals

**Step 6:** Follow-Up & Retention — post-job/post-close sequences, maintenance reminders, referral processes, repeat business percentage

**Step 7:** Operations & Accountability — performance measurement, KPI tracking (multi-select checkboxes), process documentation, quality control

**Step 8:** Financial Operations — estimate/invoice processes, pricing model, payment methods (multi-select), collections, financial review cadence, open-ended challenge textarea

### 3. Loading / Generation Screen
- Animated progress steps cycling through messages: "Analyzing your technology stack...", "Evaluating your lead funnel...", "Identifying revenue opportunities...", "Generating personalized recommendations..."
- Estimated 10–20 second wait during Claude API call

### 4. Audit Report Results Page (shareable URL with audit ID)
- **Executive Summary** — overall assessment, strengths, critical gaps, estimated revenue impact
- **Category Scorecard** — 8 category scores with color-coded progress bars (red/orange/yellow/green)
- **Overall Business Score** — prominent percentage with visual indicator
- **Top 3 Critical Gaps** — specific, data-tied explanations referencing their actual answers
- **Quick Wins (30 days)** — 3 immediately actionable items
- **Strategic Recommendations (90 days)** — larger ROI investments aligned with E&P Systems' offerings
- **Competitor Benchmark** — above/average/below comparison per category
- **CTA Section** — "Book a Free Strategy Call with E&P Systems" with Calendly link placeholder
- "Download PDF" button and "Share with a colleague" link generator
- Clean, print-friendly design

---

## Backend & Data

### Supabase Database
- `audit_submissions` table with UUID primary key, niche, contact info, 8 JSONB sections for form data, computed scores JSONB, AI-generated report markdown, partner/UTM tracking fields, and IP/user agent

### Supabase Edge Functions
1. **`submit-audit`** — Receives complete form data, computes scores (0–3 per answer mapped to category percentages with defined weights), saves to database, triggers report generation
2. **`generate-report`** — Calls Claude claude-sonnet-4-20250514 API with full form data + scores, structured prompt requesting all 7 report sections, saves markdown to database, returns report content. Includes rate limiting (max 3 submissions per email per 24 hours)
3. **`send-report-email`** — Sends transactional email via Resend with the shareable report URL after generation

### Scoring Engine
- Each dropdown/selection answer maps to a 0–3 score internally
- 8 category scores = (sum of answer scores / max possible) × 100
- Overall score = weighted average: Technology 10%, Leads 20%, Scheduling/Lead Mgmt 15%, Communication 10%, Follow-Up 15%, Operations 15%, Financial 15%

---

## Design System
- **Colors:** Dark navy `#1a2332` (headers/nav), White (cards/content), Coral/Red `#e63946` (CTAs/accents), success greens and warning oranges for score indicators
- **Typography:** Clean, professional sans-serif
- **Components:** Progress bar, tab navigation, dropdown selects, multi-select checkbox grids (2-column on desktop), 1–5 scale rating buttons, textarea fields
- **Mobile-first:** All steps work perfectly on mobile; dropdowns and checkboxes are touch-friendly
- **Partner badge:** Subtle "Referred by [Partner]" display when `?ref=` param is present

---

## Key Technical Decisions
- Form state managed via React `useReducer` with localStorage backup
- Report lives at `/report/:auditId` — shareable and bookmarkable
- Claude API called server-side only via Edge Function (API key stored as Supabase secret)
- No user authentication required — anonymous lead-gen flow
- Anthropic API key stored as `ANTHROPIC_API_KEY` Supabase secret

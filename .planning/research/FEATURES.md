# Feature Research: Sub-Niche Specialization & Bulgarian Localization

**Domain:** Business audit wizard — Home Services and Real Estate sub-niche question specialization + Bulgarian market localization
**Researched:** 2026-02-21
**Confidence:** MEDIUM-HIGH (global sub-niche tool/KPI data HIGH; Bulgarian market specifics MEDIUM due to limited local data)

> **Scope note:** This document covers v1.1 additions: i18n infrastructure, Bulgarian localization, and sub-niche specialization of question answer options. All v1.0 features (persistence, AI reports, scoring, shareable URLs) are already implemented.

---

## Context: Existing Form Structure

The audit has 8 steps with two current niche branches (Home Services `isHS=true`, Real Estate `isHS=false`). Sub-niche is captured in Step 1 (`industry` field for HS, `primaryMarket` for RE) but **currently has zero effect** on questions in Steps 2-8. All HS sub-niches see identical questions; all RE sub-niches see identical questions.

The goal is to determine which answer *options* (not question structure) should differ per sub-niche, and what Bulgarian-market alternatives to include.

---

## Decision Framework: What Changes vs. What Stays Shared

Research finding: The 8-step question *structure* is well-suited across all sub-niches. What differs is the **answer options** within each question. The form schema already supports this via option arrays. No new fields need to be added — only option lists need to be branched per sub-niche.

### Questions That MUST Differ Per Sub-Niche (option lists change)

| Step | Field | Why It Must Differ |
|------|-------|-------------------|
| Step 2 | `primaryCRM` | Each sub-niche has a dominant CRM ecosystem (ServiceTitan for HVAC vs GorillaDesk for pest vs Buildium for property management) |
| Step 2 | `toolsUsed` | Tool categories differ significantly (pest control needs recurring route software; interior design needs FF&E/spec tools; construction needs BIM/takeoff) |
| Step 3 | `leadSources` | Lead channels are sub-niche specific (storm chasers for roofing, imot.bg for Bulgarian RE, OLX.bg for Bulgarian HS) |
| Step 7 | `kpisTracked` | KPI language and priorities differ per trade (First-Time Fix Rate for HVAC; Occupancy Rate for property management; Billable Hours Ratio for interior design) |
| Step 8 | `pricingModel` (HS) | Construction uses milestone billing; cleaning uses recurring/flat; pest control uses service agreements; roofing uses per-project quotes |
| Step 8 | `paymentMethods` | Construction needs milestone invoicing; property management needs management-fee/owner-draw options |

### Questions That Stay Shared (wording adjustments only, no option changes)

| Step | Field | Rationale |
|------|-------|-----------|
| Step 3 | `responseSpeed` | Same speed benchmarks matter across all sub-niches |
| Step 3 | `leadTracking` | CRM vs spreadsheet tracking is universal |
| Step 3 | `reviewAutomation` | Google review automation logic is the same |
| Step 4 | `schedulingMethod` (HS) | Applies equally to HVAC, cleaning, construction crews |
| Step 5 | `appointmentReminders`, `onTheWayNotifications` | Universal HS communication patterns |
| Step 6 | `repeatBusinessPercent` | Universal retention metric |
| Step 7 | `performanceMeasurement` | Same maturity levels apply across trades |
| Step 8 | `estimateProcess` | Same digital vs paper options apply across HS trades |
| Step 8 | `financialReview` | Same cadence options across all |

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features audit respondents assume exist. Missing = product feels generic or irrelevant to their specific trade.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Sub-niche CRM options that match their actual software | Business owner sees ServiceTitan listed for HVAC but Buildertrend for construction — if irrelevant software names appear, they assume the form is not built for them | LOW | Different option arrays per sub-niche group in Step 2 |
| Lead sources that reflect their actual channels | Roofing uses storm-chasing and door-knocking; cleaning uses Yelp/Nextdoor; interior design uses Houzz/referrals — current generic list includes none of these | LOW | Existing option arrays need sub-niche branching |
| KPI language matching their trade | "Revenue Per Technician" means nothing to an interior designer; "Billable Hours Ratio" does. "GCI" is meaningless for a property manager | LOW | New KPI option sets per sub-niche in Step 7 |
| Bulgarian-market tool names in `/bg/` path | Bulgarian home service owner should see Viber (not just SMS), OLX.bg and bazar.bg (not Nextdoor, which does not operate in Bulgaria) | MEDIUM | Locale-aware option sets via i18n translation files |
| Full Bulgarian UI translation | Business owner who operates in Bulgarian should not have to mentally translate the form — this breaks trust and comprehension | HIGH | Requires react-i18next infrastructure + professional translation |
| AI report in Bulgarian | A report in English for a Bulgarian business feels generic; defeats personalization goal. Bulgarian business owners expect business content in Bulgarian | HIGH | Requires language parameter in edge function + Bulgarian prompt variant |
| Revenue/price ranges appropriate for Bulgarian market | EUR-denominated revenue bands (e.g. "$250K–$500K") are confusing in BGN context; Bulgarian market operates at different scale | LOW | New Bulgarian-specific option arrays for Step 1 financial fields |

---

### Differentiators (Competitive Advantage)

Features that make the audit feel genuinely specialized, not just rebranded.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Pest control service agreement as a dedicated KPI | Pest control revenue model is fundamentally driven by service agreements (recurring contracts) — this is survival, not a differentiator | LOW | Add "Service Agreement Retention Rate" and "Monthly Recurring Revenue (MRR)" to pest KPI options |
| Construction milestone billing as a pricing option | GC owners who see "flat rate vs T&M" think the form does not understand their business; milestone billing is the industry standard | LOW | Add "Milestone-based billing" to Step 8 pricing options for construction sub-niche |
| Interior design FF&E/spec tools in the tools checklist | Houzz Pro, Studio Designer, Programa are the actual tools these businesses use — none appear in the current checklist | LOW | New tool options for interior design sub-niche in Step 2 |
| Property management occupancy and tenant KPIs | PM firms do not measure GCI — they measure occupancy rate, maintenance response time, rent collection rate, and lease renewal rate | LOW | New KPI set for property management sub-niche in Step 7 |
| New construction developer-specific lead sources | Presales, broker co-op networks, builder exhibitions — none appear in the current RE lead source list | LOW | New lead source options for new construction RE sub-niche |
| Viber as a Bulgarian-market communication channel | Viber has 35.7% market share in Bulgaria (#1 messaging platform per SensorTower Q2 2025) vs WhatsApp at 19.1%; omitting it signals the tool is not built for Bulgarian businesses | LOW | Bulgarian locale option variant for Step 5 internal/client comms |
| Bulgarian real estate portals (imot.bg, homes.bg, property.bg) | These are where Bulgarian buyers search; Zillow and Realtor.com have no Bulgarian presence | LOW | Bulgarian locale RE lead sources in Step 3 |
| Bulgarian classified platforms for HS (OLX.bg, bazar.bg) | OLX.bg has 4M monthly active users in Bulgaria; used for service discovery across all trades | LOW | Bulgarian locale HS lead sources in Step 3 |
| Luxury/resort RE internationalization questions | Luxury RE in Bulgaria (Bansko ski resort, Black Sea coast) requires international buyer pipeline and foreign-language marketing questions | MEDIUM | Sub-niche-specific questions/options for luxury RE |
| Sub-niche-specific scoring weight adjustments | Pest control should weight recurring service agreements more heavily; construction should weight job costing and project scheduling more | MEDIUM | Requires per-sub-niche weight maps in scoring.ts — implement after option branching is validated |

---

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Completely different form structure per sub-niche | "Each trade is totally different" | Massively increases code complexity, maintenance burden, and translation scope. The 8-step structure is already flexible via option branching | Branch option arrays, not question structure — the existing schema accommodates all needed changes |
| Machine-translated Bulgarian | Cheapest path to localization | Machine translation of business-specific terminology (e.g., "CRM удовлетвореност", "средна стойност на сделката") produces unnatural, untrustworthy text that undermines the professional feel of the audit | Human-reviewed translation of all strings with domain context |
| Detecting user location to auto-select language | Seems smart UX | IP geolocation is unreliable; creates confusing experience for bilingual Bulgarian teams or VPN users | URL-based routing (`/bg/`) with explicit language selector in the header |
| Adding a third language (Romanian, Greek, Russian) | Natural extension for Balkan market | Doubles translation workload and maintenance; no validated demand from actual users | Deliver Bulgarian excellently and prove the model before expanding |
| Sub-niche-specific scoring explanations per report section | Makes reports more specific | Each sub-niche x each category x each language = combinatorial explosion of template text | Pass sub-niche as context in the AI prompt and let Claude Haiku generate sub-niche-specific language |
| Saving form progress in a different localStorage key per sub-niche | Cleaner data separation | Breaks the existing resume-from-localStorage feature for users who change sub-niche selection | Keep single `ep_audit_state` key; sub-niche is stored within form state already |

---

## Feature Dependencies

```
[i18n infrastructure (URL routing + react-i18next)]
    └──requires──> [Translation files (en.json, bg.json namespaced by step)]
                       └──requires──> [Sub-niche option arrays organized as i18n-compatible config]
                                          └──requires──> [Sub-niche branching logic in Step components]

[Bulgarian AI report generation]
    └──requires──> [Language parameter in generate-report edge function request body]
                       └──requires──> [Bulgarian prompt variant in edge function]
                                          └──requires──> [i18n infrastructure to detect user language]

[Sub-niche scoring weight adjustments]
    └──requires──> [Sub-niche stored in AuditFormState (already: industry / primaryMarket)]
                       └──requires──> [scoring.ts refactored to read sub-niche from state]

[Bulgarian market option arrays]
    └──requires──> [i18n infrastructure]
                       └──enhances──> [Sub-niche branching logic]

[User email with report link (EMAIL-02)]
    └──requires──> [Custom Resend domain verification]
                       (independent of i18n/sub-niche work — can be parallelized)
```

### Dependency Notes

- **Sub-niche option branching requires i18n infrastructure first:** Option arrays will be defined as translation keys. Without i18n set up, Bulgarian options cannot be delivered without duplicating all component logic across English and Bulgarian variants.
- **Bulgarian AI report requires language detection:** The `generate-report` edge function must receive `language: "bg"` in its request body to switch prompt language. This is a new field in the existing API contract.
- **Sub-niche scoring requires no new form fields:** `state.step1.industry` already captures HS sub-niche; `state.step1.primaryMarket` captures RE sub-niche. Scoring engine only needs to read these existing fields.
- **Sub-niche branching is a prerequisite for meaningful scoring weight adjustment:** Implement and validate option branching first; scoring weights are secondary improvements.

---

## Sub-Niche Question Specialization: Home Services (12 sub-niches)

### Grouping Strategy (Reduces Implementation Complexity)

Rather than 12 completely independent option sets, group sub-niches by operational similarity. This reduces option arrays from 12 to 3 groups while maintaining meaningful differentiation.

| Group | Sub-niches | Defining Characteristic |
|-------|-----------|------------------------|
| A: Reactive Service | HVAC, Plumbing, Electrical, Garage Doors | High emergency call volume; same-day dispatch; ServiceTitan/FieldEdge ecosystem |
| B: Recurring/Scheduled | Pest Control, Landscaping, Cleaning | Recurring service model; service agreements; GorillaDesk/ZenMaid/Jobber ecosystem |
| C: Project-Based | Roofing, Painting, General Contracting, Construction, Interior Design | Multi-day/week projects; per-project quoting; Buildertrend/Procore/Houzz Pro ecosystem |

---

### Step 2 (Technology): CRM Options Per Group

**Group A (Reactive — HVAC/Plumbing/Electrical/Garage Doors):**
ServiceTitan, Housecall Pro, Jobber, FieldEdge, Successware, ServiceM8, No CRM/Software, Other

**Group B (Recurring — Pest/Landscaping/Cleaning):**
Jobber, Housecall Pro, GorillaDesk, ZenMaid (cleaning-specific), Pocomos (pest-specific), Lawn Buddy (landscaping), No CRM/Software, Other

**Group C (Project-Based — Roofing/Painting/GC/Construction/Interior Design):**
Buildertrend, JobTread, Procore, CoConstruct, Houzz Pro (interior design), Jobber, No CRM/Software, Other

**Bulgarian locale additions (all groups):**
Monday.com, Pipedrive, Bonsai, Google Sheets/Excel (extremely common in Bulgarian SMBs), No software, Other

---

### Step 2 (Technology): Tools Checklist Additions Per Sub-Niche

Current shared tools checklist is adequate for Group A. The following additions are needed:

**Pest Control specific:** Route optimization software (GorillaDesk routing, WorkWave Route Manager), Chemical inventory tracking, Service agreement management platform, Robocall/automated renewal reminder system

**Landscaping specific:** Lawn care estimate software (LMN, Aspire), Seasonal billing/contract renewal software, GPS fleet tracking (already in shared list but critical for this group)

**Cleaning specific:** Team scheduling app (ZenMaid, Swept), Background check service integration, Recurring payment/subscription processor, Quality inspection checklist app

**Roofing specific:** Aerial measurement software (EagleView, GAF QuikMeasure), Storm damage/hail tracking service (Hail Trace), Door-to-door canvassing app (Spotio, D2D CRM)

**Construction/GC specific:** BIM/CAD software (AutoCAD, Revit, SketchUp), Project management (Procore, Buildertrend, Monday.com), Takeoff/estimating software (PlanSwift, Bluebeam, Stack)

**Interior Design specific:** FF&E specification software (Studio Designer, Design Manager, Programa), 3D rendering tools (SketchUp, Enscape, Lumion), Client portal (Houzz Pro, Ivy/Mydoma), Procurement/trade purchasing platform

---

### Step 3 (Lead Funnel): Lead Sources Per Sub-Niche

**Group A (HVAC/Plumbing/Electrical/Garage Doors):**
Google Search/SEO, Google Ads (PPC), Google Local Services Ads, Nextdoor, Emergency call-ins, Home warranty company referrals, Yelp, Angi/HomeAdvisor, Truck wraps/yard signs, Word of mouth/referrals

**Pest Control:**
Google Search/SEO, Nextdoor, Door-to-door canvassing, Word of mouth/referrals, Yelp, Direct mail/flyers, Seasonal campaigns (spring/fall), HOA partnerships, Angi/HomeAdvisor

**Landscaping:**
Google Search/SEO, Nextdoor, Door-to-door/yard signs, Word of mouth/neighbor referrals, HOA partnerships, Seasonal flyers/direct mail, Social media (Facebook/Instagram), Angi/HomeAdvisor

**Cleaning (Residential and Commercial):**
Google Search/SEO, Nextdoor, Yelp, Thumbtack, Word of mouth/referrals, Commercial building manager relationships, Facebook/Instagram Ads, Google Ads

**Roofing:**
Google Search/SEO, Storm chasing/door-to-door canvassing, Insurance adjuster referrals, Google Ads (PPC), Direct mail (post-storm), Word of mouth/referrals, Satellite lead services (Hail Trace), Angi/HomeAdvisor

**Painting:**
Word of mouth/referrals, Houzz, Nextdoor, Angi/HomeAdvisor, Google Search/SEO, General contractor partnerships, Real estate agent referrals, Social media

**Construction/GC:**
Word of mouth/referrals, Architect/engineer partnerships, Real estate developer referrals, Houzz, Commercial: online bid platforms (e.g., BidClerk), Repeat client work, Google Search/SEO

**Interior Design:**
Word of mouth/referrals, Houzz, Instagram/Pinterest, Interior design publications/features, Architecture firm partnerships, Builder/developer relationships, Google Search/SEO

**Bulgarian locale additions (all HS sub-niches — `/bg/` path only):**
OLX.bg listings, Facebook marketplace/groups, Viber community referrals (neighbor groups), bazar.bg, Local building material supplier referrals, Word of mouth (overwhelmingly dominant — include as first option)

---

### Step 7 (Operations): KPIs Per Sub-Niche

**Group A (Reactive — HVAC/Plumbing/Electrical/Garage Doors):**
Average Ticket/Job Value, First-Time Fix Rate, Callback/Redo Rate, Revenue Per Technician, Lead-to-Booked Rate, Membership/Maintenance Plan Count, Customer Satisfaction Score (CSAT), Emergency Call Response Time, Profit Margin Per Job Type, We don't track any KPIs

**Pest Control:**
Service Agreement Retention Rate, Customer Churn Rate, Revenue Per Route, Monthly Recurring Revenue (MRR), Average Service Agreement Value, Customer Acquisition Cost (CAC), On-Time Completion Rate, Chemical/Material Cost Per Job, We don't track any KPIs

**Landscaping:**
Revenue Per Crew Per Day, Seasonal Contract Renewal Rate, Customer Retention Rate, Labor Utilization Rate, Estimate Close Rate, Average Job Value, Job Completion Rate, We don't track any KPIs

**Cleaning:**
Revenue Per Cleaner Per Hour, Client Retention/Churn Rate, On-Time Arrival Rate, Team Utilization Rate, Quality Inspection Score, Customer Acquisition Cost (CAC), Recurring Revenue Percentage, We don't track any KPIs

**Roofing:**
Average Job Value, Estimate Close Rate, Revenue Per Sales Rep, Material Cost Percentage of Revenue, Callback/Warranty Claim Rate, Cost Per Lead (digital vs door-to-door), Insurance Claim Approval Rate, We don't track any KPIs

**Painting:**
Estimate Close Rate, Average Job Value, Gross Margin Per Job, Labor Efficiency (actual vs estimated hours), Referral Rate, Customer Satisfaction Score, We don't track any KPIs

**Construction/GC:**
Cost Performance Index (CPI — budget adherence), Schedule Performance Index (SPI), Bid-to-Win Ratio, Gross Margin Per Project, Change Order Volume/Revenue, Labor Productivity Rate, Project Backlog Value, Safety Incident Rate, We don't track any KPIs

**Interior Design:**
Billable Hours Ratio (target 75–85% of total hours), Client Acquisition Cost (CAC), Average Project Value, Project Gross Margin, Proposal-to-Contract Rate, Repeat/Referral Client Rate, We don't track any KPIs

---

### Step 8 (Financial): Pricing Model Per Sub-Niche

**Group A (Reactive trades):** Flat rate pricing (industry best practice), Time & materials, Mix of flat rate and T&M, No standardized pricing

**Pest Control:** Service agreement/recurring contract, Per-visit pricing, Mix of contract and per-visit, No standardized pricing

**Landscaping:** Seasonal contract, Per-visit pricing, Annual lawn care program, Mix, No standardized pricing

**Cleaning:** Recurring flat rate per clean, Hourly pricing, Quoted per job, Mix, No standardized pricing

**Roofing/Painting:** Per-project fixed quote, Time & materials, No standardized pricing

**Construction/GC:** Milestone-based billing (industry standard for GCs), Fixed-price contract, Cost-plus contract, Time & materials, No standardized pricing

**Interior Design:** Design fee plus purchasing markup (industry standard), Hourly rate, Fixed project fee, Retainer arrangement, No standardized pricing

---

## Sub-Niche Question Specialization: Real Estate (5 sub-niches)

### Step 2 (Technology): CRM Options Per Sub-Niche

**Residential Sales:**
Follow Up Boss, KVCore/Inside Real Estate, Lofty (formerly Chime), Sierra Interactive, LionDesk, Wise Agent, HubSpot, No CRM, Other

**Commercial/Office:**
Apto, Buildout, REThink CRM, Salesforce, HubSpot, 42Floors/CoStar (lead sources, not CRMs), No CRM, Other

**Property Management:**
Buildium, AppFolio, Propertyware, Rent Manager, Rentec Direct, TenantCloud, No software, Other

**New Construction:**
Lasso CRM, Buildertrend (hybrid sales+PM), Zoho CRM, Salesforce, HubSpot, No CRM, Other

**Luxury/Resort:**
Salesforce, Follow Up Boss, LionDesk, Top Producer, Contactually, No CRM, Other

**Bulgarian locale additions:**
- Residential/Commercial/Luxury: Pipedrive (popular in Bulgaria), Google Sheets (dominant for small agencies in Bulgaria), No CRM, Other
- Property Management: flatmanager.bg platform tools, Roomspilot (Bulgarian STR channel manager), propertymanagement.bg, No software, Other

---

### Step 3 (Lead Funnel): Lead Sources Per Sub-Niche

**Residential Sales:**
Zillow/Realtor.com, Google Ads (PPC), Facebook/Instagram Ads, Open Houses, Sphere of Influence/Referrals, Past Client Referrals, Agent Website/IDX, YouTube/Video content, Door Knocking/Expired/FSBO prospecting, Relocation companies, Builder/developer partnerships

**Commercial/Office:**
CoStar/LoopNet leads, LinkedIn outreach/prospecting, Commercial broker referral network, Cold calling/direct prospecting, Trade association networks, RFP/tender response, Existing tenant expansion/upsell

**Property Management:**
Referrals from sales agents, Direct outreach to property owners, Online listings (Apartments.com, Rent.com), Zillow Rental Manager, LinkedIn (for commercial PM), Social media/Facebook property groups, Past landlord relationships

**New Construction:**
Presale reservation lists, Builder/developer referral program, Real estate broker co-op network, Local property exhibitions/home shows, Facebook/Instagram Ads, Google Ads (PPC), Email database campaigns, Model home walk-ins

**Luxury/Resort:**
Referrals from existing luxury clients, International property portals, Luxury network partnerships (Sotheby's, Christie's, Forbes Global), Instagram/targeted social media, Wealth manager/financial advisor partnerships, Press/editorial features, Private client events

**Bulgarian locale — Residential Sales:**
imot.bg, homes.bg, property.bg, imoti.net, Facebook property groups (very active in Bulgaria), Google Ads (local targeting), Word of mouth/referrals (dominant), Brokerage network referrals

**Bulgarian locale — Luxury/Resort:**
Luximmo.com, suprimmo.net (Bansko specialist), BulgarianProperties.com (foreign buyer focus), International property exhibitions (Berlin, London, Dubai), newestatebg.com, Word of mouth/referrals, International real estate portals for resort buyers

**Bulgarian locale — Property Management:**
Airbnb/Booking.com listings, imot.bg rental section, flatmanager.bg platform, Facebook rental groups, Word of mouth from property owners, Owner referrals from sales colleagues

---

### Step 7 (Operations): KPIs Per Sub-Niche

**Residential Sales (existing RE set is largely correct — minor additions):**
Leads generated per agent, Appointments set per agent, Lead-to-client conversion rate, Average days to close, Cost per lead by source, GCI per agent, Client satisfaction score, Average list-to-sale price ratio, Agent activity compliance rate (calls/texts/emails logged), We don't track any KPIs

**Commercial/Office:**
Deals closed per quarter, Total square footage leased, Average lease value/commission, Pipeline value, Average deal cycle length (often 6–24 months), Commission per deal, Tenant retention rate on managed properties, Prospecting activity per broker (calls, tours), We don't track any KPIs

**Property Management:**
Occupancy rate (target 95%+), Average days to re-lease on vacancy, Rent collection rate, Maintenance request resolution time (hours/days), Lease renewal rate, Units under management growth, Net Operating Income (NOI) per property, Owner retention/churn rate, We don't track any KPIs

**New Construction:**
Units sold per month, Presale reservation conversion rate, Average time from reservation to contract, Price per sqm vs market benchmark, Co-op broker deal percentage, Marketing cost per unit sold, Cancellation/refund rate on reservations, We don't track any KPIs

**Luxury/Resort:**
Average transaction value, International vs domestic buyer ratio, Time on market for luxury listings, Close rate from qualified showings, Referral/repeat client rate, Average commission per transaction, Qualified buyer introductions per month, We don't track any KPIs

---

### Step 4 (Lead Management): Sub-Niche Adjustments

**Commercial RE:** Nurture duration options should extend — commercial deals often take 12–24 months. Add options: "12–18 months" and "18–24 months" alongside the existing options.

**Property Management:** The entire Step 4 framing (lead nurture for buyer/seller) does not fit property management. For PM sub-niche, Step 4 should be reframed around owner acquisition: "How do you attract and convert property owners to sign management agreements?" This is a v1.x improvement, not v1.1 launch scope, due to form restructuring complexity.

**New Construction:** Standard RE follow-up options apply. Nurture duration is most relevant since presale timelines vary from 6 months to 2+ years.

---

### Step 8 (Financial): Sub-Niche Adjustments

**Property Management:** Commission disbursement question is irrelevant (PM firms charge management fees, not commissions). For PM, this should ask about management fee structure (flat fee vs % of rent collected) and owner reporting cadence. V1.x improvement.

**Commercial RE:** Marketing budget per deal is the key metric. Add "Per-deal marketing spend tracking" as an option.

**New Construction (developer):** Add "Per-unit marketing budget" to the marketing budget options.

---

## Bulgarian Market Specifics

### Communication Channels (Step 5 — Bulgarian locale only)

Viber is dominant in Bulgaria with 35.7% market share (#1 platform per SensorTower Q2 2025). Bulgarian locale should add Viber explicitly in:
- `internalComms`: "Viber group" (alongside "WhatsApp/Group text")
- `afterHoursComms`: "Viber Business Message auto-responder"
- General client communication questions

Facebook Messenger leads at 43.5% — relevant for client communication. WhatsApp at 19.1% — keep in list but not primary. SMS (traditional) is less common than in US/UK markets.

### Bulgarian Market Platform Ecosystem

| Category | International Standard (EN version) | Bulgarian Equivalent/Alternative (BG version) |
|----------|-------------------------------------|-----------------------------------------------|
| RE listing portals | Zillow, Realtor.com | imot.bg, homes.bg, property.bg, imoti.net, suprimmo.net |
| Luxury RE | Sotheby's, Luxury Presence | Luximmo, BulgarianProperties.com, newestatebg.com |
| HS classified/leads | Nextdoor, Thumbtack | OLX.bg (4M MAU), bazar.bg, alo.bg |
| Property management | AppFolio, Buildium | flatmanager.bg, realmanager.bg, propertymanagement.bg |
| STR channel management | Generic tools | Roomspilot (Bulgarian-specific, integrates Airbnb+Booking.com) |
| Messaging (business) | WhatsApp Business, SMS | Viber Business Messages (35.7% market share, lower cost than WhatsApp API) |
| Accounting | QuickBooks, Xero | QuickBooks available; many Bulgarian firms use Excel + local accountant |
| CRM (generic) | HubSpot, Salesforce | Pipedrive (popular in Bulgaria), Monday.com, Google Sheets (dominant SMB) |

### Bulgarian Market Revenue/Price Tiers (Step 1 — `/bg/` locale)

**Home Services — Annual Revenue (BGN):**
Under 50,000 лв., 50,000–150,000 лв., 150,000–500,000 лв., 500,000 лв.–1 млн. лв., Over 1 млн. лв.

Note: 1 EUR = 1.95583 BGN (fixed rate; Eurozone entry expected soon). The EUR-denominated US ranges ($250K–$500K) should be replaced with BGN ranges that reflect Bulgarian market scale.

**Real Estate — Annual GCI (BGN):**
Under 30,000 лв., 30,000–80,000 лв., 80,000–200,000 лв., 200,000–500,000 лв., Over 500,000 лв.

**Real Estate — Transaction Volume:**
Under 10 deals, 10–25 deals, 25–50 deals, 50–100 deals, 100+ deals
(Bulgarian market volumes are significantly lower than US benchmarks; US tiers starting at "25 deals" are already too high for most Bulgarian agents)

**Service Area (HS — Bulgarian context):**
Single city/district (okrag), Sofia metropolitan area, Multiple cities, National coverage

### Bulgarian Context for AI Report Prompt

The generate-report edge function's Bulgarian prompt should include:
- Market context: "This business operates in Bulgaria (EU member, BGN currency pegged to EUR)"
- Platform awareness: imot.bg/homes.bg for RE; OLX.bg for HS; Viber for messaging
- Regulatory context: Real estate agents in Bulgaria are unlicensed (low barrier, high reputation-dependence); construction requires licensed engineers (Ключов Eксперт qualification) for permitted work
- Market scale: Bulgarian SMBs operate at smaller revenue scale than US/UK benchmarks; adjust benchmarking language accordingly

---

## MVP Definition for v1.1

### Launch With (v1.1 — this milestone)

- [ ] i18n infrastructure with `/bg/` URL routing — foundation for all locale work; must be first
- [ ] Full Bulgarian translation of all UI strings, form steps, landing page — table stakes for Bulgarian market
- [ ] Sub-niche CRM option branching (3 HS groups + 5 RE sub-niches) — highest-visibility differentiation
- [ ] Sub-niche lead source options (all 12 HS + 5 RE) — users know instantly if the form is relevant to them
- [ ] Sub-niche KPI options per group — Step 7 currently misrepresents all non-HVAC trades
- [ ] Bulgarian real estate portal options in `/bg/` locale (imot.bg, homes.bg, property.bg, suprimmo.net)
- [ ] Bulgarian HS lead sources (OLX.bg, bazar.bg, Facebook groups, Viber referrals)
- [ ] Viber in Bulgarian communication options (Step 5, `/bg/` locale)
- [ ] AI report generation in Bulgarian (language parameter in edge function)

### Add After Validation (v1.x)

- [ ] Sub-niche pricing model options (milestone billing for construction, service agreements for pest) — moderate impact
- [ ] Sub-niche scoring weight adjustments — only valuable after option branching is validated with real data
- [ ] Bulgarian revenue/price tiers (BGN amounts in Step 1 — `/bg/` locale)
- [ ] Property management Step 4 reframe (owner acquisition vs lead nurture) — requires new form structure
- [ ] Commercial RE extended nurture duration options (12–24 months)
- [ ] Sub-niche tools checklist additions (FF&E tools for interior design, aerial measurement for roofing)

### Future Consideration (v2+)

- [ ] Third language expansion (Romanian, Greek) — no validated demand yet
- [ ] Per-sub-niche AI prompt tuning beyond passing context — marginal gains
- [ ] Admin analytics by sub-niche — requires dashboard
- [ ] Bulgarian regulatory content in AI reports — requires legal review

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| i18n infrastructure (react-i18next + /bg/ routing) | HIGH | HIGH | P1 |
| Full Bulgarian translation | HIGH | HIGH | P1 |
| Sub-niche CRM options (3 HS groups + 5 RE) | HIGH | LOW | P1 |
| Sub-niche lead sources (all 17 sub-niches) | HIGH | LOW | P1 |
| Sub-niche KPI lists (Step 7) | HIGH | LOW | P1 |
| Bulgarian RE portal options | HIGH | LOW | P1 |
| Bulgarian HS lead sources (OLX.bg etc.) | HIGH | LOW | P1 |
| Viber in BG communication options | MEDIUM | LOW | P1 |
| AI report in Bulgarian | HIGH | MEDIUM | P1 |
| Sub-niche pricing model options | MEDIUM | LOW | P2 |
| Sub-niche scoring weight adjustments | MEDIUM | MEDIUM | P2 |
| Bulgarian revenue/price tiers (BGN) | MEDIUM | LOW | P2 |
| Commercial RE extended nurture duration | MEDIUM | LOW | P2 |
| PM Step 4/8 reframe | MEDIUM | MEDIUM | P2 |
| Bulgarian property management tools | MEDIUM | LOW | P2 |
| Sub-niche tools checklist additions | LOW | LOW | P2 |
| Luxury/resort-specific Bulgarian tools | LOW | LOW | P3 |
| Bulgarian regulatory context in AI prompt | LOW | LOW | P3 |

**Priority key:**
- P1: Must have for v1.1 launch
- P2: Should have, meaningful differentiation — add when P1 is complete
- P3: Nice to have, incremental — future iteration

---

## Implementation Architecture Implication

**Recommended pattern:** The existing `isHS` boolean should be extended to a sub-niche discriminated union. Option arrays in each Step component should be derived from a typed config object keyed by sub-niche (or sub-niche group for HS), not hardcoded inline arrays.

```typescript
// Sub-niche type additions
type HSSubNicheGroup = "reactive" | "recurring" | "project_based";
type RESubNiche = "residential_sales" | "commercial" | "property_management" | "new_construction" | "luxury_resort";

// Config pattern: maps sub-niche to option arrays
const CRM_OPTIONS: Record<HSSubNicheGroup | RESubNiche, string[]> = {
  reactive: ["ServiceTitan", "Housecall Pro", "Jobber", "FieldEdge", ...],
  recurring: ["GorillaDesk", "Jobber", "ZenMaid", "Pocomos", ...],
  project_based: ["Buildertrend", "Procore", "JobTread", "Houzz Pro", ...],
  residential_sales: ["Follow Up Boss", "KVCore", ...],
  property_management: ["Buildium", "AppFolio", ...],
  // etc.
};
```

For Bulgarian locale, the i18n translation files supply locale-specific option text:
```json
// bg.json (excerpt)
{
  "step2.crm.residential_sales": ["Follow Up Boss", "KVCore", "Pipedrive", "Google Sheets", "Без CRM", "Друго"],
  "step3.leadSources.reactive": ["Търсене в Google/SEO", "Google Ads", "OLX.bg обяви", "bazar.bg", "Viber препоръки", "Уста на уста"]
}
```

This architecture ensures:
1. Option arrays remain maintainable in one config location per sub-niche
2. Locale variants are handled entirely by the i18n system, not component logic
3. Scoring engine continues reading string values from unified lookup tables (scoreMap functions in scoring.ts) — no breaking changes required
4. No new form state fields are needed — the existing AuditFormState type accommodates all changes

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| HS sub-niche CRM/tool landscape | HIGH | ServiceTitan, GorillaDesk, Buildertrend, Houzz Pro are established category leaders per multiple authoritative sources |
| HS sub-niche KPI differentiation | HIGH | FieldRoutes (pest), Design Manager blog (interior design), ServiceTitan blog (HVAC) — domain-specific authoritative sources |
| RE sub-niche differentiation | HIGH | Commercial vs residential vs PM vs new construction are well-documented in CRE industry literature |
| Bulgarian real estate portals | HIGH | imot.bg, homes.bg, property.bg confirmed as major platforms; Luximmo confirmed for luxury; all verified by direct source check |
| Bulgarian messaging (Viber dominance) | HIGH | SensorTower Q2 2025 data + Messaggio market reports — two independent sources confirming 35.7% Viber share |
| Bulgarian classified platforms (OLX.bg) | HIGH | 4M MAU confirmed by OLX Group Balkan eCommerce data |
| Bulgarian property management tools | MEDIUM | flatmanager.bg and Roomspilot confirmed; market is fragmented with no dominant software provider |
| Bulgarian HS lead sources | MEDIUM | OLX.bg and bazar.bg confirmed for classified; Facebook groups confirmed; no Nextdoor equivalent exists in Bulgaria |
| Bulgarian construction software adoption | LOW | No Bulgaria-specific CRM data found; assumption is international tools (Procore/Buildertrend) or Excel — flag as needing validation |
| Bulgarian revenue/price tiers | LOW | No specific SMB revenue benchmarks found; BGN ranges are estimates based on EUR/BGN peg and general market scale awareness |

---

## Sources

- [ServiceTitan HVAC KPIs](https://www.servicetitan.com/blog/hvac-key-performance-indicators) — HIGH confidence
- [Successware HVAC/Plumbing/Electrical KPIs](https://www.successware.com/blog/2024/july/mastering-metrics-kpis-for-hvac-plumbing-electri/) — HIGH confidence
- [FieldRoutes Pest Control KPIs](https://www.fieldroutes.com/blog/pest-control-kpis) — HIGH confidence
- [Pocomos pest control software](https://pocomos.com/) — MEDIUM confidence
- [GorillaDesk — pest/lawn/cleaning](https://gorilladesk.com/) — MEDIUM confidence
- [Pearl Collective Interior Design KPIs](https://thepearlcollective.com/kpis-interior-design-firms/) — HIGH confidence
- [Design Manager Interior Design KPIs](https://www.designmanager.com/blog/measuring-success-key-performance-indicators-for-interior-designers) — HIGH confidence
- [Buildium Property Management KPIs](https://www.buildium.com/blog/property-management-kpis-to-track/) — HIGH confidence
- [Showdigs Property Management KPIs 2025](https://www.showdigs.com/property-managers/property-management-key-performance-indicators) — HIGH confidence
- [4Degrees Commercial RE CRMs 2025](https://www.4degrees.ai/blog/the-best-commercial-real-estate-crms-of-2025) — HIGH confidence
- [Lasso CRM for home builders/new construction](https://www.ecisolutions.com/products/lasso-crm/) — HIGH confidence
- [imot.bg — Bulgaria's #1 RE portal](https://www.imot.bg/) — HIGH confidence
- [property.bg](https://www.property.bg/) — HIGH confidence
- [Luximmo — Bulgarian luxury RE](https://www.luximmo.com/) — HIGH confidence
- [suprimmo.net — national Bulgarian RE](https://www.suprimmo.net/) — HIGH confidence
- [OLX Bulgaria 4M MAU — Balkan eCommerce Summit](https://balkanecommerce.com/partners/olx-bulgaria/) — HIGH confidence
- [Flat Manager BG — property management leader](https://flatmanager.bg/en/) — HIGH confidence
- [Roomspilot — Bulgarian STR channel manager](https://roomspilot.com/) — HIGH confidence
- [Viber Bulgaria market share — SensorTower Q2 2025](https://sensortower.com/blog/2025-q2-unified-top-5-communication%20apps-units-bg-6070aae1241bc16eb81f5bab) — HIGH confidence
- [Messaggio Viber Bulgaria messaging market](https://messaggio.com/messaging/bulgaria/viber/) — HIGH confidence
- [Centrarium Bulgarian RE market 2025](https://centrarium.com/en/blog/rynok-nedvizhimosti-bolgarii-2025-goda-358.html) — MEDIUM confidence
- [Buildertrend — construction CRM](https://www.buildertrend.com/) — HIGH confidence
- [Procore Construction KPIs](https://www.procore.com/library/construction-kpis) — HIGH confidence

---

*Feature research for: BizAudit v1.1 — sub-niche specialization and Bulgarian localization*
*Researched: 2026-02-21*

# Phase 8: Sub-Niche Config and Selection UI - Context

**Gathered:** 2026-02-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Config-driven sub-niche branching for all 17 sub-niches (12 Home Services + 5 Real Estate). Users select their sub-niche via a card grid in Step 1, and form option lists in Steps 2, 3, and 7 adapt to show sub-niche-relevant additions on top of base niche options. Selection is locked after advancing past Step 1.

</domain>

<decisions>
## Implementation Decisions

### Sub-niche selection UI
- Selection appears within Step 1 (not a new step or landing page addition)
- Sequential reveal: user picks niche (Home Services / Real Estate) first, then sub-niche cards animate in below
- Sub-niche selection is locked after advancing to Step 2 — changing requires restarting the audit
- Sub-niche is required — cannot advance to Step 2 without selecting one (per roadmap success criteria)
- Claude's Discretion: card design (compact grid with icons vs medium cards with descriptions), based on number of sub-niches and screen space

### Option list adaptation
- Base + additions model: keep generic niche options as the base list, add sub-niche-specific options seamlessly integrated (no "recommended" badges or visual differentiation)
- Only Steps 2 (CRM/software), 3 (lead sources), and 7 (KPIs) adapt to sub-niche selection
- Steps 1, 4, 5, 6, 8 remain niche-level only (no sub-niche variation)
- Graceful fallback: if a sub-niche has no specific additions for a given step, show the base niche options unchanged

### Config data structure
- Claude's Discretion: TypeScript config files vs JSON — pick based on existing codebase patterns and type safety needs
- Config organized per sub-niche: each sub-niche has a config block listing its additions for each adapted step
- Config includes both display options AND scoring key mappings (enables simpler Phase 9)
- Claude's Discretion: how research feeds into config — researcher populates directly or produces docs that planner translates

### Sub-niche grouping
- Claude's Discretion (research-driven): whether similar sub-niches share option lists or each gets unique config
- Claude's Discretion: whether to show all 17 cards separately (sharing config behind the scenes) or merge nearly-identical sub-niches into fewer cards
- No pre-committed groupings — let the researcher determine which sub-niches actually differ in CRM/lead source/KPI options vs which can share
- Same approach for both Home Services and Real Estate sub-niches

### Claude's Discretion
- Card grid visual design (compact vs medium, icons/emojis)
- Config file format (TypeScript vs JSON)
- Research-to-config workflow
- Sub-niche grouping strategy based on research findings
- Whether to merge or keep separate nearly-identical sub-niches

</decisions>

<specifics>
## Specific Ideas

- The roadmap lists all 17 sub-niches explicitly: HS (HVAC, Plumbing, Electrical, Roofing, Landscaping, Pest Control, Garage Doors, Painting, General Contracting, Construction, Interior Design, Cleaning) and RE (Residential Sales, Commercial/Office, Property Management, New Construction, Luxury/Resort)
- Success criteria specifically mention ServiceTitan for HVAC, GorillaDesk for Pest Control, Buildertrend for Construction, Lasso for New Construction — these are concrete examples of what "sub-niche-relevant tools" means
- Sub-niche selection must persist in localStorage and survive page refresh
- Must work identically in English and Bulgarian (selection is language-neutral)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 08-sub-niche-config-and-selection-ui*
*Context gathered: 2026-02-22*

---
phase: 11-bulgarian-content-and-ai-reports
plan: 02
subsystem: ui
tags: [i18n, bulgarian, eur, subniche, form-options, market-localization]

# Dependency graph
requires:
  - phase: 08-sub-niche-specialization
    provides: SubNicheOptions config map and getSubNicheOptions function
  - phase: 06-i18n-infrastructure
    provides: useLang hook and language detection infrastructure
provides:
  - BG_SUB_NICHE_OPTIONS config map with Bulgarian-market platforms for all 8 sub-niche groups
  - getSubNicheOptionsForLang(subNiche, lang) function for language-aware option resolution
  - EUR-denominated revenue (BG_HS_REVENUES) and GCI (BG_RE_GCI) tier arrays for Bulgarian users
  - Bulgarian base lead source fallback arrays (BG_HS_LEAD_SOURCES, BG_RE_LEAD_SOURCES)
affects: [11-03, 11-04, generate-report edge function]

# Tech tracking
tech-stack:
  added: []
  patterns: [language-conditional config map resolution, parallel BG/EN option arrays]

key-files:
  created: []
  modified:
    - src/config/subNicheConfig.ts
    - src/components/audit/Step1BusinessInfo.tsx
    - src/components/audit/Step2Technology.tsx
    - src/components/audit/Step3LeadFunnel.tsx
    - src/components/audit/Step7Operations.tsx

key-decisions:
  - "BG sub-niche options keep CRM lists unchanged (international tools), add Viber to all toolsExtra, replace lead sources with BG platforms"
  - "KPI values kept as English strings for scoring consistency — display-layer translation via bg/steps.json"
  - "EUR revenue tiers at Bulgarian-appropriate ranges (25K-500K EUR for HS, 15K-150K EUR for RE)"
  - "getSubNicheOptionsForLang as new export, getSubNicheOptions preserved for backward compatibility"

patterns-established:
  - "Language-conditional config: BG_SUB_NICHE_OPTIONS parallels SUB_NICHE_OPTIONS, resolved by getSubNicheOptionsForLang"
  - "Revenue/GCI arrays defined at module level, selected in component via lang === 'bg' ternary"
  - "Base lead source fallbacks: BG_HS_LEAD_SOURCES and BG_RE_LEAD_SOURCES in Step3 for when no sub-niche selected"

requirements-completed: [TRANS-04, TRANS-05]

# Metrics
duration: 3min
completed: 2026-02-22
---

# Phase 11 Plan 02: Bulgarian Market Options Summary

**Bulgarian-market form options with EUR revenue tiers, local platforms (imot.bg, OLX.bg, homes.bg, bazar.bg), and Viber across all sub-niche groups**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-22T21:20:35Z
- **Completed:** 2026-02-22T21:24:02Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Added BG_SUB_NICHE_OPTIONS with Bulgarian-market lead sources for all 8 sub-niche groups (reactive, recurring, project_based, residential_sales, commercial, property_management, new_construction, luxury_resort)
- Added Viber to toolsExtra for every BG sub-niche group (Viber is the dominant messaging app in Bulgaria)
- Implemented EUR-denominated revenue and GCI tiers for Bulgarian users with proper formatting (e.g., "50 000 - 100 000 EUR")
- Wired Step2, Step3, Step7 to use getSubNicheOptionsForLang for language-aware option resolution
- Added BG base lead source fallback arrays in Step3 for defensive coverage

## Task Commits

Each task was committed atomically:

1. **Task 1: Add Bulgarian market options to subNicheConfig and EUR revenue tiers to Step1** - `c2476ac` (feat)
2. **Task 2: Wire Step2, Step3, Step7 to use language-aware sub-niche options** - `b0fdb19` (feat)

**Plan metadata:** `5a22b16` (docs: complete plan)

## Files Created/Modified
- `src/config/subNicheConfig.ts` - Added BG_SUB_NICHE_OPTIONS (full Bulgarian-market config map) and getSubNicheOptionsForLang function
- `src/components/audit/Step1BusinessInfo.tsx` - Added BG_HS_REVENUES and BG_RE_GCI arrays, language-conditional selection via useLang
- `src/components/audit/Step2Technology.tsx` - Switched to getSubNicheOptionsForLang with useLang for language-aware CRM/tool options
- `src/components/audit/Step3LeadFunnel.tsx` - Switched to getSubNicheOptionsForLang, added BG base lead source fallback arrays
- `src/components/audit/Step7Operations.tsx` - Switched to getSubNicheOptionsForLang with useLang for language-aware KPI options

## Decisions Made
- **CRM lists unchanged for BG:** Bulgarian businesses use international CRMs (Salesforce, HubSpot, Jobber). No Bulgarian-specific CRM software exists per research, so CRM arrays are the same across languages.
- **KPI values kept as English scoring keys:** KPI tracked count is scored, not specific KPI names. English values preserved for scoring consistency; display labels will come from bg/steps.json translation.
- **EUR revenue tiers at Bulgarian-appropriate ranges:** HS revenue: 25K-500K EUR (vs US 250K-5M+ USD). RE GCI: 15K-150K EUR (vs US 250K-3M+ USD). Reflects Bulgarian market size.
- **Backward compatibility preserved:** getSubNicheOptions still exported for any existing consumers; new getSubNicheOptionsForLang adds language parameter.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Bulgarian market options are in place for all form steps
- Next plans (11-03, 11-04) can build on this foundation for AI report generation in Bulgarian and translation file population
- The generate-report edge function will need to consume the language parameter and adapt prompts accordingly

## Self-Check: PASSED

All files exist, all commits verified, summary created.

---
*Phase: 11-bulgarian-content-and-ai-reports*
*Completed: 2026-02-22*

# Phase 9: Scoring Engine Sub-Niche Weights - Context

**Gathered:** 2026-02-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Add config-driven weight overrides to the scoring engine per sub-niche group. Base weights remain unchanged when no sub-niche is selected. Also pass sub-niche name to the AI report prompt so recommendations reflect the specific business type. Language-neutral by design (Phase 6 value/label separation ensures this).

</domain>

<decisions>
## Implementation Decisions

### Weight override strategy
- Claude's Discretion (research-driven): magnitude of weight shifts — let research determine what differences actually matter per sub-niche group
- Reuse the same grouping from Phase 8: 3 HS groups (reactive/recurring/project-based) + 5 RE sub-niches
- Only create weight overrides where research shows meaningful differences — groups with no significant priority differences use base weights (graceful fallback)
- Pass sub-niche name to the AI report prompt (e.g., "This is an HVAC business") — sub-niche name only, no weight context in the prompt. Let the AI's own knowledge drive recommendations
- Numerical scores AND AI prompt hints are in scope for this phase

### Regression safety
- Claude's Discretion: regression precision — determine appropriate level (bit-for-bit vs functionally equivalent)
- Manual verification only — no automated unit tests for scoring. Verify during the verification plan
- Language-neutral scoring verified by design guarantee: scoring uses English form values (Phase 6 value/label separation), i18n.language never touches scoring logic. Verify architecturally, not via explicit test

### Weight data sourcing
- Research agent determines the actual weight numbers — investigates which of the 7 categories matter more for each sub-niche group and proposes distributions
- Claude's Discretion: whether weight config lives in same file as Phase 8 sub-niche config (subNicheConfig.ts) or separate scoring config file — pick based on config size and separation of concerns

### Claude's Discretion
- Weight shift magnitudes per sub-niche group
- Regression test precision level
- Config file organization (co-located vs separate)
- Which groups get overrides vs use base weights

</decisions>

<specifics>
## Specific Ideas

- The 7 scoring categories are: Operations, Marketing, Finance, Customer Experience, Technology, Lead Management, Team/HR (from existing scoring.ts)
- Weights must sum to 1.0 per group
- computeScores() must accept an optional sub-niche parameter and apply overrides when present
- AI prompt in generate-report edge function should include the sub-niche name for more specific recommendations

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 09-scoring-engine-sub-niche-weights*
*Context gathered: 2026-02-22*

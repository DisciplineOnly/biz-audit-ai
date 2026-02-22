# Phase 11: Bulgarian Content and AI Reports - Context

**Gathered:** 2026-02-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Users accessing `/bg/` experience a fully Bulgarian product — UI translations, form options reflecting the Bulgarian market, EUR pricing at locally appropriate tiers, and AI-generated reports in Bulgarian with local context. This phase delivers TRANS-01, TRANS-04, TRANS-05, AI-01, AI-02, AI-03.

</domain>

<decisions>
## Implementation Decisions

### Bulgarian market options
- Mix of international + local Bulgarian platforms/tools — not purely local, include widely-used international tools that Bulgarian businesses actually use
- Shared base options across languages, with market-specific additions per language (BG gets Bulgarian platforms added; EN keeps US platforms)
- Viber treated as one among equals alongside WhatsApp and others — no special prominence
- Claude to research the full Bulgarian RE and HS platform landscape and propose specific lists for review

### Currency and pricing
- All pricing uses EUR (not BGN) — revenue fields, job pricing, monthly spend, everything consistently in EUR
- Bulgarian number formatting: space as thousand separator, comma as decimal (e.g., "50 000 €")
- EUR symbol placed after the number (Bulgarian convention): "50 000 €"
- Claude to research typical Bulgarian HS/RE business revenue ranges and propose appropriate EUR-denominated tiers

### AI report tone and content
- Formal business tone — traditional Bulgarian business writing style with formal address (Вие), structured, authoritative
- Stay generic on business norms — no references to Bulgarian-specific regulations, tax practices, or NRA; keep recommendations universal
- Platform recommendations: Bulgarian platforms first, then note international alternatives if relevant (local + international approach)
- Sub-niche specificity: report should reference the user's specific sub-niche (e.g., "като ВиК бизнес")

### Landing page and UI copy
- Direct translation of the English landing page — same structure, same messaging, just in Bulgarian
- AI/Claude translation is acceptable for all strings including validation messages and error states
- Edge function returns machine-readable error codes (e.g., 'RATE_LIMIT_EXCEEDED'); frontend maps to translated Bulgarian strings
- Niche selection layout: same visual layout, text wraps naturally if Bulgarian labels are longer

### Claude's Discretion
- AI prompt approach: separate Bulgarian prompt template vs language flag on existing prompt — Claude decides cleanest implementation
- Layout adjustments for longer Bulgarian strings — Claude evaluates and adjusts if needed
- Specific Bulgarian platform/tool lists — Claude researches and proposes, within the "shared base + local additions" framework
- EUR revenue tier ranges — Claude researches Bulgarian market and proposes appropriate brackets

</decisions>

<specifics>
## Specific Ideas

- Success criteria explicitly mention: imot.bg and homes.bg for RE lead sources, OLX.bg and bazar.bg for HS, Viber in communication tools
- Rate-limit error must be translated via frontend (machine-readable code from edge function, not hardcoded English string)
- Bulgarian formatting convention: "50 000 €" (space thousands, symbol after)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 11-bulgarian-content-and-ai-reports*
*Context gathered: 2026-02-22*

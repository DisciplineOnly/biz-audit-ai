# Phase 11: Bulgarian Content and AI Reports - Research

**Researched:** 2026-02-22
**Domain:** i18n content translation, market-specific form options, multilingual AI report generation
**Confidence:** HIGH

## Summary

Phase 11 delivers the final piece of v1.1 localization: populating the empty Bulgarian translation files, adapting form answer options for the Bulgarian market, converting revenue/pricing fields to EUR, and making the `generate-report` edge function language-aware so Bulgarian users receive AI reports entirely in Bulgarian with local market context.

The i18n infrastructure (Phase 6), form step labels (Phase 7), sub-niche config (Phase 8), scoring weights (Phase 9), and database columns (Phase 10) are all complete. What remains is content: filling `bg/*.json` translation files (currently empty `{}` objects), adding Bulgarian-market options to `subNicheConfig.ts`, modifying the edge function to accept a `language` parameter and adapt its prompt, and converting rate-limit responses to machine-readable error codes.

**Primary recommendation:** Use a separate Bulgarian system prompt template in the `generate-report` edge function (not a language flag injection into the existing English prompt), add `language` to the request body from `Loading.tsx`, and populate all five `bg/*.json` translation files with complete Bulgarian content matching the English structure.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Mix of international + local Bulgarian platforms/tools -- not purely local, include widely-used international tools that Bulgarian businesses actually use
- Shared base options across languages, with market-specific additions per language (BG gets Bulgarian platforms added; EN keeps US platforms)
- Viber treated as one among equals alongside WhatsApp and others -- no special prominence
- Claude to research the full Bulgarian RE and HS platform landscape and propose specific lists for review
- All pricing uses EUR (not BGN) -- revenue fields, job pricing, monthly spend, everything consistently in EUR
- Bulgarian number formatting: space as thousand separator, comma as decimal (e.g., "50 000 EUR")
- EUR symbol placed after the number (Bulgarian convention): "50 000 EUR"
- Claude to research typical Bulgarian HS/RE business revenue ranges and propose appropriate EUR-denominated tiers
- Formal business tone -- traditional Bulgarian business writing style with formal address (Vie), structured, authoritative
- Stay generic on business norms -- no references to Bulgarian-specific regulations, tax practices, or NRA; keep recommendations universal
- Platform recommendations: Bulgarian platforms first, then note international alternatives if relevant (local + international approach)
- Sub-niche specificity: report should reference the user's specific sub-niche (e.g., "kato VIK biznes")
- Direct translation of the English landing page -- same structure, same messaging, just in Bulgarian
- AI/Claude translation is acceptable for all strings including validation messages and error states
- Edge function returns machine-readable error codes (e.g., 'RATE_LIMIT_EXCEEDED'); frontend maps to translated Bulgarian strings
- Niche selection layout: same visual layout, text wraps naturally if Bulgarian labels are longer

### Claude's Discretion
- AI prompt approach: separate Bulgarian prompt template vs language flag on existing prompt -- Claude decides cleanest implementation
- Layout adjustments for longer Bulgarian strings -- Claude evaluates and adjusts if needed
- Specific Bulgarian platform/tool lists -- Claude researches and proposes, within the "shared base + local additions" framework
- EUR revenue tier ranges -- Claude researches Bulgarian market and proposes appropriate brackets

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TRANS-01 | User sees all landing page content in Bulgarian when accessing `/bg/` | Populate `bg/landing.json` with full Bulgarian translation matching `en/landing.json` structure. Currently empty `{}`. |
| TRANS-04 | Bulgarian form options reflect the local market (Bulgarian CRMs, tools, platforms) | Add Bulgarian-market platforms to `subNicheConfig.ts` via language-conditional option sets. Key additions: imot.bg, homes.bg, OLX.bg, bazar.bg, Viber. Revenue tiers in EUR. |
| TRANS-05 | Bulgarian price/revenue ranges use EUR currency with locally appropriate tiers | Replace USD-denominated revenue tiers with EUR tiers at Bulgarian-appropriate ranges. Format: "50 000 EUR" (space thousands, symbol after). |
| AI-01 | User who completed the audit in Bulgarian receives an AI-generated report entirely in Bulgarian | Pass `language` from frontend to `generate-report` edge function. Use separate Bulgarian system prompt with formal tone instructions. |
| AI-02 | AI report references sub-niche-specific context in its recommendations | Already partially implemented (sub-niche label passed to prompt since Phase 9). Needs Bulgarian sub-niche labels (e.g., "ВиК" not "Plumbing") in the prompt. |
| AI-03 | AI report for Bulgarian users references Bulgarian-market tools and platforms | Bulgarian system prompt must instruct Claude to reference Bulgarian platforms (imot.bg, OLX.bg, etc.) and use Bulgarian business context. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| i18next + react-i18next | Already installed | Translation files and `t()` function | Already in place from Phase 6-7. Only content files need populating. |
| i18next-http-backend | Already installed | Loads `public/locales/{lng}/{ns}.json` at runtime | Namespace-per-page pattern already established. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| No new libraries needed | N/A | All infrastructure is in place | Phase 11 is purely content + edge function modification |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Separate BG prompt template | Language flag injection in existing prompt | Separate template is cleaner: BG prompt needs different tone, platform references, and sub-niche labels. Mixing languages in one template creates complexity. **Recommendation: separate template.** |
| Language-conditional option arrays in step components | Separate config file per language | Components already use `toOptions()` and `subNicheConfig.ts`. Adding language awareness to existing config is simpler than a parallel config system. |

**Installation:**
```bash
# No new packages needed
```

## Architecture Patterns

### Recommended Project Structure
```
public/locales/
  bg/
    common.json       # Currently {} -- needs full Bulgarian translation
    landing.json      # Currently {} -- needs full Bulgarian translation
    steps.json        # Currently {} -- needs full Bulgarian translation
    generating.json   # Currently {} -- needs full Bulgarian translation
    report.json       # Currently {} -- needs full Bulgarian translation
  en/
    common.json       # Complete reference -- BG must match structure
    landing.json      # Complete reference
    steps.json        # Complete reference
    generating.json   # Complete reference
    report.json       # Complete reference

src/config/
  subNicheConfig.ts   # Add language-aware option overrides for BG market

supabase/functions/generate-report/
  index.ts            # Add language param, Bulgarian prompt template
```

### Pattern 1: Language-Aware Form Options via Config
**What:** Extend `subNicheConfig.ts` or create a language-options config that provides Bulgarian-market-specific options (CRMs, lead sources, tools, revenue tiers) when the active language is `bg`.
**When to use:** For all form fields where Bulgarian options differ from English ones.
**How it works:**

The current architecture uses `toOptions()` to convert string arrays into `SelectOption[]` where `value === label`. For Bulgarian market options, the pattern must maintain English scoring keys as `value` (scoring engine depends on exact English strings) while showing Bulgarian `label` text.

**Critical constraint:** The scoring engine (`scoring.ts`) uses Record<string, number> lookup tables keyed by the exact English option text (e.g., `"Under 5 minutes": 3`). These values are stored in `AuditFormState` and persisted to Supabase. Changing `value` would break scoring.

**Approach for language-conditional options:**
1. **Revenue/price fields:** These need entirely different `value` strings for BG (EUR-denominated tiers). Since scoring maps these specific strings, new scoring entries must be added for BG tiers, OR the revenue field must store a language-neutral value.
2. **CRM/lead source/tool options:** BG adds local platforms to the shared base. The `value` is the English platform name (scoring counts array length, not specific values). Adding `imot.bg` as both `value` and `label` is fine.
3. **Dropdown answer options** (response speed, lead tracking, etc.): The scoring engine keys on exact English strings. For BG, `value` must remain the English scoring key; `label` is the Bulgarian translation.

```typescript
// Example: language-aware option creation
function makeOptions(
  items: Array<{ value: string; labelEn: string; labelBg: string }>,
  lang: string
): SelectOption[] {
  return items.map(item => ({
    value: item.value,
    label: lang === 'bg' ? item.labelBg : item.labelEn,
  }));
}
```

### Pattern 2: Separate Bulgarian AI Prompt Template
**What:** A second `buildPrompt` function (or a language branch within `buildPrompt`) that produces system/user prompts in Bulgarian with formal tone, Bulgarian platform references, and Bulgarian sub-niche labels.
**When to use:** When `language === 'bg'` is passed to `generate-report`.
**Key differences from English prompt:**

| Aspect | English Prompt | Bulgarian Prompt |
|--------|---------------|-----------------|
| Language instruction | None (default English) | "Respond entirely in Bulgarian" |
| Tone | "Warm but honest" | "Formal business tone (Vie form)" |
| Platform references | Generic ("tools") | "Reference Bulgarian platforms (imot.bg, OLX.bg, etc.)" |
| Sub-niche label | English (e.g., "Plumbing") | Bulgarian (e.g., "ВиК") |
| Regulation references | Generic | "Stay generic -- no NRA/regulation references" |

```typescript
// In generate-report/index.ts
const BG_SUB_NICHE_LABELS: Record<string, string> = {
  hvac: 'ОВК', plumbing: 'ВиК', electrical: 'Електро',
  // ... etc
};

function buildBulgarianPrompt(params: PromptParams): { system: string; user: string } {
  // Full Bulgarian system prompt with formal tone
  const system = `Вие сте бизнес консултант...
  // Respond entirely in Bulgarian using formal address (Вие).
  // ... (separate template, not a flag on the English one)
  `;
}
```

### Pattern 3: Machine-Readable Error Codes from Edge Functions
**What:** The `generate-report` edge function currently returns a hardcoded English string for rate-limit errors. Change to a machine-readable code; frontend maps to translated string.
**When to use:** All error responses from edge functions that users see.

Current (broken for i18n):
```typescript
// generate-report/index.ts line 415
JSON.stringify({
  rateLimited: true,
  message: `You've already submitted 3 audits today. Try again ${timeHint}.`,
})
```

Target:
```typescript
JSON.stringify({
  rateLimited: true,
  code: 'RATE_LIMIT_EXCEEDED',
  hoursRemaining: hoursRemaining,
})
```

Frontend (`Loading.tsx`) then uses:
```typescript
const message = t('rateLimit.message', { timeHint: formatTimeHint(body.hoursRemaining) });
```

### Anti-Patterns to Avoid
- **Translating `value` in SelectOption:** Never translate the `value` field -- scoring depends on exact English strings. Only `label` changes per language.
- **Hardcoding Bulgarian strings in components:** All Bulgarian text goes in `bg/*.json` files, never in TSX components.
- **Duplicating entire option arrays per language:** Use the shared base + additions pattern from CONTEXT.md. BG adds local platforms to shared lists, not a completely separate set.
- **Mixing prompt languages:** Don't inject "Please respond in Bulgarian" into the English prompt. Use a separate prompt template with the correct tone, instructions, and cultural context.
- **BGN currency:** User explicitly decided EUR only. Do not use BGN leva anywhere.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Number formatting (Bulgarian convention) | Custom formatter | `Intl.NumberFormat('bg-BG', { style: 'currency', currency: 'EUR' })` or manual "X XXX EUR" | Bulgarian convention is space-separated thousands with EUR after. `Intl.NumberFormat` may not perfectly match "50 000 EUR" convention; may need light wrapper. |
| Translation file content | Manual string creation | Claude AI translation of English files | CONTEXT.md explicitly allows AI translation for all strings. Translate all 5 en/*.json files to bg/*.json. |
| Sub-niche label translation | Hardcoded mapping | i18n keys via `labelKey` field in `SUB_NICHE_REGISTRY` | Registry already has `labelKey: "subNiche.hvac"` etc. Just populate the keys in `bg/steps.json`. |

**Key insight:** Phase 11 is primarily a content phase, not an architecture phase. All infrastructure exists. The risk is in content correctness (Bulgarian language quality, market-appropriate options, EUR pricing ranges) not in technical complexity.

## Common Pitfalls

### Pitfall 1: Breaking the Scoring Engine with Translated Values
**What goes wrong:** If `SelectOption.value` is translated to Bulgarian, the scoring engine's `Record<string, number>` lookup tables fail (e.g., `"Under 5 minutes"` becomes `"Под 5 минути"` and scores as 1 via the default `?? 1` fallback instead of the correct 3).
**Why it happens:** The `toOptions()` function sets `value === label`. When labels are translated, values change too.
**How to avoid:** For translated dropdown options, construct `SelectOption` objects explicitly with English `value` and Bulgarian `label`. Use `toOptions()` only for options where value/label should match (e.g., platform names like "imot.bg").
**Warning signs:** Scoring tests produce different results for the same conceptual answers in different languages. This should be covered by existing test SCORE-02 (identical scoring regardless of language).

### Pitfall 2: Revenue Tier Scoring Mismatch
**What goes wrong:** English revenue tiers are `"Under $250K"`, `"$250K-$500K"`, etc. Bulgarian tiers will be EUR-denominated (e.g., `"Под 25 000 EUR"`). If `value` changes, scoring breaks.
**Why it happens:** Revenue fields are used in `formContext` sent to the AI prompt, and potentially displayed in the report hero section. They're NOT used in the scoring `Record<string, number>` maps (revenue doesn't have a scoring lookup table), but they ARE stored in state and persisted.
**How to avoid:** Revenue fields (Step 1: `annualRevenue`, `annualGCI`) are not scored via lookup tables -- they're passed as context to the AI and displayed on the report. So using different EUR-denominated `value` strings for BG is safe for scoring. However, the AI prompt context will show EUR values, which is correct for Bulgarian users.
**Warning signs:** Check that no scoring map references revenue tier strings. (Confirmed: `scoring.ts` does not reference revenue/GCI values.)

### Pitfall 3: i18n Fallback Masking Missing Translations
**What goes wrong:** `fallbackLng: 'en'` means if a key is missing in `bg/*.json`, it silently falls back to English. The page looks "mostly translated" but has English fragments scattered throughout.
**Why it happens:** i18next is designed to be forgiving. Missing keys don't cause errors.
**How to avoid:** After populating `bg/*.json`, verify key coverage: every key in `en/*.json` must have a corresponding key in `bg/*.json`. A simple script or manual diff can catch this. Use `i18n.options.missingKeyHandler` during development to log missing keys.
**Warning signs:** Any English text appearing on a `/bg/` page is a missing translation key.

### Pitfall 4: Rate-Limit `timeHint` Not Internationalized
**What goes wrong:** The `timeHint` calculation in the edge function currently produces English phrases ("in about 1 hour", "tomorrow"). If the frontend simply displays the server's `message` field, Bulgarian users see English rate-limit text.
**Why it happens:** The current implementation constructs a full English sentence server-side.
**How to avoid:** Return machine-readable data (`code`, `hoursRemaining`) instead of a pre-formatted message. The frontend constructs the localized message using `t()`.
**Warning signs:** The `rateLimitMessage` state variable in `Loading.tsx` is set to `body.message` (the server's English string) on line 77.

### Pitfall 5: AI Report Language Drift
**What goes wrong:** Claude Haiku 4.5 starts in Bulgarian but inserts English terms, especially for business jargon (CRM, KPI, ROI) or switches to English mid-sentence.
**Why it happens:** Haiku is smaller and less language-stable than Opus/Sonnet. Business/technical vocabulary has strong English training signal.
**How to avoid:** The Bulgarian system prompt should explicitly state: "Write entirely in Bulgarian. Use formal address (Вие). Business terms like CRM, KPI, ROI can remain in English as they are internationally used, but all surrounding text must be in Bulgarian." Including example output in the prompt helps anchor the language.
**Warning signs:** Review 3-5 generated Bulgarian reports before launch. Flag entries like STATE.md already notes: "Phase 11 quality gate: Bulgarian AI report output requires native-speaker review."

### Pitfall 6: MAX_TOKENS Too Low for Bulgarian
**What goes wrong:** Bulgarian text is approximately 10-20% longer than English for the same content. At `MAX_TOKENS = 4096`, some reports may truncate.
**Why it happens:** Cyrillic characters tokenize differently (often fewer chars per token). Combined with more verbose Bulgarian phrasing, token usage increases.
**How to avoid:** Monitor or increase `MAX_TOKENS` for Bulgarian requests. Consider `MAX_TOKENS = 5000` for BG language, or a single increase to 5000 for all languages (won't affect cost since Haiku only charges for actual output tokens, not the limit).
**Warning signs:** `stop_reason === 'max_tokens'` errors after Bulgarian launch. The existing truncation guard (line 478-480 of generate-report) will catch this, but users will get a failed report.

## Code Examples

### Example 1: Passing Language to generate-report

Currently in `Loading.tsx` (line 64-65):
```typescript
// CURRENT: No language passed
const generateCall = supabase.functions.invoke("generate-report", {
  body: { auditId, formState: formStateRef.current, scores: scoresRef.current },
});
```

Target:
```typescript
// AFTER: Language included
const generateCall = supabase.functions.invoke("generate-report", {
  body: {
    auditId,
    formState: formStateRef.current,
    scores: scoresRef.current,
    language: lang, // 'bg' or 'en'
  },
});
```

### Example 2: Language-Conditional Prompt in Edge Function

```typescript
// In generate-report/index.ts
const language: string = body.language ?? 'en';

// Sub-niche labels in Bulgarian
const BG_SUB_NICHE_LABELS: Record<string, string> = {
  hvac: 'ОВК (отопление, вентилация, климатизация)',
  plumbing: 'ВиК (водоснабдяване и канализация)',
  electrical: 'Електроинсталации',
  garage_doors: 'Гаражни врати',
  pest_control: 'Дезинфекция и дезинсекция (DDD)',
  landscaping: 'Озеленяване и поддръжка на градини',
  cleaning: 'Професионално почистване',
  roofing: 'Покривни конструкции',
  painting: 'Бояджийски услуги',
  general_contracting: 'Строително предприемачество',
  construction: 'Строителство',
  interior_design: 'Интериорен дизайн',
  residential_sales: 'Жилищни продажби',
  commercial: 'Търговски имоти / Офиси',
  property_management: 'Управление на имоти',
  new_construction: 'Ново строителство',
  luxury_resort: 'Луксозни / Ваканционни имоти',
};

// Choose label set based on language
const subNicheLabelMap = language === 'bg' ? BG_SUB_NICHE_LABELS : SUB_NICHE_LABELS;
const subNicheLabel = subNicheKey ? (subNicheLabelMap[subNicheKey] ?? null) : null;

// Choose prompt builder based on language
const { system, user } = language === 'bg'
  ? buildBulgarianPrompt({ niche, businessName, scores, formState, techFrustrations, biggestChallenge, subNiche: subNicheLabel })
  : buildPrompt({ niche, businessName, scores, formState, techFrustrations, biggestChallenge, subNiche: subNicheLabel });
```

### Example 3: Machine-Readable Rate Limit Response

```typescript
// BEFORE (English string):
return new Response(
  JSON.stringify({
    rateLimited: true,
    message: `You've already submitted 3 audits today. Try again ${timeHint}.`,
  }),
  { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
);

// AFTER (machine-readable code + data):
return new Response(
  JSON.stringify({
    rateLimited: true,
    code: 'RATE_LIMIT_EXCEEDED',
    hoursRemaining,
  }),
  { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
);
```

Frontend maps to translated string:
```typescript
// Loading.tsx
if (body?.rateLimited) {
  setIsRateLimited(true);
  const hours = body.hoursRemaining ?? 24;
  let timeHint: string;
  if (hours <= 1) timeHint = t('rateLimit.timeHints.oneHour');
  else if (hours < 20) timeHint = t('rateLimit.timeHints.hours', { count: hours });
  else timeHint = t('rateLimit.timeHints.tomorrow');
  setRateLimitMessage(t('rateLimit.message', { timeHint }));
  return;
}
```

### Example 4: Bulgarian Revenue Tiers (EUR)

Based on research: Bulgaria's average salary is ~1,370 EUR/month (Q4 2025). Small trade businesses typically range from solo operators earning 10,000-20,000 EUR/year to established companies earning 500,000+ EUR/year.

```typescript
// BG Home Services revenue tiers (EUR)
const BG_HS_REVENUES = toOptions([
  "Под 25 000 \u20ac",     // Under 25K EUR (solo/micro)
  "25 000 - 50 000 \u20ac", // 25-50K EUR
  "50 000 - 100 000 \u20ac", // 50-100K EUR
  "100 000 - 250 000 \u20ac", // 100-250K EUR
  "250 000 - 500 000 \u20ac", // 250-500K EUR
  "Над 500 000 \u20ac",     // 500K+ EUR
]);

// BG Real Estate GCI tiers (EUR)
const BG_RE_GCI = toOptions([
  "Под 15 000 \u20ac",     // Under 15K EUR
  "15 000 - 30 000 \u20ac", // 15-30K EUR
  "30 000 - 60 000 \u20ac", // 30-60K EUR
  "60 000 - 150 000 \u20ac", // 60-150K EUR
  "Над 150 000 \u20ac",     // 150K+ EUR
]);
```

**Note:** These tiers align with Bulgarian market realities where a successful plumbing company with 5 employees might earn 100,000-250,000 EUR/year, and a top real estate agent's GCI might be 30,000-60,000 EUR/year. These are significantly lower than US equivalents.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| All BG translation files empty `{}` | Must be populated with full Bulgarian content | Phase 11 (now) | Without this, fallbackLng shows English for all BG pages |
| Edge function ignores language | Must accept `language` param and branch prompt | Phase 11 (now) | Without this, BG users get English AI reports |
| Rate limit returns English message string | Must return machine-readable code + data | Phase 11 (now) | Without this, BG users see English error text |
| Revenue tiers in USD | Must offer EUR tiers for BG users | Phase 11 (now) | Without this, BG users see irrelevant USD amounts |

## Bulgarian Market Research

### Real Estate Platforms (for lead source options)
| Platform | Type | Relevance |
|----------|------|-----------|
| imot.bg | Property listings portal | #1 most visited RE site in Bulgaria |
| imoti.net | Property listings + agencies | Top 3, 25 years in market, AI features added 2025 |
| homes.bg | Property listings portal | Top 5 in Bulgaria |
| address.bg | Property listings portal | Top 5 in Bulgaria |
| OLX.bg | General classifieds (includes RE) | 2M+ active ads, 4M monthly unique users |
| bazar.bg | General classifieds (includes RE) | Same corporate group as OLX.bg |

### Home Services Platforms (for lead source options)
| Platform | Type | Relevance |
|----------|------|-----------|
| OLX.bg | General classifieds | Most used for finding/advertising trade services |
| bazar.bg | General classifieds | Second marketplace for services |
| Alo.bg | Classifieds | Used for service advertisements |
| Facebook Groups/Marketplace | Social marketplace | Very widely used for trade services in BG |
| Google Maps/Business Profile | Local discovery | Standard for all businesses |

### Communication Tools
| Tool | Relevance in Bulgaria |
|------|----------------------|
| Viber | #1 messaging app in Bulgaria (~90% market share). Used extensively for business communication. |
| WhatsApp | Secondary but growing usage |
| Facebook Messenger | Common for business inquiries |
| SMS | Still used for formal notifications |

### CRM/Software Landscape
Bulgarian trade businesses primarily use international CRM/software tools due to limited local alternatives. Common pattern: international SaaS (HubSpot, Salesforce, Zoho) for larger businesses; spreadsheets/no CRM for smaller ones. No Bulgarian-specific field service management software equivalent to ServiceTitan.

## Open Questions

1. **Bulgarian AI report quality validation**
   - What we know: Claude Haiku 4.5 supports multilingual output. Bulgarian is a supported language.
   - What's unclear: Output quality for formal Bulgarian business writing at Haiku-level model. May produce grammatically acceptable but stylistically stiff text.
   - Recommendation: Generate 3-5 sample reports after implementation and review. STATE.md already flags this as a quality gate. Consider increasing MAX_TOKENS from 4096 to 5000 for Bulgarian requests.

2. **EUR formatting consistency**
   - What we know: User wants "50 000 EUR" (space thousands, symbol after number).
   - What's unclear: Whether `Intl.NumberFormat('bg-BG', { style: 'currency', currency: 'EUR' })` produces exactly this format. It may produce "50 000,00 EUR" with decimals.
   - Recommendation: Test `Intl.NumberFormat` output. If it doesn't match exactly, use a simple string formatter. Revenue tiers are static strings anyway (not dynamic formatting).

3. **Scoring backward compatibility with EUR tiers**
   - What we know: Revenue (`annualRevenue`, `annualGCI`) fields are NOT used in scoring lookup tables. They appear in form context for the AI and on the report hero.
   - What's unclear: Whether any downstream consumer (email templates, analytics) depends on specific revenue tier string values.
   - Recommendation: Confirmed safe -- revenue values are display-only in scoring. They flow to AI prompt context and report hero badges. EUR values are appropriate for Bulgarian users.

## Sources

### Primary (HIGH confidence)
- Project codebase: `public/locales/en/*.json` (5 files, reference translations)
- Project codebase: `public/locales/bg/*.json` (5 files, all currently empty `{}`)
- Project codebase: `supabase/functions/generate-report/index.ts` (current prompt structure, no language awareness)
- Project codebase: `src/config/subNicheConfig.ts` (sub-niche option architecture)
- Project codebase: `src/lib/scoring.ts` (scoring maps keyed by English option strings)
- Project codebase: `src/pages/Loading.tsx` (rate limit handling, `lang` available but not passed to generate-report)
- Project codebase: `src/components/audit/AuditFormComponents.tsx` (`SelectOption` type, `toOptions()` pattern)
- 11-CONTEXT.md: User decisions on EUR, tone, platform approach, error codes

### Secondary (MEDIUM confidence)
- [Similarweb Bulgaria RE ranking](https://www.similarweb.com/top-websites/bulgaria/business-and-consumer-services/real-estate/) - imot.bg, imoti.net, homes.bg rankings
- [Novinite.com Bulgaria salary data](https://www.novinite.com/articles/236969/) - Average salary 1,369 EUR Q4 2025
- [Messaggio Viber Bulgaria](https://messaggio.com/messaging/bulgaria/viber/) - 90% market share in Bulgaria
- [Anthropic Models Overview](https://docs.claude.com/en/docs/about-claude/models/overview) - Multilingual support confirmed
- [OLX Bulgaria](https://balkanecommerce.com/partners/olx-bulgaria/) - 2M+ active ads, 4M monthly users

### Tertiary (LOW confidence)
- Bulgarian CRM adoption patterns -- no specific data found. Based on general Eastern European SaaS adoption patterns and absence of local field-service software.
- Bulgarian HS revenue ranges -- extrapolated from average salary data (1,370 EUR/month) and EU HVAC/plumbing industry data. No Bulgaria-specific trade business revenue surveys found.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new libraries needed, all infrastructure in place from Phases 6-10
- Architecture: HIGH - Patterns are clear extensions of existing code (config additions, prompt branching, translation file population)
- Pitfalls: HIGH - Scoring engine dependency on English string values is well-understood; rate limit internationalization gap is documented
- Content accuracy (BG translations): MEDIUM - AI-generated translations are acceptable per user decision but need native review (flagged in STATE.md)
- Market research (BG platforms/pricing): MEDIUM - Major platforms confirmed via web research; revenue tiers extrapolated from salary/market data

**Research date:** 2026-02-22
**Valid until:** 2026-03-22 (stable -- no external dependencies changing)

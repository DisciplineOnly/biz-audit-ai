import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { corsHeaders } from '../_shared/cors.ts'
import Anthropic from 'npm:@anthropic-ai/sdk'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { Ratelimit } from 'npm:@upstash/ratelimit'
import { Redis } from 'npm:@upstash/redis'

const MODEL = 'claude-haiku-4-5-20251001'
const MAX_TOKENS = 4096

// --- Sanitization (SEC-04) ---

function sanitizeText(input: string | undefined, maxLen: number = 500): string {
  if (!input) return ''
  return input
    .replace(/<[^>]*>/g, '')                    // strip HTML tags
    .replace(/\p{Emoji_Presentation}/gu, '')    // strip emoji (keep text chars)
    .replace(/[^\p{L}\p{N}\s.,!?'-]/gu, ' ')   // keep letters (any script), digits, common punctuation
    .replace(/\s+/g, ' ')                       // normalize whitespace
    .trim()
    .slice(0, maxLen)
}

function sanitizeBusinessName(name: string | undefined): string {
  if (!name) return 'Your Business'
  return name
    .replace(/<[^>]*>/g, '')                    // strip HTML tags
    .replace(/\p{Emoji_Presentation}/gu, '')    // strip emoji
    .replace(/[^\p{L}\p{N}\s.,&'-]/gu, ' ')    // keep letters, digits, & for business names
    .replace(/\s+/g, ' ')                       // normalize whitespace
    .trim()
    .slice(0, 100)
}

// --- Prompt building ---

interface CategoryScore {
  category: string
  label: string
  score: number
  weight: number
}

interface AuditScores {
  technology: number
  leads: number
  scheduling: number
  communication: number
  followUp: number
  operations: number
  financial: number
  overall: number
  categories: CategoryScore[]
}

interface FormState {
  niche: string
  subNiche?: string | null  // Sub-niche key from AuditFormState (e.g., "hvac", "plumbing")
  step1: {
    businessName: string
    contactName?: string
    email?: string
    phone?: string
    industry?: string
    employeeCount?: string
    annualRevenue?: string
    yearsInBusiness?: string
    serviceArea?: string
    role?: string
    teamSize?: string
    transactionVolume?: string
    annualGCI?: string
    primaryMarket?: string
  }
  step2: {
    primaryCRM?: string
    crmSatisfaction?: number
    toolsUsed?: string[]
    techFrustrations?: string
  }
  step3: {
    leadSources?: string[]
    responseSpeed?: string
    leadTracking?: string
    conversionRate?: string
    missedCallHandling?: string
    leadDistribution?: string
    googleReviews?: string
    reviewAutomation?: string
    touchesIn7Days?: string
  }
  step4: {
    schedulingMethod?: string
    dispatchMethod?: string
    routeOptimization?: string
    realTimeTracking?: string
    capacityPlanning?: string
    emergencyHandling?: string
    followUpPlan?: string
    nurtureDuration?: string
    automatedDrip?: string
    leadTemperatureTracking?: string
    activityLogging?: string
    coldLeadHandling?: string
  }
  step5: {
    internalComms?: string
    afterHoursComms?: string
    clientPortal?: string
    appointmentReminders?: string
    onTheWayNotifications?: string
    jobCompletionComms?: string
    agentClientComms?: string
    transactionUpdates?: string
    pastClientEngagement?: string
  }
  step6: {
    repeatBusinessPercent?: string
    postJobFollowUp?: string
    maintenanceReminders?: string
    serviceAgreements?: string
    estimateFollowUp?: string
    warrantyTracking?: string
    postCloseFollowUp?: string
    pastClientContact?: string
    referralProcess?: string
    lostLeadFollowUp?: string
    anniversaryTracking?: string
  }
  step7: {
    kpisTracked?: string[]
    performanceMeasurement?: string
    jobCosting?: string
    inventoryManagement?: string
    timeTracking?: string
    qualityControl?: string
    agentPerformanceMeasurement?: string
    agentAccountability?: string
    transactionWorkflow?: string
    agentOnboarding?: string
  }
  step8: {
    paymentMethods?: string[]
    financialReview?: string
    estimateProcess?: string
    pricingModel?: string
    invoiceTiming?: string
    collectionsProcess?: string
    expenseTracking?: string
    teamPnL?: string
    commissionDisbursement?: string
    marketingBudget?: string
    biggestChallenge?: string
  }
}

function buildPrompt(params: {
  niche: string
  businessName: string
  scores: AuditScores
  formState: FormState
  techFrustrations: string
  biggestChallenge: string
  subNiche?: string | null  // Human-readable sub-niche label (e.g., "HVAC", "Plumbing")
}): { system: string; user: string } {
  const { niche, businessName, scores, formState, techFrustrations, biggestChallenge, subNiche } = params
  const isHS = niche === 'home_services'
  const nicheLabel = isHS ? 'Home Services Business' : 'Real Estate Team'
  const overallScore = scores.overall

  // Determine item counts based on score
  let gapCount: string
  let quickWinCount: string
  let stratRecCount: string
  if (overallScore < 40) {
    gapCount = '4-5'
    quickWinCount = '3'
    stratRecCount = '3'
  } else if (overallScore <= 65) {
    gapCount = '3'
    quickWinCount = '3'
    stratRecCount = '3'
  } else {
    gapCount = '2'
    quickWinCount = '2'
    stratRecCount = '2'
  }

  const system = `You are a business operations advisor generating a personalized audit report.

Tone: Warm but honest. Encouraging with clear direction — not aggressive or hedging. Make the business owner feel understood and optimistic about what's possible.

Constraints:
- Never recommend third-party tools, software vendors, or specific products by name. Identify problems and their business impact, steering toward custom solutions and expert consultation.
- Reference industry benchmarks using phrases like "Most successful teams in your space..." without hard numbers or competitor names.
- Each gap, quick win, and recommendation MUST include a "cta" field with a personalized call-to-action nudging the reader to book a consultation call. Examples: "Let us automate your follow-up sequence — book a call", "We can build a custom scheduling system for your team".
- When a sub-niche is specified, tailor recommendations to that specific business type (e.g., "as a plumbing business" not just "home services"). Use your knowledge of that sub-niche's unique challenges and opportunities.

Item count based on overall score (${overallScore}/100):
- Generate ${gapCount} gaps
- Generate ${quickWinCount} quick wins
- Generate ${stratRecCount} strategic recommendations

JSON output instruction: Respond with ONLY valid JSON. Do not include markdown code fences, preamble, or explanation. The entire response must be parseable by JSON.parse().

Required JSON schema:
{
  "executiveSummary": "string (2-4 sentences, personalized paragraph referencing business name, niche, and overall score)",
  "gaps": [{ "title": "string", "description": "string (2-3 sentences)", "impact": "string (one-liner)", "priority": "high|medium|low", "cta": "string" }],
  "quickWins": [{ "title": "string", "description": "string (actionable steps)", "timeframe": "string", "priority": "high|medium|low", "cta": "string" }],
  "strategicRecommendations": [{ "title": "string", "description": "string", "roi": "string", "priority": "high|medium|low", "cta": "string" }]
}`

  // Sort categories ascending (weakest first) for AI-03
  const sortedCategories = [...scores.categories].sort((a, b) => a.score - b.score)

  // Extract non-PII form context
  // PII excluded: email, phone, contactName — only businessName included
  const formContext: Record<string, string | string[] | number | undefined> = {}

  // Step 1: business context only (no PII)
  if (isHS) {
    if (formState.step1.industry) formContext['industry'] = formState.step1.industry
    if (formState.step1.employeeCount) formContext['employeeCount'] = formState.step1.employeeCount
    if (formState.step1.annualRevenue) formContext['annualRevenue'] = formState.step1.annualRevenue
    if (formState.step1.yearsInBusiness) formContext['yearsInBusiness'] = formState.step1.yearsInBusiness
    if (formState.step1.serviceArea) formContext['serviceArea'] = formState.step1.serviceArea
  } else {
    if (formState.step1.role) formContext['role'] = formState.step1.role
    if (formState.step1.teamSize) formContext['teamSize'] = formState.step1.teamSize
    if (formState.step1.transactionVolume) formContext['transactionVolume'] = formState.step1.transactionVolume
    if (formState.step1.annualGCI) formContext['annualGCI'] = formState.step1.annualGCI
    if (formState.step1.primaryMarket) formContext['primaryMarket'] = formState.step1.primaryMarket
  }

  // Step 2: technology
  if (formState.step2.primaryCRM) formContext['primaryCRM'] = formState.step2.primaryCRM
  if (formState.step2.crmSatisfaction) formContext['crmSatisfaction'] = `${formState.step2.crmSatisfaction}/5`
  if (formState.step2.toolsUsed?.length) formContext['toolsUsed'] = formState.step2.toolsUsed

  // Step 3: leads
  if (formState.step3.leadSources?.length) formContext['leadSources'] = formState.step3.leadSources
  if (formState.step3.responseSpeed) formContext['leadResponseSpeed'] = formState.step3.responseSpeed
  if (formState.step3.leadTracking) formContext['leadTracking'] = formState.step3.leadTracking
  if (formState.step3.conversionRate) formContext['conversionRate'] = formState.step3.conversionRate
  if (formState.step3.googleReviews) formContext['googleReviews'] = formState.step3.googleReviews
  if (formState.step3.reviewAutomation) formContext['reviewAutomation'] = formState.step3.reviewAutomation
  if (isHS && formState.step3.missedCallHandling) formContext['missedCallHandling'] = formState.step3.missedCallHandling
  if (!isHS && formState.step3.touchesIn7Days) formContext['touchesIn7Days'] = formState.step3.touchesIn7Days
  if (!isHS && formState.step3.leadDistribution) formContext['leadDistribution'] = formState.step3.leadDistribution

  // Step 4: scheduling (HS) / lead management (RE)
  if (isHS) {
    if (formState.step4.schedulingMethod) formContext['schedulingMethod'] = formState.step4.schedulingMethod
    if (formState.step4.dispatchMethod) formContext['dispatchMethod'] = formState.step4.dispatchMethod
    if (formState.step4.routeOptimization) formContext['routeOptimization'] = formState.step4.routeOptimization
    if (formState.step4.capacityPlanning) formContext['capacityPlanning'] = formState.step4.capacityPlanning
  } else {
    if (formState.step4.followUpPlan) formContext['followUpPlan'] = formState.step4.followUpPlan
    if (formState.step4.nurtureDuration) formContext['nurtureDuration'] = formState.step4.nurtureDuration
    if (formState.step4.automatedDrip) formContext['automatedDrip'] = formState.step4.automatedDrip
    if (formState.step4.leadTemperatureTracking) formContext['leadTemperatureTracking'] = formState.step4.leadTemperatureTracking
    if (formState.step4.activityLogging) formContext['activityLogging'] = formState.step4.activityLogging
  }

  // Step 5: communication
  if (formState.step5.internalComms) formContext['internalComms'] = formState.step5.internalComms
  if (formState.step5.afterHoursComms) formContext['afterHoursComms'] = formState.step5.afterHoursComms
  if (formState.step5.clientPortal) formContext['clientPortal'] = formState.step5.clientPortal
  if (isHS) {
    if (formState.step5.appointmentReminders) formContext['appointmentReminders'] = formState.step5.appointmentReminders
    if (formState.step5.onTheWayNotifications) formContext['onTheWayNotifications'] = formState.step5.onTheWayNotifications
  } else {
    if (formState.step5.agentClientComms) formContext['agentClientComms'] = formState.step5.agentClientComms
    if (formState.step5.transactionUpdates) formContext['transactionUpdates'] = formState.step5.transactionUpdates
    if (formState.step5.pastClientEngagement) formContext['pastClientEngagement'] = formState.step5.pastClientEngagement
  }

  // Step 6: follow-up & retention
  if (formState.step6.repeatBusinessPercent) formContext['repeatBusinessPercent'] = formState.step6.repeatBusinessPercent
  if (isHS) {
    if (formState.step6.postJobFollowUp) formContext['postJobFollowUp'] = formState.step6.postJobFollowUp
    if (formState.step6.serviceAgreements) formContext['serviceAgreements'] = formState.step6.serviceAgreements
  } else {
    if (formState.step6.postCloseFollowUp) formContext['postCloseFollowUp'] = formState.step6.postCloseFollowUp
    if (formState.step6.referralProcess) formContext['referralProcess'] = formState.step6.referralProcess
    if (formState.step6.anniversaryTracking) formContext['anniversaryTracking'] = formState.step6.anniversaryTracking
  }

  // Step 7: operations
  if (formState.step7.kpisTracked?.length) formContext['kpisTracked'] = formState.step7.kpisTracked
  if (isHS) {
    if (formState.step7.performanceMeasurement) formContext['performanceMeasurement'] = formState.step7.performanceMeasurement
    if (formState.step7.jobCosting) formContext['jobCosting'] = formState.step7.jobCosting
  } else {
    if (formState.step7.agentPerformanceMeasurement) formContext['agentPerformanceMeasurement'] = formState.step7.agentPerformanceMeasurement
    if (formState.step7.agentAccountability) formContext['agentAccountability'] = formState.step7.agentAccountability
    if (formState.step7.transactionWorkflow) formContext['transactionWorkflow'] = formState.step7.transactionWorkflow
  }

  // Step 8: financial
  if (formState.step8.paymentMethods?.length) formContext['paymentMethods'] = formState.step8.paymentMethods
  if (formState.step8.financialReview) formContext['financialReview'] = formState.step8.financialReview
  if (isHS) {
    if (formState.step8.estimateProcess) formContext['estimateProcess'] = formState.step8.estimateProcess
    if (formState.step8.pricingModel) formContext['pricingModel'] = formState.step8.pricingModel
    if (formState.step8.invoiceTiming) formContext['invoiceTiming'] = formState.step8.invoiceTiming
  } else {
    if (formState.step8.expenseTracking) formContext['expenseTracking'] = formState.step8.expenseTracking
    if (formState.step8.marketingBudget) formContext['marketingBudget'] = formState.step8.marketingBudget
  }

  const categoryScoreLines = sortedCategories
    .map(c => `  - ${c.label}: ${c.score}/100`)
    .join('\n')

  const formContextLines = Object.entries(formContext)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `  - ${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
    .join('\n')

  const user = `Generate a personalized business audit report for the following business.

Business: ${businessName}
Niche: ${nicheLabel}
${subNiche ? `Sub-Niche: ${subNiche}\n` : ''}Overall Score: ${overallScore}/100

Category Scores (weakest first):
${categoryScoreLines}

Key Business Context:
${formContextLines}

${techFrustrations ? `Technology Frustrations: ${techFrustrations}` : ''}
${biggestChallenge ? `Biggest Challenge: ${biggestChallenge}` : ''}

Generate the report now as valid JSON only.`

  return { system, user }
}

// --- IP extraction helper ---

function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (!forwarded) return 'unknown'
  return forwarded.split(/\s*,\s*/)[0].trim()
}

// --- Main handler ---

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  let auditId: string | undefined

  try {
    const body = await req.json()
    auditId = body.auditId
    const formState: FormState = body.formState
    const scores: AuditScores = body.scores

    // --- Rate limiting guard (SEC-01) ---
    // Must run BEFORE any Anthropic or Supabase calls to reject abuse early
    const contactEmail: string = body.formState?.step1?.email ?? 'unknown'
    const clientIp = getClientIp(req)

    // Instantiate Redis inside handler (per_worker mode requirement)
    const redis = new Redis({
      url: Deno.env.get('UPSTASH_REDIS_REST_URL')!,
      token: Deno.env.get('UPSTASH_REDIS_REST_TOKEN')!,
    })

    const emailRatelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.fixedWindow(3, '24 h'),
      prefix: 'bizaudit:email',
    })

    const ipRatelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.fixedWindow(10, '24 h'),
      prefix: 'bizaudit:ip',
    })

    // Run both checks in parallel — email is case-sensitive per product decision
    const [emailResult, ipResult] = await Promise.all([
      emailRatelimit.limit(contactEmail),
      ipRatelimit.limit(clientIp),
    ])

    if (!emailResult.success || !ipResult.success) {
      // Use reset timestamp from the check(s) that failed
      const failedResetMs = Math.max(
        emailResult.success ? 0 : emailResult.reset,
        ipResult.success ? 0 : ipResult.reset,
      )
      const hoursRemaining = Math.ceil((failedResetMs - Date.now()) / (1000 * 60 * 60))

      let timeHint: string
      if (hoursRemaining <= 1) {
        timeHint = 'in about 1 hour'
      } else if (hoursRemaining < 20) {
        timeHint = `in about ${hoursRemaining} hours`
      } else {
        timeHint = 'tomorrow'
      }

      // Same message for email and IP — do not reveal which limit triggered
      return new Response(
        JSON.stringify({
          rateLimited: true,
          message: `You've already submitted 3 audits today. Try again ${timeHint}.`,
        }),
        {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }
    // --- End rate limiting guard ---

    // Instantiate clients inside handler (per_worker mode safe)
    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY')!,
      maxRetries: 1,
    })

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Sanitize free-text inputs
    const businessName = sanitizeBusinessName(formState?.step1?.businessName)
    const techFrustrations = sanitizeText(formState?.step2?.techFrustrations, 500)
    const biggestChallenge = sanitizeText(formState?.step8?.biggestChallenge, 500)
    const niche = formState?.niche || 'home_services'

    // Sub-niche: read from request body, resolve to human-readable label
    const subNicheKey: string | null = body.subNiche ?? body.formState?.subNiche ?? null

    // Sub-niche display labels — must stay in sync with SUB_NICHE_REGISTRY in src/config/subNicheConfig.ts
    const SUB_NICHE_LABELS: Record<string, string> = {
      hvac: 'HVAC', plumbing: 'Plumbing', electrical: 'Electrical', garage_doors: 'Garage Doors',
      pest_control: 'Pest Control', landscaping: 'Landscaping', cleaning: 'Cleaning',
      roofing: 'Roofing', painting: 'Painting', general_contracting: 'General Contracting',
      construction: 'Construction', interior_design: 'Interior Design',
      residential_sales: 'Residential Sales', commercial: 'Commercial / Office',
      property_management: 'Property Management', new_construction: 'New Construction',
      luxury_resort: 'Luxury / Resort',
    }
    const subNicheLabel = subNicheKey ? (SUB_NICHE_LABELS[subNicheKey] ?? null) : null

    // Build prompts
    const { system, user } = buildPrompt({
      niche,
      businessName,
      scores,
      formState,
      techFrustrations,
      biggestChallenge,
      subNiche: subNicheLabel,
    })

    // Call Claude Haiku 4.5
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system,
      messages: [{ role: 'user', content: user }],
    })

    // Guard against truncated responses — incomplete JSON is unparseable
    if (message.stop_reason === 'max_tokens') {
      throw new Error('AI response was truncated (max_tokens). Report too long for token limit.')
    }

    // Extract and parse response
    let responseText = (message.content[0] as { type: string; text: string }).text
    // Strip markdown fences if present (Claude sometimes wraps JSON)
    responseText = responseText.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '').trim()

    // Fix literal newlines inside JSON string values (Claude sometimes breaks strings across lines)
    let reportData: Record<string, unknown>
    try {
      reportData = JSON.parse(responseText)
    } catch {
      // Collapse all newlines to spaces and retry — JSON structure doesn't need them
      responseText = responseText.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ')
      reportData = JSON.parse(responseText)
    }

    // Persist AI report for email notifications and future retrieval
    // Must happen BEFORE report_status update — webhook fires on status change
    // and send-notification needs the report data to already exist in audit_reports
    await supabaseAdmin
      .from('audit_reports')
      .upsert({
        audit_id: auditId,
        report: reportData,
      }, { onConflict: 'audit_id' })

    // Update report_status to 'completed' (triggers Database Webhook → send-notification)
    await supabaseAdmin
      .from('audits')
      .update({ report_status: 'completed' })
      .eq('id', auditId)

    return new Response(
      JSON.stringify({ success: true, report: reportData }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    // Best-effort status update to 'failed' — don't throw if this fails
    if (auditId) {
      try {
        const supabaseAdmin = createClient(
          Deno.env.get('SUPABASE_URL')!,
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
        )
        await supabaseAdmin
          .from('audits')
          .update({ report_status: 'failed' })
          .eq('id', auditId)
      } catch (_statusUpdateError) {
        // Intentionally swallowed — status update is best-effort
      }
    }

    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

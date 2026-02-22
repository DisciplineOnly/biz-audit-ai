import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

// --- Types ---

interface CategoryScore {
  category: string
  label: string
  score: number
  weight: number
}

interface AuditScores {
  overall: number
  categories: CategoryScore[]
}

interface AuditRecord {
  id: string
  contact_name: string
  contact_email: string
  contact_phone: string | null
  niche: string
  overall_score: number
  scores: AuditScores | Record<string, unknown>
  form_data: Record<string, unknown>
  report_status: string
  email_status: string
  created_at: string
  language: string | null     // null for legacy audits
  sub_niche: string | null    // null for legacy audits
}

interface WebhookPayload {
  type: 'UPDATE' | 'INSERT' | 'DELETE'
  table: string
  schema: string
  record: AuditRecord
  old_record: Record<string, unknown>
}

interface StrategicRecommendation {
  title: string
  description: string
  roi?: string
  priority?: string
  cta?: string
}

interface AiReport {
  executiveSummary?: string
  gaps?: unknown[]
  quickWins?: unknown[]
  strategicRecommendations?: StrategicRecommendation[]
}

// Language display labels — full names per CONTEXT.md decision
const LANGUAGE_LABELS: Record<string, string> = {
  en: 'English',
  bg: 'Bulgarian',
}

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

// --- Email helpers ---

function getScoreColor(score: number): string {
  if (score < 40) return '#dc2626'   // red
  if (score < 60) return '#ea580c'   // orange
  if (score < 75) return '#ca8a04'   // yellow/amber
  return '#16a34a'                    // green
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function buildCategoryScoresHtml(scores: AuditRecord['scores']): string {
  try {
    const parsed = scores as AuditScores
    const categories = parsed?.categories
    if (!Array.isArray(categories) || categories.length === 0) return ''

    const rows = categories
      .map((cat: CategoryScore) => {
        const color = getScoreColor(cat.score)
        return `
          <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #f0f0f0; font-size: 14px; color: #374151;">${escapeHtml(cat.label)}</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #f0f0f0; font-size: 14px; font-weight: 600; color: ${color}; text-align: right;">${cat.score}/100</td>
          </tr>`
      })
      .join('')

    return `
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-top: 8px;">
        <thead>
          <tr>
            <th style="padding: 8px 12px; background-color: #f9fafb; text-align: left; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e5e7eb;">Category</th>
            <th style="padding: 8px 12px; background-color: #f9fafb; text-align: right; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e5e7eb;">Score</th>
          </tr>
        </thead>
        <tbody>${rows}
        </tbody>
      </table>`
  } catch {
    return ''
  }
}

function buildRecommendationsHtml(aiReport: AiReport | null): string {
  if (!aiReport) return ''
  const recs = aiReport.strategicRecommendations
  if (!Array.isArray(recs) || recs.length === 0) return ''

  const topRecs = recs.slice(0, 3)
  const recItems = topRecs
    .map((rec: StrategicRecommendation, i: number) => `
      <tr>
        <td style="padding: 12px; background-color: #f9fafb; border-radius: 6px; margin-bottom: 8px; display: block;">
          <div style="font-size: 13px; font-weight: 600; color: #111827; margin-bottom: 4px;">${i + 1}. ${escapeHtml(rec.title || '')}</div>
          <div style="font-size: 13px; color: #6b7280; line-height: 1.5;">${escapeHtml(rec.description || '')}</div>
        </td>
      </tr>`)
    .join('<tr><td style="height: 8px;"></td></tr>')

  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-top: 8px;">
      ${recItems}
    </table>`
}

function buildAdminEmailHtml(record: AuditRecord, aiReport: AiReport | null): string {
  const nicheLabel = record.niche === 'home_services' ? 'Home Services' : 'Real Estate'
  const scoreColor = getScoreColor(record.overall_score)
  const reportUrl = `https://bizaudit.epsystems.dev/report/${record.id}`
  const categoryScoresHtml = buildCategoryScoresHtml(record.scores)
  const recommendationsHtml = buildRecommendationsHtml(aiReport)

  const phoneDisplay = record.contact_phone
    ? `<tr><td style="padding: 4px 0; font-size: 14px; color: #6b7280; width: 100px;">Phone</td><td style="padding: 4px 0; font-size: 14px; color: #111827;">${escapeHtml(record.contact_phone)}</td></tr>`
    : ''

  const categorySection = categoryScoresHtml
    ? `
      <!-- Category Scores -->
      <tr>
        <td style="padding: 24px 0 0;">
          <div style="font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em;">Category Scores</div>
          ${categoryScoresHtml}
        </td>
      </tr>`
    : ''

  const recommendationsSection = recommendationsHtml
    ? `
      <!-- AI Recommendations -->
      <tr>
        <td style="padding: 24px 0 0;">
          <div style="font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em;">Top Recommendations</div>
          ${recommendationsHtml}
        </td>
      </tr>`
    : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Audit Submission</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; background-color: #f3f4f6;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <!-- Email container -->
        <table width="600" cellpadding="0" cellspacing="0" style="border-collapse: collapse; max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background-color: #0f172a; padding: 24px 32px;">
              <div style="font-size: 20px; font-weight: 700; color: #ffffff;">BizAudit</div>
              <div style="font-size: 13px; color: #94a3b8; margin-top: 4px;">New Audit Submission</div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">

                <!-- Contact Info -->
                <tr>
                  <td style="padding-bottom: 24px; border-bottom: 1px solid #e5e7eb;">
                    <div style="font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Contact</div>
                    <table cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                      <tr>
                        <td style="padding: 4px 0; font-size: 14px; color: #6b7280; width: 100px;">Name</td>
                        <td style="padding: 4px 0; font-size: 14px; color: #111827; font-weight: 600;">${escapeHtml(record.contact_name)}</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; font-size: 14px; color: #6b7280;">Email</td>
                        <td style="padding: 4px 0; font-size: 14px; color: #111827;">
                          <a href="mailto:${escapeHtml(record.contact_email)}" style="color: #2563eb; text-decoration: none;">${escapeHtml(record.contact_email)}</a>
                        </td>
                      </tr>
                      ${phoneDisplay}
                      <tr>
                        <td style="padding: 4px 0; font-size: 14px; color: #6b7280;">Niche</td>
                        <td style="padding: 4px 0; font-size: 14px; color: #111827;">${escapeHtml(nicheLabel)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Overall Score -->
                <tr>
                  <td style="padding: 24px 0; border-bottom: 1px solid #e5e7eb;">
                    <div style="font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Overall Score</div>
                    <table cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                      <tr>
                        <td>
                          <span style="display: inline-block; background-color: ${scoreColor}; color: #ffffff; font-size: 28px; font-weight: 700; padding: 8px 20px; border-radius: 6px; letter-spacing: -0.5px;">${record.overall_score}/100</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                ${categorySection}

                ${recommendationsSection}

                <!-- CTA Button -->
                <tr>
                  <td style="padding: 32px 0 0;">
                    <table cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                      <tr>
                        <td style="border-radius: 6px; background-color: #0f172a;">
                          <a href="${reportUrl}" style="display: inline-block; padding: 12px 24px; font-size: 14px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 6px;">View Full Report &rarr;</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 16px 32px; border-top: 1px solid #e5e7eb;">
              <div style="font-size: 12px; color: #9ca3af; text-align: center;">Sent by BizAudit notification system &bull; <a href="${reportUrl}" style="color: #9ca3af;">${reportUrl}</a></div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function buildUserEmailHtml(record: AuditRecord, aiReport: AiReport | null): string {
  const nicheLabel = record.niche === 'home_services' ? 'Home Services' : 'Real Estate'
  const scoreColor = getScoreColor(record.overall_score)
  const reportUrl = `https://bizaudit.epsystems.dev/report/${record.id}`
  const categoryScoresHtml = buildCategoryScoresHtml(record.scores)

  // Show executive summary if available
  const summarySection = aiReport?.executiveSummary
    ? `<tr>
        <td style="padding: 24px 0; border-bottom: 1px solid #e5e7eb;">
          <div style="font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em;">Executive Summary</div>
          <div style="font-size: 14px; color: #374151; line-height: 1.6;">${escapeHtml(aiReport.executiveSummary)}</div>
        </td>
      </tr>`
    : ''

  const categorySection = categoryScoresHtml
    ? `<tr>
        <td style="padding: 24px 0 0;">
          <div style="font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em;">Your Category Scores</div>
          ${categoryScoresHtml}
        </td>
      </tr>`
    : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Audit Report is Ready</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; background-color: #f3f4f6;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" style="border-collapse: collapse; max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background-color: #0f172a; padding: 24px 32px;">
              <div style="font-size: 20px; font-weight: 700; color: #ffffff;">BizAudit</div>
              <div style="font-size: 13px; color: #94a3b8; margin-top: 4px;">Your ${escapeHtml(nicheLabel)} Audit Report</div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">

                <!-- Greeting -->
                <tr>
                  <td style="padding-bottom: 24px;">
                    <div style="font-size: 16px; color: #111827; line-height: 1.6;">Hi ${escapeHtml(record.contact_name)},</div>
                    <div style="font-size: 14px; color: #374151; line-height: 1.6; margin-top: 8px;">Your business operations audit is complete. Here are your results:</div>
                  </td>
                </tr>

                <!-- Overall Score -->
                <tr>
                  <td style="padding: 24px 0; border-top: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb;">
                    <div style="font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Overall Score</div>
                    <table cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                      <tr>
                        <td>
                          <span style="display: inline-block; background-color: ${scoreColor}; color: #ffffff; font-size: 28px; font-weight: 700; padding: 8px 20px; border-radius: 6px; letter-spacing: -0.5px;">${record.overall_score}/100</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                ${summarySection}

                ${categorySection}

                <!-- CTA Button -->
                <tr>
                  <td style="padding: 32px 0 0;">
                    <table cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                      <tr>
                        <td style="border-radius: 6px; background-color: #f97316;">
                          <a href="${reportUrl}" style="display: inline-block; padding: 14px 28px; font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 6px;">View Your Full Report &rarr;</a>
                        </td>
                      </tr>
                    </table>
                    <div style="font-size: 13px; color: #6b7280; margin-top: 12px;">Your report is available anytime at the link above.</div>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 16px 32px; border-top: 1px solid #e5e7eb;">
              <div style="font-size: 12px; color: #9ca3af; text-align: center;">Sent by E&amp;P Systems &bull; <a href="https://epsystems.dev" style="color: #9ca3af;">epsystems.dev</a></div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// --- Main handler ---

Deno.serve(async (req: Request) => {
  // Outermost catch — always return 200 to prevent webhook retries
  try {
    // Parse webhook payload
    let payload: WebhookPayload
    try {
      payload = await req.json() as WebhookPayload
    } catch (parseErr) {
      console.error('Failed to parse webhook payload:', (parseErr as Error).message)
      return new Response(JSON.stringify({ skipped: true, reason: 'parse_error' }), { status: 200 })
    }

    const record = payload?.record

    if (!record) {
      console.error('Webhook payload missing record')
      return new Response(JSON.stringify({ skipped: true, reason: 'no_record' }), { status: 200 })
    }

    // Guard: only process when report is completed
    if (record.report_status !== 'completed') {
      return new Response(JSON.stringify({ skipped: true, reason: 'not_completed' }), { status: 200 })
    }

    // Guard: only process if email is still pending (prevents duplicate sends)
    if (record.email_status !== 'pending') {
      return new Response(JSON.stringify({ skipped: true, reason: 'email_not_pending' }), { status: 200 })
    }

    // Instantiate Supabase admin client inside handler (per_worker mode pattern)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Read AI report from audit_reports (may not exist — degrade gracefully)
    let aiReport: AiReport | null = null
    try {
      const { data: reportRow, error: reportError } = await supabaseAdmin
        .from('audit_reports')
        .select('report')
        .eq('audit_id', record.id)
        .single()

      if (reportError) {
        console.error('audit_reports fetch error:', reportError.message)
      } else if (reportRow?.report) {
        aiReport = reportRow.report as AiReport
      }
    } catch (reportFetchErr) {
      console.error('audit_reports fetch failed:', (reportFetchErr as Error).message)
    }

    // Read env vars for email sending
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
    const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL')!

    const nicheLabel = record.niche === 'home_services' ? 'Home Services' : 'Real Estate'

    // Send admin email via Resend
    let emailStatus = 'failed'
    try {
      const htmlBody = buildAdminEmailHtml(record, aiReport)

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'E&P Systems <engineering@epsystems.org>',
          to: [ADMIN_EMAIL],
          subject: `New Audit: ${record.contact_name} — ${nicheLabel} (${record.overall_score}/100)`,
          html: htmlBody,
        }),
      })

      if (!res.ok) {
        const errorBody = await res.text()
        console.error('Resend API error:', res.status, errorBody)
      } else {
        emailStatus = 'sent'
      }
    } catch (emailErr) {
      console.error('Email send failed:', (emailErr as Error).message)
    }

    // Send user email via Resend (EMAIL-02)
    let userEmailSent = false
    if (record.contact_email) {
      try {
        const userHtml = buildUserEmailHtml(record, aiReport)

        const userRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: 'E&P Systems <engineering@epsystems.org>',
            to: [record.contact_email],
            subject: `Your ${nicheLabel} Audit Results — ${record.overall_score}/100`,
            html: userHtml,
          }),
        })

        if (!userRes.ok) {
          const errorBody = await userRes.text()
          console.error('User email Resend error:', userRes.status, errorBody)
        } else {
          userEmailSent = true
        }
      } catch (userEmailErr) {
        console.error('User email send failed:', (userEmailErr as Error).message)
      }
    }

    // Update email_status (best-effort — don't let this failure change the response)
    try {
      await supabaseAdmin
        .from('audits')
        .update({ email_status: emailStatus })
        .eq('id', record.id)
    } catch (statusErr) {
      console.error('email_status update failed:', (statusErr as Error).message)
    }

    return new Response(JSON.stringify({ emailStatus, userEmailSent }), { status: 200 })
  } catch (outerErr) {
    // Catch-all: never return non-200 to the Database Webhook
    console.error('Unhandled error in send-notification:', (outerErr as Error).message)
    return new Response(JSON.stringify({ skipped: true, reason: 'unhandled_error' }), { status: 200 })
  }
})

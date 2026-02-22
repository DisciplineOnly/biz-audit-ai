import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const auditId: string | undefined = body.auditId

    if (!auditId) {
      return new Response(
        JSON.stringify({ error: 'auditId is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Instantiate supabaseAdmin inside handler (per_worker mode requirement)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Query audits table using service_role (bypasses RLS — anon has no SELECT policy)
    const { data: audit, error: auditError } = await supabaseAdmin
      .from('audits')
      .select('id, niche, business_name, form_data, scores, report_status, created_at, language, sub_niche')
      .eq('id', auditId)
      .single()

    if (auditError || !audit) {
      return new Response(
        JSON.stringify({ error: 'not_found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Query audit_reports table for AI report data
    const { data: reportRow } = await supabaseAdmin
      .from('audit_reports')
      .select('report')
      .eq('audit_id', auditId)
      .single()

    return new Response(
      JSON.stringify({
        audit,
        aiReport: reportRow?.report ?? null,
        reportStatus: audit.report_status,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

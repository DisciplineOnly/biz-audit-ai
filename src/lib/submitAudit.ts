import { supabase } from '@/lib/supabase'
import type { AuditFormState, AuditScores } from '@/types/audit'

export async function submitAudit(
  formState: AuditFormState,
  scores: AuditScores
): Promise<string> {
  const { data, error } = await supabase
    .from('audits')
    .insert({
      niche: formState.niche,
      business_name: formState.step1.businessName,
      contact_name: formState.step1.contactName,
      contact_email: formState.step1.email,
      contact_phone: formState.step1.phone ?? null,
      partner_code: formState.partnerCode ?? null,
      overall_score: scores.overall,
      form_data: formState,
      scores: scores,
    })
    .select('id')
    .single()

  if (error) {
    throw new Error(`Audit submission failed: ${error.message}`)
  }

  return data.id
}

import { supabase } from "@/lib/supabase";
import type { AuditFormState, AuditScores } from "@/types/audit";

// Client-generated UUID pattern: generate the UUID here, include it in the INSERT body,
// then return it directly without needing to SELECT it back.
//
// Why not use .select('id').single() after insert?
// The anon role has no SELECT policy on audits (SEC-02 compliance: anon reads return 0 rows).
// PostgREST's return=representation triggers a SELECT after INSERT, which RLS blocks.
// Generating the UUID client-side avoids this entirely - no extra round-trip needed.
export async function submitAudit(
  formState: AuditFormState,
  scores: AuditScores,
  language: string,
): Promise<string> {
  const id = crypto.randomUUID();

  const { error } = await supabase.from("audits").insert({
    id,
    niche: formState.niche,
    business_name: formState.step1.businessName,
    contact_name: formState.step1.contactName,
    contact_email: formState.step1.email,
    contact_phone: formState.step1.phone ?? null,
    partner_code: formState.partnerCode ?? null,
    overall_score: scores.overall,
    form_data: formState,
    scores: scores,
    language,
    sub_niche: formState.subNiche ?? null,
  });

  if (error) {
    throw new Error(`Audit submission failed: ${error.message}`);
  }

  return id;
}

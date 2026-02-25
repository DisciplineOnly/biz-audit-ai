import { supabase } from "@/lib/supabase";
import { FunctionsHttpError } from "@supabase/supabase-js";
import type { AuditFormState, AuditScores, AIReportData } from "@/types/audit";

export interface FetchReportResult {
  audit: {
    id: string;
    niche: string;
    business_name: string;
    form_data: AuditFormState;
    scores: AuditScores;
    report_status: "pending" | "completed" | "failed";
    created_at: string;
    language: string | null; // null for legacy audits (no backfill)
    sub_niche: string | null; // null for legacy audits (no backfill)
  };
  aiReport: AIReportData | null;
  reportStatus: "pending" | "completed" | "failed";
}

export async function fetchReport(auditId: string): Promise<FetchReportResult> {
  const { data, error } = await supabase.functions.invoke("fetch-report", {
    body: { auditId },
  });

  if (error) {
    if (error instanceof FunctionsHttpError) {
      // 404 - audit not found
      const errorBody = await error.context.json();
      if (errorBody?.error === "not_found") {
        throw new Error("not_found");
      }
    }
    throw new Error(error.message || "Failed to fetch report");
  }

  return data as FetchReportResult;
}

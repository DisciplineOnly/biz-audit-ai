-- Add email_status column to audits table for notification tracking
-- Values: pending (default) | sent | failed
-- 'partial' excluded — only admin email is sent in Phase 3
ALTER TABLE public.audits
  ADD COLUMN email_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (email_status IN ('pending', 'sent', 'failed'));

-- Create audit_reports table to store AI-generated report content
-- Required by send-notification edge function (Plan 02) to read report data
-- when the Database Webhook fires on report_status change to 'completed'
CREATE TABLE public.audit_reports (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id   UUID        NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
  report     JSONB       NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(audit_id)
);

-- Enable RLS at creation time (CVE-2025-48757 precedent: never add RLS later)
ALTER TABLE public.audit_reports ENABLE ROW LEVEL SECURITY;

-- No RLS policies for anon = zero anon access (same pattern as audits table)
-- Service role bypasses RLS automatically — edge functions use service_role key
-- No explicit policy needed for service role reads/writes

CREATE TABLE public.audits (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  niche         TEXT        NOT NULL CHECK (niche IN ('home_services', 'real_estate')),
  business_name TEXT        NOT NULL,
  contact_name  TEXT        NOT NULL,
  contact_email TEXT        NOT NULL,
  contact_phone TEXT,
  partner_code  TEXT,
  overall_score INTEGER     NOT NULL CHECK (overall_score BETWEEN 0 AND 100),
  form_data     JSONB       NOT NULL,
  scores        JSONB       NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS at creation time (CVE-2025-48757 precedent: never add RLS later)
ALTER TABLE public.audits ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to insert audit submissions
CREATE POLICY "anon_can_insert_audits"
ON public.audits
FOR INSERT
TO anon
WITH CHECK (true);

-- No SELECT policy for anon = reads return zero rows (SEC-02 compliant)
-- No UPDATE or DELETE policies = those operations blocked for all roles

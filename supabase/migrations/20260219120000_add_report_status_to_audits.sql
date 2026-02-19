ALTER TABLE public.audits
  ADD COLUMN report_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (report_status IN ('pending', 'completed', 'failed'));

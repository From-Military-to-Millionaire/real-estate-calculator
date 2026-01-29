-- Track which app version created/last updated each analysis.
-- This is essential for beta testing: if a beta build introduces a
-- calculation change, we can identify which deals were saved under
-- that version and re-validate them after feedback.
ALTER TABLE public.property_analyses
  ADD COLUMN IF NOT EXISTS app_version TEXT DEFAULT '1.0.0';

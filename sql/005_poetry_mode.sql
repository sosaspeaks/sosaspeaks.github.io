-- ============================================================================
-- SosaSpeaks Migration 005 — Poetry Formatting Mode (post_type = 'poetry')
-- Run once in Supabase Dashboard -> SQL Editor
-- ============================================================================

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.articles'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%post_type%'
  LOOP
    EXECUTE format('ALTER TABLE public.articles DROP CONSTRAINT IF EXISTS %I', r.conname);
  END LOOP;
END $$;

ALTER TABLE public.articles
  ADD CONSTRAINT articles_post_type_check
  CHECK (post_type IN ('standard', 'sosa-study', 'poetry'));

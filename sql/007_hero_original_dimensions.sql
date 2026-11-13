-- ============================================================================
-- SosaSpeaks Migration 007 — Original Hero Image Dimensions (0px Border Radius)
-- Run once in Supabase Dashboard -> SQL Editor
-- ============================================================================

ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS hero_original_dimensions BOOLEAN NOT NULL DEFAULT false;

-- ============================================================================
-- SosaSpeaks Migration 006 — Optional Hero Image Color Tinting
-- Run once in Supabase Dashboard -> SQL Editor
-- ============================================================================

ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS hero_tint_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS hero_tint_color TEXT;

-- ============================================================================
-- SosaSpins Migration 014 — Add dedicated City column to artist_profiles
-- Run once in Supabase Dashboard -> SQL Editor
-- ============================================================================

ALTER TABLE public.artist_profiles
ADD COLUMN IF NOT EXISTS city TEXT;

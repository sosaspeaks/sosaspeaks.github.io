-- ============================================================================
-- SosaSpins Migration 008 — Scenes & Movements Dual Tag Fields
-- Run once in Supabase Dashboard -> SQL Editor
-- ============================================================================

ALTER TABLE public.spins
  ADD COLUMN IF NOT EXISTS scenes TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS movements TEXT[] DEFAULT '{}';

ALTER TABLE public.challenge_backlog
  ADD COLUMN IF NOT EXISTS scenes TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS movements TEXT[] DEFAULT '{}';

ALTER TABLE public.top_albums
  ADD COLUMN IF NOT EXISTS scenes TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS movements TEXT[] DEFAULT '{}';

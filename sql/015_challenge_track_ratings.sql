-- ============================================================================
-- SosaSpins Migration 015 — Challenge Backlog Tracklist & Track Ratings
-- Run once in Supabase Dashboard -> SQL Editor (idempotent)
-- ============================================================================

ALTER TABLE public.challenge_backlog
  ADD COLUMN IF NOT EXISTS track_ratings JSONB DEFAULT '[]'::jsonb;

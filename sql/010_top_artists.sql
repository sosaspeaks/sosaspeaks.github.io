-- ============================================================================
-- SosaSpins Migration 010 — Curated Top Artists Table
-- Run once in Supabase Dashboard -> SQL Editor
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.top_artists (
  rank INTEGER PRIMARY KEY,
  artist TEXT NOT NULL,
  custom_image TEXT,
  top_album_title TEXT,
  top_album_cover TEXT,
  top_album_rating TEXT,
  avg_rating TEXT,
  spins_count INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON TABLE public.top_artists TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.top_artists TO authenticated;

ALTER TABLE public.top_artists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view top_artists" ON public.top_artists;
CREATE POLICY "Public can view top_artists"
ON public.top_artists FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage top_artists" ON public.top_artists;
CREATE POLICY "Authenticated users can manage top_artists"
ON public.top_artists FOR ALL
TO authenticated
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

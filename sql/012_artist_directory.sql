-- ============================================================================
-- SosaSpins Migration 012 — Artist Directory & Structured Metadata Profiles
-- Run once in Supabase Dashboard -> SQL Editor
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.artist_profiles (
  canonical_artist TEXT PRIMARY KEY,
  native_name TEXT,
  aliases TEXT[] NOT NULL DEFAULT '{}',
  member_of TEXT[] NOT NULL DEFAULT '{}',
  members TEXT[] NOT NULL DEFAULT '{}',
  artist_kind TEXT,
  active_years TEXT,
  country TEXT,
  state_province TEXT,
  portrait_url TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON TABLE public.artist_profiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.artist_profiles TO authenticated;

ALTER TABLE public.artist_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view artist_profiles" ON public.artist_profiles;
CREATE POLICY "Public can view artist_profiles"
ON public.artist_profiles FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage artist_profiles" ON public.artist_profiles;
CREATE POLICY "Authenticated users can manage artist_profiles"
ON public.artist_profiles FOR ALL
TO authenticated
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

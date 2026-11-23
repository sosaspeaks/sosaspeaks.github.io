-- ============================================================================
-- SosaSpins Migration 016 — Song of the Day Calendar
-- Run once in Supabase Dashboard -> SQL Editor
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.song_of_the_day (
  entry_date DATE PRIMARY KEY,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  album TEXT,
  release_year INT4,
  cover_url TEXT,
  audio_url TEXT,
  note TEXT,
  spin_id INT8 REFERENCES public.spins(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_song_of_the_day_date_desc
  ON public.song_of_the_day (entry_date DESC);

CREATE OR REPLACE FUNCTION public.set_sotd_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sotd_updated_at ON public.song_of_the_day;
CREATE TRIGGER trg_sotd_updated_at
  BEFORE UPDATE ON public.song_of_the_day
  FOR EACH ROW
  EXECUTE FUNCTION public.set_sotd_updated_at();

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON TABLE public.song_of_the_day TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.song_of_the_day TO authenticated;

ALTER TABLE public.song_of_the_day ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view song_of_the_day" ON public.song_of_the_day;
CREATE POLICY "Public can view song_of_the_day"
ON public.song_of_the_day FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage song_of_the_day" ON public.song_of_the_day;
CREATE POLICY "Authenticated users can manage song_of_the_day"
ON public.song_of_the_day FOR ALL
TO authenticated
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

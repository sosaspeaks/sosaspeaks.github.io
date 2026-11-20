-- ============================================================================
-- SosaSpins Migration 011 — Public "artists" Storage Bucket & RLS Policies
-- Run once in Supabase Dashboard -> SQL Editor
-- ============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('artists', 'artists', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public read artists" ON storage.objects;
CREATE POLICY "Public read artists"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'artists');

DROP POLICY IF EXISTS "Authenticated upload artists" ON storage.objects;
CREATE POLICY "Authenticated upload artists"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'artists');

DROP POLICY IF EXISTS "Authenticated update artists" ON storage.objects;
CREATE POLICY "Authenticated update artists"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'artists')
WITH CHECK (bucket_id = 'artists');

DROP POLICY IF EXISTS "Authenticated delete artists" ON storage.objects;
CREATE POLICY "Authenticated delete artists"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'artists');

-- Ensure authenticated admins can list/read and delete legacy artist_* objects
-- in the covers bucket during migration to the artists bucket
DROP POLICY IF EXISTS "Authenticated read legacy artist objects in covers" ON storage.objects;
CREATE POLICY "Authenticated read legacy artist objects in covers"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'covers' AND (name LIKE 'artist_%' OR name LIKE 'artists/%'));

DROP POLICY IF EXISTS "Authenticated delete legacy artist objects in covers" ON storage.objects;
CREATE POLICY "Authenticated delete legacy artist objects in covers"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'covers' AND (name LIKE 'artist_%' OR name LIKE 'artists/%'));

-- Phase 3: Migrate stored image URLs from Supabase Storage to Cloudflare R2 (https://assets.sosaspeaks.org/)
-- Run this in Supabase SQL Editor ONLY AFTER scripts/upload_to_r2_wrangler.mjs succeeds
-- and sample URLs at https://assets.sosaspeaks.org/covers/... & /artists/... return HTTP 200.

BEGIN;

-- 1. spins.cover_url
UPDATE public.spins
SET cover_url = REPLACE(
  REPLACE(
    cover_url,
    'https://gxgfuomkjrhixcjfvhvj.supabase.co/storage/v1/object/public/covers/',
    'https://assets.sosaspeaks.org/covers/'
  ),
  'https://gxgfuomkjrhixcjfvhvj.supabase.co/storage/v1/object/public/artists/',
  'https://assets.sosaspeaks.org/artists/'
)
WHERE cover_url LIKE 'https://gxgfuomkjrhixcjfvhvj.supabase.co/storage/v1/object/public/%';

-- 2. challenge_backlog.cover_url
UPDATE public.challenge_backlog
SET cover_url = REPLACE(
  REPLACE(
    cover_url,
    'https://gxgfuomkjrhixcjfvhvj.supabase.co/storage/v1/object/public/covers/',
    'https://assets.sosaspeaks.org/covers/'
  ),
  'https://gxgfuomkjrhixcjfvhvj.supabase.co/storage/v1/object/public/artists/',
  'https://assets.sosaspeaks.org/artists/'
)
WHERE cover_url LIKE 'https://gxgfuomkjrhixcjfvhvj.supabase.co/storage/v1/object/public/%';

-- 3. top_albums.cover_url
UPDATE public.top_albums
SET cover_url = REPLACE(
  REPLACE(
    cover_url,
    'https://gxgfuomkjrhixcjfvhvj.supabase.co/storage/v1/object/public/covers/',
    'https://assets.sosaspeaks.org/covers/'
  ),
  'https://gxgfuomkjrhixcjfvhvj.supabase.co/storage/v1/object/public/artists/',
  'https://assets.sosaspeaks.org/artists/'
)
WHERE cover_url LIKE 'https://gxgfuomkjrhixcjfvhvj.supabase.co/storage/v1/object/public/%';

-- 4. top_artists.custom_image & top_artists.top_album_cover
UPDATE public.top_artists
SET
  custom_image = CASE
    WHEN custom_image LIKE 'https://gxgfuomkjrhixcjfvhvj.supabase.co/storage/v1/object/public/%'
    THEN REPLACE(
      REPLACE(
        custom_image,
        'https://gxgfuomkjrhixcjfvhvj.supabase.co/storage/v1/object/public/covers/',
        'https://assets.sosaspeaks.org/covers/'
      ),
      'https://gxgfuomkjrhixcjfvhvj.supabase.co/storage/v1/object/public/artists/',
      'https://assets.sosaspeaks.org/artists/'
    )
    ELSE custom_image
  END,
  top_album_cover = CASE
    WHEN top_album_cover LIKE 'https://gxgfuomkjrhixcjfvhvj.supabase.co/storage/v1/object/public/%'
    THEN REPLACE(
      REPLACE(
        top_album_cover,
        'https://gxgfuomkjrhixcjfvhvj.supabase.co/storage/v1/object/public/covers/',
        'https://assets.sosaspeaks.org/covers/'
      ),
      'https://gxgfuomkjrhixcjfvhvj.supabase.co/storage/v1/object/public/artists/',
      'https://assets.sosaspeaks.org/artists/'
    )
    ELSE top_album_cover
  END
WHERE custom_image LIKE 'https://gxgfuomkjrhixcjfvhvj.supabase.co/storage/v1/object/public/%'
   OR top_album_cover LIKE 'https://gxgfuomkjrhixcjfvhvj.supabase.co/storage/v1/object/public/%';

-- 5. artist_profiles.portrait_url (if sql/012_artist_directory.sql is applied)
DO $$
BEGIN
  IF to_regclass('public.artist_profiles') IS NOT NULL THEN
    UPDATE public.artist_profiles
    SET portrait_url = REPLACE(
      REPLACE(
        portrait_url,
        'https://gxgfuomkjrhixcjfvhvj.supabase.co/storage/v1/object/public/covers/',
        'https://assets.sosaspeaks.org/covers/'
      ),
      'https://gxgfuomkjrhixcjfvhvj.supabase.co/storage/v1/object/public/artists/',
      'https://assets.sosaspeaks.org/artists/'
    )
    WHERE portrait_url LIKE 'https://gxgfuomkjrhixcjfvhvj.supabase.co/storage/v1/object/public/%';
  END IF;
END $$;

COMMIT;

-- Verification: all rows should report 0 remaining Supabase storage URLs
SELECT 'spins' AS tbl, COUNT(*) AS remaining FROM public.spins WHERE cover_url LIKE '%supabase.co/storage%'
UNION ALL
SELECT 'challenge_backlog', COUNT(*) FROM public.challenge_backlog WHERE cover_url LIKE '%supabase.co/storage%'
UNION ALL
SELECT 'top_albums', COUNT(*) FROM public.top_albums WHERE cover_url LIKE '%supabase.co/storage%'
UNION ALL
SELECT 'top_artists_custom', COUNT(*) FROM public.top_artists WHERE custom_image LIKE '%supabase.co/storage%'
UNION ALL
SELECT 'top_artists_album', COUNT(*) FROM public.top_artists WHERE top_album_cover LIKE '%supabase.co/storage%';

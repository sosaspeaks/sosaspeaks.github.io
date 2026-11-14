-- ============================================================================
-- SosaSpins Migration 009 — Backfill Scenes & Movements from Genres
-- Prerequisites: Run sql/008_scenes_and_movements.sql (and top_albums columns)
-- Run once in Supabase Dashboard -> SQL Editor (idempotent)
--
-- Scenes (19):
--   Southern Hip Hop, West Coast Hip Hop, East Coast Hip Hop, Midwest Hip Hop,
--   DMV Hip Hop, UK Hip Hop, South Florida SoundCloud Rap,
--   New Brunswick Basement Scene, Bristol Sound, Louisville Sound,
--   San Diego Sound, Detroit Sound, Houston Sound, Minneapolis Sound,
--   Nashville Sound, Palm Desert Scene, Shibuya-kei, Shimokita-kei, Mandopop
--
-- Movements (10):
--   Afrofuturism, Beijing New Sound, New Rave, Hauntology,
--   Indie Sleaze Revival, Furry Music, Seapunk, Scene, RABM, New Romantic
-- ============================================================================

BEGIN;

-- 1. Move matching tags from public.spins (jsonb genres/secondary_genres -> text[] scenes/movements)
UPDATE public.spins AS s
SET
  scenes = COALESCE((
    SELECT array_agg(val ORDER BY first_ord)
    FROM (
      SELECT val, MIN(ord) AS first_ord
      FROM unnest(
        COALESCE(s.scenes, '{}'::text[])
        || COALESCE((
          SELECT array_agg(elem ORDER BY idx)
          FROM (
            SELECT trim(elem) AS elem, idx
            FROM jsonb_array_elements_text(
              CASE WHEN jsonb_typeof(s.genres) = 'array' THEN s.genres ELSE '[]'::jsonb END
            ) WITH ORDINALITY AS g(elem, idx)
            UNION ALL
            SELECT trim(elem) AS elem, 10000 + idx AS idx
            FROM jsonb_array_elements_text(
              CASE WHEN jsonb_typeof(s.secondary_genres) = 'array' THEN s.secondary_genres ELSE '[]'::jsonb END
            ) WITH ORDINALITY AS sg(elem, idx)
          ) raw_s
          WHERE elem = ANY(ARRAY[
            'Southern Hip Hop', 'West Coast Hip Hop', 'East Coast Hip Hop', 'Midwest Hip Hop',
            'DMV Hip Hop', 'UK Hip Hop', 'South Florida SoundCloud Rap',
            'New Brunswick Basement Scene', 'Bristol Sound', 'Louisville Sound',
            'San Diego Sound', 'Detroit Sound', 'Houston Sound', 'Minneapolis Sound',
            'Nashville Sound', 'Palm Desert Scene', 'Shibuya-kei', 'Shimokita-kei', 'Mandopop'
          ])
        ), '{}'::text[])
      ) WITH ORDINALITY AS merged_s(val, ord)
      WHERE COALESCE(trim(val), '') <> ''
      GROUP BY val
    ) dedup_s
  ), '{}'::text[]),

  movements = COALESCE((
    SELECT array_agg(val ORDER BY first_ord)
    FROM (
      SELECT val, MIN(ord) AS first_ord
      FROM unnest(
        COALESCE(s.movements, '{}'::text[])
        || COALESCE((
          SELECT array_agg(elem ORDER BY idx)
          FROM (
            SELECT trim(elem) AS elem, idx
            FROM jsonb_array_elements_text(
              CASE WHEN jsonb_typeof(s.genres) = 'array' THEN s.genres ELSE '[]'::jsonb END
            ) WITH ORDINALITY AS g(elem, idx)
            UNION ALL
            SELECT trim(elem) AS elem, 10000 + idx AS idx
            FROM jsonb_array_elements_text(
              CASE WHEN jsonb_typeof(s.secondary_genres) = 'array' THEN s.secondary_genres ELSE '[]'::jsonb END
            ) WITH ORDINALITY AS sg(elem, idx)
          ) raw_m
          WHERE elem = ANY(ARRAY[
            'Afrofuturism', 'Beijing New Sound', 'New Rave', 'Hauntology',
            'Indie Sleaze Revival', 'Furry Music', 'Seapunk', 'Scene', 'RABM', 'New Romantic'
          ])
        ), '{}'::text[])
      ) WITH ORDINALITY AS merged_m(val, ord)
      WHERE COALESCE(trim(val), '') <> ''
      GROUP BY val
    ) dedup_m
  ), '{}'::text[]),

  genres = CASE
    WHEN jsonb_typeof(s.genres) = 'array' THEN COALESCE((
      SELECT jsonb_agg(to_jsonb(elem) ORDER BY idx)
      FROM jsonb_array_elements_text(s.genres) WITH ORDINALITY AS g(elem, idx)
      WHERE trim(elem) <> ALL(ARRAY[
        'Southern Hip Hop', 'West Coast Hip Hop', 'East Coast Hip Hop', 'Midwest Hip Hop',
        'DMV Hip Hop', 'UK Hip Hop', 'South Florida SoundCloud Rap',
        'New Brunswick Basement Scene', 'Bristol Sound', 'Louisville Sound',
        'San Diego Sound', 'Detroit Sound', 'Houston Sound', 'Minneapolis Sound',
        'Nashville Sound', 'Palm Desert Scene', 'Shibuya-kei', 'Shimokita-kei', 'Mandopop',
        'Afrofuturism', 'Beijing New Sound', 'New Rave', 'Hauntology',
        'Indie Sleaze Revival', 'Furry Music', 'Seapunk', 'Scene', 'RABM', 'New Romantic'
      ])
    ), '[]'::jsonb)
    ELSE s.genres
  END,

  secondary_genres = CASE
    WHEN jsonb_typeof(s.secondary_genres) = 'array' THEN COALESCE((
      SELECT jsonb_agg(to_jsonb(elem) ORDER BY idx)
      FROM jsonb_array_elements_text(s.secondary_genres) WITH ORDINALITY AS sg(elem, idx)
      WHERE trim(elem) <> ALL(ARRAY[
        'Southern Hip Hop', 'West Coast Hip Hop', 'East Coast Hip Hop', 'Midwest Hip Hop',
        'DMV Hip Hop', 'UK Hip Hop', 'South Florida SoundCloud Rap',
        'New Brunswick Basement Scene', 'Bristol Sound', 'Louisville Sound',
        'San Diego Sound', 'Detroit Sound', 'Houston Sound', 'Minneapolis Sound',
        'Nashville Sound', 'Palm Desert Scene', 'Shibuya-kei', 'Shimokita-kei', 'Mandopop',
        'Afrofuturism', 'Beijing New Sound', 'New Rave', 'Hauntology',
        'Indie Sleaze Revival', 'Furry Music', 'Seapunk', 'Scene', 'RABM', 'New Romantic'
      ])
    ), '[]'::jsonb)
    ELSE s.secondary_genres
  END

WHERE EXISTS (
  SELECT 1
  FROM (
    SELECT jsonb_array_elements_text(
      CASE WHEN jsonb_typeof(s.genres) = 'array' THEN s.genres ELSE '[]'::jsonb END
    ) AS elem
    UNION ALL
    SELECT jsonb_array_elements_text(
      CASE WHEN jsonb_typeof(s.secondary_genres) = 'array' THEN s.secondary_genres ELSE '[]'::jsonb END
    ) AS elem
  ) chk
  WHERE trim(chk.elem) = ANY(ARRAY[
    'Southern Hip Hop', 'West Coast Hip Hop', 'East Coast Hip Hop', 'Midwest Hip Hop',
    'DMV Hip Hop', 'UK Hip Hop', 'South Florida SoundCloud Rap',
    'New Brunswick Basement Scene', 'Bristol Sound', 'Louisville Sound',
    'San Diego Sound', 'Detroit Sound', 'Houston Sound', 'Minneapolis Sound',
    'Nashville Sound', 'Palm Desert Scene', 'Shibuya-kei', 'Shimokita-kei', 'Mandopop',
    'Afrofuturism', 'Beijing New Sound', 'New Rave', 'Hauntology',
    'Indie Sleaze Revival', 'Furry Music', 'Seapunk', 'Scene', 'RABM', 'New Romantic'
  ])
);


-- 2. Move matching tags from public.challenge_backlog (text[] genres/secondary_genres -> text[] scenes/movements)
UPDATE public.challenge_backlog AS cb
SET
  scenes = COALESCE((
    SELECT array_agg(val ORDER BY first_ord)
    FROM (
      SELECT val, MIN(ord) AS first_ord
      FROM unnest(
        COALESCE(cb.scenes, '{}'::text[])
        || COALESCE((
          SELECT array_agg(elem ORDER BY idx)
          FROM (
            SELECT trim(elem) AS elem, idx
            FROM unnest(COALESCE(cb.genres, '{}'::text[])) WITH ORDINALITY AS g(elem, idx)
            UNION ALL
            SELECT trim(elem) AS elem, 10000 + idx AS idx
            FROM unnest(COALESCE(cb.secondary_genres, '{}'::text[])) WITH ORDINALITY AS sg(elem, idx)
          ) raw_s
          WHERE elem = ANY(ARRAY[
            'Southern Hip Hop', 'West Coast Hip Hop', 'East Coast Hip Hop', 'Midwest Hip Hop',
            'DMV Hip Hop', 'UK Hip Hop', 'South Florida SoundCloud Rap',
            'New Brunswick Basement Scene', 'Bristol Sound', 'Louisville Sound',
            'San Diego Sound', 'Detroit Sound', 'Houston Sound', 'Minneapolis Sound',
            'Nashville Sound', 'Palm Desert Scene', 'Shibuya-kei', 'Shimokita-kei', 'Mandopop'
          ])
        ), '{}'::text[])
      ) WITH ORDINALITY AS merged_s(val, ord)
      WHERE COALESCE(trim(val), '') <> ''
      GROUP BY val
    ) dedup_s
  ), '{}'::text[]),

  movements = COALESCE((
    SELECT array_agg(val ORDER BY first_ord)
    FROM (
      SELECT val, MIN(ord) AS first_ord
      FROM unnest(
        COALESCE(cb.movements, '{}'::text[])
        || COALESCE((
          SELECT array_agg(elem ORDER BY idx)
          FROM (
            SELECT trim(elem) AS elem, idx
            FROM unnest(COALESCE(cb.genres, '{}'::text[])) WITH ORDINALITY AS g(elem, idx)
            UNION ALL
            SELECT trim(elem) AS elem, 10000 + idx AS idx
            FROM unnest(COALESCE(cb.secondary_genres, '{}'::text[])) WITH ORDINALITY AS sg(elem, idx)
          ) raw_m
          WHERE elem = ANY(ARRAY[
            'Afrofuturism', 'Beijing New Sound', 'New Rave', 'Hauntology',
            'Indie Sleaze Revival', 'Furry Music', 'Seapunk', 'Scene', 'RABM', 'New Romantic'
          ])
        ), '{}'::text[])
      ) WITH ORDINALITY AS merged_m(val, ord)
      WHERE COALESCE(trim(val), '') <> ''
      GROUP BY val
    ) dedup_m
  ), '{}'::text[]),

  genres = COALESCE((
    SELECT array_agg(elem ORDER BY idx)
    FROM unnest(COALESCE(cb.genres, '{}'::text[])) WITH ORDINALITY AS g(elem, idx)
    WHERE trim(elem) <> ALL(ARRAY[
      'Southern Hip Hop', 'West Coast Hip Hop', 'East Coast Hip Hop', 'Midwest Hip Hop',
      'DMV Hip Hop', 'UK Hip Hop', 'South Florida SoundCloud Rap',
      'New Brunswick Basement Scene', 'Bristol Sound', 'Louisville Sound',
      'San Diego Sound', 'Detroit Sound', 'Houston Sound', 'Minneapolis Sound',
      'Nashville Sound', 'Palm Desert Scene', 'Shibuya-kei', 'Shimokita-kei', 'Mandopop',
      'Afrofuturism', 'Beijing New Sound', 'New Rave', 'Hauntology',
      'Indie Sleaze Revival', 'Furry Music', 'Seapunk', 'Scene', 'RABM', 'New Romantic'
    ])
  ), '{}'::text[]),

  secondary_genres = COALESCE((
    SELECT array_agg(elem ORDER BY idx)
    FROM unnest(COALESCE(cb.secondary_genres, '{}'::text[])) WITH ORDINALITY AS sg(elem, idx)
    WHERE trim(elem) <> ALL(ARRAY[
      'Southern Hip Hop', 'West Coast Hip Hop', 'East Coast Hip Hop', 'Midwest Hip Hop',
      'DMV Hip Hop', 'UK Hip Hop', 'South Florida SoundCloud Rap',
      'New Brunswick Basement Scene', 'Bristol Sound', 'Louisville Sound',
      'San Diego Sound', 'Detroit Sound', 'Houston Sound', 'Minneapolis Sound',
      'Nashville Sound', 'Palm Desert Scene', 'Shibuya-kei', 'Shimokita-kei', 'Mandopop',
      'Afrofuturism', 'Beijing New Sound', 'New Rave', 'Hauntology',
      'Indie Sleaze Revival', 'Furry Music', 'Seapunk', 'Scene', 'RABM', 'New Romantic'
    ])
  ), '{}'::text[])

WHERE EXISTS (
  SELECT 1
  FROM (
    SELECT unnest(COALESCE(cb.genres, '{}'::text[])) AS elem
    UNION ALL
    SELECT unnest(COALESCE(cb.secondary_genres, '{}'::text[])) AS elem
  ) chk
  WHERE trim(chk.elem) = ANY(ARRAY[
    'Southern Hip Hop', 'West Coast Hip Hop', 'East Coast Hip Hop', 'Midwest Hip Hop',
    'DMV Hip Hop', 'UK Hip Hop', 'South Florida SoundCloud Rap',
    'New Brunswick Basement Scene', 'Bristol Sound', 'Louisville Sound',
    'San Diego Sound', 'Detroit Sound', 'Houston Sound', 'Minneapolis Sound',
    'Nashville Sound', 'Palm Desert Scene', 'Shibuya-kei', 'Shimokita-kei', 'Mandopop',
    'Afrofuturism', 'Beijing New Sound', 'New Rave', 'Hauntology',
    'Indie Sleaze Revival', 'Furry Music', 'Seapunk', 'Scene', 'RABM', 'New Romantic'
  ])
);


-- 3A. Sync public.top_albums linked via spin_id
UPDATE public.top_albums AS ta
SET
  scenes = COALESCE((
    SELECT array_agg(val ORDER BY first_ord)
    FROM (
      SELECT val, MIN(ord) AS first_ord
      FROM unnest(COALESCE(ta.scenes, '{}'::text[]) || COALESCE(s.scenes, '{}'::text[])) WITH ORDINALITY AS m(val, ord)
      WHERE COALESCE(trim(val), '') <> ''
      GROUP BY val
    ) d
  ), '{}'::text[]),
  movements = COALESCE((
    SELECT array_agg(val ORDER BY first_ord)
    FROM (
      SELECT val, MIN(ord) AS first_ord
      FROM unnest(COALESCE(ta.movements, '{}'::text[]) || COALESCE(s.movements, '{}'::text[])) WITH ORDINALITY AS m(val, ord)
      WHERE COALESCE(trim(val), '') <> ''
      GROUP BY val
    ) d
  ), '{}'::text[])
FROM public.spins AS s
WHERE ta.spin_id = s.id
  AND (
    COALESCE(array_length(s.scenes, 1), 0) > 0
    OR COALESCE(array_length(s.movements, 1), 0) > 0
  );


-- 3B. Fallback sync for public.top_albums rows without spin_id (match artist + title across spins)
UPDATE public.top_albums AS ta
SET
  scenes = COALESCE((
    SELECT array_agg(val ORDER BY first_ord)
    FROM (
      SELECT val, MIN(ord) AS first_ord
      FROM unnest(
        COALESCE(ta.scenes, '{}'::text[])
        || COALESCE((
          SELECT array_agg(sc)
          FROM public.spins s
          CROSS JOIN LATERAL unnest(COALESCE(s.scenes, '{}'::text[])) AS sc
          WHERE lower(trim(s.artist)) = lower(trim(ta.artist))
            AND lower(trim(s.title)) = lower(trim(ta.title))
        ), '{}'::text[])
      ) WITH ORDINALITY AS m(val, ord)
      WHERE COALESCE(trim(val), '') <> ''
      GROUP BY val
    ) d
  ), '{}'::text[]),
  movements = COALESCE((
    SELECT array_agg(val ORDER BY first_ord)
    FROM (
      SELECT val, MIN(ord) AS first_ord
      FROM unnest(
        COALESCE(ta.movements, '{}'::text[])
        || COALESCE((
          SELECT array_agg(mv)
          FROM public.spins s
          CROSS JOIN LATERAL unnest(COALESCE(s.movements, '{}'::text[])) AS mv
          WHERE lower(trim(s.artist)) = lower(trim(ta.artist))
            AND lower(trim(s.title)) = lower(trim(ta.title))
        ), '{}'::text[])
      ) WITH ORDINALITY AS m(val, ord)
      WHERE COALESCE(trim(val), '') <> ''
      GROUP BY val
    ) d
  ), '{}'::text[])
WHERE ta.spin_id IS NULL
  AND EXISTS (
    SELECT 1
    FROM public.spins s
    WHERE lower(trim(s.artist)) = lower(trim(ta.artist))
      AND lower(trim(s.title)) = lower(trim(ta.title))
      AND (
        COALESCE(array_length(s.scenes, 1), 0) > 0
        OR COALESCE(array_length(s.movements, 1), 0) > 0
      )
  );

COMMIT;

-- Summary check after migration:
SELECT 'spins' AS table_name,
       COUNT(*) FILTER (WHERE COALESCE(array_length(scenes, 1), 0) > 0) AS rows_with_scenes,
       COUNT(*) FILTER (WHERE COALESCE(array_length(movements, 1), 0) > 0) AS rows_with_movements
FROM public.spins
UNION ALL
SELECT 'challenge_backlog',
       COUNT(*) FILTER (WHERE COALESCE(array_length(scenes, 1), 0) > 0),
       COUNT(*) FILTER (WHERE COALESCE(array_length(movements, 1), 0) > 0)
FROM public.challenge_backlog
UNION ALL
SELECT 'top_albums',
       COUNT(*) FILTER (WHERE COALESCE(array_length(scenes, 1), 0) > 0),
       COUNT(*) FILTER (WHERE COALESCE(array_length(movements, 1), 0) > 0)
FROM public.top_albums;

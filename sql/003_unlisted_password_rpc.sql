-- ============================================================
-- 3. SECURE PASSWORD-PROTECTED UNLISTED DRAFTS
-- ============================================================

-- Ensure pgcrypto extension is available (installed in extensions schema on Supabase)
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Add unlisted flag to articles
ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS unlisted BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_articles_unlisted ON public.articles (slug, unlisted);

-- Tighten public read policy: only published & non-unlisted essays are public
DROP POLICY IF EXISTS "Public can view published articles" ON public.articles;
CREATE POLICY "Public can view published articles"
ON public.articles FOR SELECT
TO anon, authenticated
USING (published = true AND unlisted = false);

-- Isolated secrets table for bcrypt passcode hashes (ZERO direct client access)
CREATE TABLE IF NOT EXISTS public.article_locks (
  article_id UUID PRIMARY KEY REFERENCES public.articles(id) ON DELETE CASCADE,
  passcode_hash TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.article_locks ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.article_locks FROM anon, authenticated;

-- ============================================================
-- RPC 1: Check if an unlisted slug requires a passcode (no content returned)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_article_gate_status(p_slug TEXT)
RETURNS TABLE (
  is_unlisted BOOLEAN,
  has_passcode BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.unlisted,
    (l.article_id IS NOT NULL) AS has_passcode
  FROM public.articles a
  LEFT JOIN public.article_locks l ON l.article_id = a.id
  WHERE a.slug = p_slug
    AND a.unlisted = true
    AND a.published = false
  LIMIT 1;
END;
$$;

REVOKE ALL ON FUNCTION public.get_article_gate_status(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_article_gate_status(TEXT) TO anon, authenticated;

-- ============================================================
-- RPC 2: Verify passcode & return unlisted draft content
-- ============================================================
CREATE OR REPLACE FUNCTION public.unlock_unlisted_article(p_slug TEXT, p_passcode TEXT)
RETURNS SETOF public.articles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF p_passcode IS NULL OR length(trim(p_passcode)) = 0 THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT a.*
  FROM public.articles a
  INNER JOIN public.article_locks l ON l.article_id = a.id
  WHERE a.slug = p_slug
    AND a.unlisted = true
    AND a.published = false
    AND l.passcode_hash = crypt(trim(p_passcode), l.passcode_hash)
  LIMIT 1;
END;
$$;

REVOKE ALL ON FUNCTION public.unlock_unlisted_article(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.unlock_unlisted_article(TEXT, TEXT) TO anon, authenticated;

-- ============================================================
-- RPC 3 (Admin Only): Set unlisted flag & bcrypt-hashed passcode
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_article_lock(
  p_article_id UUID,
  p_unlisted BOOLEAN,
  p_passcode TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_has_passcode BOOLEAN;
BEGIN
  IF auth.role() <> 'authenticated' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF p_unlisted THEN
    UPDATE public.articles
    SET unlisted = true, published = false
    WHERE id = p_article_id;

    IF p_passcode IS NOT NULL AND length(trim(p_passcode)) > 0 THEN
      INSERT INTO public.article_locks (article_id, passcode_hash, updated_at)
      VALUES (p_article_id, crypt(trim(p_passcode), gen_salt('bf')), now())
      ON CONFLICT (article_id) DO UPDATE
        SET passcode_hash = EXCLUDED.passcode_hash,
            updated_at = now();
    END IF;
  ELSE
    UPDATE public.articles
    SET unlisted = false
    WHERE id = p_article_id;

    DELETE FROM public.article_locks
    WHERE article_id = p_article_id;
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM public.article_locks WHERE article_id = p_article_id
  ) INTO v_has_passcode;

  RETURN jsonb_build_object(
    'unlisted', p_unlisted,
    'has_passcode', v_has_passcode
  );
END;
$$;

REVOKE ALL ON FUNCTION public.set_article_lock(UUID, BOOLEAN, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_article_lock(UUID, BOOLEAN, TEXT) TO authenticated;

-- ============================================================
-- RPC 4 (Admin Only): Check which articles have a passcode set (without hashes)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_articles_lock_status()
RETURNS TABLE (
  article_id UUID,
  has_passcode BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() <> 'authenticated' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT l.article_id, true AS has_passcode
  FROM public.article_locks l;
END;
$$;

REVOKE ALL ON FUNCTION public.get_articles_lock_status() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_articles_lock_status() TO authenticated;

-- ============================================================
-- 1. ARTICLES TABLE
-- ============================================================
CREATE TABLE public.articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  hero_image_url TEXT,
  hero_image_caption TEXT,
  categories TEXT[] NOT NULL DEFAULT '{}',
  read_time TEXT,
  review_rating NUMERIC(2,1),
  authors JSONB NOT NULL DEFAULT '[{"name": "Sosa", "avatar_url": "assets/images/authors/sosaicon1.png"}]'::jsonb,
  post_type TEXT NOT NULL DEFAULT 'standard' CHECK (post_type IN ('standard', 'sosa-study')),
  study_artist TEXT,
  study_album TEXT,
  study_year INT4,
  body_html TEXT NOT NULL DEFAULT '',
  legacy_url TEXT,
  published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for fast slug lookup & homepage feed sorting
CREATE INDEX idx_articles_slug ON public.articles (slug);
CREATE INDEX idx_articles_published_feed ON public.articles (published, published_at DESC);

-- Auto-update updated_at on row modification
CREATE OR REPLACE FUNCTION public.set_articles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_articles_updated_at
BEFORE UPDATE ON public.articles
FOR EACH ROW
EXECUTE FUNCTION public.set_articles_updated_at();

-- ============================================================
-- 2. GRANTS & ROW-LEVEL SECURITY (RLS) FOR ARTICLES
-- ============================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON TABLE public.articles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.articles TO authenticated;

ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- Public & visitors can ONLY read published articles
CREATE POLICY "Public can view published articles"
ON public.articles FOR SELECT
TO anon, authenticated
USING (published = true);

-- Authenticated admin session has full CRUD (including unpublished drafts)
CREATE POLICY "Authenticated users have full access to articles"
ON public.articles FOR ALL
TO authenticated
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- ============================================================
-- 3. STORAGE BUCKET: article-images
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('article-images', 'article-images', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access for article images
CREATE POLICY "Public read article-images"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'article-images');

-- Authenticated admin upload, update, and delete
CREATE POLICY "Authenticated upload article-images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'article-images');

CREATE POLICY "Authenticated update article-images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'article-images')
WITH CHECK (bucket_id = 'article-images');

CREATE POLICY "Authenticated delete article-images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'article-images');

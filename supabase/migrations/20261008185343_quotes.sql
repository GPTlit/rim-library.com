-- =========================================================
-- Quote Cards (إقتباسات) feature
-- Tables: book_quotes, quotes, quote_likes, quote_saves
-- =========================================================

-- Primary book_quotes table
CREATE TABLE IF NOT EXISTS public.book_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quote_text text NOT NULL,
  comment_text text,
  page_number integer,
  theme_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  likes_count integer NOT NULL DEFAULT 0,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_book_quotes_book_id ON public.book_quotes(book_id);
CREATE INDEX IF NOT EXISTS idx_book_quotes_user_id ON public.book_quotes(user_id);
CREATE INDEX IF NOT EXISTS idx_book_quotes_created_at ON public.book_quotes(created_at DESC);

ALTER TABLE public.book_quotes ENABLE ROW LEVEL SECURITY;

-- book_quotes RLS: Public read access for all visitors
DROP POLICY IF EXISTS "Anyone can view book quotes" ON public.book_quotes;
CREATE POLICY "Anyone can view book quotes"
ON public.book_quotes FOR SELECT
USING (true);

-- Authenticated create access where auth.uid() = user_id
DROP POLICY IF EXISTS "Authenticated can insert own book quotes" ON public.book_quotes;
CREATE POLICY "Authenticated can insert own book quotes"
ON public.book_quotes FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- User update access for their own quotes
DROP POLICY IF EXISTS "Users can update own book quotes" ON public.book_quotes;
CREATE POLICY "Users can update own book quotes"
ON public.book_quotes FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- User delete access for their own quotes
DROP POLICY IF EXISTS "Users can delete own book quotes" ON public.book_quotes;
CREATE POLICY "Users can delete own book quotes"
ON public.book_quotes FOR DELETE TO authenticated
USING (auth.uid() = user_id);

GRANT SELECT ON public.book_quotes TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.book_quotes TO authenticated;

-- Legacy / compatibility quotes table
CREATE TABLE IF NOT EXISTS public.quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text text NOT NULL,
  comment text,
  page integer,
  style jsonb NOT NULL DEFAULT '{}'::jsonb,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quotes_book_id ON public.quotes(book_id);
CREATE INDEX IF NOT EXISTS idx_quotes_user_id ON public.quotes(user_id);
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON public.quotes(created_at DESC);

CREATE TABLE IF NOT EXISTS public.quote_likes (
  quote_id uuid NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (quote_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.quote_saves (
  quote_id uuid NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (quote_id, user_id)
);

ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_saves ENABLE ROW LEVEL SECURITY;

-- quotes policies: anyone can read, authenticated can insert/update/delete own
DROP POLICY IF EXISTS "Anyone can view quotes" ON public.quotes;
CREATE POLICY "Anyone can view quotes"
ON public.quotes FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Authenticated can insert own quotes" ON public.quotes;
CREATE POLICY "Authenticated can insert own quotes"
ON public.quotes FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own quotes" ON public.quotes;
CREATE POLICY "Users can update own quotes"
ON public.quotes FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own quotes" ON public.quotes;
CREATE POLICY "Users can delete own quotes"
ON public.quotes FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- quote_likes policies: anyone can read (for counts), authenticated manage own
DROP POLICY IF EXISTS "Anyone can view quote likes" ON public.quote_likes;
CREATE POLICY "Anyone can view quote likes"
ON public.quote_likes FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Authenticated can like quotes" ON public.quote_likes;
CREATE POLICY "Authenticated can like quotes"
ON public.quote_likes FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated can unlike own quotes" ON public.quote_likes;
CREATE POLICY "Authenticated can unlike own quotes"
ON public.quote_likes FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- quote_saves policies: anyone can read (for counts), authenticated manage own
DROP POLICY IF EXISTS "Anyone can view quote saves" ON public.quote_saves;
CREATE POLICY "Anyone can view quote saves"
ON public.quote_saves FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Authenticated can save quotes" ON public.quote_saves;
CREATE POLICY "Authenticated can save quotes"
ON public.quote_saves FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated can unsave own quotes" ON public.quote_saves;
CREATE POLICY "Authenticated can unsave own quotes"
ON public.quote_saves FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- GRANTs
GRANT SELECT ON public.quotes TO anon, authenticated;
GRANT SELECT ON public.quote_likes TO anon, authenticated;
GRANT SELECT ON public.quote_saves TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.quotes TO authenticated;
GRANT INSERT, DELETE ON public.quote_likes TO authenticated;
GRANT INSERT, DELETE ON public.quote_saves TO authenticated;

-- =========================================================
-- Storage: quote card images are stored in the existing public
-- 'covers' bucket under quotes/<user_id>/<uuid>.png
-- (bucket already created & made public in an earlier migration)
-- =========================================================

DROP POLICY IF EXISTS "Anyone can view quote images" ON storage.objects;
CREATE POLICY "Anyone can view quote images"
ON storage.objects FOR SELECT
USING (bucket_id = 'covers' AND (storage.foldername(name))[1] = 'quotes');

DROP POLICY IF EXISTS "Users can upload own quote images" ON storage.objects;
CREATE POLICY "Users can upload own quote images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'covers'
  AND (storage.foldername(name))[1] = 'quotes'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can update own quote images" ON storage.objects;
CREATE POLICY "Users can update own quote images"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'covers'
  AND (storage.foldername(name))[1] = 'quotes'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can delete own quote images" ON storage.objects;
CREATE POLICY "Users can delete own quote images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'covers'
  AND (storage.foldername(name))[1] = 'quotes'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- 24-hour profile stories created from quote cards
CREATE TABLE IF NOT EXISTS public.quote_stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id uuid REFERENCES public.books(id) ON DELETE SET NULL,
  text text NOT NULL,
  image_url text,
  style jsonb NOT NULL DEFAULT '{}'::jsonb,
  archived boolean NOT NULL DEFAULT false,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quote_stories_user_id ON public.quote_stories(user_id);
CREATE INDEX IF NOT EXISTS idx_quote_stories_expires_at ON public.quote_stories(expires_at);

GRANT SELECT ON public.quote_stories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.quote_stories TO authenticated;
GRANT ALL ON public.quote_stories TO service_role;

ALTER TABLE public.quote_stories ENABLE ROW LEVEL SECURITY;

-- Anyone can read stories that are still live or were archived (kept forever)
CREATE POLICY "Anyone can view active or archived quote stories"
ON public.quote_stories FOR SELECT
USING (archived = true OR expires_at > now());

-- Owners can also see their own expired stories (to archive them later)
CREATE POLICY "Owners can view own expired quote stories"
ON public.quote_stories FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated can insert own quote stories"
ON public.quote_stories FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quote stories"
ON public.quote_stories FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own quote stories"
ON public.quote_stories FOR DELETE TO authenticated
USING (auth.uid() = user_id);
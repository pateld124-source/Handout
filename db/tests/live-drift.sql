-- ════════════════════════════════════════════════════════════════════════
-- TEST ONLY — emulates known drift of the LIVE database that the repo SQL
-- does not create. Loaded by db/tests/run.sh after db/messages-read-policy.sql
-- (db/feature-1-points.sql needs users.referral_count). Idempotent.
-- Never run this against a real Supabase project.
-- ════════════════════════════════════════════════════════════════════════

-- ── live-only users columns ───────────────────────────────────────────────
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS plan            TEXT DEFAULT 'free';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS membership_plan TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS wallet_balance  NUMERIC(10,2) DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS referral_count  INTEGER DEFAULT 0;

-- ── verifications.reviewed_by FK as the pre-fix db/schema.sql made it (no ON DELETE)
ALTER TABLE public.verifications DROP CONSTRAINT IF EXISTS verifications_reviewed_by_fkey;
ALTER TABLE public.verifications ADD CONSTRAINT verifications_reviewed_by_fkey
  FOREIGN KEY (reviewed_by) REFERENCES public.users(id);

-- ── public_profiles exactly as it is on the LIVE database ─────────────────
-- A real TABLE (not the view the repo SQL describes): one row per member, kept
-- in sync from public.users by a SECURITY DEFINER trigger, with a primary key
-- that doubles as a foreign key to users and other tables pointing at it (the
-- app embeds poster names through those foreign keys). Supabase's default
-- grants give anon/authenticated ALL on it; one RLS policy allows reads.
-- (On live, community_posts, post_comments and handout_reviews also point at
-- it; the repo SQL does not create those tables, so only the three tables the
-- repo does create are wired up here.)
DROP VIEW IF EXISTS public.public_profiles;
CREATE TABLE public.public_profiles (
  id          uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  full_name   text,
  avatar_url  text,
  role        text,
  city        text,
  state       text,
  is_verified boolean,
  created_at  timestamptz
);
ALTER TABLE public.public_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY pp_public_read ON public.public_profiles FOR SELECT TO anon, authenticated USING (true);
GRANT ALL ON public.public_profiles TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.sync_public_profile()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.public_profiles (id, full_name, avatar_url, role, city, state, is_verified, created_at)
  VALUES (NEW.id, NEW.full_name, NEW.avatar_url, NEW.role, NEW.city, NEW.state, NEW.is_verified, NEW.created_at)
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, avatar_url = EXCLUDED.avatar_url,
    role = EXCLUDED.role, city = EXCLUDED.city, state = EXCLUDED.state, is_verified = EXCLUDED.is_verified;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS sync_public_profile_trg ON public.users;
CREATE TRIGGER sync_public_profile_trg AFTER INSERT OR UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_public_profile();

INSERT INTO public.public_profiles (id, full_name, avatar_url, role, city, state, is_verified, created_at)
SELECT id, full_name, avatar_url, role::text, city, state, is_verified, created_at FROM public.users
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.tiffin_listings  ADD CONSTRAINT tiffin_listings_user_pp_fkey
  FOREIGN KEY (user_id) REFERENCES public.public_profiles(id) ON DELETE CASCADE;
ALTER TABLE public.service_listings ADD CONSTRAINT service_listings_user_pp_fkey
  FOREIGN KEY (user_id) REFERENCES public.public_profiles(id) ON DELETE CASCADE;
ALTER TABLE public.welcome_packages ADD CONSTRAINT welcome_packages_host_pp_fkey
  FOREIGN KEY (host_id) REFERENCES public.public_profiles(id) ON DELETE CASCADE;

-- ── live-only buckets with deliberately permissive write policies ─────────
INSERT INTO storage.buckets (id, name, public) VALUES
  ('avatars', 'avatars', true),
  ('handouts', 'handouts', true),
  ('message-attachments', 'message-attachments', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "drift: public read" ON storage.objects;
CREATE POLICY "drift: public read" ON storage.objects
  FOR SELECT USING (bucket_id IN ('avatars', 'handouts', 'message-attachments'));

DROP POLICY IF EXISTS "drift: any signed-in upload" ON storage.objects;
CREATE POLICY "drift: any signed-in upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('avatars', 'handouts', 'message-attachments'));

DROP POLICY IF EXISTS "drift: any signed-in update" ON storage.objects;
CREATE POLICY "drift: any signed-in update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id IN ('avatars', 'handouts', 'message-attachments'))
  WITH CHECK (bucket_id IN ('avatars', 'handouts', 'message-attachments'));

DROP POLICY IF EXISTS "drift: any signed-in delete" ON storage.objects;
CREATE POLICY "drift: any signed-in delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id IN ('avatars', 'handouts', 'message-attachments'));

SELECT '✅ Live drift emulated (users columns, reviewed_by FK, public_profiles TABLE + sync trigger + FKs, 3 public buckets + permissive policies).' AS status;

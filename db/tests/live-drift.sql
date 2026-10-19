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

-- ── wider public_profiles (columns the app reads on live) ─────────────────
-- Recreated, so it picks up the Supabase default grants (ALL to anon/authenticated).
DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles AS
  SELECT id, full_name, created_at, avatar_url, role, is_verified, city, state FROM public.users;

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

SELECT '✅ Live drift emulated (users columns, reviewed_by FK, wider public_profiles, 3 public buckets + permissive policies).' AS status;

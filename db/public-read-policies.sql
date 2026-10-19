-- ════════════════════════════════════════════════════════════════════════
-- FIX: guests (logged-out visitors) could not see ANY listings because all
-- read policies were "TO authenticated". This enables the browse-first flow:
-- anyone can VIEW active listings; acting still requires sign-in.
-- Run once in Supabase → SQL Editor. Safe to re-run.
-- ════════════════════════════════════════════════════════════════════════

-- Public can read ACTIVE listings (owners/admins keep full access via existing policies)
DROP POLICY IF EXISTS rl_read_public  ON public.roommate_listings;
CREATE POLICY rl_read_public  ON public.roommate_listings FOR SELECT TO anon USING (is_active = true);

DROP POLICY IF EXISTS tl_read_public  ON public.tiffin_listings;
CREATE POLICY tl_read_public  ON public.tiffin_listings   FOR SELECT TO anon USING (is_active = true);

DROP POLICY IF EXISTS svl_read_public ON public.service_listings;
CREATE POLICY svl_read_public ON public.service_listings  FOR SELECT TO anon USING (is_active = true);

-- Poster names for guests WITHOUT exposing emails/phones/addresses:
-- a read-only view of safe fields (city/state only for signed-in users).
DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles AS
  SELECT id, full_name, avatar_url, role, is_verified,
         CASE WHEN auth.uid() IS NOT NULL THEN city END AS city,
         CASE WHEN auth.uid() IS NOT NULL THEN state END AS state,
         created_at
  FROM public.users;
REVOKE ALL ON public.public_profiles FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.public_profiles TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
SELECT '✅ Public can now browse listings. Names come from public_profiles (safe fields only).' AS status;

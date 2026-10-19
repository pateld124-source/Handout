-- ════════════════════════════════════════════════════════════════
-- Gives ADMINS full access to all data. Members can't delete their own
-- users row (account deletion runs server-side). Run once in Supabase →
-- SQL Editor. Safe to re-run.
-- ════════════════════════════════════════════════════════════════

-- Helper that checks "is the caller an admin?" WITHOUT recursing through
-- RLS (SECURITY DEFINER bypasses RLS inside the function).
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
$$;

-- No self-delete policy: account deletion runs server-side with the service role.
DROP POLICY IF EXISTS users_delete_own ON public.users;

-- Admins can read / update / delete ANY user.
DROP POLICY IF EXISTS users_admin_all ON public.users;
CREATE POLICY users_admin_all ON public.users FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Admins can manage ANY listing.
DROP POLICY IF EXISTS rl_admin  ON public.roommate_listings;
CREATE POLICY rl_admin  ON public.roommate_listings FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS tl_admin  ON public.tiffin_listings;
CREATE POLICY tl_admin  ON public.tiffin_listings  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS svl_admin ON public.service_listings;
CREATE POLICY svl_admin ON public.service_listings FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS wp_admin  ON public.welcome_packages;
CREATE POLICY wp_admin  ON public.welcome_packages  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

NOTIFY pgrst, 'reload schema';
SELECT '✅ Admin policies applied (self-delete runs server-side).' AS status;

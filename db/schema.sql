-- ════════════════════════════════════════════════════════════════════════
-- HANDOUT — FINAL SCHEMA (single source of truth)
-- Run this in Supabase → SQL Editor. Drops + recreates everything cleanly.
-- Includes: all tables, roommate preference fields, ID-verification table,
-- the is_admin() helper, signup trigger, and full Row Level Security.
-- After this, run:  db/storage-setup.sql  and  db/make-admin.sql, then the
-- other db/*.sql files, and db/security-hardening.sql LAST.
-- ════════════════════════════════════════════════════════════════════════

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;

DROP TABLE IF EXISTS
  public.verifications, public.notifications, public.reviews, public.messages,
  public.bookings, public.welcome_packages, public.service_listings,
  public.tiffin_listings, public.roommate_listings, public.provider_profiles,
  public.student_profiles, public.users CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

CREATE TYPE user_role AS ENUM ('student', 'vendor', 'provider', 'admin');

-- ── 1. USERS ──────────────────────────────────────────────────────────────
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'student',
  phone TEXT,
  country TEXT,
  country_code TEXT,            -- dial code, e.g. +1
  state TEXT,
  city TEXT,
  zip TEXT,
  address TEXT,
  gender TEXT,                  -- Male | Female | Non-binary | Other
  avatar_url TEXT,
  is_verified BOOLEAN DEFAULT false,
  verification_status TEXT DEFAULT 'unsubmitted',  -- unsubmitted | pending | approved | rejected
  onboarded BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 2. PROFILES ───────────────────────────────────────────────────────────
CREATE TABLE public.student_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  university TEXT, major TEXT, bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE public.provider_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  business_name TEXT, service_area TEXT, bio TEXT,
  rating NUMERIC(3,2) DEFAULT 0, total_reviews INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 3. ROOMMATE LISTINGS (with preference fields for matching) ────────────
CREATE TABLE public.roommate_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  listing_type TEXT NOT NULL DEFAULT 'have',   -- have | need
  title TEXT, description TEXT, location TEXT,
  rent NUMERIC(10,2), room_type TEXT, gender_preference TEXT,
  available_from DATE,
  contact_phone TEXT,
  media JSONB DEFAULT '[]'::jsonb,
  occupancy TEXT, diet TEXT, smoking TEXT, pets TEXT, university TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 4. FOOD / TIFFIN ──────────────────────────────────────────────────────
CREATE TABLE public.tiffin_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL, cuisine TEXT, diet_type TEXT, description TEXT,
  price_per_meal NUMERIC(10,2), price_per_month NUMERIC(10,2),
  price_per_week NUMERIC(10,2), meals_per_day INT DEFAULT 1, weekly_menu JSONB,
  location TEXT, contact_phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 5. SERVICES ───────────────────────────────────────────────────────────
CREATE TABLE public.service_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL, category TEXT, description TEXT,
  rate NUMERIC(10,2), rate_type TEXT DEFAULT 'hour',
  details JSONB,
  location TEXT, contact_phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 6. WELCOME PACKAGES ───────────────────────────────────────────────────
CREATE TABLE public.welcome_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL, description TEXT, price NUMERIC(10,2) NOT NULL,
  location TEXT, airport_served TEXT,
  is_active BOOLEAN DEFAULT true, is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 7. BOOKINGS ───────────────────────────────────────────────────────────
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  listing_type TEXT, listing_id UUID,
  total_price NUMERIC(10,2),
  status TEXT DEFAULT 'pending',
  arrival_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 8. MESSAGES ───────────────────────────────────────────────────────────
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL, is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 9. REVIEWS ────────────────────────────────────────────────────────────
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  reviewee_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  rating INT CHECK (rating BETWEEN 1 AND 5), comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 10. NOTIFICATIONS ─────────────────────────────────────────────────────
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT DEFAULT 'system',   -- booking | message | roommate | food | verification | system
  title TEXT NOT NULL, message TEXT, is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 11. VERIFICATIONS (SENSITIVE — ID docs; locked down) ──────────────────
CREATE TABLE public.verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  id_type TEXT,                 -- e.g. Driver's License, Passport
  id_number TEXT,
  id_doc_path TEXT,             -- path in the PRIVATE id-documents bucket
  status TEXT DEFAULT 'pending',-- pending | approved | rejected
  notes TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

-- ── admin check (SECURITY DEFINER avoids RLS recursion) ───────────────────
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
$$;

-- approved? (verified member or admin) — used to gate posting/booking
CREATE OR REPLACE FUNCTION public.is_approved()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $fn$
  SELECT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND (verification_status = 'approved' OR role = 'admin'))
$fn$;

-- ── auto-create users row on signup ───────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id, NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)),
    -- signup metadata can never grant admin
    CASE WHEN NEW.raw_user_meta_data->>'role' IN ('vendor', 'provider')
         THEN (NEW.raw_user_meta_data->>'role')::user_role
         ELSE 'student'::user_role END
  ) ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ── members edit only their own profile columns ───────────────────────────
REVOKE INSERT, UPDATE ON public.users FROM PUBLIC, anon, authenticated;
GRANT UPDATE (full_name, phone, avatar_url, gender, city, address, onboarded, country, country_code, state, zip,
              role, verification_status, is_verified) ON public.users TO authenticated;
GRANT INSERT (id, email, full_name, role) ON public.users TO authenticated;

-- members: student/provider → vendor and → 'pending' only; admins and server-side code: anything
CREATE OR REPLACE FUNCTION public.users_guard_transitions()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.role IS NOT DISTINCT FROM OLD.role
     AND NEW.verification_status IS NOT DISTINCT FROM OLD.verification_status
     AND NEW.is_verified IS NOT DISTINCT FROM OLD.is_verified THEN
    RETURN NEW;
  END IF;
  -- service role, SQL editor and SECURITY DEFINER functions are trusted
  IF current_user NOT IN ('authenticated', 'anon') OR public.is_admin() THEN
    RETURN NEW;
  END IF;
  IF NEW.role IS DISTINCT FROM OLD.role
     AND NOT (OLD.role::text IN ('student', 'provider') AND NEW.role::text = 'vendor') THEN
    RAISE EXCEPTION 'Only an admin can make this role change.' USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF NEW.verification_status IS DISTINCT FROM OLD.verification_status
     AND NEW.verification_status IS DISTINCT FROM 'pending' THEN
    RAISE EXCEPTION 'Only an admin can change the verification status.' USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF NEW.is_verified IS DISTINCT FROM OLD.is_verified THEN
    RAISE EXCEPTION 'Only an admin can change the verified badge.' USING ERRCODE = 'insufficient_privilege';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER users_guard_transitions BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE PROCEDURE public.users_guard_transitions();

-- ═══════════════════════ ROW LEVEL SECURITY ══════════════════════════════
ALTER TABLE public.users             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roommate_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tiffin_listings   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_listings  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.welcome_packages  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verifications     ENABLE ROW LEVEL SECURITY;

-- users: own row only (others via public_profiles); write own row; admin all. No self-delete (runs server-side).
CREATE POLICY users_read       ON public.users FOR SELECT TO authenticated USING (auth.uid() = id OR public.is_admin());
CREATE POLICY users_insert     ON public.users FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id AND role::text IN ('student', 'vendor', 'provider') AND lower(email) = lower(auth.jwt() ->> 'email'));
CREATE POLICY users_update_own ON public.users FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY users_admin_all  ON public.users FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- profiles
CREATE POLICY sp_read  ON public.student_profiles  FOR SELECT TO authenticated USING (true);
CREATE POLICY sp_write ON public.student_profiles  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY pp_read  ON public.provider_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY pp_write ON public.provider_profiles FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- listings: signed-in read; owner write; admin manage
CREATE POLICY rl_read   ON public.roommate_listings FOR SELECT TO authenticated USING (true);
CREATE POLICY rl_read_public ON public.roommate_listings FOR SELECT TO anon USING (is_active = true);
CREATE POLICY rl_write  ON public.roommate_listings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id AND public.is_approved());
CREATE POLICY rl_admin  ON public.roommate_listings FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY tl_read   ON public.tiffin_listings   FOR SELECT TO authenticated USING (true);
CREATE POLICY tl_read_public ON public.tiffin_listings FOR SELECT TO anon USING (is_active = true);
CREATE POLICY tl_write  ON public.tiffin_listings   FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id AND public.is_approved());
CREATE POLICY tl_admin  ON public.tiffin_listings   FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY svl_read  ON public.service_listings  FOR SELECT TO authenticated USING (true);
CREATE POLICY svl_read_public ON public.service_listings FOR SELECT TO anon USING (is_active = true);
CREATE POLICY svl_write ON public.service_listings  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id AND public.is_approved());
CREATE POLICY svl_admin ON public.service_listings  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY wp_read   ON public.welcome_packages  FOR SELECT TO authenticated USING (true);
CREATE POLICY wp_write  ON public.welcome_packages  FOR ALL USING (auth.uid() = host_id) WITH CHECK (auth.uid() = host_id AND public.is_approved());
CREATE POLICY wp_admin  ON public.welcome_packages  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- bookings / messages / reviews / notifications
CREATE POLICY bk_read   ON public.bookings FOR SELECT USING (auth.uid() = student_id OR auth.uid() = provider_id OR public.is_admin());
CREATE POLICY bk_write  ON public.bookings FOR INSERT WITH CHECK (auth.uid() = student_id AND public.is_approved());
CREATE POLICY bk_update ON public.bookings FOR UPDATE USING (auth.uid() = student_id OR auth.uid() = provider_id);
CREATE POLICY msg_read  ON public.messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY msg_send  ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY rev_read  ON public.reviews FOR SELECT TO authenticated USING (true);
CREATE POLICY rev_write ON public.reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);
CREATE POLICY ntf_own   ON public.notifications FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- verifications: ONLY the owner and admins can see/manage. No general read. Owners (re)submit as 'pending' only.
CREATE POLICY ver_owner_read   ON public.verifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY ver_owner_write  ON public.verifications FOR INSERT WITH CHECK (auth.uid() = user_id AND status = 'pending');
CREATE POLICY ver_owner_update ON public.verifications FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id AND status = 'pending');
CREATE POLICY ver_admin_all    ON public.verifications FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

SELECT '✅ Handout final schema ready — 12 tables, RLS on, is_admin() + signup trigger.' AS status;


-- Safe public profile fields (city/state only for signed-in callers). Read-only: view writes skip RLS.
DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles AS
  SELECT id, full_name, avatar_url, role, is_verified,
         CASE WHEN auth.uid() IS NOT NULL THEN city END AS city,
         CASE WHEN auth.uid() IS NOT NULL THEN state END AS state,
         created_at
  FROM public.users;
REVOKE ALL ON public.public_profiles FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.public_profiles TO anon, authenticated;

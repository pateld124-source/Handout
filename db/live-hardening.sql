-- ════════════════════════════════════════════════════════════════════════
-- LIVE SECURITY HARDENING — for the live Supabase project (prepared 2026-10-19,
-- tested on a local copy; paste into Supabase → SQL Editor after the code deploy).
-- Same goals as db/security-hardening.sql (sections 1-6), adapted to what the
-- live database already has. DO NOT re-run db/security-hardening.sql on the live
-- project: it would replace the signup functions below with simpler versions.
--
-- Differences from db/security-hardening.sql:
--  * handle_new_user keeps the live behaviour (owner admin, student profile,
--    welcome notifications). Only the role taken from signup metadata is clamped
--    to student/vendor/provider (before: any role, including 'admin').
--  * enforce_edu_email and notify_on_message are NOT replaced: live has the BETA
--    switch for the .edu rule and its own message-notification trigger.
--  * Storage buckets: listing-media keeps video (25 MB) but only named image and
--    video types (no SVG); id-documents gets a 20 MB image/PDF limit; the other
--    buckets are left as they are.
--  * The listing-phone step (db/hide-listing-phones.sql) runs after the code deploy.
-- Safe to re-run.
-- ════════════════════════════════════════════════════════════════════════

DO $$ BEGIN
  PERFORM set_config('hardening.storage_error', '', false);
  PERFORM set_config('hardening.bucket_error', '', false);
END $$;

-- ── 1. USERS — signup: same as live, but the metadata role is clamped ─────
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_role user_role; v_campus text;
BEGIN
  IF lower(NEW.email) = ANY (public.owner_admin_emails()) THEN
    v_role := 'admin';
  ELSE
    -- signup may only choose student / vendor / provider (was: any role, incl. admin)
    v_role := CASE WHEN NEW.raw_user_meta_data->>'role' IN ('vendor', 'provider')
                   THEN (NEW.raw_user_meta_data->>'role')::user_role
                   ELSE 'student'::user_role END;
  END IF;

  INSERT INTO public.users (id, email, full_name, role)
  VALUES (NEW.id, NEW.email,
          COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)), v_role)
  ON CONFLICT (id) DO NOTHING;

  IF v_role = 'student' THEN
    v_campus := public.campus_from_email(NEW.email);
    IF v_campus IS NOT NULL THEN
      INSERT INTO public.student_profiles (user_id, university)
      VALUES (NEW.id, v_campus)
      ON CONFLICT (user_id)
      DO UPDATE SET university = COALESCE(NULLIF(student_profiles.university,''), EXCLUDED.university);
    END IF;

    -- Welcome + first-action nudge (in-app; email is handled separately).
    INSERT INTO public.notifications (user_id, title, message, type, is_read)
    VALUES
      (NEW.id, 'Welcome to Handout 👋',
       'You''re in. Find a roommate, buy and sell textbooks, and meet students on your campus — all free.',
       'system', false),
      (NEW.id, 'Post your first listing',
       'Selling a textbook or looking for a roommate? Post it in 30 seconds — it''s the fastest way to get replies.',
       'system', false);
  END IF;

  RETURN NEW;
END; $function$;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- ── 1. USERS — column privileges (only columns that exist on this database) ─
DO $$
DECLARE
  v_update text;
  v_insert text;
BEGIN
  SELECT string_agg(quote_ident(column_name), ', ' ORDER BY ordinal_position) INTO v_update
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'users'
    AND column_name IN ('full_name', 'phone', 'avatar_url', 'gender', 'city', 'address', 'onboarded',
                        'country', 'country_code', 'state', 'zip', 'plan',
                        'role', 'verification_status', 'is_verified');
  SELECT string_agg(quote_ident(column_name), ', ' ORDER BY ordinal_position) INTO v_insert
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'users'
    AND column_name IN ('id', 'email', 'full_name', 'role');

  REVOKE INSERT, UPDATE ON public.users FROM PUBLIC, anon, authenticated;
  EXECUTE format('GRANT UPDATE (%s) ON public.users TO authenticated', v_update);
  EXECUTE format('GRANT INSERT (%s) ON public.users TO authenticated', v_insert);
END $$;

-- ── 1. USERS — role / verification transitions ────────────────────────────
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

DROP TRIGGER IF EXISTS users_guard_transitions ON public.users;
CREATE TRIGGER users_guard_transitions
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.users_guard_transitions();

-- ── 1+2. USERS — row level security ───────────────────────────────────────
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS users_read ON public.users;
CREATE POLICY users_read ON public.users FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS users_insert ON public.users;
CREATE POLICY users_insert ON public.users FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id
              AND role::text IN ('student', 'vendor', 'provider')
              AND lower(email) = lower(auth.jwt() ->> 'email'));

DROP POLICY IF EXISTS users_update_own ON public.users;
CREATE POLICY users_update_own ON public.users FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS users_delete_own ON public.users;

DROP POLICY IF EXISTS users_admin_all ON public.users;
CREATE POLICY users_admin_all ON public.users FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Restrictive backstops: these hold even if other permissive policies exist.
DROP POLICY IF EXISTS users_limit_select ON public.users;
CREATE POLICY users_limit_select ON public.users AS RESTRICTIVE FOR SELECT TO anon, authenticated
  USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS users_limit_insert ON public.users;
CREATE POLICY users_limit_insert ON public.users AS RESTRICTIVE FOR INSERT TO anon, authenticated
  WITH CHECK (public.is_admin()
              OR (auth.uid() = id
                  AND role::text IN ('student', 'vendor', 'provider')
                  AND lower(email) = lower(auth.jwt() ->> 'email')));

DROP POLICY IF EXISTS users_limit_update ON public.users;
CREATE POLICY users_limit_update ON public.users AS RESTRICTIVE FOR UPDATE TO anon, authenticated
  USING (auth.uid() = id OR public.is_admin()) WITH CHECK (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS users_limit_delete ON public.users;
CREATE POLICY users_limit_delete ON public.users AS RESTRICTIVE FOR DELETE TO anon, authenticated
  USING (public.is_admin());

-- ── 2. PUBLIC PROFILES (live: a TABLE kept in sync by sync_public_profile_trg) ─
DO $$
DECLARE
  v_kind "char";
BEGIN
  SELECT relkind INTO v_kind FROM pg_class WHERE oid = to_regclass('public.public_profiles');

  IF v_kind IN ('r', 'p') THEN
    ALTER TABLE public.public_profiles ENABLE ROW LEVEL SECURITY;
    REVOKE ALL ON public.public_profiles FROM PUBLIC, anon, authenticated;
    GRANT SELECT (id, full_name, avatar_url, role, is_verified, created_at)
      ON public.public_profiles TO anon;
    GRANT SELECT ON public.public_profiles TO authenticated;
  ELSE
    DROP VIEW IF EXISTS public.public_profiles;
    CREATE VIEW public.public_profiles AS
      SELECT id, full_name, avatar_url, role, is_verified,
             CASE WHEN auth.uid() IS NOT NULL THEN city END AS city,
             CASE WHEN auth.uid() IS NOT NULL THEN state END AS state,
             created_at
      FROM public.users;
    REVOKE ALL ON public.public_profiles FROM PUBLIC, anon, authenticated;
    GRANT SELECT ON public.public_profiles TO anon, authenticated;
  END IF;
END $$;

-- ── 3. VERIFICATIONS ──────────────────────────────────────────────────────
ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ver_owner_write ON public.verifications;
CREATE POLICY ver_owner_write ON public.verifications FOR INSERT
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

DROP POLICY IF EXISTS ver_owner_update ON public.verifications;
CREATE POLICY ver_owner_update ON public.verifications FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- reviewed_by: ON DELETE SET NULL, so an admin who reviewed verifications can be deleted.
DO $$
DECLARE
  v_col smallint;
  r record;
BEGIN
  SELECT attnum INTO v_col FROM pg_attribute
  WHERE attrelid = 'public.verifications'::regclass AND attname = 'reviewed_by' AND NOT attisdropped;
  FOR r IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.verifications'::regclass AND contype = 'f'
      AND conkey = ARRAY[v_col] AND confdeltype <> 'n'
  LOOP
    EXECUTE format('ALTER TABLE public.verifications DROP CONSTRAINT %I', r.conname);
  END LOOP;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint
                 WHERE conrelid = 'public.verifications'::regclass AND contype = 'f' AND conkey = ARRAY[v_col]) THEN
    ALTER TABLE public.verifications ADD CONSTRAINT verifications_reviewed_by_fkey
      FOREIGN KEY (reviewed_by) REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ── 4. NOTIFICATIONS — members only create their own ──────────────────────
-- The live message trigger (trg_notify_message) already creates the receiver's
-- notification as SECURITY DEFINER, so it is left as it is.
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ntf_insert_any ON public.notifications;

-- ── 5. BLOCKS — messages + dating profiles ────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_blocked_with(p_other uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.dating_blocks
    WHERE (blocker_id = auth.uid() AND blocked_id = p_other)
       OR (blocker_id = p_other AND blocked_id = auth.uid())
  )
$$;
REVOKE EXECUTE ON FUNCTION public.is_blocked_with(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_blocked_with(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.is_student_account(p_user uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.users WHERE id = p_user AND role::text = 'student')
$$;
REVOKE EXECUTE ON FUNCTION public.is_student_account(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_student_account(uuid) TO authenticated;

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS msg_send ON public.messages;
CREATE POLICY msg_send ON public.messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id AND NOT public.is_blocked_with(receiver_id));

ALTER TABLE public.dating_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "dp_select_auth" ON public.dating_profiles;
CREATE POLICY "dp_select_auth" ON public.dating_profiles FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR public.is_admin()
    OR (is_visible
        AND public.is_student_account(auth.uid())
        AND public.is_student_account(user_id)
        AND NOT public.is_blocked_with(user_id))
  );

DROP POLICY IF EXISTS msg_limit_insert ON public.messages;
CREATE POLICY msg_limit_insert ON public.messages AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id AND NOT public.is_blocked_with(receiver_id));
DROP POLICY IF EXISTS msg_limit_insert_anon ON public.messages;
CREATE POLICY msg_limit_insert_anon ON public.messages AS RESTRICTIVE FOR INSERT TO anon
  WITH CHECK (false);

DROP POLICY IF EXISTS dp_limit_select ON public.dating_profiles;
CREATE POLICY dp_limit_select ON public.dating_profiles AS RESTRICTIVE FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR public.is_admin()
    OR (is_visible
        AND public.is_student_account(auth.uid())
        AND public.is_student_account(user_id)
        AND NOT public.is_blocked_with(user_id))
  );
DROP POLICY IF EXISTS dp_limit_select_anon ON public.dating_profiles;
CREATE POLICY dp_limit_select_anon ON public.dating_profiles AS RESTRICTIVE FOR SELECT TO anon
  USING (false);

-- ── 6. STORAGE — own-folder rule (restrictive: other policies can't widen it)
DO $$
BEGIN
  DROP POLICY IF EXISTS "hardening: own folder insert" ON storage.objects;
  CREATE POLICY "hardening: own folder insert" ON storage.objects AS RESTRICTIVE
    FOR INSERT TO anon, authenticated
    WITH CHECK (bucket_id NOT IN ('avatars', 'listing-media', 'handouts', 'message-attachments', 'id-documents')
                OR (storage.foldername(name))[1] = auth.uid()::text);

  DROP POLICY IF EXISTS "hardening: own folder update" ON storage.objects;
  CREATE POLICY "hardening: own folder update" ON storage.objects AS RESTRICTIVE
    FOR UPDATE TO anon, authenticated
    USING (bucket_id NOT IN ('avatars', 'listing-media', 'handouts', 'message-attachments', 'id-documents')
           OR (storage.foldername(name))[1] = auth.uid()::text
           OR public.is_admin())
    WITH CHECK (bucket_id NOT IN ('avatars', 'listing-media', 'handouts', 'message-attachments', 'id-documents')
                OR (storage.foldername(name))[1] = auth.uid()::text
                OR public.is_admin());

  DROP POLICY IF EXISTS "hardening: own folder delete" ON storage.objects;
  CREATE POLICY "hardening: own folder delete" ON storage.objects AS RESTRICTIVE
    FOR DELETE TO anon, authenticated
    USING (bucket_id NOT IN ('avatars', 'listing-media', 'handouts', 'message-attachments', 'id-documents')
           OR (storage.foldername(name))[1] = auth.uid()::text
           OR public.is_admin());

  DROP POLICY IF EXISTS "hardening: id documents read" ON storage.objects;
  CREATE POLICY "hardening: id documents read" ON storage.objects AS RESTRICTIVE
    FOR SELECT TO anon, authenticated
    USING (bucket_id <> 'id-documents'
           OR (storage.foldername(name))[1] = auth.uid()::text
           OR public.is_admin());
EXCEPTION WHEN insufficient_privilege THEN
  PERFORM set_config('hardening.storage_error', SQLERRM, false);
END $$;

-- ── 6. STORAGE — limits for the two buckets that need tightening ──────────
DO $$
BEGIN
  -- listing photos + 1 video per listing (lib/imageCompress.ts: video up to 20 MB); named types, no SVG
  UPDATE storage.buckets SET file_size_limit = 26214400, allowed_mime_types = ARRAY[
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/avif', 'image/heic', 'image/heif',
    'video/mp4', 'video/quicktime', 'video/webm', 'video/x-m4v', 'video/3gpp']
  WHERE id = 'listing-media';
  -- ID card / selfie photos or a PDF scan
  UPDATE storage.buckets SET file_size_limit = 20971520, allowed_mime_types = ARRAY[
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/avif', 'image/heic', 'image/heif',
    'application/pdf']
  WHERE id = 'id-documents';
EXCEPTION WHEN insufficient_privilege THEN
  PERFORM set_config('hardening.bucket_error', SQLERRM, false);
END $$;

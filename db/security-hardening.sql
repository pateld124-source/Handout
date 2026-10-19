-- ════════════════════════════════════════════════════════════════════════
-- SECURITY HARDENING — run in Supabase → SQL Editor. Safe to re-run.
--
-- Run order: LAST — after db/schema.sql, every other db/*.sql file and
-- supabase/migrations/*.sql. Re-run it after re-running any other db/ or
-- supabase/ file, and after creating any of the storage buckets below.
--
-- What it changes (no tables dropped, no rows changed except bucket limits):
--   1. public.users writes — members may edit only their own profile columns;
--      role / verification_status / is_verified changes are checked by a
--      trigger (members: student/provider → vendor and → 'pending' only; admins and
--      server-side code: anything). Own-row inserts are limited to
--      student/vendor/provider with the account's own email. Members can no
--      longer delete their users row (account deletion runs server-side).
--      Signup metadata roles are clamped to student/vendor/provider and only
--      vendor/provider signups are exempt from the .edu rule.
--   2. public.users reads — own row (admins: all rows). Other members are read
--      through the read-only public_profiles view.
--   3. verifications — members can only submit/resubmit as 'pending'.
--      Deleting an admin who reviewed verifications clears reviewed_by
--      instead of failing.
--   4. notifications — members can only create their own; the receiver's
--      message notification is created by a trigger on messages.
--   5. blocks — blocked pairs cannot message each other; dating profiles are
--      shown only between students and never across a block.
--   6. storage — writes in avatars, listing-media, handouts,
--      message-attachments and id-documents only inside the uploader's own
--      <user id>/ folder (admins may also update/delete); ID documents are
--      readable by their owner and admins only; per-bucket size/type limits.
--   7. read-only audit queries for the owner, then a status line.
-- ════════════════════════════════════════════════════════════════════════

DO $$ BEGIN
  PERFORM set_config('hardening.storage_error', '', false);
  PERFORM set_config('hardening.bucket_error', '', false);
END $$;

-- ── 1. USERS — signup triggers ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id, NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)),
    CASE WHEN NEW.raw_user_meta_data->>'role' IN ('vendor', 'provider')
         THEN (NEW.raw_user_meta_data->>'role')::user_role
         ELSE 'student'::user_role END
  ) ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Keeps the existing enforce_edu_email_trigger wiring (db/signup-guardrails.sql).
CREATE OR REPLACE FUNCTION public.enforce_edu_email()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_role text := NEW.raw_user_meta_data->>'role';
BEGIN
  -- Only vendor/provider signups are exempt; any other metadata role (or none,
  -- e.g. OAuth) becomes a student in handle_new_user().
  IF COALESCE(v_role, '') NOT IN ('vendor', 'provider')
     AND NEW.email IS NOT NULL
     AND NEW.email !~* '\.edu$' THEN
    RAISE EXCEPTION 'Students must sign up with a .edu university email address.'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.enforce_edu_email() FROM PUBLIC, anon, authenticated;

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

-- ── 2. PUBLIC PROFILES (safe columns of other members; read-only) ─────────
DROP VIEW IF EXISTS public.public_profiles;
-- Runs with the owner's rights so it can show these columns of other members.
CREATE VIEW public.public_profiles AS
  SELECT id, full_name, avatar_url, role, is_verified,
         CASE WHEN auth.uid() IS NOT NULL THEN city END AS city,
         CASE WHEN auth.uid() IS NOT NULL THEN state END AS state,
         created_at
  FROM public.users;
REVOKE ALL ON public.public_profiles FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.public_profiles TO anon, authenticated;

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

-- ── 4. NOTIFICATIONS ──────────────────────────────────────────────────────
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ntf_insert_any ON public.notifications;

-- the message trigger writes notifications.type (db/add-notification-type.sql)
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'system';

CREATE OR REPLACE FUNCTION public.notify_on_message()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE sname TEXT;
BEGIN
  IF NEW.receiver_id IS NOT NULL THEN
    SELECT full_name INTO sname FROM public.users WHERE id = NEW.sender_id;
    INSERT INTO public.notifications (user_id, type, title, message)
    VALUES (NEW.receiver_id, 'message', '💬 New message from ' || COALESCE(sname, 'someone'), left(NEW.content, 80));
  END IF;
  RETURN NEW;
END; $$;
REVOKE EXECUTE ON FUNCTION public.notify_on_message() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_notify_message ON public.messages;
CREATE TRIGGER trg_notify_message AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE PROCEDURE public.notify_on_message();

-- ── 5. BLOCKS — messages + dating profiles ────────────────────────────────
-- Needs db/dating-safety.sql (dating_blocks) and the campus_connect migration.
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

-- Restrictive backstops: these hold even if other permissive policies exist
-- (e.g. dashboard templates, or re-running the campus_connect migration).
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
-- Wrapped so the rest still applies on projects where the SQL editor role may
-- not manage storage policies; the status line below reports it.
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

-- ── 6. STORAGE — size / type limits (from what the app uploads) ───────────
-- No SVG/HTML anywhere (they can run script when opened from the bucket URL).
DO $$
DECLARE
  v_images text[] := ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/avif',
                           'image/heic', 'image/heif', 'image/bmp', 'image/tiff'];
BEGIN
  -- profile photos (5 MB client check) + dating photos (re-encoded JPEG)
  UPDATE storage.buckets SET file_size_limit = 5242880, allowed_mime_types = v_images
  WHERE id = 'avatars';
  -- listing photos: originals up to 8 MB (lib/imageCompress.ts)
  UPDATE storage.buckets SET file_size_limit = 8388608, allowed_mime_types = v_images
  WHERE id = 'listing-media';
  -- ID card / selfie photos or a PDF scan, uploaded as-is
  UPDATE storage.buckets SET file_size_limit = 20971520, allowed_mime_types = v_images || ARRAY['application/pdf']
  WHERE id = 'id-documents';
  -- chat attachments: 10 MB client check; octet-stream = browser didn't know the type
  UPDATE storage.buckets SET file_size_limit = 10485760, allowed_mime_types = v_images || ARRAY[
    'application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain', 'text/csv', 'application/csv', 'text/x-csv', 'application/vnd.ms-excel',
    'application/zip', 'application/x-zip-compressed', 'application/x-zip', 'application/octet-stream']
  WHERE id = 'message-attachments';
  -- study handouts: no client size check; 50 MB = Supabase free-plan upload maximum
  UPDATE storage.buckets SET file_size_limit = 52428800, allowed_mime_types = ARRAY[
    'application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'application/octet-stream']
  WHERE id = 'handouts';
EXCEPTION WHEN insufficient_privilege THEN
  PERFORM set_config('hardening.bucket_error', SQLERRM, false);
END $$;

-- ── 7. AUDIT (read-only) ──────────────────────────────────────────────────
-- The SQL editor shows only the last result: select one query and run it alone.

-- 7a. Admin accounts — each should be someone you trust.
SELECT 'admin account' AS audit, id, email, created_at
FROM public.users WHERE role::text = 'admin' ORDER BY created_at;

-- 7b. Verified/approved members without a verification reviewed by an admin
--     (admin pages can also approve without one — confirm each is expected).
SELECT 'verified without admin review' AS audit, u.id, u.email, u.role::text AS role,
       u.verification_status, u.is_verified
FROM public.users u
WHERE (u.verification_status = 'approved' OR u.is_verified)
  AND u.role::text <> 'admin'
  AND NOT EXISTS (
    SELECT 1 FROM public.verifications v
    JOIN public.users a ON a.id = v.reviewed_by AND a.role::text = 'admin'
    WHERE v.user_id = u.id)
ORDER BY u.created_at
LIMIT 100;

-- 7c. Functions running with the caller's rights that mention users: they now
--     see only the caller's own row and the column grants above — review them.
SELECT 'invoker function using users' AS audit, p.oid::regprocedure AS function
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.prokind = 'f' AND NOT p.prosecdef
  AND p.prosrc ~* '\musers\M'
  AND NOT EXISTS (SELECT 1 FROM pg_depend d WHERE d.objid = p.oid AND d.deptype = 'e')
ORDER BY 2;

-- 7d. Views the API roles can write through (view writes skip row level security).
SELECT 'writable view' AS audit, c.oid::regclass AS view
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'v'
  AND (has_table_privilege('anon', c.oid, 'INSERT, UPDATE, DELETE')
       OR has_table_privilege('authenticated', c.oid, 'INSERT, UPDATE, DELETE'))
ORDER BY 2;

-- 7e. Other policies on these tables (not from the repo) — drop any you don't recognise.
SELECT 'other policy' AS audit, tablename, policyname, cmd, permissive
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('users', 'verifications', 'notifications', 'messages', 'dating_profiles', 'dating_blocks')
  AND policyname NOT IN (
    'users_read', 'users_insert', 'users_update_own', 'users_admin_all',
    'users_limit_select', 'users_limit_insert', 'users_limit_update', 'users_limit_delete',
    'ver_owner_read', 'ver_owner_write', 'ver_owner_update', 'ver_admin_all',
    'ntf_own', 'msg_read', 'msg_send', 'msg_mark_read', 'msg_limit_insert', 'msg_limit_insert_anon',
    'dp_select_auth', 'dp_insert_own', 'dp_update_own', 'dp_delete_own', 'dp_limit_select', 'dp_limit_select_anon',
    'db_owner', 'db_admin')
ORDER BY tablename, policyname;

NOTIFY pgrst, 'reload schema';

SELECT CASE
  WHEN current_setting('hardening.storage_error', true) <> '' THEN
    '⚠️ Hardening applied, but the storage policies were NOT created (' || current_setting('hardening.storage_error', true)
    || '). Add them in Storage → Policies, then re-run.'
  WHEN current_setting('hardening.bucket_error', true) <> '' THEN
    '⚠️ Hardening applied, but bucket limits were NOT set (' || current_setting('hardening.bucket_error', true) || ').'
  ELSE
    '✅ Security hardening applied — users/profiles, verifications, notifications, blocks, storage. Limits on '
    || (SELECT count(*) FROM storage.buckets WHERE file_size_limit IS NOT NULL
          AND id IN ('avatars', 'listing-media', 'handouts', 'message-attachments', 'id-documents'))
    || '/5 buckets; ' || (SELECT count(*) FROM public.users WHERE role::text = 'admin')
    || ' admin account(s). Run the audit queries (7a–7e) one at a time to review.'
END AS status;

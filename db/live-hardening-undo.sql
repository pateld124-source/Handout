-- UNDO for db/live-hardening.sql. State captured from the live project on 2026-10-19, before any change.
-- Run the whole file in the Supabase SQL editor (one transaction). Only needed if the hardening must be reverted.

-- 1. policies and objects the hardening added
DROP POLICY IF EXISTS users_limit_select ON public.users;
DROP POLICY IF EXISTS users_limit_insert ON public.users;
DROP POLICY IF EXISTS users_limit_update ON public.users;
DROP POLICY IF EXISTS users_limit_delete ON public.users;
DROP POLICY IF EXISTS msg_limit_insert ON public.messages;
DROP POLICY IF EXISTS msg_limit_insert_anon ON public.messages;
DROP POLICY IF EXISTS dp_limit_select ON public.dating_profiles;
DROP POLICY IF EXISTS dp_limit_select_anon ON public.dating_profiles;
DROP POLICY IF EXISTS "hardening: own folder insert" ON storage.objects;
DROP POLICY IF EXISTS "hardening: own folder update" ON storage.objects;
DROP POLICY IF EXISTS "hardening: own folder delete" ON storage.objects;
DROP POLICY IF EXISTS "hardening: id documents read" ON storage.objects;

-- 2. policies the hardening replaced -> old definitions
DROP POLICY IF EXISTS users_read ON public.users;
DROP POLICY IF EXISTS users_insert ON public.users;
DROP POLICY IF EXISTS users_update_own ON public.users;
DROP POLICY IF EXISTS users_delete_own ON public.users;
DROP POLICY IF EXISTS users_admin_all ON public.users;
DROP POLICY IF EXISTS ver_owner_write ON public.verifications;
DROP POLICY IF EXISTS ver_owner_update ON public.verifications;
DROP POLICY IF EXISTS msg_send ON public.messages;
DROP POLICY IF EXISTS dp_select_auth ON public.dating_profiles;
CREATE POLICY users_read ON public.users AS PERMISSIVE FOR SELECT TO authenticated USING ((( SELECT auth.uid() AS uid) = id));
CREATE POLICY users_insert ON public.users AS PERMISSIVE FOR INSERT TO public WITH CHECK ((( SELECT auth.uid() AS uid) = id));
CREATE POLICY users_update_own ON public.users AS PERMISSIVE FOR UPDATE TO public USING ((( SELECT auth.uid() AS uid) = id));
CREATE POLICY users_delete_own ON public.users AS PERMISSIVE FOR DELETE TO public USING ((( SELECT auth.uid() AS uid) = id));
CREATE POLICY users_admin_all ON public.users AS PERMISSIVE FOR ALL TO public USING (private.is_admin()) WITH CHECK (private.is_admin());
CREATE POLICY ver_owner_update ON public.verifications AS PERMISSIVE FOR UPDATE TO public USING ((( SELECT auth.uid() AS uid) = user_id)) WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));
CREATE POLICY ver_owner_write ON public.verifications AS PERMISSIVE FOR INSERT TO public WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));
CREATE POLICY msg_send ON public.messages AS PERMISSIVE FOR INSERT TO public WITH CHECK ((( SELECT auth.uid() AS uid) = sender_id));
CREATE POLICY dp_select_auth ON public.dating_profiles AS PERMISSIVE FOR SELECT TO authenticated USING (((is_visible = true) OR (( SELECT auth.uid() AS uid) = user_id)));

-- 3. users guard trigger and the two helper functions (added by the hardening)
DROP TRIGGER IF EXISTS users_guard_transitions ON public.users;
DROP FUNCTION IF EXISTS public.users_guard_transitions();
DROP FUNCTION IF EXISTS public.is_blocked_with(uuid);
DROP FUNCTION IF EXISTS public.is_student_account(uuid);

-- 4. table privileges (before: full table privileges for anon and authenticated, RLS does the limiting)
REVOKE ALL ON TABLE public.users FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.public_profiles FROM PUBLIC, anon, authenticated;
GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLE public.users TO anon, authenticated;
GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLE public.public_profiles TO anon, authenticated;

-- 5. storage buckets
UPDATE storage.buckets SET file_size_limit = 26214400, allowed_mime_types = '{image/*,video/*}' WHERE id = 'listing-media';
UPDATE storage.buckets SET file_size_limit = NULL, allowed_mime_types = NULL WHERE id = 'id-documents';

-- 6. verifications.reviewed_by foreign key (before: no ON DELETE action)
ALTER TABLE public.verifications DROP CONSTRAINT IF EXISTS verifications_reviewed_by_fkey;
ALTER TABLE public.verifications ADD CONSTRAINT verifications_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id);

-- 7. signup function (before: any role from signup metadata was accepted, including 'admin')
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
    v_role := COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student');
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

-- (if the listing-phone step was run:)  GRANT SELECT ON public.roommate_listings, public.service_listings, public.tiffin_listings TO anon;

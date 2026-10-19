-- ════════════════════════════════════════════════════════════════════════
-- SIGNUP GUARDRAILS
-- Run in Supabase → SQL Editor. Safe to re-run (idempotent).
--
--   1. Students must sign up with a .edu email — enforced server-side (catches
--      Google/Apple OAuth too, which can't be checked client-side before the
--      provider redirect). Vendors and providers are exempt (businesses, not students).
--   2. No two accounts can share the same phone number (partial unique index,
--      ignores NULL/blank — phone is optional).
--   3. phone_number_taken() — a SECURITY DEFINER check the signup forms call
--      BEFORE creating an account, so duplicate phones fail fast with a clean
--      error instead of a raw constraint violation after the account exists.
--
-- Note: email uniqueness is already enforced by Supabase Auth itself — no
-- extra work needed there.
-- ════════════════════════════════════════════════════════════════════════

-- ── 1. .edu enforcement for student signups (email/password AND OAuth) ────
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

DROP TRIGGER IF EXISTS enforce_edu_email_trigger ON auth.users;
CREATE TRIGGER enforce_edu_email_trigger
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.enforce_edu_email();

-- ── 2. One phone number per account (DB-level backstop) ───────────────────
CREATE UNIQUE INDEX IF NOT EXISTS users_phone_unique_idx
  ON public.users (phone)
  WHERE phone IS NOT NULL AND phone <> '';

-- ── 3. Pre-signup duplicate-phone check (RLS-safe: users can't read each
--      other's rows, so this returns only a boolean, never the actual data) ─
CREATE OR REPLACE FUNCTION public.phone_number_taken(p_phone TEXT)
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT EXISTS(SELECT 1 FROM public.users WHERE phone = p_phone)
$$;

REVOKE ALL ON FUNCTION public.phone_number_taken(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.phone_number_taken(TEXT) TO anon, authenticated;

SELECT '✅ Signup guardrails ready — .edu enforcement (students), phone uniqueness (index + RPC).' AS status;

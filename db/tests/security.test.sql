-- ════════════════════════════════════════════════════════════════════════
-- DATABASE SECURITY TESTS — run with db/tests/run.sh (throwaway local
-- Postgres only). Every case runs in its own transaction and is rolled back.
-- A failing case raises 'FAIL: <case>' and the next case still runs; a
-- passing case prints one 'PASS: <case>' line.
-- ════════════════════════════════════════════════════════════════════════
\set ON_ERROR_STOP on

-- ── harness ───────────────────────────────────────────────────────────────
DELETE FROM auth.users WHERE id::text LIKE '00000000-0000-4000-8000-%';
DROP SCHEMA IF EXISTS test CASCADE;
CREATE SCHEMA test;
GRANT USAGE ON SCHEMA test TO anon, authenticated, service_role;

CREATE TABLE test.people (name TEXT PRIMARY KEY, id UUID NOT NULL UNIQUE, email TEXT NOT NULL);
GRANT SELECT ON test.people TO anon, authenticated, service_role;

CREATE FUNCTION test.uid(p_name text) RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT id FROM test.people WHERE name = p_name
$$;

-- Act as a signed-in user until the end of the transaction (Supabase-style claims).
CREATE FUNCTION test.as_user(p_name text) RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  v_id    uuid;
  v_email text;
BEGIN
  EXECUTE 'RESET ROLE';
  SELECT id, email INTO v_id, v_email FROM test.people WHERE name = p_name;
  IF v_id IS NULL THEN RAISE EXCEPTION 'unknown test user %', p_name; END IF;
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_id, 'role', 'authenticated', 'email', v_email)::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';
END $$;

CREATE FUNCTION test.as_anon() RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  EXECUTE 'RESET ROLE';
  PERFORM set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
  EXECUTE 'SET LOCAL ROLE anon';
END $$;

-- The statement must be rejected by a privilege, RLS policy, trigger or check.
CREATE FUNCTION test.denied(p_case text, p_sql text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  BEGIN
    EXECUTE p_sql;
  EXCEPTION WHEN insufficient_privilege OR check_violation THEN
    RETURN;
  END;
  RAISE EXCEPTION 'FAIL: % (allowed: %)', p_case, p_sql;
END $$;

-- The statement must succeed and touch exactly p_rows rows.
CREATE FUNCTION test.rows(p_case text, p_sql text, p_rows int) RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  n int;
BEGIN
  BEGIN
    EXECUTE p_sql;
    GET DIAGNOSTICS n = ROW_COUNT;
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'FAIL: % (% %: %)', p_case, SQLSTATE, SQLERRM, p_sql;
  END;
  IF n <> p_rows THEN
    RAISE EXCEPTION 'FAIL: % (expected % row(s), got %: %)', p_case, p_rows, n, p_sql;
  END IF;
END $$;

CREATE FUNCTION test.eq(p_case text, p_actual anycompatible, p_expected anycompatible)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF p_actual IS DISTINCT FROM p_expected THEN
    RAISE EXCEPTION 'FAIL: % (expected %, got %)', p_case, p_expected, p_actual;
  END IF;
END $$;

-- ── seed (signups go through auth.users, i.e. the real signup triggers) ───
INSERT INTO test.people (name, id, email) VALUES
  ('admin', '00000000-0000-4000-8000-000000000001', 'admin@uni.edu'),
  ('alice', '00000000-0000-4000-8000-000000000002', 'alice@uni.edu'),
  ('bob',   '00000000-0000-4000-8000-000000000003', 'bob@uni.edu'),
  ('carol', '00000000-0000-4000-8000-000000000004', 'carol@uni.edu'),
  ('dan',   '00000000-0000-4000-8000-000000000005', 'dan@uni.edu'),
  ('vic',   '00000000-0000-4000-8000-000000000006', 'vic@shop.example'),
  ('frank', '00000000-0000-4000-8000-000000000007', 'frank@uni.edu');

INSERT INTO auth.users (id, email, raw_user_meta_data)
SELECT id, email, CASE WHEN name = 'vic' THEN '{"role": "vendor", "full_name": "Vic"}'::jsonb
                       ELSE jsonb_build_object('full_name', initcap(name)) END
FROM test.people;

-- promote the admin the way db/make-admin.sql does (SQL editor = table owner)
UPDATE public.users SET role = 'admin', is_verified = true, verification_status = 'approved', onboarded = true
WHERE id = test.uid('admin');
UPDATE public.users SET city = 'Austin', state = 'TX' WHERE id = test.uid('bob');

INSERT INTO public.dating_profiles (user_id, display_name, age, is_visible)
SELECT test.uid(n), initcap(n), 21, true FROM unnest(ARRAY['alice', 'bob', 'dan', 'vic']) AS n;

\set ON_ERROR_STOP off

-- ════════════════════ C1 — users write protection ═══════════════════════
\set case 'C1 member cannot change own role to admin'
BEGIN;
SELECT test.as_user('alice');
SELECT test.denied(:'case', $$UPDATE public.users SET role = 'admin' WHERE id = auth.uid()$$);
SELECT 'PASS: ' || :'case';
ROLLBACK;

\set case 'C1 member cannot change own role to provider'
BEGIN;
SELECT test.as_user('alice');
SELECT test.denied(:'case', $$UPDATE public.users SET role = 'provider' WHERE id = auth.uid()$$);
SELECT 'PASS: ' || :'case';
ROLLBACK;

\set case 'C1 vendor cannot switch to student or admin'
BEGIN;
SELECT test.as_user('vic');
SELECT test.denied(:'case', $$UPDATE public.users SET role = 'student' WHERE id = auth.uid()$$);
SELECT test.denied(:'case', $$UPDATE public.users SET role = 'admin' WHERE id = auth.uid()$$);
SELECT 'PASS: ' || :'case';
ROLLBACK;

\set case 'C1 member cannot set is_verified'
BEGIN;
SELECT test.as_user('alice');
SELECT test.denied(:'case', $$UPDATE public.users SET is_verified = true WHERE id = auth.uid()$$);
SELECT 'PASS: ' || :'case';
ROLLBACK;

\set case 'C1 member cannot set verification_status approved'
BEGIN;
SELECT test.as_user('alice');
SELECT test.denied(:'case', $$UPDATE public.users SET verification_status = 'approved' WHERE id = auth.uid()$$);
SELECT 'PASS: ' || :'case';
ROLLBACK;

\set case 'C1 member cannot change points'
BEGIN;
SELECT test.as_user('alice');
SELECT test.denied(:'case', $$UPDATE public.users SET points = 100000 WHERE id = auth.uid()$$);
SELECT 'PASS: ' || :'case';
ROLLBACK;

\set case 'C1 member cannot change wallet_balance'
BEGIN;
SELECT test.as_user('alice');
SELECT test.denied(:'case', $$UPDATE public.users SET wallet_balance = 500 WHERE id = auth.uid()$$);
SELECT 'PASS: ' || :'case';
ROLLBACK;

\set case 'C1 member cannot change email'
BEGIN;
SELECT test.as_user('alice');
SELECT test.denied(:'case', $$UPDATE public.users SET email = 'admin2@uni.edu' WHERE id = auth.uid()$$);
SELECT 'PASS: ' || :'case';
ROLLBACK;

\set case 'C1 provider can become vendor but not student'
BEGIN;
UPDATE public.users SET role = 'provider' WHERE id = test.uid('carol');
SELECT test.as_user('carol');
SELECT test.denied(:'case', $$UPDATE public.users SET role = 'student' WHERE id = auth.uid()$$);
SELECT test.rows(:'case', $$UPDATE public.users SET role = 'vendor', full_name = 'Carol C' WHERE id = auth.uid()$$, 1);
SELECT 'PASS: ' || :'case';
ROLLBACK;

\set case 'C1 student can become vendor'
BEGIN;
SELECT test.as_user('alice');
SELECT test.rows(:'case', $$UPDATE public.users SET role = 'vendor' WHERE id = auth.uid()$$, 1);
SELECT test.eq(:'case', (SELECT role::text FROM public.users WHERE id = auth.uid()), 'vendor');
SELECT 'PASS: ' || :'case';
ROLLBACK;

\set case 'C1 member can set verification_status pending'
BEGIN;
SELECT test.as_user('alice');
SELECT test.rows(:'case', $$UPDATE public.users SET verification_status = 'pending' WHERE id = auth.uid()$$, 1);
SELECT 'PASS: ' || :'case';
ROLLBACK;

\set case 'C1 member can update self-service columns and plan'
BEGIN;
SELECT test.as_user('alice');
SELECT test.rows(:'case', $$UPDATE public.users SET full_name = 'Alice A', phone = '+15550000002',
  avatar_url = 'https://example.com/a.jpg', gender = 'Female', city = 'Austin', address = '1 Main St',
  onboarded = true, country = 'United States', country_code = '+1', state = 'TX', zip = '78701',
  plan = 'plus' WHERE id = auth.uid()$$, 1);
SELECT 'PASS: ' || :'case';
ROLLBACK;

\set case 'C1 member cannot update another users row'
BEGIN;
SELECT test.as_user('alice');
SELECT test.rows(:'case', format($$UPDATE public.users SET full_name = 'x' WHERE id = %L$$, test.uid('bob')), 0);
SELECT 'PASS: ' || :'case';
ROLLBACK;

\set case 'C1 admin can verify another user'
BEGIN;
SELECT test.as_user('admin');
SELECT test.rows(:'case', format($$UPDATE public.users SET is_verified = true, verification_status = 'approved'
  WHERE id = %L$$, test.uid('bob')), 1);
SELECT 'PASS: ' || :'case';
ROLLBACK;

\set case 'C1 security definer award_points still updates points'
BEGIN;
SELECT test.as_user('alice');
SELECT test.eq(:'case', public.award_points('create_post'), 15);
SELECT test.eq(:'case', (SELECT points FROM public.users WHERE id = auth.uid()), 15);
SELECT 'PASS: ' || :'case';
ROLLBACK;

\set case 'C1 member cannot delete own users row'
BEGIN;
SELECT test.as_user('alice');
SELECT test.rows(:'case', $$DELETE FROM public.users WHERE id = auth.uid()$$, 0);
SELECT 'PASS: ' || :'case';
ROLLBACK;

\set case 'C1 client insert of own row as admin is denied'
BEGIN;
DELETE FROM public.users WHERE id = test.uid('frank');
SELECT test.as_user('frank');
SELECT test.denied(:'case', $$INSERT INTO public.users (id, email, full_name, role)
  VALUES (auth.uid(), 'frank@uni.edu', 'Frank', 'admin')$$);
SELECT 'PASS: ' || :'case';
ROLLBACK;

\set case 'C1 client insert of own row as student is allowed'
BEGIN;
DELETE FROM public.users WHERE id = test.uid('frank');
SELECT test.as_user('frank');
SELECT test.rows(:'case', $$INSERT INTO public.users (id, email, full_name, role)
  VALUES (auth.uid(), 'frank@uni.edu', 'Frank', 'student')$$, 1);
SELECT 'PASS: ' || :'case';
ROLLBACK;

\set case 'C1 client insert with another email is denied'
BEGIN;
DELETE FROM public.users WHERE id = test.uid('frank');
SELECT test.as_user('frank');
SELECT test.denied(:'case', $$INSERT INTO public.users (id, email, full_name, role)
  VALUES (auth.uid(), 'someone.else@uni.edu', 'Frank', 'student')$$);
SELECT 'PASS: ' || :'case';
ROLLBACK;

\set case 'C1 client insert cannot set verification columns'
BEGIN;
DELETE FROM public.users WHERE id = test.uid('frank');
SELECT test.as_user('frank');
SELECT test.denied(:'case', $$INSERT INTO public.users (id, email, role, is_verified, verification_status)
  VALUES (auth.uid(), 'frank@uni.edu', 'student', true, 'approved')$$);
SELECT 'PASS: ' || :'case';
ROLLBACK;

\set case 'C1 onboarding upsert (ignoreDuplicates) still works'
BEGIN;
SELECT test.as_user('alice');
SELECT test.rows(:'case', $$INSERT INTO public.users (id, email, role) VALUES (auth.uid(), 'alice@uni.edu', 'student')
  ON CONFLICT (id) DO NOTHING$$, 0);
SELECT 'PASS: ' || :'case';
ROLLBACK;

\set case 'C1 signup metadata role is clamped to student vendor or provider'
BEGIN;
INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES
  ('00000000-0000-4000-8000-0000000000e1', 'eve@uni.edu',     '{"role": "admin"}'),
  ('00000000-0000-4000-8000-0000000000e2', 'erin@uni.edu',    '{"role": "superuser"}'),
  ('00000000-0000-4000-8000-0000000000e3', 'pat@uni.edu',     '{"role": "provider"}'),
  ('00000000-0000-4000-8000-0000000000e4', 'val@uni.edu',     '{"role": "vendor"}');
SELECT test.eq(:'case', (SELECT string_agg(role::text, ',' ORDER BY email) FROM public.users
  WHERE id::text LIKE '00000000-0000-4000-8000-0000000000e%'), 'student,student,provider,vendor');
SELECT 'PASS: ' || :'case';
ROLLBACK;

\set case 'C1 signup triggers still fire for the non-superuser auth role'
BEGIN;
SET LOCAL ROLE supabase_auth_admin;
INSERT INTO auth.users (id, email, raw_user_meta_data)
VALUES ('00000000-0000-4000-8000-0000000000e9', 'gina@uni.edu', '{"role": "admin"}');
RESET ROLE;
SELECT test.eq(:'case', (SELECT role::text FROM public.users WHERE id = '00000000-0000-4000-8000-0000000000e9'), 'student');
SELECT 'PASS: ' || :'case';
ROLLBACK;

\set case 'C1 non-edu signup with metadata role admin is rejected'
BEGIN;
SELECT test.denied(:'case', $$INSERT INTO auth.users (id, email, raw_user_meta_data)
  VALUES ('00000000-0000-4000-8000-0000000000f1', 'mallory@gmail.example', '{"role": "admin"}')$$);
SELECT 'PASS: ' || :'case';
ROLLBACK;

\set case 'C1 non-edu student signup is rejected'
BEGIN;
SELECT test.denied(:'case', $$INSERT INTO auth.users (id, email, raw_user_meta_data)
  VALUES ('00000000-0000-4000-8000-0000000000f2', 'sam@gmail.example', '{}')$$);
SELECT 'PASS: ' || :'case';
ROLLBACK;

\set case 'C1 non-edu vendor and provider signups are allowed'
BEGIN;
SELECT test.rows(:'case', $$INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES
  ('00000000-0000-4000-8000-0000000000f3', 'shop@biz.example', '{"role": "vendor"}'),
  ('00000000-0000-4000-8000-0000000000f4', 'cook@biz.example', '{"role": "provider"}')$$, 2);
SELECT test.eq(:'case', (SELECT string_agg(role::text, ',' ORDER BY email) FROM public.users
  WHERE id::text LIKE '00000000-0000-4000-8000-0000000000f%'), 'provider,vendor');
SELECT 'PASS: ' || :'case';
ROLLBACK;

\set case 'C1 guard rails hold even with extra permissive users policies'
BEGIN;
CREATE POLICY "Enable read access for all users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON public.users FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON public.users FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Enable delete for all users" ON public.users FOR DELETE USING (true);
DELETE FROM public.users WHERE id = test.uid('frank');
SELECT test.as_user('alice');
SELECT test.eq(:'case', (SELECT count(*) FROM public.users WHERE id <> auth.uid()), 0::bigint);
SELECT test.rows(:'case', format($$UPDATE public.users SET full_name = 'x' WHERE id = %L$$, test.uid('bob')), 0);
SELECT test.rows(:'case', format($$DELETE FROM public.users WHERE id = %L$$, test.uid('bob')), 0);
SELECT test.as_user('frank');
SELECT test.denied(:'case', $$INSERT INTO public.users (id, email, full_name, role)
  VALUES (auth.uid(), 'frank@uni.edu', 'Frank', 'admin')$$);
SELECT test.as_anon();
SELECT test.eq(:'case', (SELECT count(*) FROM public.users), 0::bigint);
SELECT 'PASS: ' || :'case';
ROLLBACK;

-- ════════════════════ C2 — reading other users ═══════════════════════════
\set case 'C2 member cannot read another users row'
BEGIN;
SELECT test.as_user('alice');
SELECT test.eq(:'case', (SELECT count(*) FROM public.users WHERE id <> auth.uid()), 0::bigint);
SELECT 'PASS: ' || :'case';
ROLLBACK;

\set case 'C2 member can read own row'
BEGIN;
SELECT test.as_user('alice');
SELECT test.eq(:'case', (SELECT count(*) FROM public.users WHERE id = auth.uid()), 1::bigint);
SELECT 'PASS: ' || :'case';
ROLLBACK;

\set case 'C2 admin can read all users'
BEGIN;
SELECT test.as_user('admin');
SELECT test.eq(:'case', (SELECT count(*) FROM public.users WHERE id::text LIKE '00000000-0000-4000-8000-%'), 7::bigint);
SELECT 'PASS: ' || :'case';
ROLLBACK;

\set case 'C2 public_profiles has exactly the agreed columns'
BEGIN;
SELECT test.eq(:'case', (SELECT string_agg(column_name::text, ',' ORDER BY ordinal_position)
  FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'public_profiles'),
  'id,full_name,avatar_url,role,is_verified,city,state,created_at');
SELECT 'PASS: ' || :'case';
ROLLBACK;

\set case 'C2 member reads other profiles via public_profiles incl city and state'
BEGIN;
SELECT test.as_user('alice');
SELECT test.eq(:'case', (SELECT full_name || '|' || city || '|' || state FROM public.public_profiles
  WHERE id = test.uid('bob')), 'Bob|Austin|TX');
SELECT 'PASS: ' || :'case';
ROLLBACK;

\set case 'C2 anon reads public_profiles without city or state'
BEGIN;
SELECT test.as_anon();
SELECT test.eq(:'case', (SELECT full_name FROM public.public_profiles WHERE id = test.uid('bob')), 'Bob');
SELECT test.eq(:'case', (SELECT count(*) FROM public.public_profiles WHERE city IS NOT NULL OR state IS NOT NULL),
  0::bigint);
SELECT 'PASS: ' || :'case';
ROLLBACK;

\set case 'C2 public_profiles is read-only for API roles'
BEGIN;
SELECT test.as_user('alice');
SELECT test.denied(:'case', $$UPDATE public.public_profiles SET full_name = 'x' WHERE id = auth.uid()$$);
SELECT test.denied(:'case', format($$DELETE FROM public.public_profiles WHERE id = %L$$, test.uid('bob')));
SELECT test.as_anon();
SELECT test.denied(:'case', format($$UPDATE public.public_profiles SET full_name = 'x' WHERE id = %L$$, test.uid('bob')));
SELECT 'PASS: ' || :'case';
ROLLBACK;

-- ════════════════════ verifications ══════════════════════════════════════
\set case 'VER insert with status approved is denied'
BEGIN;
SELECT test.as_user('alice');
SELECT test.denied(:'case', $$INSERT INTO public.verifications (user_id, id_type, status)
  VALUES (auth.uid(), 'Student ID', 'approved')$$);
SELECT 'PASS: ' || :'case';
ROLLBACK;

\set case 'VER insert pending is allowed'
BEGIN;
SELECT test.as_user('alice');
SELECT test.rows(:'case', $$INSERT INTO public.verifications (user_id, id_type, status)
  VALUES (auth.uid(), 'Student ID', 'pending')$$, 1);
SELECT 'PASS: ' || :'case';
ROLLBACK;

\set case 'VER update to approved is denied'
BEGIN;
SELECT test.as_user('alice');
SELECT test.rows(:'case', $$INSERT INTO public.verifications (user_id, id_type) VALUES (auth.uid(), 'Student ID')$$, 1);
SELECT test.denied(:'case', $$UPDATE public.verifications SET status = 'approved' WHERE user_id = auth.uid()$$);
SELECT 'PASS: ' || :'case';
ROLLBACK;

\set case 'VER resubmission upsert as pending is allowed'
BEGIN;
SELECT test.as_user('alice');
SELECT test.rows(:'case', $$INSERT INTO public.verifications (user_id, id_type) VALUES (auth.uid(), 'Student ID')$$, 1);
SELECT test.rows(:'case', $$INSERT INTO public.verifications (user_id, id_type, id_number, status)
  VALUES (auth.uid(), 'Student ID', 'S-1', 'pending')
  ON CONFLICT (user_id) DO UPDATE SET id_number = EXCLUDED.id_number, status = EXCLUDED.status$$, 1);
SELECT 'PASS: ' || :'case';
ROLLBACK;

\set case 'VER deleting an admin who reviewed a verification clears reviewed_by'
BEGIN;
INSERT INTO public.verifications (user_id, id_type, status, reviewed_by, reviewed_at)
VALUES (test.uid('bob'), 'Student ID', 'approved', test.uid('admin'), NOW());
SET LOCAL ROLE service_role;
SELECT test.rows(:'case', format($$DELETE FROM public.users WHERE id = %L$$, test.uid('admin')), 1);
RESET ROLE;
SELECT test.eq(:'case', (SELECT count(*) FROM public.verifications
  WHERE user_id = test.uid('bob') AND reviewed_by IS NULL), 1::bigint);
-- exactly one FK on reviewed_by, and it is ON DELETE SET NULL
SELECT test.eq(:'case', (SELECT string_agg(c.confdeltype::text, ',') FROM pg_constraint c
  JOIN pg_attribute a ON a.attrelid = c.conrelid AND c.conkey = ARRAY[a.attnum]
  WHERE c.conrelid = 'public.verifications'::regclass AND c.contype = 'f' AND a.attname = 'reviewed_by'), 'n');
SELECT 'PASS: ' || :'case';
ROLLBACK;

-- ════════════════════ C3 — notifications ═════════════════════════════════
\set case 'C3 member cannot notify another user'
BEGIN;
SELECT test.as_user('alice');
SELECT test.denied(:'case', format($$INSERT INTO public.notifications (user_id, title) VALUES (%L, 'x')$$, test.uid('bob')));
SELECT 'PASS: ' || :'case';
ROLLBACK;

\set case 'C3 member can insert own notification'
BEGIN;
SELECT test.as_user('alice');
SELECT test.rows(:'case', $$INSERT INTO public.notifications (user_id, title) VALUES (auth.uid(), 'Welcome')$$, 1);
SELECT 'PASS: ' || :'case';
ROLLBACK;

\set case 'C3 a message creates exactly one receiver notification'
BEGIN;
SELECT test.as_user('alice');
SELECT test.rows(:'case', format($$INSERT INTO public.messages (sender_id, receiver_id, content)
  VALUES (auth.uid(), %L, %L)$$, test.uid('bob'), repeat('x', 100)), 1);
RESET ROLE;
SELECT test.eq(:'case', (SELECT count(*) FROM public.notifications WHERE user_id = test.uid('bob')), 1::bigint);
SELECT test.eq(:'case', (SELECT type || '|' || title || '|' || message FROM public.notifications
  WHERE user_id = test.uid('bob')), 'message|💬 New message from Alice|' || repeat('x', 80));
SELECT test.eq(:'case', (SELECT count(*) FROM public.notifications WHERE user_id = test.uid('alice')), 0::bigint);
SELECT 'PASS: ' || :'case';
ROLLBACK;

-- ════════════════════ C4 — blocks / dating ═══════════════════════════════
\set case 'C4 blocked pair cannot message in either direction'
BEGIN;
INSERT INTO public.dating_blocks (blocker_id, blocked_id) VALUES (test.uid('bob'), test.uid('alice'));
SELECT test.as_user('alice');
SELECT test.denied(:'case', format($$INSERT INTO public.messages (sender_id, receiver_id, content)
  VALUES (auth.uid(), %L, 'hi')$$, test.uid('bob')));
SELECT test.as_user('bob');
SELECT test.denied(:'case', format($$INSERT INTO public.messages (sender_id, receiver_id, content)
  VALUES (auth.uid(), %L, 'hi')$$, test.uid('alice')));
SELECT 'PASS: ' || :'case';
ROLLBACK;

\set case 'C4 unblocked pair can still message'
BEGIN;
SELECT test.as_user('alice');
SELECT test.rows(:'case', format($$INSERT INTO public.messages (sender_id, receiver_id, content)
  VALUES (auth.uid(), %L, 'hi')$$, test.uid('carol')), 1);
SELECT 'PASS: ' || :'case';
ROLLBACK;

\set case 'C4 dating profile hidden across a block in both directions'
BEGIN;
INSERT INTO public.dating_blocks (blocker_id, blocked_id) VALUES (test.uid('dan'), test.uid('bob'));
SELECT test.as_user('bob');
SELECT test.eq(:'case', (SELECT count(*) FROM public.dating_profiles WHERE user_id = test.uid('dan')), 0::bigint);
SELECT test.as_user('dan');
SELECT test.eq(:'case', (SELECT count(*) FROM public.dating_profiles WHERE user_id = test.uid('bob')), 0::bigint);
SELECT 'PASS: ' || :'case';
ROLLBACK;

\set case 'C4 dating profile hidden from a non-student viewer'
BEGIN;
SELECT test.as_user('vic');
SELECT test.eq(:'case', (SELECT count(*) FROM public.dating_profiles WHERE user_id = test.uid('bob')), 0::bigint);
SELECT 'PASS: ' || :'case';
ROLLBACK;

\set case 'C4 dating profile of a non-student owner is hidden'
BEGIN;
SELECT test.as_user('carol');
SELECT test.eq(:'case', (SELECT count(*) FROM public.dating_profiles WHERE user_id = test.uid('vic')), 0::bigint);
SELECT 'PASS: ' || :'case';
ROLLBACK;

\set case 'C4 student sees another visible student profile'
BEGIN;
SELECT test.as_user('carol');
SELECT test.eq(:'case', (SELECT count(*) FROM public.dating_profiles WHERE user_id = test.uid('bob')), 1::bigint);
SELECT 'PASS: ' || :'case';
ROLLBACK;

\set case 'C4 own profile always visible and hidden ones are not shown'
BEGIN;
UPDATE public.dating_profiles SET is_visible = false WHERE user_id = test.uid('bob');
SELECT test.as_user('bob');
SELECT test.eq(:'case', (SELECT count(*) FROM public.dating_profiles WHERE user_id = auth.uid()), 1::bigint);
SELECT test.as_user('carol');
SELECT test.eq(:'case', (SELECT count(*) FROM public.dating_profiles WHERE user_id = test.uid('bob')), 0::bigint);
SELECT 'PASS: ' || :'case';
ROLLBACK;

\set case 'C4 own profile visible to a vendor owner'
BEGIN;
SELECT test.as_user('vic');
SELECT test.eq(:'case', (SELECT count(*) FROM public.dating_profiles WHERE user_id = auth.uid()), 1::bigint);
SELECT 'PASS: ' || :'case';
ROLLBACK;

\set case 'C4 admin sees hidden dating profiles'
BEGIN;
UPDATE public.dating_profiles SET is_visible = false WHERE user_id = test.uid('bob');
SELECT test.as_user('admin');
SELECT test.eq(:'case', (SELECT count(*) FROM public.dating_profiles WHERE user_id = test.uid('bob')), 1::bigint);
SELECT 'PASS: ' || :'case';
ROLLBACK;

\set case 'C4 block helpers are not executable by anon'
BEGIN;
SELECT test.as_anon();
SELECT test.denied(:'case', format($$SELECT public.is_blocked_with(%L)$$, test.uid('bob')));
SELECT test.denied(:'case', format($$SELECT public.is_student_account(%L)$$, test.uid('bob')));
SELECT 'PASS: ' || :'case';
ROLLBACK;

\set case 'C4 block and student rules hold even with extra permissive policies'
BEGIN;
CREATE POLICY "Enable read access for all users" ON public.dating_profiles FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.messages FOR INSERT WITH CHECK (true);
INSERT INTO public.dating_blocks (blocker_id, blocked_id) VALUES (test.uid('bob'), test.uid('alice'));
SELECT test.as_user('alice');
SELECT test.denied(:'case', format($$INSERT INTO public.messages (sender_id, receiver_id, content)
  VALUES (auth.uid(), %L, 'hi')$$, test.uid('bob')));
SELECT test.denied(:'case', format($$INSERT INTO public.messages (sender_id, receiver_id, content)
  VALUES (%L, %L, 'spoofed sender')$$, test.uid('carol'), test.uid('dan')));
SELECT test.eq(:'case', (SELECT count(*) FROM public.dating_profiles WHERE user_id = test.uid('bob')), 0::bigint);
SELECT test.as_user('vic');
SELECT test.eq(:'case', (SELECT count(*) FROM public.dating_profiles WHERE user_id <> auth.uid()), 0::bigint);
SELECT test.as_anon();
SELECT test.eq(:'case', (SELECT count(*) FROM public.dating_profiles), 0::bigint);
SELECT test.denied(:'case', format($$INSERT INTO public.messages (sender_id, receiver_id, content)
  VALUES (%L, %L, 'anon')$$, test.uid('carol'), test.uid('dan')));
SELECT 'PASS: ' || :'case';
ROLLBACK;

-- ════════════════════ C6 — account deletion ══════════════════════════════
\set case 'C6 deleting the auth user removes the members rows'
BEGIN;
SELECT test.as_user('alice');
SELECT test.rows(:'case', format($$INSERT INTO public.messages (sender_id, receiver_id, content)
  VALUES (auth.uid(), %L, 'hi')$$, test.uid('carol')), 1);
RESET ROLE;
SELECT test.rows(:'case', format($$DELETE FROM auth.users WHERE id = %L$$, test.uid('alice')), 1);
SELECT test.eq(:'case', (SELECT count(*) FROM public.users WHERE id = test.uid('alice')), 0::bigint);
SELECT test.eq(:'case', (SELECT count(*) FROM public.dating_profiles WHERE user_id = test.uid('alice')), 0::bigint);
SELECT test.eq(:'case', (SELECT count(*) FROM public.messages WHERE sender_id = test.uid('alice')), 0::bigint);
SELECT 'PASS: ' || :'case';
ROLLBACK;

-- ════════════════════ C5 — storage ═══════════════════════════════════════
\set case 'C5 upload into another users folder is denied in all five buckets'
BEGIN;
SELECT test.as_user('alice');
SELECT test.denied(:'case' || ' [' || b || ']', format($$INSERT INTO storage.objects (bucket_id, name, owner)
  VALUES (%L, %L, auth.uid())$$, b, test.uid('bob') || '/x.jpg'))
FROM unnest(ARRAY['avatars', 'listing-media', 'handouts', 'message-attachments', 'id-documents']) AS b;
SELECT 'PASS: ' || :'case';
ROLLBACK;

\set case 'C5 upload into own folder is allowed in all five buckets'
BEGIN;
SELECT test.as_user('alice');
SELECT test.rows(:'case' || ' [' || b || ']', format($$INSERT INTO storage.objects (bucket_id, name, owner)
  VALUES (%L, %L, auth.uid())$$, b, test.uid('alice') || '/x.jpg'), 1)
FROM unnest(ARRAY['avatars', 'listing-media', 'handouts', 'message-attachments', 'id-documents']) AS b;
SELECT 'PASS: ' || :'case';
ROLLBACK;

\set case 'C5 root-level upload without a user folder is denied'
BEGIN;
SELECT test.as_user('alice');
SELECT test.denied(:'case', $$INSERT INTO storage.objects (bucket_id, name, owner) VALUES ('avatars', 'x.jpg', auth.uid())$$);
SELECT test.denied(:'case', $$INSERT INTO storage.objects (bucket_id, name, owner)
  VALUES ('avatars', 'dating/x.jpg', auth.uid())$$);
SELECT 'PASS: ' || :'case';
ROLLBACK;

\set case 'C5 anon cannot upload even with a public insert policy'
BEGIN;
CREATE POLICY "Anyone can upload an avatar." ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars');
SELECT test.as_anon();
SELECT test.denied(:'case', $$INSERT INTO storage.objects (bucket_id, name) VALUES ('avatars', 'x/y.jpg')$$);
SELECT 'PASS: ' || :'case';
ROLLBACK;

\set case 'C5 other buckets are unaffected'
BEGIN;
INSERT INTO storage.buckets (id, name, public) VALUES ('misc', 'misc', true);
CREATE POLICY "misc any upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'misc');
SELECT test.as_user('alice');
SELECT test.rows(:'case', format($$INSERT INTO storage.objects (bucket_id, name, owner)
  VALUES ('misc', %L, auth.uid())$$, test.uid('bob') || '/x.jpg'), 1);
SELECT test.rows(:'case', $$INSERT INTO storage.objects (bucket_id, name, owner) VALUES ('misc', 'root.jpg', auth.uid())$$, 1);
SELECT 'PASS: ' || :'case';
ROLLBACK;

\set case 'C5 cannot update or delete another users object'
BEGIN;
INSERT INTO storage.objects (bucket_id, name, owner) VALUES
  ('avatars', test.uid('bob') || '/a.jpg', test.uid('bob')),
  ('handouts', test.uid('bob') || '/h.pdf', test.uid('bob'));
SELECT test.as_user('alice');
SELECT test.rows(:'case', format($$UPDATE storage.objects SET metadata = '{}' WHERE name = %L$$,
  test.uid('bob') || '/a.jpg'), 0);
SELECT test.rows(:'case', format($$DELETE FROM storage.objects WHERE name = %L$$, test.uid('bob') || '/h.pdf'), 0);
SELECT 'PASS: ' || :'case';
ROLLBACK;

\set case 'C5 cannot move own object into another users folder'
BEGIN;
INSERT INTO storage.objects (bucket_id, name, owner) VALUES ('avatars', test.uid('alice') || '/a.jpg', test.uid('alice'));
SELECT test.as_user('alice');
SELECT test.denied(:'case', format($$UPDATE storage.objects SET name = %L WHERE name = %L$$,
  test.uid('bob') || '/a.jpg', test.uid('alice') || '/a.jpg'));
SELECT 'PASS: ' || :'case';
ROLLBACK;

\set case 'C5 owner can update and delete own objects'
BEGIN;
INSERT INTO storage.objects (bucket_id, name, owner) VALUES ('avatars', test.uid('alice') || '/a.jpg', test.uid('alice'));
SELECT test.as_user('alice');
SELECT test.rows(:'case', format($$UPDATE storage.objects SET metadata = '{}' WHERE name = %L$$,
  test.uid('alice') || '/a.jpg'), 1);
SELECT test.rows(:'case', format($$DELETE FROM storage.objects WHERE name = %L$$, test.uid('alice') || '/a.jpg'), 1);
SELECT 'PASS: ' || :'case';
ROLLBACK;

\set case 'C5 admin can delete another users object'
BEGIN;
INSERT INTO storage.objects (bucket_id, name, owner) VALUES ('avatars', test.uid('bob') || '/a.jpg', test.uid('bob'));
SELECT test.as_user('admin');
SELECT test.rows(:'case', format($$DELETE FROM storage.objects WHERE name = %L$$, test.uid('bob') || '/a.jpg'), 1);
SELECT 'PASS: ' || :'case';
ROLLBACK;

\set case 'C5 id documents stay private even with a broad read policy'
BEGIN;
INSERT INTO storage.objects (bucket_id, name, owner) VALUES ('id-documents', test.uid('bob') || '/id.jpg', test.uid('bob'));
CREATE POLICY "drift: read everything" ON storage.objects FOR SELECT TO authenticated USING (true);
SELECT test.as_user('alice');
SELECT test.eq(:'case', (SELECT count(*) FROM storage.objects WHERE bucket_id = 'id-documents'), 0::bigint);
SELECT test.as_user('bob');
SELECT test.eq(:'case', (SELECT count(*) FROM storage.objects WHERE bucket_id = 'id-documents'), 1::bigint);
SELECT test.as_user('admin');
SELECT test.eq(:'case', (SELECT count(*) FROM storage.objects WHERE bucket_id = 'id-documents'), 1::bigint);
SELECT 'PASS: ' || :'case';
ROLLBACK;

\set case 'C5 bucket size and type limits are set'
BEGIN;
SELECT test.eq(:'case', (SELECT string_agg(id || '=' || file_size_limit, ',' ORDER BY id) FROM storage.buckets
  WHERE id IN ('avatars', 'listing-media', 'handouts', 'message-attachments', 'id-documents')),
  'avatars=5242880,handouts=52428800,id-documents=20971520,listing-media=8388608,message-attachments=10485760');
SELECT test.eq(:'case', (SELECT count(*) FROM storage.buckets WHERE id IN ('avatars', 'listing-media', 'handouts',
  'message-attachments', 'id-documents') AND 'image/jpeg' = ANY (allowed_mime_types)), 5::bigint);
SELECT test.eq(:'case', (SELECT count(*) FROM storage.buckets b, unnest(b.allowed_mime_types) AS m
  WHERE m IN ('image/svg+xml', 'text/html', 'application/xhtml+xml', 'text/xml', 'application/xml',
              'text/javascript', 'application/javascript') OR m LIKE '%*%'), 0::bigint);
SELECT 'PASS: ' || :'case';
ROLLBACK;

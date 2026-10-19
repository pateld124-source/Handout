-- ════════════════════════════════════════════════════════════════════════
-- HIDE LISTING PHONE NUMBERS FROM SIGNED-OUT VISITORS
-- Run in Supabase → SQL Editor. Safe to re-run.
--
-- RUN ORDER: only AFTER the app version that names its columns (no
-- select('*')) in the guest-facing listing queries is live (lib/listingColumns.ts,
-- app/browse, app/explore, components/landing/*). Run this earlier and the home
-- page, /browse and /explore show no listings to guests until that code is up.
-- Re-run it after re-running db/public-read-policies.sql or any file that grants
-- SELECT on the listing tables to anon again.
--
-- What it does: guests (anon) may read every column of roommate_listings,
-- service_listings and tiffin_listings EXCEPT contact_phone. Signed-in members
-- keep full access. Row visibility (active listings only) is unchanged.
-- If you add a column that guests should see, re-run this file.
-- ════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  t    text;
  cols text;
BEGIN
  FOREACH t IN ARRAY ARRAY['roommate_listings', 'service_listings', 'tiffin_listings'] LOOP
    IF to_regclass('public.' || t) IS NULL THEN CONTINUE; END IF;

    SELECT string_agg(quote_ident(column_name), ', ' ORDER BY ordinal_position) INTO cols
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = t AND column_name <> 'contact_phone';

    EXECUTE format('REVOKE SELECT ON public.%I FROM anon', t);
    EXECUTE format('GRANT SELECT (%s) ON public.%I TO anon', cols, t);
  END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';

SELECT '✅ Guests can no longer read contact_phone on roommate_listings, service_listings, tiffin_listings.' AS status;

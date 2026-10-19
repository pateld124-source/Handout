-- ════════════════════════════════════════════════════════════════════════
-- HANDOUT STORAGE — run once in Supabase → SQL Editor.
--   • listing-media : PUBLIC  (room/listing photos & videos)
--   • id-documents  : PRIVATE (driver's license / ID images — sensitive)
-- Written so buckets still commit even if a policy line errors on your
-- project. If a policy is skipped, add it in Storage → Policies.
-- ════════════════════════════════════════════════════════════════════════

-- ── PUBLIC listing media ──────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('listing-media', 'listing-media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DO $$ BEGIN
  BEGIN CREATE POLICY "listing media read" ON storage.objects
    FOR SELECT USING (bucket_id = 'listing-media');
  EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'lm read skipped: %', SQLERRM; END;
  -- a user can upload only into their OWN folder ( <uid>/... )
  BEGIN DROP POLICY IF EXISTS "listing media upload" ON storage.objects;
    CREATE POLICY "listing media upload" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'listing-media' AND (storage.foldername(name))[1] = auth.uid()::text);
  EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'lm upload skipped: %', SQLERRM; END;
END $$;

-- ── PRIVATE ID documents ──────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('id-documents', 'id-documents', false)
ON CONFLICT (id) DO UPDATE SET public = false;

DO $$ BEGIN
  -- a user can upload only into their OWN folder ( <uid>/... )
  BEGIN CREATE POLICY "id docs upload own" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'id-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
  EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'id upload skipped: %', SQLERRM; END;

  -- only the owner OR an admin can read an ID document
  BEGIN CREATE POLICY "id docs read own or admin" ON storage.objects
    FOR SELECT TO authenticated
    USING (bucket_id = 'id-documents' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin()));
  EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'id read skipped: %', SQLERRM; END;
END $$;

SELECT '✅ Buckets ready: listing-media (public), id-documents (private).' AS status;

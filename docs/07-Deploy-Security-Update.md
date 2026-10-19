# Deploying the security update (beta)

Order matters. Do these in order; each step says why.

## 1. Vercel environment (before deploying)
Add `SUPABASE_SERVICE_ROLE_KEY` in Vercel → Project → Settings → Environment Variables
(Production + Preview). Server-only: never give it a `NEXT_PUBLIC_` name and never commit it.
It is used by one thing: "Delete my account" (`lib/actions/account.ts`). Without it, deleting an
account shows "We could not delete your account" and nothing else breaks.

The e2e test logins (`E2E_STUDENT_EMAIL`, `E2E_STUDENT_PASSWORD`, … see `.env.example`) are only
needed on a developer machine that runs `npm run test:e2e`. Do not add them to Vercel.

## 2. Deploy the code
Merge to `main`; Vercel deploys. The code works with the old database too, with two gaps until
step 3: message notifications are not created, and the age/photo rules are only enforced in the app.

## 3. Run the database hardening
Supabase → SQL Editor → paste `db/security-hardening.sql` → Run. Safe to re-run.
Run it LAST: after any other `db/*.sql` or `supabase/migrations/*.sql` file you ever re-run.

On the live project `public_profiles` is a TABLE kept in sync by a trigger, with foreign keys from
other tables pointing at it. The script keeps that table and locks it down (read-only for the API,
no city/state for signed-out visitors). It does not turn it into a view.

Then check, signed in as a test student: sign in, send a message (the receiver gets a notification),
change the profile photo, post a roommate listing with a photo, add a Campus Connect photo.

## 4. Hide listing phone numbers from signed-out visitors
Only after step 2 is live (the guest pages must name their columns first). Supabase → SQL Editor →
paste `db/hide-listing-phones.sql` → Run. Then open the home page, `/browse` and `/explore` while
signed out: listings still show, no phone numbers. Re-run the file after re-running
`db/public-read-policies.sql`, or after adding a listing column that guests should see (and add it to
`lib/listingColumns.ts`).

## Known limits (not fixed here)
- A member can still set their own `plan` from the browser (the billing page does it client-side).
  Move that to the server before real payments (Stripe) go live.
- The old test password is still in git history (commit a407cca). Change it wherever it was used.
- `npm run test:e2e` and the DB tests are not run by Vercel. Run `db/tests/run.sh` (needs Docker or
  Podman and a local `postgres:17` image) before changing the SQL.

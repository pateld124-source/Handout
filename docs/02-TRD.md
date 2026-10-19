# 2. Technical Requirements Document (TRD) — Handout

| | |
|---|---|
| **Product** | Handout |
| **Owner** | Darshil Patel |
| **Last updated** | _edit me_ |
| **Status** | Living document |

> This is *how* we build it. Update when the stack or architecture changes.

---

## 2.1 Stack
| Layer | Choice |
|---|---|
| Framework | **Next.js 14** (App Router) + **TypeScript** + React |
| Styling | Inline styles + global CSS tokens ("Midnight Tech"), Material Symbols icons |
| Backend / DB | **Supabase** — PostgreSQL, Auth, Storage |
| Auth client | `@supabase/supabase-js` with a **localStorage singleton** client |
| Hosting (planned) | Vercel (web) + Supabase (managed DB) |
| Dev environment | Windows + VS Code + PowerShell, `npm run dev` |

## 2.2 Architecture overview
- **Client-rendered app** (most pages are `'use client'`) talking directly to Supabase via the JS client.
- **Single Supabase client** (`lib/supabase/client.ts`) using a fixed `storageKey: 'handout-auth'` to avoid session/cookie mismatches.
- **Auth-gate context** (`components/auth/AuthGate.tsx`): exposes `requireAuth(action, reason)`, `openAuth()`, `signOut()`. Guests browse freely; the glass auth modal appears only on an action.
- **Role guard** (`lib/auth/role-guard.ts`): `requireRole('student' | 'vendor' | 'admin')` — redirects by role, self-heals a missing profile row (never to admin).
- **Middleware** is a passthrough; auth is enforced client-side per page.

## 2.3 Project structure (key paths)
```
app/
  page.tsx                 # landing
  browse/                  # public browse-first discovery
  student/                 # student dashboard, roommates, services, food, etc.
  vendor/                  # vendor dashboard, orders, earnings, profile
  admin/                   # admin-only console (guarded)
components/
  auth/   AuthGate.tsx, AuthModal.tsx
  layout/ Sidebar.tsx, VendorShell.tsx, AdminLayout.tsx, StudentLayout.tsx
  ui/     PhoneInput.tsx, MediaGallery.tsx, LocationSelect.tsx, ...
lib/
  supabase/client.ts       # singleton client
  auth/role-guard.ts
  validation.ts            # name/email/phone/password validators
db/
  schema.sql               # full schema (run first)
  upgrade-roommates.sql    # add room columns without data loss
  storage-setup.sql        # listing-media bucket + policies
  make-admin.sql           # promote one account to admin
  reset-all-data.sql       # wipe all data
docs/                      # these documents
```

## 2.4 Authentication & roles
- Email + password via Supabase Auth.
- On signup, a Postgres trigger (`handle_new_user`) inserts a matching `public.users` row with the role from sign-up metadata (`student`, `vendor` or `provider`; anything else becomes `student`).
- After plain login, the app reads the role and redirects to `/student/dashboard`, `/vendor/dashboard`, or `/admin/users`.
- **Admin** is reachable only by logging in as an admin account; admin links are not shown to students, and every admin page runs an admin check.

## 2.5 Data & storage
- 11 tables (see **Data Schema** doc). Listings are readable by any signed-in user so students see vendor posts; only the owner can write their own rows (enforced by RLS).
- **Storage bucket `listing-media`** (public read, authenticated upload) holds roommate photos/videos. URLs are stored in `roommate_listings.media` (JSONB array of `{url, type}`).

## 2.6 Validation rules (current)
- **Phone:** digits only; US numbers are 10 digits (a pasted leading `+1` is dropped), international numbers (`PhoneInput`) up to 14 digits.
- **Listings:** title length, required location, prices must be positive numbers, description minimums.
- **Auth:** email format, password strength, name checks (`lib/validation.ts`; names may use any alphabet).

## 2.7 Security (RLS summary)
- Row Level Security ON for all tables.
- `users`: you can read and update only **your own** row, and only your profile columns; role and verification changes are admin-only (except student/provider → vendor and submitting for review). Other members' public fields come from the read-only `public_profiles` view.
- Listings: signed-in read; owner-only write.
- `bookings` / `messages`: visible only to the parties involved; blocked users can't message each other.
- Storage: public read of media; uploads only into your own `<user id>/` folder; ID documents readable only by their owner and admins.
- `db/security-hardening.sql` applies these rules (run it last); `db/tests/run.sh` tests them against a throwaway local Postgres.

## 2.8 Non-functional requirements
- **Reliability:** complete file replacements over partial patches during the build; every delivery is testable by running `npm run dev`.
- **Performance:** client fetches are scoped and ordered; media served from Supabase CDN.
- **Privacy:** verification status stored per user; sensitive payment/legal flows gated until compliant.
- **Accessibility:** see UI/UX Brief.

## 2.9 Environment / secrets
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...   # server-only; needed for account deletion
```
E2E test accounts come from `E2E_*` variables (see `.env.example`).
Active Supabase project: `zidxnwtolbluisgucrzs`. Never commit secrets.

## 2.10 Planned integrations
- **Stripe** for payments + Connect payouts (Phase 4) — blocked on business banking + F-1 legal check.
- Email/SMS notifications (later).

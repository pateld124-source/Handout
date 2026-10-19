# 6. Implementation Flow — Handout

| | |
|---|---|
| **Product** | Handout |
| **Owner** | Darshil Patel |
| **Last updated** | _edit me_ |
| **Status** | Living document — the build roadmap |

> What's done, what's next, and how to set it up. Tick items as you go.

---

## 6.1 Setup (run once)
1. In Supabase → **SQL Editor**, run **`db/schema.sql`** (creates all tables + RLS + signup trigger).
   - Already have tables and don't want to lose data? Run **`db/upgrade-roommates.sql`** instead.
2. Run **`db/storage-setup.sql`** (creates the `listing-media` bucket for photos/videos).
3. Run **`db/make-admin.sql`** with **your** email to become the only admin.
4. Run the other `db/*.sql` files you need, then **`db/security-hardening.sql` last** (re-run it after re-running any other db file).
5. Add `.env` keys (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and server-only `SUPABASE_SERVICE_ROLE_KEY`).
6. `npm install` → `npm run dev` → open the local URL.
7. Smoke test: sign up a vendor → post a service → sign up a student → Book it.

## 6.2 Status board
### ✅ Done
- [x] Landing page (Midnight Tech) — hero, stats (start at 0), 6-block "What we provide", Browse, founder section, footer.
- [x] Browse-first flow + glass auth modal; login redirects by role.
- [x] Midnight Tech reskin across all pages (no leftover brown).
- [x] Student dashboard + roommate posting:
  - [x] Phone capped at 10 digits.
  - [x] Save-error fixed (`listing_type` + columns added).
  - [x] Photos/videos upload + swipeable gallery + posted date.
  - [x] "Need a room" = no photos.
- [x] Roommates browse page: groups/filters, gallery, Contact → Messages.
- [x] Vendor dashboard add-listing (validated) → `tiffin_listings` / `service_listings`.
- [x] Vendor pages: Orders, Earnings, Profile (editable) + account chip → profile, sign-out on profile.
- [x] Admin separated + locked to admin accounts; removed from student sidebar.
- [x] Services page rewritten: real vendor listings only + **Book now** (writes `bookings`).
- [x] Database: full schema, reset, upgrade, storage, make-admin scripts.

### 🔜 Next (recommended order)
1. **Close the booking loop** — make the vendor **Orders** page read the `bookings` table (today it reads `package_bookings`). Show student name, listing, status; allow confirm/complete.
2. **Real messaging** — turn the Messages link into actual student↔vendor conversations using the `messages` table (threads, read state).
3. **Food/Tiffin student page** — like Services: real `tiffin_listings` + subscribe/book.
4. **More vendor forms** — welcome packages + per-category service forms.
5. **Reviews & ratings** — end-to-end (write + display, feed the stats).
6. **Notifications** — booking/message alerts via the `notifications` table.

### 🧱 Later / blocked
- [ ] **Payments (Stripe)** + payouts — *blocked on* business banking + **F-1 host-income legal check via Rowan ISSS**.
- [ ] Lawyer review of Terms & Privacy.
- [ ] Native mobile app (iOS needs a Mac/Xcode) or PWA.
- [ ] Expand beyond Rowan once liquidity proven.

## 6.3 Working agreements (how we build)
- **Complete file replacements** over partial edits (easier to apply safely).
- Every change is **verified by running `npm run dev`** — if a screen throws a red error, copy that one line and fix that file.
- Build **one flow at a time, end-to-end**, then move on.
- Keep **docs in sync** (`docs/`) and the **schema in sync** (`db/schema.sql`).

## 6.4 Definition of "done" for a feature
1. Form validated (required fields, valid phone number, positive prices).
2. Writes/reads the correct Supabase table with RLS respected.
3. Empty state + loading state present.
4. Works for the right role; guarded if needed.
5. Matches the Midnight Tech UI.
6. Manually tested locally.

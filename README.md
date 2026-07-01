# StoopSale

Find garage, stoop, and yard sales near you — on a map. List your own in about a minute.

Map-first, mobile-first, local. Built with **Next.js (App Router) + TypeScript + Tailwind**, with **Supabase** for Postgres, Auth, and Storage, and **Google Maps Platform** for the map, address autocomplete, and geocoding.

> **Build status: MVP complete (Phases 1–7).** Auth, listings + geocoding, browse list, map view, saved sales, save/report, photo uploads, admin moderation, tests, and deployment docs are all in place.

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS |
| Database | Supabase Postgres (SQL migrations + Row Level Security) |
| Auth | Supabase Auth — email/password + Google OAuth |
| Storage | Supabase Storage (`sale-photos` bucket) |
| Maps | Google Maps JS API, Places Autocomplete, Geocoding (Phase 4+) |
| Deploy | Vercel (app) + Supabase (DB/Auth/Storage) |

Authorization is enforced in the **database** via Row Level Security, so the rules (owners edit only their own listings, the public sees only active sales, seller email is never exposed) hold no matter how the data is queried.

---

## Prerequisites

- **Node.js 18.18+** (20+ recommended)
- **Supabase CLI** — https://supabase.com/docs/guides/cli (`brew install supabase/tap/supabase` or see docs)
- **Docker** (the local Supabase stack runs in Docker)

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

```bash
cp .env.example .env.local
```

Fill in `.env.local`. For **local development with the Supabase CLI**, after `supabase start` (next step) the CLI prints your local URL and keys — paste them in:

```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key from `supabase start`>
SUPABASE_SERVICE_ROLE_KEY=<service_role key from `supabase start`>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Google Maps keys aren't needed until Phase 4; leave them blank for now.

> **Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser.** It has full database access and is used only by the seed script and trusted server code. It is not prefixed with `NEXT_PUBLIC_`, so Next.js will not bundle it client-side.

### 3. Start the database and apply the schema

```bash
supabase start          # boots Postgres, Auth, Storage locally (Docker)
supabase db reset       # applies ALL migrations in supabase/migrations/ (0001 + 0002)
```

> **Already running a live project on 0001?** Apply the new migration by pasting
> `supabase/migrations/0002_sessions_community.sql` into the Supabase SQL editor and
> running it (or `supabase db push`). It adds multi-day sale sessions, weekly
> recurrence, and community-spotted listings.

`db reset` runs the migration, which creates all tables, enums, indexes, RLS policies, the profile-on-signup trigger, the `submit_report` RPC, and the public `sale-photos` storage bucket.

### 4. Seed test data

```bash
npm run seed
```

This creates three test accounts (password `password123`) and a spread of Brooklyn sales covering every state — **open now, later today, this weekend, next week, already ended, and a draft**:

- `maya@stoopsale.test`
- `dev@stoopsale.test`
- `admin@stoopsale.test` *(ADMIN role)*

### 5. Run

```bash
npm run dev
```

Open http://localhost:3000.

---

## Using a hosted Supabase project instead of local

1. Create a project at https://supabase.com.
2. In **Project Settings → API**, copy the Project URL, `anon` key, and `service_role` key into `.env.local`.
3. Apply the schema: link the CLI (`supabase link --project-ref <ref>`) then `supabase db push`, **or** paste `supabase/migrations/0001_init.sql` into the SQL Editor and run it.
4. **Turn off email confirmation** to match the MVP "skip verification" decision: **Authentication → Providers → Email → "Confirm email" = off**. (Locally this is already set in `supabase/config.toml`.)
5. *(Optional)* Enable Google: **Authentication → Providers → Google**, add your OAuth client ID/secret, and add `${NEXT_PUBLIC_SITE_URL}/auth/callback` to the allowed redirect URLs.
6. `npm run seed`.

---

## Google Maps setup (needed from Phase 4)

You'll create **two** keys in Google Cloud Console (APIs & Services → Credentials):

- **Browser key** → `NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY`. Restrict by **HTTP referrer** (your domains + `localhost`). Enable **Maps JavaScript API** and **Places API**.
- **Server key** → `GOOGLE_MAPS_SERVER_KEY`. Restrict to the **Geocoding API** only. Used server-side; never shipped to the client.

Geocoding runs **once** when a listing is created or edited, and the resulting latitude/longitude is stored — the app never re-geocodes on page load.

---

## Project structure

```
app/
  (auth)/login, (auth)/signup     # auth screens
  (auth)/actions.ts               # sign in / up / google / out (server actions)
  auth/callback                   # OAuth + email code exchange
  create, saved, my-listings, admin   # protected routes (placeholders for now)
  page.tsx                        # home / landing (becomes map browse later)
components/
  ui/                             # button, input, field primitives
  auth/                           # auth form, sign-out
  site-header.tsx
lib/
  supabase/                       # browser, server, middleware clients
  types/database.types.ts         # DB types (regenerate: npm run db:types)
  validation/                     # zod schemas
middleware.ts                     # session refresh + route guards
supabase/
  migrations/0001_init.sql        # schema, RLS, triggers, storage
  config.toml                     # local CLI config
scripts/seed.ts                   # test users + Brooklyn sales
```

---

## Manual test checklist — Phase 1

Run `npm run dev` after seeding, then:

- [ ] **Browse without an account.** Home loads; header shows *Log in / Sign up*.
- [ ] **Sign up.** Create a new account → you're logged in and redirected home; header now shows *List a sale / My sales / Log out*.
- [ ] **Profile auto-created.** In Supabase Studio (`http://localhost:54323`), the `profiles` table has a row for your new user — and **no email column** (email lives only in `auth.users`).
- [ ] **Log out**, then **log in** with `maya@stoopsale.test` / `password123`.
- [ ] **Route guard (logged out).** Visit `/create` while logged out → redirected to `/login?next=/create`; after logging in you land back on `/create`.
- [ ] **Admin guard.** As a non-admin, visit `/admin` → redirected home. Log in as `admin@stoopsale.test` → `/admin` loads.
- [ ] **Google button** appears on login/signup (functional once you configure a Google provider).
- [ ] **RLS smoke test (optional).** In Studio's SQL editor, querying `sale_listings` as `anon` returns only `ACTIVE`, non-hidden rows (the draft and ended-but-derived rows behave per policy).

Type-check anytime with `npm run typecheck`.

### Manual test checklist — Phase 2

Logged in (e.g. `maya@stoopsale.test`):

- [ ] **Create + publish.** Go to **List a sale**, fill it in, hit **Publish sale** → you land on **My sales** with the new listing marked **Open now / Upcoming** (per its times).
- [ ] **Save as draft.** Create another and **Save as draft** → it shows a dashed **Draft** badge and is not publicly visible.
- [ ] **Validation.** Submit with a missing title, no category, or an end time before the start time → inline errors appear and nothing is saved.
- [ ] **Geocoding.** Without `GOOGLE_MAPS_SERVER_KEY`, listings still save (a dev fallback coordinate near Brooklyn is used, logged with a warning). With the key set, the real address is geocoded and `latitude`/`longitude` are stored once.
- [ ] **Edit.** Open **Edit** on a listing, change the title and address, **Save changes** → updates persist; changing the address re-geocodes (unchanged address does not).
- [ ] **Publish / unpublish.** Toggle a listing between draft and active from its card.
- [ ] **Delete.** Delete a listing (with confirm) → it disappears from My sales (soft delete: `status = DELETED`, kept in the DB).
- [ ] **Ownership.** Try visiting `/listings/<another-user's-id>/edit` → you're redirected away; RLS also blocks the update server-side.

### Manual test checklist — Phase 3

No login required (browse is public):

- [ ] **List loads.** The home page shows seeded sales as photo-led cards. The "Open now" card carries the pulsing neon badge.
- [ ] **Time filters.** Tap **Open now / Today / Tomorrow / This weekend / All upcoming** — the set changes accordingly. The seeded "ended" sale never appears; the seeded draft never appears.
- [ ] **Category & type.** Filtering by e.g. **Records** or **Stoop sale** narrows results; clearing returns to all.
- [ ] **Distance.** Tap **Use my location**, allow it → cards show a distance chip and **Sort → Distance** orders nearest-first. Deny it → a friendly note appears and distance sort is disabled.
- [ ] **Sorts.** Starting soon / Ending soon / Newly posted reorder the list.
- [ ] **Empty state.** Apply a filter combo with no matches → the helpful empty state shows, not a blank page.
- [ ] **Detail.** Click a card → the detail page shows photos, window, status, description, categories, notes, and a **Directions** button that opens Google Maps. An ended sale shows a "This sale has ended" notice.
- [ ] **Shareable URLs.** Filters live in the URL — copying the address bar reproduces the same filtered view.

### Manual test checklist — Phase 4

Needs a Google Maps **browser key** (`NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY`) with the Maps JavaScript API enabled. `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID` can be left as the built-in `DEMO_MAP_ID` for testing.

- [ ] **Map loads.** Toggle **List ⇄ Map** (top right). Seeded sales appear as price-tag markers; the open-now ones are neon.
- [ ] **Clustering.** Zoom out → nearby markers cluster into a count bubble; zoom in → they split apart.
- [ ] **Viewport loading.** Pan/zoom → the map refetches only what's in view (watch `/api/listings?bbox=…` in the Network tab); the "N sales in view" chip updates.
- [ ] **Filters apply to the map.** Changing time/category/type updates the markers without leaving the map.
- [ ] **Preview.** Tap a marker → a preview card appears with photo, title, window, **View details**, and **Go** (directions). Tapping the map dismisses it.
- [ ] **Location.** With **Use my location** on, the map centers on you and shows a "you are here" dot.
- [ ] **Missing-key fallback.** Unset the browser key → the map area shows a clear "Map isn't configured" message with a link back to the list (the rest of the app keeps working).
- [ ] **Load-error fallback.** With a bad/over-restricted key, the map shows a "didn't load" state with a retry.

### Manual test checklist — Phase 5

- [ ] **Save / unsave.** On a sale detail page (logged in), tap **Save** → it fills in. Open **Saved** in the nav → it's there. Remove it from the Saved page → it disappears. Saving while logged out sends you to login and back.
- [ ] **Report.** Tap **Report**, pick a reason, submit → you get a thank-you. As the `admin@stoopsale.test` user, the report shows up (queue UI is Phase 7-adjacent; the row and `reported_count` update are visible in Studio now).
- [ ] **Embedded map.** The detail page shows an interactive mini-map centered on the sale (or a clean address card if no Maps key is set).

### Manual test checklist — Phase 6

Photo uploads need a **real Supabase project** (local or hosted) — the bucket and storage policies are created by the migration.

- [ ] **Upload.** In **List a sale**, add photos → they upload to Storage and preview as a grid; the first is labeled **Cover**.
- [ ] **Validation.** Try a non-image or a >10 MB file → it's rejected with a message; valid ones still upload.
- [ ] **Reorder / remove.** Use **★** to make a photo the cover and **✕** to remove one.
- [ ] **Publish + view.** Publish, then open the detail page and browse list → your cover photo leads the card and the detail gallery.
- [ ] **Edit photos.** Edit the listing → existing photos load; add/remove/reorder and save → the set updates.
- [ ] **Storage security.** Uploads land under `sale-photos/<your-user-id>/…`; the storage policy blocks writing to another user's folder.

### Manual test checklist — Phase 7 (admin)

- [ ] Log in as `admin@stoopsale.test` and open **/admin** (non-admins are redirected away). The seeded open report appears.
- [ ] **Hide** the reported listing → it vanishes from browse and the map; **Unhide** restores it.
- [ ] **Mark reviewed** / **Dismiss** a report → it leaves the open queue.

---

## Testing

Pure, high-value logic is covered by unit tests (Vitest):

```bash
npm test
```

This covers the distance math (`haversineMiles`, `formatMiles`), the derived listing state (`getDisplayState`), and the tz-aware browse time windows (`timeWindow`) plus filter parsing — the trickiest correctness-sensitive code. The UI and data flows are covered by the per-phase manual checklists above.

## Admin / moderation

A user becomes an admin by setting `profiles.role = 'ADMIN'` (the seed does this for `admin@stoopsale.test`; in Studio you can flip any user). Admins get **/admin**, a queue of open reports with **Hide listing / Unhide** and **Mark reviewed / Dismiss**. Hiding sets `is_hidden = true`, which the Row Level Security policies and every browse/map query already exclude from the public. The whole moderation surface is enforced at the database, not just the UI.

## Deployment

**Database & auth (Supabase):**
1. Create a project, then apply the schema — link the CLI and `supabase db push`, or paste `supabase/migrations/0001_init.sql` into the SQL editor.
2. Authentication → Providers → Email → set **Confirm email = off** (MVP). Optionally enable Google and add `https://YOUR_DOMAIN/auth/callback` to the redirect allowlist.
3. (Optional) run `npm run seed` against the project for demo data.

**App (Vercel):**
1. Import the repo. Set env vars from `.env.example`: the two `NEXT_PUBLIC_SUPABASE_*` values, `SUPABASE_SERVICE_ROLE_KEY`, the Google Maps keys + Map ID, `NEXT_PUBLIC_SITE_URL` (your production URL), and `CRON_SECRET`.
2. Deploy. `vercel.json` registers the daily `/api/cron/expire` job; Vercel sends `CRON_SECRET` as a bearer token automatically.

**Google Maps key hardening (production):**
- **Browser key** (`NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY`): restrict **Application → HTTP referrers** to your domains (plus `localhost` for dev); restrict **APIs** to Maps JavaScript API + Places API. Create a real **Map ID** and set `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID` (Advanced Markers require one).
- **Server key** (`GOOGLE_MAPS_SERVER_KEY`): restrict **APIs** to Geocoding API only; it's used only server-side and never shipped to the browser.

## Roadmap (post-MVP ideas)

- Drag-to-reorder photos; clean up orphaned Storage objects on photo removal.
- PostGIS for true radius queries and server-side distance sorting at scale.
- Per-sale authoritative timezones for cross-region listings.
- Lazy-load the Storage client to trim the create/edit bundle.

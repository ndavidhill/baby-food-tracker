# Autumn & Alma — First Foods

A calm, minimal baby-food tracker for twin girls **Autumn** and **Alma** — built to
introduce them to solids and then keep a gentle daily record of what they eat and how
it went.

Designed mobile-first, with a warm, breathy, low-contrast aesthetic inspired by the
[Daylight Computer](https://daylightcomputer.com/product) — no bright colours, no
cartoons, just paper-warm tones and quiet typography.

## What it does

- **Today** — an at-a-glance view of each twin's day, a one-tap *Log a food* action,
  and a gentle *"something new"* nudge toward a first food nobody has tried yet.
- **Foods** — a curated library of ~34 sensible first foods grouped by category, with
  the common allergens flagged. Each row shows, per twin, whether it's been introduced.
  Tap any food to log a taste.
- **Journal** — two views:
  - *Timeline* — the full history, grouped by day and filterable by twin.
  - *Allergens* — a dedicated tracker for the common allergens (peanut, egg, dairy,
    sesame, wheat, soy, tree nuts, fish, shellfish). For each twin it shows whether
    it's been introduced, how many times it's been offered and when last, a gentle
    *"offer again"* nudge when it's been over a week, and any flagged reactions.
- **Insights** — a calm analytical dashboard. A segmented "exploration score" ring
  (a positive, non-medical 0–10 measure of variety, food-group balance, freshness, and
  allergen progress), a per-food-group breakdown, deterministic nudges, favourites and
  acceptance, a logging streak, and a weekly new-foods trend — all filterable by twin.
- **Edit anything** — tap a logged food to reopen it and change how it went, the amount,
  notes, or the reaction flag, or delete it.
- **Profiles** — a Settings screen (gear on Today) to name each twin, pick her colour, and
  set a birthday, which surfaces her age and a calm, non-medical weaning-stage tip.
- **Sync (optional)** — sign in with an email magic link to back up and sync live across
  devices and with a partner (see *Cloud sync* below).

Every meal captures **who** (Autumn, Alma, or both), **what**, **how much**
(a taste / some / lots), **how it went** (a calm five-point scale), an optional
**reaction flag** for allergy watching, and notes.

## Data & privacy

By default all data lives **locally in the browser** (`localStorage`) — no account, no
backend. Optionally you can **sign in** (email magic link) to back up your data and sync it
live across devices and with a partner; signing in merges the data already on the device.
With Supabase not configured, the app runs entirely local, exactly as before.

## Tech

- [Next.js 15](https://nextjs.org/) (App Router) + React 19
- [Tailwind CSS v4](https://tailwindcss.com/)
- [Fraunces](https://fonts.google.com/specimen/Fraunces) + [Inter](https://fonts.google.com/specimen/Inter) via `next/font`
- Local-first: `localStorage` is always the offline cache
- Optional [Supabase](https://supabase.com/) — email magic-link auth + Postgres with
  row-level security + realtime — for cross-device/partner sync

## Develop

```bash
npm install
npm run dev      # http://localhost:3000
```

```bash
npm run build    # production build
npm start        # serve the production build
```

## Cloud sync (optional)

The app is fully usable with no setup. To enable multi-device / partner sync:

1. Create a free [Supabase](https://supabase.com/) project; note the Project URL and the
   `anon` public key (Settings → API).
2. Run [`supabase/schema.sql`](supabase/schema.sql) in the Supabase SQL editor (tables,
   RLS policies, and the `ensure_household` / `create_invite` / `join_household` RPCs).
3. **Auth → Providers → Email**: enable the magic link / email OTP.
4. **Auth → URL Configuration**: set the Site URL to your deployment, and add redirect URLs
   for `http://localhost:3000/**`, your production `/**`, and (optional) the Vercel preview
   wildcard. The magic link redirects to `/auth/callback`.
5. **Database → Replication**: ensure the `entries` and `profiles` tables are in the
   `supabase_realtime` publication (the schema adds them).
6. Set the env vars (see `.env.example`) locally in `.env.local` and in Vercel
   (Production + Preview): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

Then a **Sync across devices** card appears in Settings. Sign in on each device with the
same email to share; tap **Invite partner** to generate a join link. Magic links are
device-bound (PKCE) — open the link on the device that requested it.

## Deploy (Vercel)

1. Push the repository to GitHub.
2. In [Vercel](https://vercel.com/new), **Import** the repo.
3. Vercel auto-detects Next.js. For local-only use, no env vars are needed; for sync, add
   the two `NEXT_PUBLIC_SUPABASE_*` vars from *Cloud sync* above.
4. Deploy.

Every push to the connected branch triggers a new deployment.

## Add to home screen

The app ships a web manifest and icon, so on a phone you can use **Add to Home Screen**
to launch it full-screen like a native app.

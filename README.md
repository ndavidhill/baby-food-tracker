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

Every meal captures **who** (Autumn, Alma, or both), **what**, **how much**
(a taste / some / lots), **how it went** (a calm five-point scale), an optional
**reaction flag** for allergy watching, and notes.

## Data & privacy

All data is stored **locally in the browser** (`localStorage`) — nothing leaves the
device and there is no account or backend. Clearing the browser's site data resets the
app.

## Tech

- [Next.js 15](https://nextjs.org/) (App Router) + React 19
- [Tailwind CSS v4](https://tailwindcss.com/)
- [Fraunces](https://fonts.google.com/specimen/Fraunces) + [Inter](https://fonts.google.com/specimen/Inter) via `next/font`
- No database — client-side state persisted to `localStorage`

## Develop

```bash
npm install
npm run dev      # http://localhost:3000
```

```bash
npm run build    # production build
npm start        # serve the production build
```

## Deploy (Vercel)

This is a zero-config Vercel deployment:

1. Push the repository to GitHub.
2. In [Vercel](https://vercel.com/new), **Import** the repo.
3. Vercel auto-detects Next.js — no environment variables or settings needed.
4. Deploy.

Every push to the connected branch will trigger a new deployment.

## Add to home screen

The app ships a web manifest and icon, so on a phone you can use **Add to Home Screen**
to launch it full-screen like a native app.

# Handover — activate Supabase cloud sync via the Supabase MCP

**Purpose:** the app's cloud-sync *code* is finished and merged; what remains is
provisioning the Supabase backend. This session's job is to finish that using the
**Supabase MCP** (authenticated), then verify sign-in + sync end-to-end.

Run this session where the Supabase MCP can actually reach Supabase (local Claude
Code, or a web environment whose network policy allows `*.supabase.co`). The
previous web sandbox had `supabase.co` egress-blocked, which is why this is a handover.

## Facts
- **Repo:** `ndavidhill/baby-food-tracker` · branches `main` and
  `claude/baby-food-tracker-app-9ifb6f` (kept in sync; develop on the `claude/…` branch).
- **Supabase project ref:** `hycupansklgrscmopuwn`
- **Project URL:** `https://hycupansklgrscmopuwn.supabase.co`
- **Anon (public) key** — safe to expose, it's shipped in the client bundle and
  protected by RLS:
  ```
  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5Y3VwYW5za2xncnNjbW9wdXduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5MzQ2MzcsImV4cCI6MjA5ODUxMDYzN30.pgkeWuxYb7Bxf1KjzFHDrC6IPDU5FNZ_nBTaGQH817c
  ```
- **MCP config:** already in `.mcp.json` (project scope). Authenticate once with
  `claude /mcp` → `supabase` → Authorize.

## How the app uses Supabase (so you can verify against the schema)
Local-first: the app runs fully on `localStorage` and only touches Supabase when
BOTH `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set **and**
the user is signed in.
- `lib/supabase.ts` — memoized browser client; `getSupabase()` returns null when unconfigured.
- `lib/auth.tsx` — `AuthProvider` / `useAuth`; email magic-link (`signInWithOtp`), PKCE.
- `lib/store.tsx` — sync-aware entries store (same public API). On sign-in: `rpc('ensure_household')`,
  upload local rows (`upsert onConflict id`), pull, then optimistic writes + realtime;
  `removeEntry` = soft delete (`deleted=true`); LWW on server-set `updated_at`.
- `lib/profiles.tsx` — sync-aware baby profiles (name/colour/birthday) with a one-time
  local→cloud merge that won't clobber a partner's edits.
- `app/auth/callback/page.tsx` — completes the magic link. `app/join/page.tsx` — redeems an invite.
- `components/auth/*` — SignInCard, AccountMenu (Invite partner), Account.
- **`supabase/schema.sql`** — the full backend (idempotent, safe to re-run).

## Tasks for this session (use the Supabase MCP)
First: `ToolSearch "supabase"` to confirm the MCP tools loaded (e.g. execute-SQL /
apply-migration / list-tables). If none, the MCP isn't authenticated/connected — stop
and have the user run `claude /mcp`.

1. **Apply the schema.** Run the entire contents of `supabase/schema.sql` against the
   project (apply-migration or execute-SQL). Then verify it created:
   - tables: `households`, `household_members`, `profiles`, `entries`, `household_invites`
   - functions: `is_member`, `ensure_household`, `create_invite`, `join_household`, `touch_updated_at`
   - RLS enabled on all tables + the policies (`en_*`, `pr_*`, `hh_*`, `hm_*`, `inv_none`)
   - realtime: `entries` and `profiles` in the `supabase_realtime` publication
2. **Enable email auth.** Ensure the Email provider / magic link (OTP) is enabled. If the
   MCP can't toggle auth providers, tell the user to do it in Auth → Providers → Email.
3. **Redirect URLs.** Site URL = the Vercel production URL; allow-list
   `http://localhost:3000/**`, the prod `/**`, and (optional) the preview wildcard. The
   magic link returns to `/auth/callback`. (Dashboard if the MCP can't set these.)
4. **Env vars.**
   - Local dev: write `.env.local` with the URL + anon key above (it's gitignored;
     `.env.example` documents it).
   - Vercel: add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Production
     + Preview) in the project's Environment Variables, then redeploy. (The Vercel MCP here
     has no env-writing tool — do this in the dashboard, or ask the user.)
5. **Verify.** `npm install && npm run build` (must still pass with and without env). If the
   network allows, run `npm run dev`, sign in, and confirm an entry round-trips to the
   `entries` table (query it via the MCP). Do the two-device check below.

## Acceptance / verification checklist
- [ ] Signing in on device A creates a household + 2 profile rows; existing local entries upload.
- [ ] Add an entry on A → row appears in `entries` (query via MCP), `created_by` set, `updated_at` stamped.
- [ ] Sign in on device B (same email) → sees A's entries after bootstrap; edits on B appear live on A (realtime).
- [ ] Delete on A → hidden on both; row shows `deleted=true` (soft delete).
- [ ] Rename/birthday a twin on A → syncs to B and to headers/insights labels.
- [ ] Invite: A → Settings → "Invite partner" → `/join?code=…`; a 2nd account joins and shares data.
- [ ] RLS: a 3rd unrelated account reads 0 rows from `entries`.

## Gotchas
- Magic links are **device-bound (PKCE)** — open the link on the device that requested it.
- `entries.id` is the client `crypto.randomUUID()` (PK) → merges are idempotent.
- Never sort UI by `updated_at` (sync clock) — order by `ts` (immutable). LWW uses `updated_at`.
- `household_members` RLS uses the `is_member` SECURITY DEFINER helper to avoid recursion — don't
  add a policy that subqueries `household_members` directly.
- The whole app must keep building/working with **no** env (pure local mode). Don't break that.

## After it works
Commit any doc/config tweaks to `claude/baby-food-tracker-app-9ifb6f` and fast-forward `main`
(the established pattern). Tell the user to redeploy Vercel; sync activates once the env vars are live.

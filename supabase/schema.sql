-- Autumn & Alma — First Foods: Supabase schema
-- Run this in the Supabase SQL editor (order matters: extensions → tables →
-- functions → policies). Safe to re-run.

create extension if not exists pgcrypto;

-- ── Tables ──────────────────────────────────────────────────────────────────
create table if not exists public.households (
  id          uuid primary key default gen_random_uuid(),
  name        text not null default 'Our family',
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);

create table if not exists public.household_members (
  household_id uuid not null references public.households(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  role         text not null default 'member' check (role in ('owner','member')),
  created_at   timestamptz not null default now(),
  primary key (household_id, user_id)
);
create index if not exists household_members_user_idx
  on public.household_members (user_id);

create table if not exists public.profiles (
  household_id uuid not null references public.households(id) on delete cascade,
  baby_id      text not null check (baby_id in ('autumn','alma')),
  name         text not null,
  color_var    text not null,
  birthday     date,
  updated_at   timestamptz not null default now(),
  primary key (household_id, baby_id)
);

create table if not exists public.entries (
  id           uuid primary key,               -- client crypto.randomUUID()
  household_id uuid not null references public.households(id) on delete cascade,
  date         text not null,                  -- 'yyyy-mm-dd' local calendar day
  ts           bigint not null,                -- creation/order (ms), immutable
  baby_id      text not null check (baby_id in ('autumn','alma')),
  food_id      text not null,
  food_name    text not null,
  reaction     text not null check (reaction in ('loved','liked','neutral','unsure','refused')),
  amount       text not null check (amount   in ('taste','some','lots')),
  notes        text,
  flagged      boolean not null default false,
  deleted      boolean not null default false, -- soft delete for sync
  updated_at   timestamptz not null default now(),
  created_by   uuid references auth.users(id) on delete set null
);
create index if not exists entries_household_updated_idx
  on public.entries (household_id, updated_at);

create table if not exists public.household_invites (
  code         text primary key,
  household_id uuid not null references public.households(id) on delete cascade,
  created_by   uuid not null references auth.users(id) on delete cascade,
  expires_at   timestamptz not null,
  redeemed_at  timestamptz,
  redeemed_by  uuid references auth.users(id)
);

-- ── Server-set updated_at (mitigates client clock skew for last-write-wins) ──
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

drop trigger if exists entries_touch on public.entries;
create trigger entries_touch before insert or update on public.entries
  for each row execute function public.touch_updated_at();

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before insert or update on public.profiles
  for each row execute function public.touch_updated_at();

-- ── Membership helper (SECURITY DEFINER → no RLS recursion) ─────────────────
create or replace function public.is_member(hid uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from public.household_members m
    where m.household_id = hid and m.user_id = auth.uid()
  );
$$;
revoke all on function public.is_member(uuid) from public;
grant execute on function public.is_member(uuid) to authenticated;

-- ── RPCs ────────────────────────────────────────────────────────────────────
create or replace function public.ensure_household()
returns uuid language plpgsql security definer set search_path = public as $$
declare hid uuid;
begin
  select household_id into hid
    from public.household_members where user_id = auth.uid() limit 1;
  if hid is not null then return hid; end if;

  insert into public.households(name, created_by)
    values ('Our family', auth.uid()) returning id into hid;
  insert into public.household_members(household_id, user_id, role)
    values (hid, auth.uid(), 'owner');
  insert into public.profiles(household_id, baby_id, name, color_var) values
    (hid, 'autumn', 'Autumn', 'var(--color-autumn)'),
    (hid, 'alma',   'Alma',   'var(--color-alma)')
    on conflict do nothing;
  return hid;
end $$;
revoke all on function public.ensure_household() from public;
grant execute on function public.ensure_household() to authenticated;

create or replace function public.create_invite()
returns text language plpgsql security definer set search_path = public as $$
declare hid uuid; code text;
begin
  select household_id into hid
    from public.household_members where user_id = auth.uid() limit 1;
  if hid is null then raise exception 'no_household'; end if;
  code := replace(replace(replace(encode(gen_random_bytes(6),'base64'),'+','A'),'/','B'),'=','');
  insert into public.household_invites(code, household_id, created_by, expires_at)
    values (code, hid, auth.uid(), now() + interval '7 days');
  return code;
end $$;
revoke all on function public.create_invite() from public;
grant execute on function public.create_invite() to authenticated;

create or replace function public.join_household(invite_code text)
returns uuid language plpgsql security definer set search_path = public as $$
declare inv record;
begin
  select * into inv from public.household_invites where code = invite_code for update;
  if inv is null then raise exception 'invalid_code'; end if;
  if inv.expires_at < now() then raise exception 'expired_code'; end if;

  insert into public.household_members(household_id, user_id, role)
    values (inv.household_id, auth.uid(), 'member')
    on conflict (household_id, user_id) do nothing;
  update public.household_invites
    set redeemed_at = now(), redeemed_by = auth.uid()
    where code = invite_code and redeemed_at is null;
  return inv.household_id;
end $$;
revoke all on function public.join_household(text) from public;
grant execute on function public.join_household(text) to authenticated;

-- ── Row-level security ──────────────────────────────────────────────────────
alter table public.households        enable row level security;
alter table public.household_members enable row level security;
alter table public.profiles          enable row level security;
alter table public.entries           enable row level security;
alter table public.household_invites enable row level security;

drop policy if exists hm_select_self on public.household_members;
create policy hm_select_self on public.household_members
  for select using (user_id = auth.uid());
drop policy if exists hm_select_household on public.household_members;
create policy hm_select_household on public.household_members
  for select using (public.is_member(household_id));

drop policy if exists hh_select on public.households;
create policy hh_select on public.households
  for select using (public.is_member(id));

drop policy if exists pr_select on public.profiles;
create policy pr_select on public.profiles
  for select using (public.is_member(household_id));
drop policy if exists pr_insert on public.profiles;
create policy pr_insert on public.profiles
  for insert with check (public.is_member(household_id));
drop policy if exists pr_update on public.profiles;
create policy pr_update on public.profiles
  for update using (public.is_member(household_id))
              with check (public.is_member(household_id));

drop policy if exists en_select on public.entries;
create policy en_select on public.entries
  for select using (public.is_member(household_id));
drop policy if exists en_insert on public.entries;
create policy en_insert on public.entries
  for insert with check (public.is_member(household_id) and created_by = auth.uid());
drop policy if exists en_update on public.entries;
create policy en_update on public.entries
  for update using (public.is_member(household_id))
              with check (public.is_member(household_id));

-- household_invites: no direct client access; RPCs (SECURITY DEFINER) only.
drop policy if exists inv_none on public.household_invites;
create policy inv_none on public.household_invites for all using (false) with check (false);

-- ── Realtime (idempotent: safe to re-run) ───────────────────────────────────
do $$ begin
  alter publication supabase_realtime add table public.entries;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.profiles;
exception when duplicate_object then null; end $$;

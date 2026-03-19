-- 005_split_events_participations.sql
-- Split events into a shared catalog + per-user participation records.
-- Prerequisite for multi-user support.

-- ============================================================
-- 1. Create profiles table (minimal — expanded in multi-user story)
-- ============================================================
create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  is_admin    boolean not null default false,
  created_at  timestamptz default now()
);

alter table profiles enable row level security;

create policy "Profiles are public"
  on profiles for select using (true);

create policy "Profiles insert own"
  on profiles for insert
  with check (auth.uid() = id);

create policy "Profiles update own"
  on profiles for update
  using  (auth.uid() = id)
  with check (auth.uid() = id);

-- Seed the existing owner as admin
insert into profiles (id, is_admin)
select id, true from auth.users limit 1
on conflict (id) do update set is_admin = true;

-- ============================================================
-- 2. Helper function: is the current user an admin?
-- ============================================================
create or replace function is_admin()
returns boolean
language sql
security definer
stable
as $$
  select coalesce(
    (select is_admin from profiles where id = auth.uid()),
    false
  )
$$;

-- ============================================================
-- 3. Create event_participations table
-- ============================================================
create table if not exists event_participations (
  id                  uuid primary key default gen_random_uuid(),
  event_id            uuid not null references events(id) on delete cascade,
  user_id             uuid not null references auth.users(id) on delete cascade,
  status              text not null default 'interested'
                        check (status in ('interested', 'signed_up', 'completed', 'dns', 'dnf')),
  finish_time         text,
  timing_url          text,
  actual_distance_km  numeric(5,2),
  strava_activity_id  bigint unique,
  notes               text,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now(),
  constraint event_participations_event_user_key unique (event_id, user_id)
);

alter table event_participations enable row level security;

create policy "Participations are public"
  on event_participations for select using (true);

create policy "Participations insert own"
  on event_participations for insert
  with check (auth.uid() = user_id);

create policy "Participations update own"
  on event_participations for update
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Participations delete own"
  on event_participations for delete
  using (auth.uid() = user_id);

-- Auto-update updated_at
create or replace function update_updated_at_column()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger event_participations_updated_at
  before update on event_participations
  for each row execute function update_updated_at_column();

-- ============================================================
-- 4. Migrate existing event data → event_participations
--    All existing rows belong to the single owner (backfilled in 004)
-- ============================================================
insert into event_participations (
  event_id, user_id, status, finish_time, timing_url,
  actual_distance_km, strava_activity_id, notes,
  created_at, updated_at
)
select
  id,
  user_id,
  status,
  finish_time,
  timing_url,
  actual_distance_km,
  strava_activity_id,
  notes,
  created_at,
  updated_at
from events;

-- ============================================================
-- 5. Rename user_id → created_by on events
-- ============================================================
alter table events rename column user_id to created_by;

-- ============================================================
-- 6. Drop participation-specific columns from events
-- ============================================================
alter table events
  drop column if exists status,
  drop column if exists finish_time,
  drop column if exists timing_url,
  drop column if exists actual_distance_km,
  drop column if exists strava_activity_id,
  drop column if exists notes;

-- ============================================================
-- 7. Update strava_suggestions: swap event_id → participation_id
-- ============================================================
alter table strava_suggestions
  add column if not exists participation_id uuid references event_participations(id) on delete cascade;

-- Backfill: match via event_id + user_id (guaranteed 1:1 after migration above)
update strava_suggestions ss
set participation_id = ep.id
from event_participations ep
where ss.event_id = ep.event_id
  and ss.user_id  = ep.user_id;

alter table strava_suggestions drop column if exists event_id;

-- ============================================================
-- 8. Update RLS policies on events for creator-or-admin
-- ============================================================

-- Drop old policies (created in 004)
drop policy if exists "Events insert by owner"   on events;
drop policy if exists "Events update by owner"   on events;
drop policy if exists "Events delete by owner"   on events;
-- Also drop older policies from 001 in case migration was applied fresh
drop policy if exists "Events are editable by owner" on events;
drop policy if exists "Events update by creator" on events;
drop policy if exists "Events delete by creator" on events;

-- INSERT: any authenticated user becomes created_by
create policy "Events insert by owner"
  on events for insert
  with check (auth.uid() = created_by);

-- UPDATE: creator or admin
create policy "Events update by creator or admin"
  on events for update
  using  (auth.uid() = created_by or is_admin())
  with check (auth.uid() = created_by or is_admin());

-- DELETE: creator or admin
create policy "Events delete by creator or admin"
  on events for delete
  using (auth.uid() = created_by or is_admin());

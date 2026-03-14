-- 004_add_user_id.sql
-- Add user_id to events, strava_tokens, strava_suggestions for proper multi-user RLS

-- ============================================================
-- 1. Add user_id columns (nullable initially for backfill)
-- ============================================================
alter table events           add column if not exists user_id uuid references auth.users(id);
alter table strava_tokens    add column if not exists user_id uuid references auth.users(id);
alter table strava_suggestions add column if not exists user_id uuid references auth.users(id);

-- ============================================================
-- 2. Backfill: assign all existing rows to the single existing user
-- ============================================================
do $$
declare
  owner_id uuid;
begin
  select id into owner_id from auth.users limit 1;
  if owner_id is not null then
    update events             set user_id = owner_id where user_id is null;
    update strava_tokens      set user_id = owner_id where user_id is null;
    update strava_suggestions set user_id = owner_id where user_id is null;
  end if;
end $$;

-- ============================================================
-- 3. Make user_id NOT NULL now that all rows are backfilled
-- ============================================================
alter table events             alter column user_id set not null;
alter table strava_tokens      alter column user_id set not null;
alter table strava_suggestions alter column user_id set not null;

-- strava_tokens: drop the old single-row check constraint (id = 1)
-- and replace with a per-user unique constraint
alter table strava_tokens drop constraint if exists strava_tokens_id_check;
alter table strava_tokens add constraint strava_tokens_user_id_key unique (user_id);

-- ============================================================
-- 4. Drop the old permissive write policies
-- ============================================================
drop policy if exists "Events are editable by owner"    on events;
drop policy if exists "Strava tokens owner only"        on strava_tokens;
drop policy if exists "Strava suggestions owner only"   on strava_suggestions;

-- ============================================================
-- 5. Create new user-scoped write policies
-- Events: public read stays unchanged (created in 001_init.sql)
-- ============================================================

-- Events: INSERT — only own rows
create policy "Events insert by owner"
  on events for insert
  with check (auth.uid() = user_id);

-- Events: UPDATE — only own rows
create policy "Events update by owner"
  on events for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Events: DELETE — only own rows
create policy "Events delete by owner"
  on events for delete
  using (auth.uid() = user_id);

-- Strava tokens: per user
create policy "Strava tokens owner only"
  on strava_tokens for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Strava suggestions: per user
create policy "Strava suggestions owner only"
  on strava_suggestions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

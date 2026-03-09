-- 12 Provincies Tracker — initial schema

-- Provinces (static reference table)
create table if not exists provinces (
  id   smallint primary key,
  name text not null,
  slug text not null unique
);

insert into provinces (id, name, slug) values
  (1,  'Groningen',    'groningen'),
  (2,  'Friesland',    'friesland'),
  (3,  'Drenthe',      'drenthe'),
  (4,  'Overijssel',   'overijssel'),
  (5,  'Flevoland',    'flevoland'),
  (6,  'Gelderland',   'gelderland'),
  (7,  'Utrecht',      'utrecht'),
  (8,  'Noord-Holland','noord-holland'),
  (9,  'Zuid-Holland', 'zuid-holland'),
  (10, 'Zeeland',      'zeeland'),
  (11, 'Noord-Brabant','noord-brabant'),
  (12, 'Limburg',      'limburg')
on conflict (id) do nothing;

-- Events
create table if not exists events (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  date                date not null,
  location            text,
  province_id         smallint not null references provinces(id),
  distance_category   text not null check (distance_category in ('10k', 'half', 'marathon')),
  status              text not null default 'interested'
                        check (status in ('interested', 'signed_up', 'completed', 'dns', 'dnf')),
  finish_time         text,           -- chip time as text, e.g. "1:45:32"
  timing_url          text,
  strava_activity_id  bigint unique,  -- linked Strava activity (after confirmation)
  notes               text,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- Strava tokens (single row)
create table if not exists strava_tokens (
  id             integer primary key default 1 check (id = 1), -- max 1 row
  access_token   text not null,
  refresh_token  text not null,
  expires_at     timestamptz not null,
  updated_at     timestamptz default now()
);

-- Strava suggested matches (pending confirmation)
create table if not exists strava_suggestions (
  id                  uuid primary key default gen_random_uuid(),
  strava_activity_id  bigint not null unique,
  event_id            uuid references events(id) on delete cascade,
  activity_name       text,
  activity_date       date,
  distance_meters     numeric,
  time_seconds        integer,
  created_at          timestamptz default now()
);

-- Row Level Security
alter table events enable row level security;
alter table strava_tokens enable row level security;
alter table strava_suggestions enable row level security;
alter table provinces enable row level security;

-- Provinces: public read
create policy "Provinces are public"
  on provinces for select using (true);

-- Events: public read
create policy "Events are public"
  on events for select using (true);

-- Events: authenticated write
create policy "Events are editable by owner"
  on events for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Strava tokens: authenticated only
create policy "Strava tokens owner only"
  on strava_tokens for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Strava suggestions: authenticated only
create policy "Strava suggestions owner only"
  on strava_suggestions for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

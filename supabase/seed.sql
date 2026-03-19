-- seed.sql — test data for preview branches
-- Creates one admin user + a spread of events and participations

-- ============================================================
-- 1. Auth user
-- ============================================================
-- Fixed UUID so we can reference it below
insert into auth.users (
  instance_id, id, aud, role,
  email, encrypted_password, email_confirmed_at,
  created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data
) values (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000001',
  'authenticated', 'authenticated',
  'test@test.com',
  crypt('test1234', gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}',
  '{}'
) on conflict (id) do nothing;

insert into auth.identities (
  id, user_id, provider_id, provider,
  identity_data, last_sign_in_at, created_at, updated_at
) values (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  'test@test.com',
  'email',
  format('{"sub":"%s","email":"%s"}',
    '00000000-0000-0000-0000-000000000001',
    'test@test.com')::jsonb,
  now(), now(), now()
) on conflict do nothing;

-- ============================================================
-- 2. Profile (admin)
-- ============================================================
insert into profiles (id, is_admin) values
  ('00000000-0000-0000-0000-000000000001', true)
on conflict (id) do update set is_admin = true;

-- ============================================================
-- 3. Events (shared catalog)
-- ============================================================
insert into events (id, name, date, location, province_id, distance_category, created_by) values
  ('10000000-0000-0000-0000-000000000001', 'Groningen Halve Marathon', '2025-04-06', 'Groningen', 1, 'half', '00000000-0000-0000-0000-000000000001'),
  ('10000000-0000-0000-0000-000000000002', 'Friesland Elfsteden 10K', '2025-05-11', 'Leeuwarden', 2, '10k', '00000000-0000-0000-0000-000000000001'),
  ('10000000-0000-0000-0000-000000000003', 'Drenthe Marathon', '2025-09-14', 'Assen', 3, 'marathon', '00000000-0000-0000-0000-000000000001'),
  ('10000000-0000-0000-0000-000000000004', 'Overijssel Halve', '2025-06-22', 'Zwolle', 4, 'half', '00000000-0000-0000-0000-000000000001'),
  ('10000000-0000-0000-0000-000000000005', 'Flevoland 10K', '2025-03-30', 'Almere', 5, '10k', '00000000-0000-0000-0000-000000000001'),
  ('10000000-0000-0000-0000-000000000006', 'Zevenheuvelenloop', '2025-11-16', 'Nijmegen', 6, '10k', '00000000-0000-0000-0000-000000000001'),
  ('10000000-0000-0000-0000-000000000007', 'Utrecht Marathon', '2025-04-13', 'Utrecht', 7, 'marathon', '00000000-0000-0000-0000-000000000001'),
  ('10000000-0000-0000-0000-000000000008', 'Amsterdam Marathon', '2025-10-19', 'Amsterdam', 8, 'marathon', '00000000-0000-0000-0000-000000000001')
on conflict (id) do nothing;

-- ============================================================
-- 4. Participations for the test user
-- ============================================================
insert into event_participations (event_id, user_id, status, finish_time) values
  -- completed with times
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'completed', '1:52:44'),
  ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'completed', '0:54:12'),
  -- signed up
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'signed_up', null),
  ('10000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 'signed_up', null),
  -- interested
  ('10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'interested', null)
on conflict (event_id, user_id) do nothing;

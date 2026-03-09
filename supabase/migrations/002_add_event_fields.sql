-- Add fields for upcoming vs completed event distinction

alter table events
  add column if not exists event_url               text,
  add column if not exists registration_deadline   date,
  add column if not exists actual_distance_km      numeric(5,2);

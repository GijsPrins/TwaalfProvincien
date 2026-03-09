-- Reset script — drops everything. Run this before re-running 001_init.sql.

drop table if exists strava_suggestions cascade;
drop table if exists strava_tokens      cascade;
drop table if exists events             cascade;
drop table if exists provinces          cascade;

-- Drop old Dutch table names too, in case they exist from a previous run
drop table if exists strava_voorstellen cascade;
drop table if exists evenementen        cascade;
drop table if exists provincies         cascade;

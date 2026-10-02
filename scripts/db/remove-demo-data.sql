-- Removes every sample listing and the sample owner accounts (migration 0018).
-- Run when real listings are live:  psql "$DATABASE_URL" -f scripts/db/remove-demo-data.sql
-- Sample photos in the property-photos bucket live under each demo owner's folder; delete
-- those folders from Supabase Studio (Storage) afterwards, since Storage files must be
-- removed through the Storage API rather than SQL.

delete from public.properties where is_demo;
delete from auth.users where email like 'demo-owner-%@sastaroomrent.netlify.app';
drop schema if exists demo_seed cascade;

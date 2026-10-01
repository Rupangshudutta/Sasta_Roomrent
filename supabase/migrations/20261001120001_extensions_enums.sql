-- 0001: extensions, enumerated types, shared trigger helpers.
-- Enum strings are part of the API contract (they appear in TypeScript types and URLs);
-- change them only with a migration that also updates the app.

create extension if not exists pg_trgm with schema extensions;
create extension if not exists citext with schema extensions;

create type public.user_role as enum ('tenant', 'owner', 'admin');
create type public.property_type as enum ('pg', 'shared_room', 'single_room', 'flat', 'hostel');
create type public.furnishing as enum ('furnished', 'semi_furnished', 'unfurnished');
create type public.gender_preference as enum ('any', 'male', 'female');
create type public.listing_status as enum ('draft', 'pending', 'approved', 'rejected', 'inactive');
create type public.booking_status as enum ('pending', 'accepted', 'rejected', 'cancelled', 'active', 'completed');
create type public.verification_status as enum ('pending', 'verified', 'rejected');
create type public.business_type as enum ('individual', 'company', 'agency', 'broker');
create type public.contact_interest as enum ('pg', 'shared', 'single', 'flat', 'owner', 'other');
create type public.notification_type as enum (
  'listing_approved', 'listing_rejected',
  'booking_requested', 'booking_accepted', 'booking_rejected', 'booking_cancelled',
  'booking_activated', 'booking_completed',
  'review_received', 'system'
);

-- Keeps updated_at honest without relying on application code.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- True when the current request is privileged: a service-role key, a migration, or a
-- direct superuser connection, i.e. NOT an end user coming through PostgREST with the
-- anon or authenticated role. We read the JWT role claim rather than current_user
-- because inside a SECURITY DEFINER function current_user is the function owner,
-- which would make every caller look privileged.
create or replace function public.is_privileged_session()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role',
    'service_role'
  ) not in ('anon', 'authenticated');
$$;

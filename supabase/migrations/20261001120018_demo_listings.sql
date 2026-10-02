-- 0018: Sample listings.
--
-- The marketplace launches with illustrative sample listings so visitors can see how it
-- works. They must never be mistaken for real rooms: they are flagged, badged in the UI,
-- refuse booking requests at the database level, and can be removed in one statement
-- (scripts/db/remove-demo-data.sql) once real owners have listed.

alter table public.properties add column is_demo boolean not null default false;
comment on column public.properties.is_demo is
  'Sample listing for demonstration. Shown with a badge; never accepts booking requests.';

create index properties_demo_idx on public.properties (is_demo) where is_demo;

-- Only the service role / migrations / admins may create sample listings. End users can
-- INSERT properties (0017) but cannot UPDATE this column (no column grant), so forcing it
-- off on insert is enough.
create or replace function public.properties_guard_demo_flag()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not (public.is_privileged_session() or public.is_admin()) then
    new.is_demo := false;
  end if;
  return new;
end;
$$;

create trigger properties_guard_demo_flag before insert on public.properties
  for each row execute function public.properties_guard_demo_flag();

revoke execute on function public.properties_guard_demo_flag() from public, anon, authenticated;

-- A booking request on a sample listing would reach no real owner, so refuse it with a
-- clear message before any other rule runs.
create or replace function public.bookings_reject_demo_listing()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (select 1 from public.properties p where p.id = new.property_id and p.is_demo) then
    raise exception 'this is a sample listing and does not accept booking requests'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

-- Trigger names fire alphabetically within the same timing: "bookings_a..." runs before
-- "bookings_before_insert", so the sample-listing message wins over generic checks.
create trigger bookings_a_reject_demo_listing before insert on public.bookings
  for each row execute function public.bookings_reject_demo_listing();

revoke execute on function public.bookings_reject_demo_listing() from public, anon, authenticated;

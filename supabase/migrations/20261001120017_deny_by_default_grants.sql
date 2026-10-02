-- 0017: Deny by default for the API roles (anon, authenticated).
--
-- Why: a real Supabase project gives `anon` and `authenticated` ALL privileges on every
-- table, sequence and function that `postgres` creates in `public` (default privileges).
-- Those table-wide grants override the column-level UPDATE grants of 0008, so an owner
-- could set is_featured / views_count on a listing or rewrite a booking's rent snapshot,
-- and internal SECURITY DEFINER helpers such as notify_user() and write_audit() became
-- callable through /rest/v1/rpc. The plain-Postgres CI shim did not have those defaults,
-- so the tests passed while production was exposed. The shim now mirrors Supabase.
--
-- Fix: stop the defaults for future objects, strip what they already granted, and
-- re-grant exactly the access model declared in 0002-0016. RLS still narrows rows.

-- 1. Future objects: no automatic grants to the API roles.
alter default privileges for role postgres in schema public revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on functions from anon, authenticated;

-- 2. Existing objects: remove every direct grant to the API roles. Functions keep the
--    standard PUBLIC execute unless a migration revoked it on purpose (notify_user,
--    write_audit, the admin RPCs ...), which is the behaviour those migrations assumed.
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all functions in schema public from anon, authenticated;

-- 3. Re-grant the intended model.
-- Tables (0008). RLS policies decide which rows each role sees.
grant select on
  public.profiles, public.owner_profiles, public.cities, public.localities, public.amenities,
  public.platform_settings, public.notifications, public.audit_log, public.contact_messages,
  public.properties, public.property_photos, public.property_amenities, public.bookings,
  public.favorites, public.reviews
to anon, authenticated;
grant insert, delete on
  public.properties, public.property_photos, public.property_amenities,
  public.bookings, public.favorites, public.reviews, public.notifications, public.owner_profiles
to authenticated;
grant insert on public.contact_messages to anon, authenticated;
grant update (first_name, last_name, phone, avatar_url) on public.profiles to authenticated;
grant update (business_name, business_type, experience, primary_location, tax_id, about)
  on public.owner_profiles to authenticated;
grant update (
  title, description, property_type, gender_preference, furnishing,
  rent_amount, security_deposit, maintenance_amount,
  address_line1, address_line2, locality, city_id, state, pincode, latitude, longitude,
  total_rooms, available_rooms, available_from, min_lease_months, house_rules,
  contact_phone, alt_contact_phone, status
) on public.properties to authenticated;
grant update (is_primary, sort_order) on public.property_photos to authenticated;
grant update (status, message, owner_note, cancel_reason) on public.bookings to authenticated;
grant update (rating, title, comment) on public.reviews to authenticated;
grant update (read_at) on public.notifications to authenticated;
grant insert, update, delete on public.cities, public.localities, public.amenities to authenticated;
grant update on public.platform_settings to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- Views (0009, 0011, 0013, 0014) and payments (0015).
grant select on public.owner_public_profiles, public.city_listing_stats,
  public.locality_listing_stats, public.public_reviews to anon, authenticated;
grant select on public.booking_party_names to authenticated;
grant select on public.payments, public.payment_events to authenticated;

-- Functions (0002, 0009, 0013, 0016).
grant execute on function public.current_user_role() to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.approve_listing(uuid) to authenticated;
grant execute on function public.reject_listing(uuid, text) to authenticated;
grant execute on function public.set_listing_featured(uuid, boolean) to authenticated;
grant execute on function public.set_user_active(uuid, boolean, text) to authenticated;
grant execute on function public.mark_contact_message(bigint, boolean) to authenticated;
grant execute on function public.set_user_role(uuid, public.user_role) to authenticated;
grant execute on function public.set_review_visibility(uuid, boolean, text) to authenticated;
grant execute on function public.get_booking_contacts(uuid) to authenticated;
grant execute on function public.increment_property_view(uuid) to anon, authenticated;
grant execute on function public.search_properties(
  text, text, public.property_type[], numeric, numeric, public.furnishing[],
  public.gender_preference, text[], numeric, text, integer, integer
) to anon, authenticated;
grant execute on function public.consume_rate_limit(text, integer, integer) to anon, authenticated;

-- Trigger functions and internal SECURITY DEFINER helpers are not API surface. Calling a
-- trigger function directly already fails, but keep them out of /rest/v1/rpc entirely.
do $$
declare
  fn regprocedure;
begin
  for fn in
    select p.oid::regprocedure
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.prorettype = 'trigger'::regtype
       and pg_get_userbyid(p.proowner) = current_user
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', fn);
  end loop;
end $$;

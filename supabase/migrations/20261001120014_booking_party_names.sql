-- 0014: display names of both parties of a booking, for the parties themselves.
-- Contact details (phone/email) still come only from get_booking_contacts(),
-- which applies the reveal rule; this view exposes names only, and only to the
-- tenant, the owner, or an admin. security_invoker=off lets it read profiles,
-- the WHERE clause is the access control.

create or replace view public.booking_party_names with (security_invoker = off) as
  select
    b.id as booking_id,
    t.first_name as tenant_first_name,
    t.last_name as tenant_last_name,
    o.first_name as owner_first_name,
    o.last_name as owner_last_name
  from public.bookings b
  join public.profiles t on t.id = b.tenant_id
  join public.profiles o on o.id = b.owner_id
  where auth.uid() = b.tenant_id or auth.uid() = b.owner_id or public.is_admin();

grant select on public.booking_party_names to authenticated, service_role;

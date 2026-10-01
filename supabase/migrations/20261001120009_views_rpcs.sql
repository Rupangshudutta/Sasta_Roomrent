-- 0009: public views and RPCs. RPCs are the only path for admin moderation and
-- for revealing contact details, so the rules live in one place and are audited.

-- Owner identity that may be shown on a public listing: name and avatar only.
-- security_invoker=off (the default) means the view reads with the owner's
-- privileges, bypassing profiles RLS, but exposes only these columns.
create view public.owner_public_profiles with (security_invoker = off) as
  select p.id, p.first_name, p.last_name, p.avatar_url, p.created_at as member_since
    from public.profiles p
   where p.role = 'owner' and p.is_active;
grant select on public.owner_public_profiles to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Admin moderation
-- ---------------------------------------------------------------------------
create or replace function public.approve_listing(p_property_id uuid)
returns public.properties
language plpgsql
security definer
set search_path = ''
as $$
declare
  result public.properties;
begin
  if not public.is_admin() then
    raise exception 'admin only' using errcode = '42501';
  end if;
  update public.properties
     set status = 'approved', rejection_reason = null
   where id = p_property_id and status in ('pending', 'rejected', 'inactive')
  returning * into result;
  if not found then
    raise exception 'listing not found or not awaiting review' using errcode = 'P0002';
  end if;
  perform public.write_audit('listing.approve', 'property', p_property_id::text, '{}'::jsonb);
  return result;
end;
$$;

create or replace function public.reject_listing(p_property_id uuid, p_reason text)
returns public.properties
language plpgsql
security definer
set search_path = ''
as $$
declare
  result public.properties;
begin
  if not public.is_admin() then
    raise exception 'admin only' using errcode = '42501';
  end if;
  if coalesce(trim(p_reason), '') = '' then
    raise exception 'a reason is required' using errcode = '23514';
  end if;
  update public.properties
     set status = 'rejected', rejection_reason = left(trim(p_reason), 1000)
   where id = p_property_id and status in ('pending', 'approved')
  returning * into result;
  if not found then
    raise exception 'listing not found or cannot be rejected from its current state' using errcode = 'P0002';
  end if;
  perform public.write_audit('listing.reject', 'property', p_property_id::text, jsonb_build_object('reason', left(trim(p_reason), 1000)));
  return result;
end;
$$;

create or replace function public.set_listing_featured(p_property_id uuid, p_featured boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'admin only' using errcode = '42501';
  end if;
  update public.properties set is_featured = p_featured where id = p_property_id;
  perform public.write_audit('listing.feature', 'property', p_property_id::text, jsonb_build_object('featured', p_featured));
end;
$$;

create or replace function public.set_user_active(p_user_id uuid, p_active boolean, p_reason text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'admin only' using errcode = '42501';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'you cannot change your own active status' using errcode = '42501';
  end if;
  update public.profiles set is_active = p_active where id = p_user_id;
  perform public.write_audit(case when p_active then 'user.activate' else 'user.block' end, 'profile', p_user_id::text,
    jsonb_build_object('reason', p_reason));
end;
$$;

create or replace function public.set_user_role(p_user_id uuid, p_role public.user_role)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'admin only' using errcode = '42501';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'you cannot change your own role' using errcode = '42501';
  end if;
  update public.profiles set role = p_role where id = p_user_id;
  if p_role = 'owner' then
    insert into public.owner_profiles (user_id) values (p_user_id) on conflict (user_id) do nothing;
  end if;
  perform public.write_audit('user.set_role', 'profile', p_user_id::text, jsonb_build_object('role', p_role));
end;
$$;

create or replace function public.set_review_visibility(p_review_id uuid, p_visible boolean, p_reason text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'admin only' using errcode = '42501';
  end if;
  update public.reviews
     set is_visible = p_visible, hidden_reason = case when p_visible then null else left(p_reason, 500) end
   where id = p_review_id;
  perform public.write_audit(case when p_visible then 'review.show' else 'review.hide' end, 'review', p_review_id::text,
    jsonb_build_object('reason', p_reason));
end;
$$;

create or replace function public.mark_contact_message(p_id bigint, p_read boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'admin only' using errcode = '42501';
  end if;
  update public.contact_messages
     set is_read = p_read,
         handled_by = case when p_read then auth.uid() else null end,
         handled_at = case when p_read then now() else null end
   where id = p_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Contact reveal. The owner always sees the tenant (to call back); the tenant
-- sees the owner only once the owner has accepted.
-- ---------------------------------------------------------------------------
create or replace function public.get_booking_contacts(p_booking_id uuid)
returns table (party text, full_name text, phone text, email text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  bk public.bookings%rowtype;
  actor uuid := auth.uid();
begin
  select * into bk from public.bookings where id = p_booking_id;
  if not found then
    return;
  end if;

  if actor = bk.owner_id or public.is_admin() then
    return query
      select 'tenant'::text, trim(p.first_name || ' ' || p.last_name), p.phone, u.email::text
        from public.profiles p
        join auth.users u on u.id = p.id
       where p.id = bk.tenant_id;
  end if;

  if (actor = bk.tenant_id and bk.status in ('accepted', 'active', 'completed')) or public.is_admin() then
    return query
      select 'owner'::text, trim(p.first_name || ' ' || p.last_name),
             coalesce(pr.contact_phone, p.phone), u.email::text
        from public.profiles p
        join auth.users u on u.id = p.id
        left join public.properties pr on pr.id = bk.property_id
       where p.id = bk.owner_id;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Public counters
-- ---------------------------------------------------------------------------
create or replace function public.increment_property_view(p_property_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.properties set views_count = views_count + 1
   where id = p_property_id and status = 'approved';
$$;

-- Lock down execution: only PostgREST roles that should call these.
revoke all on function public.approve_listing(uuid) from public;
revoke all on function public.reject_listing(uuid, text) from public;
revoke all on function public.set_listing_featured(uuid, boolean) from public;
revoke all on function public.set_user_active(uuid, boolean, text) from public;
revoke all on function public.mark_contact_message(bigint, boolean) from public;
revoke all on function public.set_user_role(uuid, public.user_role) from public;
revoke all on function public.set_review_visibility(uuid, boolean, text) from public;
revoke all on function public.get_booking_contacts(uuid) from public;
revoke all on function public.increment_property_view(uuid) from public;

grant execute on function public.approve_listing(uuid) to authenticated, service_role;
grant execute on function public.reject_listing(uuid, text) to authenticated, service_role;
grant execute on function public.set_listing_featured(uuid, boolean) to authenticated, service_role;
grant execute on function public.set_user_active(uuid, boolean, text) to authenticated, service_role;
grant execute on function public.mark_contact_message(bigint, boolean) to authenticated, service_role;
grant execute on function public.set_user_role(uuid, public.user_role) to authenticated, service_role;
grant execute on function public.set_review_visibility(uuid, boolean, text) to authenticated, service_role;
grant execute on function public.get_booking_contacts(uuid) to authenticated, service_role;
grant execute on function public.increment_property_view(uuid) to anon, authenticated, service_role;

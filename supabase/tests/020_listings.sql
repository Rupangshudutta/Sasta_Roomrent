-- Listings: ownership, lifecycle, moderation, public visibility.
begin;

select tests.create_user('t@test.local', '{"first_name":"Tenant"}') as id \gset tenant_
select tests.create_user('o@test.local', '{"role":"owner","first_name":"Owner"}') as id \gset owner_
select tests.create_user('o2@test.local', '{"role":"owner","first_name":"Other"}') as id \gset other_
select tests.create_user('a@test.local', '{"first_name":"Admin"}') as id \gset admin_
update public.profiles set role = 'admin' where id = :'admin_id';
select id as id from public.cities where slug = 'bangalore' \gset city_

-- a tenant cannot create a listing
select tests.login(:'tenant_id');
select tests.expect_error(format($q$
  insert into public.properties (owner_id, title, property_type, rent_amount, address_line1, locality, city_id, state, pincode, contact_phone)
  values (%L, 'Tenant tries to list a room', 'pg', 8000, '12 MG Road', 'Koramangala', %s, 'Karnataka', '560034', '9876543210')
$q$, :'tenant_id', :'city_id'), '42501', 'tenant insert blocked by RLS');
select tests.logout();

-- owner creates a draft, cannot spoof owner_id or status=approved
select tests.login(:'owner_id');
select tests.expect_error(format($q$
  insert into public.properties (owner_id, title, property_type, rent_amount, address_line1, locality, city_id, state, pincode, contact_phone)
  values (%L, 'Spoofed owner listing here', 'pg', 8000, '12 MG Road', 'Koramangala', %s, 'Karnataka', '560034', '9876543210')
$q$, :'other_id', :'city_id'), '42501', 'owner_id spoof');
select tests.expect_error(format($q$
  insert into public.properties (owner_id, title, property_type, rent_amount, address_line1, locality, city_id, state, pincode, contact_phone, status)
  values (%L, 'Self approved listing here', 'pg', 8000, '12 MG Road', 'Koramangala', %s, 'Karnataka', '560034', '9876543210', 'approved')
$q$, :'owner_id', :'city_id'), '42501', 'self approve on insert');

insert into public.properties (owner_id, title, property_type, rent_amount, security_deposit, address_line1, locality, city_id, state, pincode, contact_phone, total_rooms, available_rooms)
values (:'owner_id', 'Sunny PG near Forum Mall', 'pg', 9500, 10000, '12 MG Road', 'Koramangala', :'city_id', 'Karnataka', '560034', '9876543210', 3, 3)
returning id \gset prop_

select tests.assert((select status from public.properties where id = :'prop_id') = 'draft', 'new listing is draft');
select tests.expect_error(format('update public.properties set is_featured = true where id = %L', :'prop_id'), '42501', 'owner sets featured');
select tests.expect_error(format('update public.properties set views_count = 999 where id = %L', :'prop_id'), '42501', 'owner sets views');
select tests.expect_error(format('update public.properties set rejection_reason = null, approved_at = now() where id = %L', :'prop_id'), '42501', 'owner sets moderation columns');

-- submit for review
update public.properties set status = 'pending' where id = :'prop_id';
select tests.assert((select status = 'pending' and submitted_at is not null from public.properties where id = :'prop_id'), 'submitted');
select tests.expect_error(format('update public.properties set status = ''approved'' where id = %L', :'prop_id'), '42501', 'owner self-approve');
select tests.logout();

-- other owner cannot see or touch it
select tests.login(:'other_id');
select tests.assert((select count(*) from public.properties where id = :'prop_id') = 0, 'pending listing hidden from other owner');
select tests.logout();

-- anon cannot see pending
select tests.anon();
select tests.assert((select count(*) from public.properties where id = :'prop_id') = 0, 'pending listing hidden from public');
select tests.logout();

-- admin rejects without reason -> error; rejects with reason -> notification
select tests.login(:'admin_id');
select tests.expect_error(format('select public.reject_listing(%L, ''  '')', :'prop_id'), '23514', 'reject needs reason');
select public.reject_listing(:'prop_id', 'Photos are missing');
select tests.assert((select status = 'rejected' and rejection_reason = 'Photos are missing' from public.properties where id = :'prop_id'), 'rejected with reason');
select tests.assert(exists (select 1 from public.audit_log where entity_id = :'prop_id' and action = 'listing.reject'), 'audit written');
select tests.logout();
select tests.assert(exists (select 1 from public.notifications where user_id = :'owner_id' and type = 'listing_rejected'), 'owner notified of rejection');

-- owner fixes and resubmits; admin approves; public can see it
select tests.login(:'owner_id');
update public.properties set status = 'pending' where id = :'prop_id';
select tests.logout();
select tests.login(:'admin_id');
select public.approve_listing(:'prop_id');
select tests.assert((select status = 'approved' and approved_at is not null and approved_by = :'admin_id' from public.properties where id = :'prop_id'), 'approved');
select tests.logout();

select tests.anon();
select tests.assert((select count(*) from public.properties where id = :'prop_id') = 1, 'approved listing is public');
select tests.assert((select count(*) from public.owner_public_profiles where id = :'owner_id') = 1, 'owner public profile visible');
select tests.expect_error('select phone from public.owner_public_profiles', '42703', 'public profile has no phone column');
select public.increment_property_view(:'prop_id');
select tests.assert((select views_count from public.properties where id = :'prop_id') = 1, 'view counted');
select tests.logout();

-- material edit of an approved listing goes back to pending; non-material edit does not
select tests.login(:'owner_id');
update public.properties set available_rooms = 2 where id = :'prop_id';
select tests.assert((select status from public.properties where id = :'prop_id') = 'approved', 'availability edit keeps approval');
update public.properties set rent_amount = 12000 where id = :'prop_id';
select tests.assert((select status from public.properties where id = :'prop_id') = 'pending', 'price edit re-enters review');
select tests.expect_error(format('update public.properties set status = ''inactive'' where id = %L', :'prop_id'), '42501', 'pending cannot go inactive');
select tests.logout();

-- tenant cannot be an admin via RPC
select tests.login(:'tenant_id');
select tests.expect_error(format('select public.approve_listing(%L)', :'prop_id'), '42501', 'tenant calling approve');
select tests.logout();

rollback;

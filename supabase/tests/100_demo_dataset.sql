-- The sample dataset loads cleanly through every constraint and trigger, is clearly
-- flagged, refuses bookings, and can be removed completely.
begin;

select tests.create_user(format('demo-owner-%s@sastaroomrent.netlify.app', lpad(n::text, 2, '0')),
  jsonb_build_object('role', 'owner', 'first_name', 'Owner', 'last_name', n::text))
from generate_series(1, 12) as n;

\ir ../demo/demo_listings.sql

select tests.assert((select count(*) from public.properties where is_demo and status = 'approved') = 56, '56 approved sample listings');
select tests.assert((select count(distinct city_id) from public.properties where is_demo) = 7, 'every city has sample listings');
select tests.assert(not exists (
  select 1 from public.properties p where p.is_demo
     and (select count(*) from public.property_amenities a where a.property_id = p.id) < 5
), 'each sample listing has at least 5 amenities');
select tests.assert((select count(*) from demo_seed.photo_plan where cardinality(photo_ids) = 3) = 56, 'photo plan has 3 images per listing');
select tests.assert(not exists (select 1 from demo_seed.photo_plan where array_position(photo_ids, null) is not null), 'no empty photo slots');
select tests.assert((select count(*) from public.properties where is_demo and is_featured) between 5 and 12, 'a handful are featured');
select tests.assert((select listing_count from public.city_listing_stats where slug = 'bangalore') = 8, 'stats count sample listings');

-- Re-running is a no-op.
\ir ../demo/demo_listings.sql
select tests.assert((select count(*) from public.properties where is_demo) = 56, 'loading twice adds nothing');

-- Visible to anonymous visitors like any approved listing.
select tests.anon();
select tests.assert((select count(*) from public.properties where is_demo) = 56, 'anon sees sample listings');
select tests.logout();

-- A tenant cannot request a sample room, and cannot create or promote a sample listing.
select tests.create_user('demo-tenant@test.local', '{"first_name":"Tara","phone":"9000000051"}') as id \gset t_
select tests.create_user('demo-real-owner@test.local', '{"role":"owner","first_name":"Real","phone":"9000000052"}') as id \gset ro_
select id as city_id from public.cities where slug = 'pune' \gset

select tests.login(:'t_id');
select tests.expect_error(format(
  'insert into public.bookings (property_id, tenant_id, move_in_date, lease_months) values (%L, %L, current_date + 30, 12)',
  md5('sasta-room-demo-listing-3')::uuid, :'t_id'), '42501', 'booking a sample listing');
select tests.logout();

select tests.login(:'ro_id');
insert into public.properties (owner_id, title, property_type, rent_amount, address_line1, locality, city_id, state, pincode, contact_phone, is_demo)
values (:'ro_id', 'A real owner trying to set the sample flag', 'pg', 9000, '1 Main Road', 'Baner', :'city_id', 'Maharashtra', '411045', '9000000052', true)
returning id \gset real_
select tests.assert((select not is_demo from public.properties where id = :'real_id'), 'is_demo forced off for owners');
select tests.expect_error(format('update public.properties set is_demo = true where id = %L', :'real_id'), '42501', 'owner flips is_demo');
select tests.logout();

-- Cleanup removes everything the dataset created.
\ir ../../scripts/db/remove-demo-data.sql
select tests.assert(not exists (select 1 from public.properties where is_demo), 'no sample listings left');
select tests.assert(not exists (select 1 from public.profiles where email like 'demo-owner-%'), 'no sample owners left');
select tests.assert(not exists (select 1 from pg_namespace where nspname = 'demo_seed'), 'staging schema dropped');
select tests.assert(exists (select 1 from public.properties where id = :'real_id'), 'real listings untouched');

rollback;

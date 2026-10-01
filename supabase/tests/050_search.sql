-- Public search: visibility, filters, all-amenities rule, gender logic, sorting.
begin;

select tests.create_user('so@test.local', '{"role":"owner","first_name":"Search","phone":"9000000011"}') as id \gset owner_
select id as id from public.cities where slug = 'bangalore' \gset blr_
select id as id from public.cities where slug = 'pune' \gset pune_
select id as id from public.amenities where slug = 'wifi' \gset wifi_
select id as id from public.amenities where slug = 'ac' \gset ac_

insert into public.properties (owner_id, title, property_type, rent_amount, address_line1, locality, city_id, state, pincode, contact_phone, gender_preference, furnishing, status, approved_at)
values
  (:'owner_id', 'Koramangala female PG with wifi', 'pg', 9000, '1 Road', 'Koramangala', :'blr_id', 'Karnataka', '560034', '9000000011', 'female', 'furnished', 'approved', now() - interval '2 days'),
  (:'owner_id', 'Whitefield single room anyone', 'single_room', 14000, '2 Road', 'Whitefield', :'blr_id', 'Karnataka', '560066', '9000000011', 'any', 'semi_furnished', 'approved', now() - interval '1 day'),
  (:'owner_id', 'Kothrud flat share male only', 'flat', 11000, '3 Road', 'Kothrud', :'pune_id', 'Maharashtra', '411038', '9000000011', 'male', 'unfurnished', 'approved', now()),
  (:'owner_id', 'Hidden pending listing wifi', 'pg', 5000, '4 Road', 'Koramangala', :'blr_id', 'Karnataka', '560034', '9000000011', 'any', 'furnished', 'pending', null);

select id as id from public.properties where title like 'Koramangala female%' \gset p1_
select id as id from public.properties where title like 'Whitefield single%' \gset p2_
select id as id from public.properties where title like 'Kothrud flat%' \gset p3_
insert into public.property_amenities (property_id, amenity_id) values (:'p1_id', :'wifi_id'), (:'p1_id', :'ac_id'), (:'p2_id', :'wifi_id');

select tests.anon();

select tests.assert((select count(*) from public.search_properties()) = 3, 'anon sees exactly the 3 approved listings');
select tests.assert((select max(total_count) from public.search_properties(p_limit => 1)) = 3, 'total_count is the full match count, not the page size');
select tests.assert((select count(*) from public.search_properties(p_city => 'pune')) = 1, 'city filter');
select tests.assert((select count(*) from public.search_properties(p_q => 'koramangala')) = 1, 'locality text search hides the pending one');
select tests.assert((select count(*) from public.search_properties(p_q => 'Bangalore')) = 2, 'city name search');
select tests.assert((select count(*) from public.search_properties(p_types => array['pg','flat']::public.property_type[])) = 2, 'type filter');
select tests.assert((select count(*) from public.search_properties(p_min_rent => 10000, p_max_rent => 12000)) = 1, 'rent range');
select tests.assert((select count(*) from public.search_properties(p_gender => 'male')) = 2, 'male tenant sees any + male');
select tests.assert((select count(*) from public.search_properties(p_gender => 'female')) = 2, 'female tenant sees any + female');
select tests.assert((select count(*) from public.search_properties(p_amenities => array['wifi'])) = 2, 'single amenity');
select tests.assert((select count(*) from public.search_properties(p_amenities => array['wifi','ac'])) = 1, 'ALL amenities must match');
select tests.assert((select count(*) from public.search_properties(p_furnishing => array['furnished']::public.furnishing[])) = 1, 'furnishing filter');
select tests.assert((select count(*) from public.search_properties(p_min_rating => 4)) = 0, 'min rating excludes unrated');
select tests.assert((select property_id from public.search_properties(p_sort => 'price_low') limit 1) = :'p1_id', 'sort price low');
select tests.assert((select property_id from public.search_properties(p_sort => 'price_high') limit 1) = :'p2_id', 'sort price high');
select tests.assert((select property_id from public.search_properties(p_sort => 'newest') limit 1) = :'p3_id', 'sort newest');
select tests.assert((select count(*) from public.public_reviews) = 0, 'public reviews view readable by anon');

select tests.logout();
rollback;

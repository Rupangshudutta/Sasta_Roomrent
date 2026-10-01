-- Bookings: snapshot, transitions, inventory, contact reveal, reviews.
begin;

select tests.create_user('t1@test.local', '{"first_name":"Tenant","last_name":"One","phone":"9000000001"}') as id \gset t1_
select tests.create_user('t2@test.local', '{"first_name":"Tenant","last_name":"Two","phone":"9000000002"}') as id \gset t2_
select tests.create_user('ow@test.local', '{"role":"owner","first_name":"Owner","phone":"9000000009"}') as id \gset owner_
select tests.create_user('adm@test.local', '{"first_name":"Admin"}') as id \gset admin_
update public.profiles set role = 'admin' where id = :'admin_id';
select id as id from public.cities where slug = 'mumbai' \gset city_

-- approved listing with 1 room
insert into public.properties (owner_id, title, property_type, rent_amount, security_deposit, address_line1, locality, city_id, state, pincode, contact_phone, total_rooms, available_rooms, min_lease_months, status)
values (:'owner_id', 'Single room in Powai flat', 'single_room', 15000, 30000, '5 Hiranandani', 'Powai', :'city_id', 'Maharashtra', '400076', '9000000009', 1, 1, 3, 'approved')
returning id \gset prop_

-- draft listing (not bookable)
insert into public.properties (owner_id, title, property_type, rent_amount, address_line1, locality, city_id, state, pincode, contact_phone)
values (:'owner_id', 'Draft room not yet live', 'pg', 7000, '9 Some Road', 'Andheri', :'city_id', 'Maharashtra', '400053', '9000000009')
returning id \gset draft_

-- owner cannot book own listing; tenant cannot book draft; lease below minimum rejected
select tests.login(:'owner_id');
select tests.expect_error(format('insert into public.bookings (property_id, tenant_id, move_in_date, lease_months) values (%L, %L, current_date + 7, 6)', :'prop_id', :'owner_id'), '42501', 'owner books own');
select tests.logout();

select tests.login(:'t1_id');
select tests.expect_error(format('insert into public.bookings (property_id, tenant_id, move_in_date, lease_months) values (%L, %L, current_date + 7, 6)', :'draft_id', :'t1_id'), '42501', 'book draft');
select tests.expect_error(format('insert into public.bookings (property_id, tenant_id, move_in_date, lease_months) values (%L, %L, current_date + 7, 1)', :'prop_id', :'t1_id'), '23514', 'lease below minimum');
select tests.expect_error(format('insert into public.bookings (property_id, tenant_id, move_in_date, lease_months) values (%L, %L, current_date - 1, 6)', :'prop_id', :'t1_id'), '23514', 'past move-in');
select tests.expect_error(format('insert into public.bookings (property_id, tenant_id, move_in_date, lease_months) values (%L, %L, current_date + 7, 6)', :'prop_id', :'t2_id'), '42501', 'spoof tenant_id');

-- valid request; snapshot and status forced
insert into public.bookings (property_id, tenant_id, move_in_date, lease_months, message, monthly_rent, status)
values (:'prop_id', :'t1_id', current_date + 7, 6, 'Hi, I work nearby', 1, 'accepted')
returning id \gset b1_
select tests.assert((select status = 'pending' and monthly_rent = 15000 and security_deposit = 30000 and total_amount = 120000 and owner_id = :'owner_id' from public.bookings where id = :'b1_id'), 'snapshot + forced pending');
select tests.expect_error(format('insert into public.bookings (property_id, tenant_id, move_in_date, lease_months) values (%L, %L, current_date + 8, 6)', :'prop_id', :'t1_id'), '23505', 'second pending request blocked');
select tests.expect_error(format('update public.bookings set status = ''accepted'' where id = %L', :'b1_id'), '42501', 'tenant self-accepts');
-- tenant cannot see owner contact before acceptance
select tests.assert((select count(*) from public.get_booking_contacts(:'b1_id')) = 0, 'no owner contact while pending');
select tests.logout();

-- second tenant also requests (allowed: different tenant)
select tests.login(:'t2_id');
insert into public.bookings (property_id, tenant_id, move_in_date, lease_months) values (:'prop_id', :'t2_id', current_date + 10, 4) returning id \gset b2_
select tests.assert((select count(*) from public.bookings) = 1, 'tenant 2 sees only own booking');
select tests.logout();

-- owner sees both, sees tenant contact immediately, accepts the first
select tests.login(:'owner_id');
select tests.assert((select count(*) from public.bookings) = 2, 'owner sees requests on own listing');
select tests.assert(exists (select 1 from public.get_booking_contacts(:'b1_id') where party = 'tenant' and phone = '9000000001' and email = 't1@test.local'), 'owner sees tenant contact');
select tests.expect_error(format('update public.bookings set monthly_rent = 1 where id = %L', :'b1_id'), '42501', 'owner edits rent snapshot');
select tests.expect_error(format('update public.bookings set status = ''active'' where id = %L', :'b1_id'), '42501', 'pending -> active not allowed');
update public.bookings set status = 'accepted', owner_note = 'Welcome!' where id = :'b1_id';
select tests.assert((select status = 'accepted' and decided_at is not null and monthly_rent = 15000 from public.bookings where id = :'b1_id'), 'accepted; money immutable');
select tests.assert((select available_rooms from public.properties where id = :'prop_id') = 0, 'room inventory decremented');
-- no rooms left: accepting the second fails
select tests.expect_error(format('update public.bookings set status = ''accepted'' where id = %L', :'b2_id'), '23514', 'no rooms left');
update public.bookings set status = 'rejected' where id = :'b2_id';
select tests.logout();

-- tenant 1 now sees owner contact; tenant 2 never does; notifications delivered
select tests.login(:'t1_id');
select tests.assert(exists (select 1 from public.get_booking_contacts(:'b1_id') where party = 'owner' and phone = '9000000009'), 'tenant sees owner contact after acceptance');
select tests.assert(exists (select 1 from public.notifications where user_id = :'t1_id' and type = 'booking_accepted'), 'tenant notified');
select tests.assert((select count(*) from public.get_booking_contacts(:'b2_id')) = 0, 'tenant 1 cannot read booking 2 contacts');
-- review not yet allowed (accepted, not active)
select tests.expect_error(format('insert into public.reviews (property_id, booking_id, tenant_id, rating, comment) values (%L, %L, %L, 5, ''Great'')', :'prop_id', :'b1_id', :'t1_id'), '42501', 'review before active');
select tests.logout();

select tests.login(:'t2_id');
select tests.assert((select count(*) from public.get_booking_contacts(:'b2_id')) = 0, 'rejected tenant gets no owner contact');
select tests.assert(exists (select 1 from public.notifications where user_id = :'t2_id' and type = 'booking_rejected'), 'tenant 2 notified of rejection');
select tests.logout();

-- owner activates; tenant reviews; rating recomputed; duplicate review blocked
select tests.login(:'owner_id');
update public.bookings set status = 'active' where id = :'b1_id';
select tests.logout();
select tests.login(:'t1_id');
insert into public.reviews (property_id, booking_id, tenant_id, rating, comment) values (:'prop_id', :'b1_id', :'t1_id', 4, 'Clean and quiet');
select tests.assert((select rating_avg = 4 and rating_count = 1 from public.properties where id = :'prop_id'), 'rating recomputed');
select tests.expect_error(format('insert into public.reviews (property_id, booking_id, tenant_id, rating) values (%L, %L, %L, 5)', :'prop_id', :'b1_id', :'t1_id'), '23505', 'duplicate review');
select tests.logout();

-- t2 cannot review a stay they never had
select tests.login(:'t2_id');
select tests.expect_error(format('insert into public.reviews (property_id, booking_id, tenant_id, rating) values (%L, %L, %L, 1)', :'prop_id', :'b1_id', :'t2_id'), null, 'review someone else''s stay');
select tests.logout();

-- admin hides the review; rating recomputed; author cannot unhide
select tests.login(:'admin_id');
select public.set_review_visibility((select id from public.reviews where booking_id = :'b1_id'), false, 'spam');
select tests.assert((select rating_count from public.properties where id = :'prop_id') = 0, 'hidden review excluded from rating');
select tests.expect_error(format('select public.set_user_role(%L, ''tenant'')', :'admin_id'), '42501', 'admin changes own role');
select public.set_user_role(:'t2_id', 'owner');
select tests.assert(exists (select 1 from public.owner_profiles where user_id = :'t2_id'), 'promoted user gets owner profile');
select tests.logout();
select tests.login(:'t1_id');
select tests.expect_error(format('update public.reviews set is_visible = true where booking_id = %L', :'b1_id'), '42501', 'author unhides review');
select tests.assert((select count(*) from public.reviews where booking_id = :'b1_id') = 1, 'author still sees own hidden review');
select tests.logout();

-- completion restores inventory
select tests.login(:'owner_id');
update public.bookings set status = 'completed' where id = :'b1_id';
select tests.assert((select available_rooms from public.properties where id = :'prop_id') = 1, 'room restored on completion');
select tests.logout();

-- anon can read the visible review but no bookings
select tests.anon();
select tests.assert((select count(*) from public.reviews where property_id = :'prop_id') = 0, 'hidden review not public');
select tests.assert((select count(*) from public.bookings) = 0, 'anon sees no bookings');
select tests.logout();

rollback;

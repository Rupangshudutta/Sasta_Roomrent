-- booking_party_names: visible to the two parties and admins only.
begin;

select tests.create_user('bn-t@test.local', '{"first_name":"Tara","last_name":"Nair"}') as id \gset t_
select tests.create_user('bn-x@test.local', '{"first_name":"Xavier"}') as id \gset x_
select tests.create_user('bn-o@test.local', '{"role":"owner","first_name":"Omar","last_name":"Khan","phone":"9000000022"}') as id \gset o_
select tests.create_user('bn-a@test.local', '{"first_name":"Admin"}') as id \gset a_
update public.profiles set role = 'admin' where id = :'a_id';
select id as id from public.cities where slug = 'chennai' \gset city_

insert into public.properties (owner_id, title, property_type, rent_amount, address_line1, locality, city_id, state, pincode, contact_phone, status, approved_at)
values (:'o_id', 'Velachery room for names test', 'single_room', 9000, '7 Lane', 'Velachery', :'city_id', 'Tamil Nadu', '600042', '9000000022', 'approved', now())
returning id \gset p_

select tests.login(:'t_id');
insert into public.bookings (property_id, tenant_id, move_in_date, lease_months) values (:'p_id', :'t_id', current_date + 3, 2) returning id \gset b_
select tests.assert((select tenant_first_name = 'Tara' and owner_first_name = 'Omar' from public.booking_party_names where booking_id = :'b_id'), 'tenant sees both names');
select tests.logout();

select tests.login(:'o_id');
select tests.assert((select tenant_last_name from public.booking_party_names where booking_id = :'b_id') = 'Nair', 'owner sees tenant name');
select tests.logout();

select tests.login(:'x_id');
select tests.assert((select count(*) from public.booking_party_names where booking_id = :'b_id') = 0, 'third party sees nothing');
select tests.logout();

select tests.login(:'a_id');
select tests.assert((select count(*) from public.booking_party_names where booking_id = :'b_id') = 1, 'admin sees names');
select tests.logout();

select tests.anon();
select tests.expect_error('select * from public.booking_party_names', '42501', 'anon has no grant');
select tests.logout();

rollback;

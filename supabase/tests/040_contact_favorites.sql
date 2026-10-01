-- Contact messages and favorites.
begin;

select tests.create_user('fav@test.local', '{"first_name":"Fav"}') as id \gset tenant_
select tests.create_user('own@test.local', '{"role":"owner","first_name":"Own"}') as id \gset owner_
select tests.create_user('adm2@test.local', '{"first_name":"Admin"}') as id \gset admin_
update public.profiles set role = 'admin' where id = :'admin_id';
select id as id from public.cities where slug = 'pune' \gset city_

insert into public.properties (owner_id, title, property_type, rent_amount, address_line1, locality, city_id, state, pincode, contact_phone, status)
values (:'owner_id', 'Cozy flat share in Kothrud', 'flat', 11000, '1 Paud Road', 'Kothrud', :'city_id', 'Maharashtra', '411038', '9123456789', 'approved')
returning id \gset prop_

-- anon can send a contact message but cannot read any
select tests.anon();
insert into public.contact_messages (name, email, phone, interest, message) values ('Visitor', 'visitor@example.com', '9876501234', 'pg', 'Looking for a PG in Pune');
select tests.expect_error('insert into public.contact_messages (name, email, message, is_read) values (''X'', ''x@example.com'', ''hello there'', true)', '42501', 'cannot pre-mark read');
select tests.assert((select count(*) from public.contact_messages) = 0, 'anon cannot read messages');
select tests.logout();

-- admin reads and marks handled
select tests.login(:'admin_id');
select tests.assert((select count(*) from public.contact_messages) = 1, 'admin reads inbox');
select public.mark_contact_message((select id from public.contact_messages limit 1), true);
select tests.assert((select is_read and handled_by = :'admin_id' from public.contact_messages limit 1), 'marked handled');
select tests.logout();

-- favorites are private
select tests.login(:'tenant_id');
insert into public.favorites (user_id, property_id) values (:'tenant_id', :'prop_id');
select tests.expect_error(format('insert into public.favorites (user_id, property_id) values (%L, %L)', :'owner_id', :'prop_id'), '42501', 'favorite for someone else');
select tests.assert((select count(*) from public.favorites) = 1, 'own favorite visible');
select tests.logout();
select tests.login(:'owner_id');
select tests.assert((select count(*) from public.favorites) = 0, 'favorites hidden from others');
select tests.logout();

rollback;

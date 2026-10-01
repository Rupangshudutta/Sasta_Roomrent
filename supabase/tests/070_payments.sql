-- Payments: server-only writes, party reads, one paid token per booking, notifications.
begin;

select tests.create_user('pay-t@test.local', '{"first_name":"Pay","last_name":"Tenant","phone":"9000000031"}') as id \gset t_
select tests.create_user('pay-o@test.local', '{"role":"owner","first_name":"Pay","last_name":"Owner","phone":"9000000032"}') as id \gset o_
select tests.create_user('pay-x@test.local', '{"first_name":"Other"}') as id \gset x_
select id as id from public.cities where slug = 'hyderabad' \gset city_

insert into public.properties (owner_id, title, property_type, rent_amount, security_deposit, address_line1, locality, city_id, state, pincode, contact_phone, status, approved_at)
values (:'o_id', 'Gachibowli room for payments test', 'single_room', 12000, 12000, '9 Lane', 'Gachibowli', :'city_id', 'Telangana', '500032', '9000000032', 'approved', now())
returning id \gset p_

select tests.login(:'t_id');
insert into public.bookings (property_id, tenant_id, move_in_date, lease_months) values (:'p_id', :'t_id', current_date + 5, 3) returning id \gset b_
select tests.logout();
select tests.login(:'o_id');
update public.bookings set status = 'accepted' where id = :'b_id';
select tests.logout();

-- end users cannot create payment rows
select tests.login(:'t_id');
select tests.expect_error(format($q$insert into public.payments (booking_id, payer_id, payee_id, purpose, amount, razorpay_order_id) values (%L, %L, %L, 'booking_token', 499, 'order_test1')$q$, :'b_id', :'t_id', :'o_id'), '42501', 'tenant inserts payment');
select tests.logout();

-- the server (privileged) creates and confirms
insert into public.payments (booking_id, payer_id, payee_id, purpose, amount, razorpay_order_id)
values (:'b_id', :'t_id', :'o_id', 'booking_token', 499, 'order_test1') returning id \gset pay_
update public.payments set status = 'paid', razorpay_payment_id = 'pay_test1', paid_at = now() where id = :'pay_id';
select tests.assert(exists (select 1 from public.notifications where user_id = :'o_id' and title = 'Booking token received'), 'owner notified of payment');
select tests.assert(exists (select 1 from public.notifications where user_id = :'t_id' and title = 'Payment confirmed'), 'tenant notified of payment');

-- a second paid token for the same booking is impossible
insert into public.payments (booking_id, payer_id, payee_id, purpose, amount, razorpay_order_id)
values (:'b_id', :'t_id', :'o_id', 'booking_token', 499, 'order_test2') returning id \gset pay2_
select tests.expect_error(format('update public.payments set status = ''paid'' where id = %L', :'pay2_id'), '23505', 'second paid token');

-- reads: payer, payee, admin yes; stranger no; users cannot update
select tests.login(:'t_id');
select tests.assert((select count(*) from public.payments where booking_id = :'b_id') = 2, 'tenant reads own payments');
select tests.expect_error(format('update public.payments set status = ''refunded'' where id = %L', :'pay_id'), '42501', 'tenant updates payment');
select tests.logout();
select tests.login(:'o_id');
select tests.assert((select count(*) from public.payments where booking_id = :'b_id') = 2, 'owner reads payments on own booking');
select tests.logout();
select tests.login(:'x_id');
select tests.assert((select count(*) from public.payments) = 0, 'stranger sees no payments');
select tests.assert((select count(*) from public.payment_events) = 0, 'stranger sees no webhook events');
select tests.logout();

rollback;

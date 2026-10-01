-- Profiles: bootstrap trigger, role lock, visibility.
begin;

select tests.create_user('tenant1@test.local', '{"first_name":"Asha","last_name":"Rao","phone":"9876543210"}') as id \gset tenant_
select tests.create_user('owner1@test.local', '{"role":"owner","first_name":"Ravi","business_name":"Ravi PG","business_type":"individual"}') as id \gset owner_
select tests.create_user('hacker@test.local', '{"role":"admin","first_name":"Mallory"}') as id \gset hacker_
select tests.create_user('admin@test.local', '{"first_name":"Admin"}') as id \gset admin_
update public.profiles set role = 'admin' where id = :'admin_id';

-- bootstrap
select tests.assert((select role from public.profiles where id = :'tenant_id') = 'tenant', 'default role is tenant');
select tests.assert((select phone from public.profiles where id = :'tenant_id') = '9876543210', 'phone copied from metadata');
select tests.assert((select email from public.profiles where id = :'tenant_id') = 'tenant1@test.local', 'email copied from auth.users');
update auth.users set email = 'tenant1-new@test.local' where id = :'tenant_id';
select tests.assert((select email from public.profiles where id = :'tenant_id') = 'tenant1-new@test.local', 'email kept in sync');
select tests.assert((select role from public.profiles where id = :'owner_id') = 'owner', 'owner role honoured');
select tests.assert(exists (select 1 from public.owner_profiles where user_id = :'owner_id' and business_name = 'Ravi PG'), 'owner profile created');
select tests.assert((select role from public.profiles where id = :'hacker_id') = 'tenant', 'admin role from sign-up metadata is downgraded to tenant');

-- role lock: a user cannot promote themselves
select tests.login(:'tenant_id');
select tests.expect_error(format('update public.profiles set role = ''admin'' where id = %L', :'tenant_id'), '42501', 'self promotion');
select tests.expect_error(format('update public.profiles set is_active = false where id = %L', :'tenant_id'), '42501', 'self deactivate');
select tests.expect_error(format('update public.profiles set email = ''x@y.z'' where id = %L', :'tenant_id'), '42501', 'user edits email copy');
update public.profiles set first_name = 'Asha K' where id = :'tenant_id';
select tests.assert((select first_name from public.profiles where id = :'tenant_id') = 'Asha K', 'user can edit own name');

-- visibility: a tenant sees only themselves
select tests.assert((select count(*) from public.profiles) = 1, 'tenant sees exactly one profile');
select tests.assert(not public.is_admin(), 'tenant is not admin');
select tests.logout();

-- admin sees everyone and can change roles
select tests.login(:'admin_id');
select tests.assert(public.is_admin(), 'admin is admin');
select tests.assert((select count(*) from public.profiles) = 4, 'admin sees all profiles');
select tests.expect_error(format('update public.profiles set is_active = false where id = %L', :'hacker_id'), '42501', 'even admin must use the RPC for is_active');
select public.set_user_active(:'hacker_id', false, 'test block');
select tests.assert((select is_active from public.profiles where id = :'hacker_id') = false, 'admin can deactivate via RPC');
select tests.expect_error(format('select public.set_user_active(%L, false)', :'admin_id'), '42501', 'admin blocks self');
select tests.logout();

-- anon sees nothing
select tests.anon();
select tests.assert((select count(*) from public.profiles) = 0, 'anon sees no profiles');
select tests.assert((select count(*) from public.cities) >= 7, 'anon can read cities');
select tests.logout();

rollback;

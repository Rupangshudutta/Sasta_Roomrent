-- Effective privileges of the API roles, as they exist on a real Supabase project
-- (the shim reproduces Supabase's default grants; 0017 must undo them).
begin;

select tests.create_user('priv-o@test.local', '{"role":"owner","first_name":"Priv","phone":"9000000041"}') as id \gset o_

-- Internal helpers are not callable through the API.
select tests.anon();
select tests.expect_error(format('select public.notify_user(%L, ''system'', ''x'')', :'o_id'), '42501', 'anon calls notify_user');
select tests.expect_error('select public.write_audit(''x'', ''y'', ''z'')', '42501', 'anon calls write_audit');
select tests.expect_error('select public.purge_rate_limits()', '42501', 'anon calls purge_rate_limits');
select tests.expect_error('insert into public.properties (owner_id, title, property_type, rent_amount, address_line1, locality, city_id, state, pincode, contact_phone) values (gen_random_uuid(), ''x'', ''pg'', 1, ''x'', ''x'', 1, ''x'', ''560001'', ''9000000000'')', '42501', 'anon inserts property');
select tests.logout();

select tests.login(:'o_id');
select tests.expect_error(format('select public.notify_user(%L, ''system'', ''x'')', :'o_id'), '42501', 'user calls notify_user');
select tests.expect_error('select public.write_audit(''x'', ''y'', ''z'')', '42501', 'user calls write_audit');
select tests.expect_error('update public.profiles set email = ''x@y.z'' where id = auth.uid()', '42501', 'user rewrites synced email');
select tests.logout();

-- No API role may truncate or hold table-wide UPDATE on tables with column grants.
select tests.assert(not exists (
  select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind = 'r'
     and (has_table_privilege('anon', c.oid, 'truncate') or has_table_privilege('authenticated', c.oid, 'truncate'))
), 'no truncate for api roles');
select tests.assert(not has_table_privilege('authenticated', 'public.properties', 'update'), 'no table-wide update on properties');
select tests.assert(not has_table_privilege('authenticated', 'public.bookings', 'update'), 'no table-wide update on bookings');
select tests.assert(not has_table_privilege('anon', 'public.properties', 'insert'), 'anon cannot insert properties');

-- Objects created later do not inherit grants for the API roles.
create table public.zz_privilege_probe (id int);
select tests.assert(not has_table_privilege('anon', 'public.zz_privilege_probe', 'select'), 'new table not readable by anon');
select tests.assert(not has_table_privilege('authenticated', 'public.zz_privilege_probe', 'insert'), 'new table not writable by authenticated');

rollback;

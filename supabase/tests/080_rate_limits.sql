-- Rate limits: counter semantics and no direct table access.
begin;

select tests.create_user('rl@test.local', '{"first_name":"Rate"}') as id \gset u_

-- anonymous callers can consume; the third hit of a 2/window limit is denied
select tests.anon();
select tests.assert(public.consume_rate_limit('t:a', 2, 60), 'first hit allowed');
select tests.assert(public.consume_rate_limit('t:a', 2, 60), 'second hit allowed');
select tests.assert(not public.consume_rate_limit('t:a', 2, 60), 'third hit denied');
select tests.assert(public.consume_rate_limit('t:b', 2, 60), 'other key unaffected');
select tests.expect_error('select * from public.rate_limits', '42501', 'anon reads rate_limits');
select tests.logout();

-- an expired window resets the counter
update public.rate_limits set window_start = now() - interval '2 minutes' where key = 't:a';
select tests.login(:'u_id');
select tests.assert(public.consume_rate_limit('t:a', 2, 60), 'window reset allows again');
select tests.expect_error('delete from public.rate_limits', '42501', 'user deletes rate_limits');
select tests.expect_error('select public.consume_rate_limit(''t:c'', 0, 60)', '22023', 'invalid limit rejected');
select tests.logout();

rollback;

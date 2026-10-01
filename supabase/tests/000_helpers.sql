-- Test helpers: simulate PostgREST sessions on a plain connection.
-- tests.login(uid) sets the JWT claims and switches to the `authenticated` role,
-- tests.anon() switches to `anon`, tests.logout() returns to the superuser.
-- tests.expect_error(sql, sqlstate) asserts that a statement is rejected.

create schema if not exists tests;

create or replace function tests.create_user(p_email text, p_meta jsonb default '{}'::jsonb)
returns uuid
language plpgsql
as $$
declare uid uuid := gen_random_uuid();
begin
  insert into auth.users (id, email, raw_user_meta_data) values (uid, p_email, p_meta);
  return uid;
end;
$$;

create or replace function tests.login(p_uid uuid)
returns void
language plpgsql
as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', p_uid::text, true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);
  execute 'set local role authenticated';
end;
$$;

create or replace function tests.anon()
returns void
language plpgsql
as $$
begin
  perform set_config('request.jwt.claims', '', true);
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('request.jwt.claim.role', 'anon', true);
  execute 'set local role anon';
end;
$$;

create or replace function tests.logout()
returns void
language plpgsql
as $$
begin
  execute 'reset role';
  perform set_config('request.jwt.claims', '', true);
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('request.jwt.claim.role', '', true);
end;
$$;

-- Runs p_sql in a sub-transaction and asserts it fails with p_sqlstate (or any error when null).
create or replace function tests.expect_error(p_sql text, p_sqlstate text default null, p_label text default null)
returns void
language plpgsql
as $$
begin
  begin
    execute p_sql;
  exception when others then
    if p_sqlstate is not null and sqlstate <> p_sqlstate then
      raise exception 'expected sqlstate % but got % (%): %', p_sqlstate, sqlstate, coalesce(p_label, p_sql), sqlerrm;
    end if;
    return;
  end;
  raise exception 'expected an error but statement succeeded: %', coalesce(p_label, p_sql);
end;
$$;

create or replace function tests.assert(p_condition boolean, p_label text)
returns void
language plpgsql
as $$
begin
  if not coalesce(p_condition, false) then
    raise exception 'assertion failed: %', p_label;
  end if;
end;
$$;

grant usage on schema tests to anon, authenticated;
grant execute on all functions in schema tests to anon, authenticated;

-- Rate limiting without extra infrastructure: a fixed-window counter per key in
-- Postgres. Keys are opaque (the server hashes IPs before sending them), so no
-- raw addresses are stored. The function is the only way to touch the table.
create table public.rate_limits (
  key          text primary key,
  window_start timestamptz not null default now(),
  hits         integer not null default 0,
  updated_at   timestamptz not null default now()
);

alter table public.rate_limits enable row level security;
-- No policies on purpose: end users cannot read or write counters directly.

-- Returns true when the call is allowed, false when the key exhausted its window.
-- Atomic under concurrency thanks to the single INSERT ... ON CONFLICT statement.
create or replace function public.consume_rate_limit(
  p_key text,
  p_limit integer,
  p_window_seconds integer
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hits integer;
begin
  if p_key is null or length(p_key) = 0 or p_limit < 1 or p_window_seconds < 1 then
    raise exception 'invalid rate limit arguments' using errcode = '22023';
  end if;

  insert into public.rate_limits as r (key, window_start, hits)
  values (p_key, now(), 1)
  on conflict (key) do update
    set hits = case
                 when r.window_start + make_interval(secs => p_window_seconds) <= now() then 1
                 else r.hits + 1
               end,
        window_start = case
                 when r.window_start + make_interval(secs => p_window_seconds) <= now() then now()
                 else r.window_start
               end,
        updated_at = now()
  returning hits into v_hits;

  return v_hits <= p_limit;
end;
$$;

revoke all on function public.consume_rate_limit(text, integer, integer) from public;
grant execute on function public.consume_rate_limit(text, integer, integer) to anon, authenticated, service_role;

-- Housekeeping for a cron/maintenance call: drop windows older than a day.
create or replace function public.purge_rate_limits() returns integer
language sql security definer set search_path = public as $$
  with d as (delete from public.rate_limits where updated_at < now() - interval '1 day' returning 1)
  select count(*)::integer from d;
$$;
revoke all on function public.purge_rate_limits() from public;
grant execute on function public.purge_rate_limits() to service_role;

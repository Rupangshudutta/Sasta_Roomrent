-- 0007: favorites and reviews. A review requires a real tenancy (active/completed booking).

create table public.favorites (
  user_id uuid not null references public.profiles (id) on delete cascade,
  property_id uuid not null references public.properties (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, property_id)
);
create index favorites_property_idx on public.favorites (property_id);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  tenant_id uuid not null references public.profiles (id) on delete cascade,
  booking_id uuid not null references public.bookings (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  title text check (title is null or char_length(title) <= 120),
  comment text check (comment is null or char_length(comment) <= 2000),
  is_visible boolean not null default true,
  hidden_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, property_id)
);
create index reviews_property_idx on public.reviews (property_id, created_at desc) where is_visible;

create trigger reviews_set_updated_at before update on public.reviews
  for each row execute function public.set_updated_at();

create or replace function public.reviews_before_write()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  bk public.bookings%rowtype;
  privileged boolean := public.is_privileged_session() or public.is_admin();
begin
  if tg_op = 'INSERT' then
    select * into bk from public.bookings where id = new.booking_id;
    if not found then
      raise exception 'booking not found' using errcode = '23503';
    end if;
    if not privileged and bk.tenant_id is distinct from auth.uid() then
      raise exception 'you can only review your own stays' using errcode = '42501';
    end if;
    if bk.property_id <> new.property_id then
      raise exception 'booking does not belong to this property' using errcode = '23514';
    end if;
    if bk.status not in ('active', 'completed') then
      raise exception 'you can review a stay once it is active or completed' using errcode = '42501';
    end if;
    new.tenant_id := bk.tenant_id;
    if not privileged then
      new.is_visible := true;
      new.hidden_reason := null;
    end if;
    return new;
  end if;

  -- UPDATE: the author may edit rating/title/comment; only admins moderate visibility.
  new.property_id := old.property_id;
  new.tenant_id := old.tenant_id;
  new.booking_id := old.booking_id;
  if not privileged then
    new.is_visible := old.is_visible;
    new.hidden_reason := old.hidden_reason;
  end if;
  return new;
end;
$$;

create trigger reviews_before_write before insert or update on public.reviews
  for each row execute function public.reviews_before_write();

create or replace function public.reviews_recompute_rating()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target uuid := coalesce(new.property_id, old.property_id);
begin
  update public.properties p
     set rating_avg = coalesce(s.avg_rating, 0),
         rating_count = coalesce(s.cnt, 0)
    from (
      select round(avg(rating)::numeric, 2) as avg_rating, count(*) as cnt
        from public.reviews
       where property_id = target and is_visible
    ) s
   where p.id = target;
  return null;
end;
$$;

create trigger reviews_recompute_rating after insert or update or delete on public.reviews
  for each row execute function public.reviews_recompute_rating();

create or replace function public.reviews_notify_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  prop record;
begin
  select owner_id, title into prop from public.properties where id = new.property_id;
  perform public.notify_user(prop.owner_id, 'review_received',
    'New review', format('A tenant left a %s-star review on "%s".', new.rating, prop.title),
    '/owner/properties/' || new.property_id::text);
  return new;
end;
$$;

create trigger reviews_notify_owner after insert on public.reviews
  for each row execute function public.reviews_notify_owner();

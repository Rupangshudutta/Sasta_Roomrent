-- 0006: booking requests and their lifecycle.
-- pending -> accepted | rejected | cancelled ; accepted -> active | cancelled ; active -> completed.
-- Rent and deposit are snapshotted at request time so later price edits do not
-- rewrite history. Contact details are revealed by get_booking_contacts() (0009).

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete restrict,
  tenant_id uuid not null references public.profiles (id) on delete restrict,
  owner_id uuid not null references public.profiles (id) on delete restrict,
  move_in_date date not null,
  lease_months smallint not null check (lease_months between 1 and 36),
  monthly_rent numeric(10, 2) not null check (monthly_rent > 0),
  security_deposit numeric(10, 2) not null default 0 check (security_deposit >= 0),
  total_amount numeric(12, 2) generated always as (monthly_rent * lease_months + security_deposit) stored,
  message text check (message is null or char_length(message) <= 1000),
  status public.booking_status not null default 'pending',
  owner_note text check (owner_note is null or char_length(owner_note) <= 1000),
  cancel_reason text check (cancel_reason is null or char_length(cancel_reason) <= 500),
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index bookings_tenant_idx on public.bookings (tenant_id, created_at desc);
create index bookings_owner_idx on public.bookings (owner_id, status, created_at desc);
create index bookings_property_idx on public.bookings (property_id, status);
-- One open request per tenant per listing.
create unique index bookings_one_pending_per_tenant_idx on public.bookings (property_id, tenant_id) where status = 'pending';

create trigger bookings_set_updated_at before update on public.bookings
  for each row execute function public.set_updated_at();

create or replace function public.bookings_before_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  prop public.properties%rowtype;
  privileged boolean := public.is_privileged_session() or public.is_admin();
begin
  select * into prop from public.properties where id = new.property_id;
  if not found then
    raise exception 'property not found' using errcode = '23503';
  end if;
  if prop.status <> 'approved' then
    raise exception 'this listing is not accepting requests' using errcode = '42501';
  end if;
  if not privileged and new.tenant_id is distinct from auth.uid() then
    raise exception 'tenant_id must be the current user' using errcode = '42501';
  end if;
  if new.tenant_id = prop.owner_id then
    raise exception 'you cannot request your own listing' using errcode = '42501';
  end if;
  if new.move_in_date < current_date then
    raise exception 'move-in date cannot be in the past' using errcode = '23514';
  end if;
  if new.lease_months < prop.min_lease_months then
    raise exception 'minimum lease for this listing is % months', prop.min_lease_months using errcode = '23514';
  end if;
  if prop.available_rooms <= 0 then
    raise exception 'no rooms are currently available in this listing' using errcode = '23514';
  end if;

  new.owner_id := prop.owner_id;
  new.monthly_rent := prop.rent_amount;
  new.security_deposit := prop.security_deposit;
  new.status := 'pending';
  new.owner_note := null;
  new.cancel_reason := null;
  new.decided_at := null;
  return new;
end;
$$;

create trigger bookings_before_insert before insert on public.bookings
  for each row execute function public.bookings_before_insert();

create or replace function public.bookings_before_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  privileged boolean := public.is_privileged_session() or public.is_admin();
  is_owner boolean := actor is not null and actor = old.owner_id;
  is_tenant boolean := actor is not null and actor = old.tenant_id;
  allowed boolean := false;
begin
  -- Immutable facts of the request.
  new.property_id := old.property_id;
  new.tenant_id := old.tenant_id;
  new.owner_id := old.owner_id;
  new.monthly_rent := old.monthly_rent;
  new.security_deposit := old.security_deposit;
  new.move_in_date := old.move_in_date;
  new.lease_months := old.lease_months;
  new.created_at := old.created_at;

  if not privileged and not is_owner and not is_tenant then
    raise exception 'not a party to this booking' using errcode = '42501';
  end if;

  if not privileged then
    -- Tenants may edit their message only while pending; owners may add a note.
    if is_tenant and not is_owner and new.owner_note is distinct from old.owner_note then
      new.owner_note := old.owner_note;
    end if;
    if is_owner and not is_tenant and new.message is distinct from old.message then
      new.message := old.message;
    end if;
    if is_tenant and old.status <> 'pending' and new.message is distinct from old.message then
      new.message := old.message;
    end if;
  end if;

  if new.status is distinct from old.status then
    if privileged then
      allowed := (old.status, new.status) in (
        ('pending', 'accepted'), ('pending', 'rejected'), ('pending', 'cancelled'),
        ('accepted', 'active'), ('accepted', 'cancelled'),
        ('active', 'completed'), ('active', 'cancelled')
      );
    elsif is_owner then
      allowed := (old.status, new.status) in (
        ('pending', 'accepted'), ('pending', 'rejected'),
        ('accepted', 'active'), ('accepted', 'cancelled'),
        ('active', 'completed')
      );
    elsif is_tenant then
      allowed := (old.status, new.status) in (('pending', 'cancelled'), ('accepted', 'cancelled'));
    end if;

    if not allowed then
      raise exception 'booking transition % -> % is not allowed for this user', old.status, new.status using errcode = '42501';
    end if;

    if new.status in ('accepted', 'rejected') then
      new.decided_at := now();
    end if;
    if new.status = 'cancelled' and coalesce(trim(new.cancel_reason), '') = '' then
      new.cancel_reason := case when is_tenant and not is_owner then 'Cancelled by tenant' else 'Cancelled by owner' end;
    end if;

    -- Room inventory follows acceptance.
    if new.status = 'accepted' then
      update public.properties
         set available_rooms = available_rooms - 1
       where id = old.property_id and available_rooms > 0;
      if not found then
        raise exception 'no rooms left to accept this request' using errcode = '23514';
      end if;
    elsif old.status in ('accepted', 'active') and new.status in ('cancelled', 'completed') then
      update public.properties
         set available_rooms = least(total_rooms, available_rooms + 1)
       where id = old.property_id;
    end if;
  end if;

  return new;
end;
$$;

create trigger bookings_before_update before update on public.bookings
  for each row execute function public.bookings_before_update();

create or replace function public.bookings_notify()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  prop_title text;
begin
  select title into prop_title from public.properties where id = new.property_id;

  if tg_op = 'INSERT' then
    perform public.notify_user(new.owner_id, 'booking_requested',
      'New booking request', format('A tenant requested "%s" from %s for %s month(s).', prop_title, to_char(new.move_in_date, 'DD Mon YYYY'), new.lease_months),
      '/owner/bookings/' || new.id::text);
    return new;
  end if;

  if new.status is distinct from old.status then
    case new.status
      when 'accepted' then
        perform public.notify_user(new.tenant_id, 'booking_accepted',
          'Your request was accepted', format('The owner accepted your request for "%s". Contact details are now visible.', prop_title),
          '/dashboard/bookings/' || new.id::text);
      when 'rejected' then
        perform public.notify_user(new.tenant_id, 'booking_rejected',
          'Your request was declined', format('The owner declined your request for "%s".', prop_title),
          '/dashboard/bookings/' || new.id::text);
      when 'cancelled' then
        if auth.uid() = new.tenant_id then
          perform public.notify_user(new.owner_id, 'booking_cancelled',
            'A request was cancelled', format('The tenant cancelled their request for "%s".', prop_title),
            '/owner/bookings/' || new.id::text);
        else
          perform public.notify_user(new.tenant_id, 'booking_cancelled',
            'Your booking was cancelled', format('Your booking for "%s" was cancelled: %s', prop_title, coalesce(new.cancel_reason, '')),
            '/dashboard/bookings/' || new.id::text);
        end if;
      when 'active' then
        perform public.notify_user(new.tenant_id, 'booking_activated',
          'Welcome home', format('Your stay at "%s" is now active.', prop_title),
          '/dashboard/bookings/' || new.id::text);
      when 'completed' then
        perform public.notify_user(new.tenant_id, 'booking_completed',
          'How was your stay?', format('Your stay at "%s" is complete. Leave a review to help other tenants.', prop_title),
          '/dashboard/bookings/' || new.id::text);
      else null;
    end case;
  end if;
  return new;
end;
$$;

create trigger bookings_notify after insert or update of status on public.bookings
  for each row execute function public.bookings_notify();

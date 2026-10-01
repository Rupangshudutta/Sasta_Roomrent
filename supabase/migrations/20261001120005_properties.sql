-- 0005: listings, photos, amenities, and the listing lifecycle
-- draft -> pending -> approved | rejected ; approved -> inactive ; edits re-enter review.

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete restrict,
  title text not null check (char_length(title) between 10 and 150),
  description text check (description is null or char_length(description) <= 5000),
  property_type public.property_type not null,
  gender_preference public.gender_preference not null default 'any',
  furnishing public.furnishing not null default 'unfurnished',
  rent_amount numeric(10, 2) not null check (rent_amount >= 500),
  security_deposit numeric(10, 2) not null default 0 check (security_deposit >= 0),
  maintenance_amount numeric(10, 2) not null default 0 check (maintenance_amount >= 0),
  address_line1 text not null check (char_length(address_line1) between 5 and 255),
  address_line2 text check (address_line2 is null or char_length(address_line2) <= 255),
  locality text not null check (char_length(locality) between 2 and 100),
  city_id smallint not null references public.cities (id) on delete restrict,
  state text not null check (char_length(state) between 2 and 100),
  pincode text not null check (pincode ~ '^[1-9][0-9]{5}$'),
  latitude numeric(9, 6) check (latitude is null or latitude between -90 and 90),
  longitude numeric(9, 6) check (longitude is null or longitude between -180 and 180),
  total_rooms smallint not null default 1 check (total_rooms between 1 and 500),
  available_rooms smallint not null default 1 check (available_rooms >= 0),
  available_from date,
  min_lease_months smallint not null default 1 check (min_lease_months between 1 and 24),
  house_rules text check (house_rules is null or char_length(house_rules) <= 2000),
  contact_phone text not null check (contact_phone ~ '^[6-9][0-9]{9}$'),
  alt_contact_phone text check (alt_contact_phone is null or alt_contact_phone ~ '^[6-9][0-9]{9}$'),
  status public.listing_status not null default 'draft',
  rejection_reason text check (rejection_reason is null or char_length(rejection_reason) <= 1000),
  is_featured boolean not null default false,
  views_count integer not null default 0,
  rating_avg numeric(3, 2) not null default 0 check (rating_avg between 0 and 5),
  rating_count integer not null default 0,
  submitted_at timestamptz,
  approved_at timestamptz,
  approved_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search_tsv tsvector generated always as (
    to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(locality, '') || ' ' || coalesce(description, ''))
  ) stored,
  constraint properties_rooms_check check (available_rooms <= total_rooms)
);
comment on table public.properties is 'A listing. Only status=approved rows are publicly visible (see RLS).';

create index properties_public_browse_idx on public.properties (city_id, rent_amount) where status = 'approved';
create index properties_status_idx on public.properties (status, submitted_at);
create index properties_owner_idx on public.properties (owner_id, created_at desc);
create index properties_search_idx on public.properties using gin (search_tsv);
create index properties_locality_trgm_idx on public.properties using gin (locality extensions.gin_trgm_ops);

create table public.property_photos (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  storage_path text not null unique,
  is_primary boolean not null default false,
  sort_order smallint not null default 0,
  width integer,
  height integer,
  bytes integer check (bytes is null or bytes > 0),
  created_at timestamptz not null default now()
);
create index property_photos_property_idx on public.property_photos (property_id, sort_order);
create unique index property_photos_one_primary_idx on public.property_photos (property_id) where is_primary;

create table public.property_amenities (
  property_id uuid not null references public.properties (id) on delete cascade,
  amenity_id smallint not null references public.amenities (id) on delete cascade,
  primary key (property_id, amenity_id)
);

create trigger properties_set_updated_at before update on public.properties
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Lifecycle rules. Owners can move draft/rejected/inactive -> pending (submit),
-- pending -> draft (withdraw), approved -> inactive (unlist). Only admins or the
-- service role can set approved/rejected. A material edit to an approved listing
-- sends it back to review. Column privileges (0008) keep metric/moderation columns
-- out of reach of end users.
-- ---------------------------------------------------------------------------
create or replace function public.properties_enforce_lifecycle()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  privileged boolean := public.is_privileged_session() or public.is_admin();
  material_change boolean;
begin
  if tg_op = 'INSERT' then
    if not privileged then
      if new.owner_id is distinct from auth.uid() then
        raise exception 'owner_id must be the current user' using errcode = '42501';
      end if;
      if new.status not in ('draft', 'pending') then
        raise exception 'new listings start as draft or pending' using errcode = '42501';
      end if;
      new.is_featured := false;
      new.views_count := 0;
      new.rating_avg := 0;
      new.rating_count := 0;
      new.approved_at := null;
      new.approved_by := null;
      new.rejection_reason := null;
    end if;
    if new.status = 'pending' then
      new.submitted_at := now();
    end if;
    return new;
  end if;

  -- UPDATE
  if not privileged then
    if new.owner_id is distinct from old.owner_id then
      raise exception 'owner_id is immutable' using errcode = '42501';
    end if;
    -- Metric and moderation columns (is_featured, views_count, rating_*, approved_*,
    -- rejection_reason) are protected by column-level privileges in 0008: an end user
    -- cannot name them in an UPDATE at all, while SECURITY DEFINER functions
    -- (view counter, rating recompute, moderation RPCs) can.

    if new.status is distinct from old.status then
      if not (
        (old.status in ('draft', 'rejected', 'inactive') and new.status = 'pending') or
        (old.status = 'pending' and new.status = 'draft') or
        (old.status = 'approved' and new.status = 'inactive')
      ) then
        raise exception 'listing transition % -> % is not allowed', old.status, new.status using errcode = '42501';
      end if;
    end if;

    material_change :=
      new.title is distinct from old.title or
      new.description is distinct from old.description or
      new.property_type is distinct from old.property_type or
      new.gender_preference is distinct from old.gender_preference or
      new.furnishing is distinct from old.furnishing or
      new.rent_amount is distinct from old.rent_amount or
      new.security_deposit is distinct from old.security_deposit or
      new.maintenance_amount is distinct from old.maintenance_amount or
      new.address_line1 is distinct from old.address_line1 or
      new.address_line2 is distinct from old.address_line2 or
      new.locality is distinct from old.locality or
      new.city_id is distinct from old.city_id or
      new.state is distinct from old.state or
      new.pincode is distinct from old.pincode or
      new.total_rooms is distinct from old.total_rooms or
      new.house_rules is distinct from old.house_rules;

    if old.status = 'approved' and new.status = 'approved' and material_change then
      new.status := 'pending';
    end if;
  else
    if new.status = 'approved' and old.status is distinct from 'approved' then
      new.approved_at := now();
      new.approved_by := coalesce(auth.uid(), new.approved_by);
      new.rejection_reason := null;
    end if;
    if new.status = 'rejected' and coalesce(trim(new.rejection_reason), '') = '' then
      raise exception 'rejection_reason is required when rejecting' using errcode = '23514';
    end if;
  end if;

  if new.status = 'pending' and old.status is distinct from 'pending' then
    new.submitted_at := now();
  end if;

  return new;
end;
$$;

create trigger properties_enforce_lifecycle before insert or update on public.properties
  for each row execute function public.properties_enforce_lifecycle();

-- Notify the owner on moderation outcomes.
create or replace function public.properties_notify_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'approved' and old.status is distinct from 'approved' then
    perform public.notify_user(new.owner_id, 'listing_approved',
      'Your listing is live', format('"%s" was approved and is now visible to tenants.', new.title),
      '/owner/properties/' || new.id::text);
  elsif new.status = 'rejected' and old.status is distinct from 'rejected' then
    perform public.notify_user(new.owner_id, 'listing_rejected',
      'Your listing needs changes', format('"%s" was not approved: %s', new.title, coalesce(new.rejection_reason, '')),
      '/owner/properties/' || new.id::text || '/edit');
  end if;
  return new;
end;
$$;

create trigger properties_notify_owner after update of status on public.properties
  for each row execute function public.properties_notify_owner();

-- Photo cap per listing comes from platform_settings.
create or replace function public.property_photos_enforce_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  max_photos smallint;
  current_count integer;
begin
  select max_photos_per_listing into max_photos from public.platform_settings where id = 1;
  select count(*) into current_count from public.property_photos where property_id = new.property_id;
  if current_count >= coalesce(max_photos, 10) then
    raise exception 'a listing may have at most % photos', coalesce(max_photos, 10) using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger property_photos_enforce_limit before insert on public.property_photos
  for each row execute function public.property_photos_enforce_limit();

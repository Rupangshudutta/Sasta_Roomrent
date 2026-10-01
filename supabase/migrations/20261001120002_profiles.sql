-- 0002: user profiles, owner profiles, auth bootstrap trigger, role helpers.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'tenant',
  first_name text not null check (char_length(first_name) between 1 and 100),
  last_name text not null default '' check (char_length(last_name) <= 100),
  phone text check (phone is null or phone ~ '^[6-9][0-9]{9}$'),
  avatar_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.profiles is 'One row per auth user. role is assigned at sign-up (tenant|owner) and only an admin can change it afterwards.';
create index profiles_role_idx on public.profiles (role);

create table public.owner_profiles (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  business_name text check (business_name is null or char_length(business_name) <= 150),
  business_type public.business_type,
  experience text check (experience is null or experience in ('0-1', '1-3', '3-5', '5+')),
  primary_location text,
  tax_id text check (tax_id is null or char_length(tax_id) <= 30),
  about text check (about is null or char_length(about) <= 2000),
  verification_status public.verification_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger owner_profiles_set_updated_at before update on public.owner_profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Role helpers. SECURITY DEFINER so they can read profiles regardless of RLS,
-- STABLE so the planner evaluates them once per statement, and an empty
-- search_path so no caller can shadow objects we reference.
-- ---------------------------------------------------------------------------
create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = ''
as $$
  select p.role from public.profiles p where p.id = auth.uid() and p.is_active;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.current_user_role() = 'admin', false);
$$;

revoke all on function public.current_user_role() from public;
revoke all on function public.is_admin() from public;
grant execute on function public.current_user_role() to anon, authenticated, service_role;
grant execute on function public.is_admin() to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Auth bootstrap: when Supabase Auth creates a user, create the profile from
-- the sign-up metadata. 'admin' is never accepted from metadata.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_role text := coalesce(new.raw_user_meta_data ->> 'role', 'tenant');
  resolved_role public.user_role;
  given_phone text := nullif(regexp_replace(coalesce(new.raw_user_meta_data ->> 'phone', ''), '\D', '', 'g'), '');
begin
  resolved_role := case when requested_role = 'owner' then 'owner'::public.user_role else 'tenant'::public.user_role end;

  insert into public.profiles (id, role, first_name, last_name, phone)
  values (
    new.id,
    resolved_role,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'first_name'), ''), split_part(coalesce(new.email, 'user'), '@', 1)),
    coalesce(trim(new.raw_user_meta_data ->> 'last_name'), ''),
    case when given_phone ~ '^[6-9][0-9]{9}$' then given_phone else null end
  )
  on conflict (id) do nothing;

  if resolved_role = 'owner' then
    insert into public.owner_profiles (user_id, business_name, business_type)
    values (
      new.id,
      nullif(trim(new.raw_user_meta_data ->> 'business_name'), ''),
      case
        when new.raw_user_meta_data ->> 'business_type' in ('individual', 'company', 'agency', 'broker')
        then (new.raw_user_meta_data ->> 'business_type')::public.business_type
        else null
      end
    )
    on conflict (user_id) do nothing;
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Column protection: end users may edit their own name/phone/avatar, but never
-- their role or active flag. Admins and privileged sessions may.
-- ---------------------------------------------------------------------------
create or replace function public.protect_profile_columns()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if public.is_privileged_session() or public.is_admin() then
    return new;
  end if;
  if new.role is distinct from old.role then
    raise exception 'role cannot be changed by the user' using errcode = '42501';
  end if;
  if new.is_active is distinct from old.is_active then
    raise exception 'is_active cannot be changed by the user' using errcode = '42501';
  end if;
  if new.id is distinct from old.id then
    raise exception 'id is immutable' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger profiles_protect_columns before update on public.profiles
  for each row execute function public.protect_profile_columns();

create or replace function public.protect_owner_profile_columns()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if public.is_privileged_session() or public.is_admin() then
    return new;
  end if;
  if new.verification_status is distinct from old.verification_status then
    raise exception 'verification_status can only be changed by an admin' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger owner_profiles_protect_columns before update on public.owner_profiles
  for each row execute function public.protect_owner_profile_columns();

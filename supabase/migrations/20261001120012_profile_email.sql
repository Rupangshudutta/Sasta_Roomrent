-- 0012: keep a copy of the auth email on profiles.
-- Why: admins need to see and search users by email, and moderation emails need the
-- owner's address, but auth.users is not readable through PostgREST. profiles is
-- already protected by RLS (self + admin only), so the copy exposes nothing new.

alter table public.profiles add column if not exists email extensions.citext;
create index if not exists profiles_email_idx on public.profiles (email);

update public.profiles p
   set email = u.email::extensions.citext
  from auth.users u
 where u.id = p.id and p.email is null;

-- Set at sign-up ...
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

  insert into public.profiles (id, role, first_name, last_name, phone, email)
  values (
    new.id,
    resolved_role,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'first_name'), ''), split_part(coalesce(new.email, 'user'), '@', 1)),
    coalesce(trim(new.raw_user_meta_data ->> 'last_name'), ''),
    case when given_phone ~ '^[6-9][0-9]{9}$' then given_phone else null end,
    new.email::extensions.citext
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

-- ... and kept in sync when the user changes their email in Supabase Auth.
create or replace function public.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email is distinct from old.email then
    update public.profiles set email = new.email::extensions.citext where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_changed on auth.users;
create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row execute function public.handle_user_email_change();

-- Users must not edit the copy themselves (it would desync from auth); the column is
-- deliberately absent from the column-level UPDATE grant in 0008, and the trigger
-- below guards privileged paths too.
create or replace function public.protect_profile_columns()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if public.is_privileged_session() then
    return new;
  end if;
  if new.email is distinct from old.email then
    raise exception 'email is managed by the authentication service' using errcode = '42501';
  end if;
  if public.is_admin() then
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

-- 0019: keep the owner's experience from sign-up.
-- Why: the sign-up form asks owners how long they have rented out property and
-- registerAction sends it as `experience`, but handle_new_user() (0002, 0012) never
-- copied it into owner_profiles, so every owner started with an empty value.
--
-- Same function as 0012 plus the experience column. Values outside the
-- owner_profiles check constraint are stored as null rather than failing the
-- sign-up, matching how business_type is handled. CREATE OR REPLACE keeps the
-- function's owner and the execute revokes from 0017.

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
    insert into public.owner_profiles (user_id, business_name, business_type, experience)
    values (
      new.id,
      nullif(trim(new.raw_user_meta_data ->> 'business_name'), ''),
      case
        when new.raw_user_meta_data ->> 'business_type' in ('individual', 'company', 'agency', 'broker')
        then (new.raw_user_meta_data ->> 'business_type')::public.business_type
        else null
      end,
      case
        when new.raw_user_meta_data ->> 'experience' in ('0-1', '1-3', '3-5', '5+')
        then new.raw_user_meta_data ->> 'experience'
        else null
      end
    )
    on conflict (user_id) do nothing;
  end if;

  return new;
end;
$$;

-- 0003: reference data that the prototype hard-coded: cities, localities, amenities,
-- and the single-row platform settings table. All admin-editable; none secret.

create table public.cities (
  id smallserial primary key,
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null,
  state text not null,
  is_active boolean not null default true,
  sort_order smallint not null default 100,
  created_at timestamptz not null default now()
);

create table public.localities (
  id serial primary key,
  city_id smallint not null references public.cities (id) on delete cascade,
  slug text not null check (slug ~ '^[a-z0-9-]+$'),
  name text not null,
  is_popular boolean not null default false,
  unique (city_id, slug)
);
create index localities_city_idx on public.localities (city_id);

create table public.amenities (
  id smallserial primary key,
  slug text not null unique check (slug ~ '^[a-z0-9_]+$'),
  label text not null,
  icon text not null default 'check',
  is_active boolean not null default true,
  sort_order smallint not null default 100
);

create table public.platform_settings (
  id smallint primary key default 1 check (id = 1),
  platform_name text not null default 'Sasta Room',
  support_email text not null default 'support@sastaroom.com',
  support_phone text not null default '+91 62943 47052',
  whatsapp_number text not null default '916294347052',
  office_address text not null default '123, MG Road, Koramangala, Bangalore, Karnataka - 560034',
  working_hours text not null default 'Mon-Sat, 9 AM - 7 PM',
  commission_rate numeric(5, 2) not null default 10.00 check (commission_rate between 0 and 100),
  booking_token_amount numeric(10, 2) not null default 499.00 check (booking_token_amount >= 0),
  auto_approve_listings boolean not null default false,
  max_photos_per_listing smallint not null default 10 check (max_photos_per_listing between 1 and 30),
  updated_at timestamptz not null default now()
);
create trigger platform_settings_set_updated_at before update on public.platform_settings
  for each row execute function public.set_updated_at();

insert into public.platform_settings (id) values (1) on conflict (id) do nothing;

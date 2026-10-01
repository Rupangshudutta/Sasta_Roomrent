-- 0004: in-app notifications, admin audit log, public contact messages.
-- Created before properties/bookings because their triggers write notifications.

create table public.notifications (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  type public.notification_type not null,
  title text not null check (char_length(title) <= 200),
  body text check (body is null or char_length(body) <= 1000),
  href text check (href is null or href ~ '^/'),
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_unread_idx on public.notifications (user_id, created_at desc) where read_at is null;
create index notifications_user_idx on public.notifications (user_id, created_at desc);

-- Internal helper used by triggers and RPCs. SECURITY DEFINER because the
-- actor (e.g. an owner accepting a booking) must be able to notify another user.
create or replace function public.notify_user(
  p_user_id uuid,
  p_type public.notification_type,
  p_title text,
  p_body text default null,
  p_href text default null
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.notifications (user_id, type, title, body, href)
  values (p_user_id, p_type, left(p_title, 200), left(p_body, 1000), p_href);
$$;
revoke all on function public.notify_user(uuid, public.notification_type, text, text, text) from public;

create table public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  entity text not null,
  entity_id text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index audit_log_entity_idx on public.audit_log (entity, entity_id);
create index audit_log_created_idx on public.audit_log (created_at desc);

create or replace function public.write_audit(
  p_action text,
  p_entity text,
  p_entity_id text,
  p_details jsonb default '{}'::jsonb
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.audit_log (actor_id, action, entity, entity_id, details)
  values (auth.uid(), p_action, p_entity, p_entity_id, coalesce(p_details, '{}'::jsonb));
$$;
revoke all on function public.write_audit(text, text, text, jsonb) from public;

create table public.contact_messages (
  id bigint generated always as identity primary key,
  name text not null check (char_length(name) between 2 and 100),
  email extensions.citext not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone text check (phone is null or phone ~ '^[6-9][0-9]{9}$'),
  interest public.contact_interest not null default 'other',
  message text not null check (char_length(message) between 5 and 5000),
  is_read boolean not null default false,
  handled_by uuid references public.profiles (id) on delete set null,
  handled_at timestamptz,
  created_at timestamptz not null default now()
);
create index contact_messages_unread_idx on public.contact_messages (created_at desc) where is_read = false;

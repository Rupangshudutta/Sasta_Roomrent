-- 0015: payments (Razorpay) and the webhook event log.
--
-- Money rows are written ONLY by the server with the service role (order creation,
-- checkout verification, webhooks). End users can read their own rows. Status is
-- confirmed authoritatively by the webhook; the checkout callback is a UX shortcut
-- that is verified with the same HMAC rules.

create type public.payment_status as enum ('created', 'paid', 'failed', 'refunded');
create type public.payment_purpose as enum ('booking_token', 'security_deposit', 'rent');

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete restrict,
  payer_id uuid not null references public.profiles (id) on delete restrict,
  payee_id uuid not null references public.profiles (id) on delete restrict,
  purpose public.payment_purpose not null,
  amount numeric(10, 2) not null check (amount > 0),
  currency text not null default 'INR' check (currency = 'INR'),
  razorpay_order_id text not null unique,
  razorpay_payment_id text unique,
  razorpay_signature text,
  status public.payment_status not null default 'created',
  failure_reason text,
  paid_at timestamptz,
  refunded_at timestamptz,
  raw jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index payments_booking_idx on public.payments (booking_id, created_at desc);
create index payments_payer_idx on public.payments (payer_id, created_at desc);
create index payments_status_idx on public.payments (status, created_at desc);
-- At most one successful token per booking.
create unique index payments_one_paid_token_idx on public.payments (booking_id, purpose) where status = 'paid';

create trigger payments_set_updated_at before update on public.payments
  for each row execute function public.set_updated_at();

create table public.payment_events (
  id bigint generated always as identity primary key,
  event_id text not null unique,
  event_type text not null,
  razorpay_payment_id text,
  razorpay_order_id text,
  payload jsonb not null,
  outcome text,
  created_at timestamptz not null default now()
);
create index payment_events_order_idx on public.payment_events (razorpay_order_id);

alter table public.payments enable row level security;
alter table public.payment_events enable row level security;

grant select on public.payments to authenticated;
grant all on public.payments, public.payment_events to service_role;
grant usage, select on all sequences in schema public to service_role;

create policy "payments: payer read own" on public.payments
  for select to authenticated using (payer_id = (select auth.uid()));
create policy "payments: payee read own" on public.payments
  for select to authenticated using (payee_id = (select auth.uid()));
create policy "payments: admin read all" on public.payments
  for select to authenticated using ((select public.is_admin()));
create policy "payment_events: admin read" on public.payment_events
  for select to authenticated using ((select public.is_admin()));
grant select on public.payment_events to authenticated;

-- Notify both parties when a token is paid (fires from service-role writes).
create or replace function public.payments_notify()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  prop_title text;
begin
  if new.status = 'paid' and old.status is distinct from 'paid' then
    select p.title into prop_title from public.bookings b join public.properties p on p.id = b.property_id where b.id = new.booking_id;
    perform public.notify_user(new.payee_id, 'system', 'Booking token received',
      format('The tenant paid the booking token for "%s".', coalesce(prop_title, 'your listing')),
      '/owner/bookings/' || new.booking_id::text);
    perform public.notify_user(new.payer_id, 'system', 'Payment confirmed',
      format('Your booking token for "%s" was received. Reference %s.', coalesce(prop_title, 'the listing'), coalesce(new.razorpay_payment_id, new.razorpay_order_id)),
      '/dashboard/bookings/' || new.booking_id::text);
  elsif new.status = 'refunded' and old.status is distinct from 'refunded' then
    perform public.notify_user(new.payer_id, 'system', 'Refund processed',
      'Your booking token refund has been processed by Razorpay. It can take 5-7 working days to reach your account.',
      '/dashboard/payments');
  end if;
  return new;
end;
$$;

create trigger payments_notify after update of status on public.payments
  for each row execute function public.payments_notify();

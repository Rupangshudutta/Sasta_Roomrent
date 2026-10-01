-- 0008: Row Level Security. Every table has RLS on; policies are the authorization model.
-- Triggers (0002-0007) guard column-level rules; policies guard row visibility and writes.

alter table public.profiles enable row level security;
alter table public.owner_profiles enable row level security;
alter table public.cities enable row level security;
alter table public.localities enable row level security;
alter table public.amenities enable row level security;
alter table public.platform_settings enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_log enable row level security;
alter table public.contact_messages enable row level security;
alter table public.properties enable row level security;
alter table public.property_photos enable row level security;
alter table public.property_amenities enable row level security;
alter table public.bookings enable row level security;
alter table public.favorites enable row level security;
alter table public.reviews enable row level security;

-- Baseline grants (PostgREST roles). RLS narrows these.
grant select on all tables in schema public to anon, authenticated;
-- Column-level UPDATE privileges are the first line of defence: an end user cannot even
-- name a protected column (role, is_featured, views_count, verification_status ...) in an
-- UPDATE. SECURITY DEFINER functions, which run as the table owner, can.
grant insert, delete on
  public.properties, public.property_photos, public.property_amenities,
  public.bookings, public.favorites, public.reviews, public.notifications, public.owner_profiles
to authenticated;
grant insert on public.contact_messages to anon, authenticated;
grant update (first_name, last_name, phone, avatar_url) on public.profiles to authenticated;
grant update (business_name, business_type, experience, primary_location, tax_id, about) on public.owner_profiles to authenticated;
grant update (
  title, description, property_type, gender_preference, furnishing,
  rent_amount, security_deposit, maintenance_amount,
  address_line1, address_line2, locality, city_id, state, pincode, latitude, longitude,
  total_rooms, available_rooms, available_from, min_lease_months, house_rules,
  contact_phone, alt_contact_phone, status
) on public.properties to authenticated;
grant update (is_primary, sort_order) on public.property_photos to authenticated;
grant update (status, message, owner_note, cancel_reason) on public.bookings to authenticated;
grant update (rating, title, comment) on public.reviews to authenticated;
grant update (read_at) on public.notifications to authenticated;
-- Admin-managed reference data: full write access, gated by the admin policies below.
grant insert, update, delete on public.cities, public.localities, public.amenities to authenticated;
grant update on public.platform_settings to authenticated;
grant usage, select on all sequences in schema public to authenticated;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;

-- profiles -------------------------------------------------------------------
create policy "profiles: read own" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "profiles: admin read all" on public.profiles
  for select to authenticated using ((select public.is_admin()));
create policy "profiles: update own" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy "profiles: admin update" on public.profiles
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- owner_profiles -------------------------------------------------------------
create policy "owner_profiles: read own" on public.owner_profiles
  for select to authenticated using (user_id = (select auth.uid()));
create policy "owner_profiles: admin read all" on public.owner_profiles
  for select to authenticated using ((select public.is_admin()));
create policy "owner_profiles: insert own" on public.owner_profiles
  for insert to authenticated with check (user_id = (select auth.uid()) and (select public.current_user_role()) = 'owner');
create policy "owner_profiles: update own" on public.owner_profiles
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "owner_profiles: admin update" on public.owner_profiles
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- catalog --------------------------------------------------------------------
create policy "cities: public read" on public.cities for select to anon, authenticated using (true);
create policy "cities: admin write" on public.cities for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "localities: public read" on public.localities for select to anon, authenticated using (true);
create policy "localities: admin write" on public.localities for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "amenities: public read" on public.amenities for select to anon, authenticated using (true);
create policy "amenities: admin write" on public.amenities for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "platform_settings: public read" on public.platform_settings for select to anon, authenticated using (true);
create policy "platform_settings: admin update" on public.platform_settings for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- notifications --------------------------------------------------------------
create policy "notifications: read own" on public.notifications
  for select to authenticated using (user_id = (select auth.uid()));
create policy "notifications: mark own read" on public.notifications
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "notifications: delete own" on public.notifications
  for delete to authenticated using (user_id = (select auth.uid()));

-- audit_log ------------------------------------------------------------------
create policy "audit_log: admin read" on public.audit_log
  for select to authenticated using ((select public.is_admin()));

-- contact_messages -----------------------------------------------------------
create policy "contact_messages: anyone can send" on public.contact_messages
  for insert to anon, authenticated with check (is_read = false and handled_by is null and handled_at is null);
create policy "contact_messages: admin read" on public.contact_messages
  for select to authenticated using ((select public.is_admin()));

-- properties -----------------------------------------------------------------
create policy "properties: public read approved" on public.properties
  for select to anon, authenticated using (status = 'approved');
create policy "properties: owner read own" on public.properties
  for select to authenticated using (owner_id = (select auth.uid()));
create policy "properties: admin read all" on public.properties
  for select to authenticated using ((select public.is_admin()));
create policy "properties: owner insert" on public.properties
  for insert to authenticated
  with check (owner_id = (select auth.uid()) and (select public.current_user_role()) = 'owner');
create policy "properties: owner update own" on public.properties
  for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "properties: admin update" on public.properties
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "properties: owner delete draft" on public.properties
  for delete to authenticated using (owner_id = (select auth.uid()) and status = 'draft');

-- property_photos / property_amenities: visible with the listing, writable by its owner
create policy "property_photos: read with listing" on public.property_photos
  for select to anon, authenticated
  using (exists (select 1 from public.properties p where p.id = property_id
                 and (p.status = 'approved' or p.owner_id = (select auth.uid()) or (select public.is_admin()))));
create policy "property_photos: owner write" on public.property_photos
  for all to authenticated
  using (exists (select 1 from public.properties p where p.id = property_id and p.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.properties p where p.id = property_id and p.owner_id = (select auth.uid())));
create policy "property_photos: admin write" on public.property_photos
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "property_amenities: read with listing" on public.property_amenities
  for select to anon, authenticated
  using (exists (select 1 from public.properties p where p.id = property_id
                 and (p.status = 'approved' or p.owner_id = (select auth.uid()) or (select public.is_admin()))));
create policy "property_amenities: owner write" on public.property_amenities
  for all to authenticated
  using (exists (select 1 from public.properties p where p.id = property_id and p.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.properties p where p.id = property_id and p.owner_id = (select auth.uid())));

-- bookings -------------------------------------------------------------------
create policy "bookings: tenant read own" on public.bookings
  for select to authenticated using (tenant_id = (select auth.uid()));
create policy "bookings: owner read own listings" on public.bookings
  for select to authenticated using (owner_id = (select auth.uid()));
create policy "bookings: admin read all" on public.bookings
  for select to authenticated using ((select public.is_admin()));
create policy "bookings: tenant insert" on public.bookings
  for insert to authenticated with check (tenant_id = (select auth.uid()));
create policy "bookings: parties update" on public.bookings
  for update to authenticated
  using (tenant_id = (select auth.uid()) or owner_id = (select auth.uid()) or (select public.is_admin()))
  with check (tenant_id = (select auth.uid()) or owner_id = (select auth.uid()) or (select public.is_admin()));

-- favorites ------------------------------------------------------------------
create policy "favorites: own" on public.favorites
  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- reviews --------------------------------------------------------------------
create policy "reviews: public read visible" on public.reviews
  for select to anon, authenticated using (is_visible);
create policy "reviews: author read own" on public.reviews
  for select to authenticated using (tenant_id = (select auth.uid()));
create policy "reviews: admin read all" on public.reviews
  for select to authenticated using ((select public.is_admin()));
create policy "reviews: tenant insert" on public.reviews
  for insert to authenticated with check (tenant_id = (select auth.uid()));
create policy "reviews: author update" on public.reviews
  for update to authenticated using (tenant_id = (select auth.uid())) with check (tenant_id = (select auth.uid()));
create policy "reviews: admin update" on public.reviews
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "reviews: author delete" on public.reviews
  for delete to authenticated using (tenant_id = (select auth.uid()) or (select public.is_admin()));

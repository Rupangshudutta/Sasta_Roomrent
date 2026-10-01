-- 0010: Storage bucket for listing photos.
-- Object path convention: <owner_id>/<property_id>/<uuid>.<ext>
-- Public read (listing photos are public once approved; drafts are unguessable UUID paths),
-- writes only by the owner of that listing.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'property-photos', 'property-photos', true, 5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "property-photos: public read" on storage.objects
  for select to anon, authenticated using (bucket_id = 'property-photos');

create policy "property-photos: owner insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'property-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (
      select 1 from public.properties p
       where p.id::text = (storage.foldername(name))[2] and p.owner_id = (select auth.uid())
    )
  );

create policy "property-photos: owner update" on storage.objects
  for update to authenticated
  using (bucket_id = 'property-photos' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'property-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "property-photos: owner delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'property-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- 0011: city hero images (from the prototype's locations page) and a public per-city
-- stats view so the Locations page shows real numbers instead of hard-coded ones.

alter table public.cities add column if not exists image_url text;
alter table public.cities add column if not exists tagline text;

-- security_invoker: the view runs with the caller's privileges, so RLS on
-- properties applies and anonymous visitors only ever count approved listings.
create or replace view public.city_listing_stats with (security_invoker = true) as
  select
    c.id as city_id,
    c.slug,
    c.name,
    c.state,
    c.image_url,
    c.sort_order,
    count(p.id)::integer as listing_count,
    min(p.rent_amount) as min_rent,
    case when count(p.id) filter (where p.rating_count > 0) > 0
         then round(avg(p.rating_avg) filter (where p.rating_count > 0), 1)
         else null end as avg_rating
  from public.cities c
  left join public.properties p on p.city_id = c.id and p.status = 'approved'
  where c.is_active
  group by c.id;

grant select on public.city_listing_stats to anon, authenticated, service_role;

create or replace view public.locality_listing_stats with (security_invoker = true) as
  select
    l.id as locality_id,
    l.city_id,
    l.slug,
    l.name,
    l.is_popular,
    count(p.id)::integer as listing_count
  from public.localities l
  left join public.properties p
    on p.city_id = l.city_id and p.status = 'approved' and lower(p.locality) = lower(l.name)
  group by l.id;

grant select on public.locality_listing_stats to anon, authenticated, service_role;

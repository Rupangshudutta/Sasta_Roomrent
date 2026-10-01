-- 0013: public search and public reviews.
--
-- search_properties() keeps all filter logic in one place and in SQL, where the
-- "must have ALL selected amenities" rule and full-text ranking are natural.
-- It is SECURITY INVOKER, so RLS still applies (anonymous callers only see
-- approved rows); the explicit status filter is belt and braces plus an index hint.

create or replace function public.search_properties(
  p_q text default null,
  p_city text default null,
  p_types public.property_type[] default null,
  p_min_rent numeric default null,
  p_max_rent numeric default null,
  p_furnishing public.furnishing[] default null,
  p_gender public.gender_preference default null,
  p_amenities text[] default null,
  p_min_rating numeric default null,
  p_sort text default 'relevance',
  p_limit integer default 12,
  p_offset integer default 0
)
returns table (property_id uuid, total_count bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  with q as (
    select nullif(trim(coalesce(p_q, '')), '') as text
  ),
  base as (
    select
      p.id,
      p.rent_amount,
      p.rating_avg,
      p.approved_at,
      p.is_featured,
      case
        when (select text from q) is null then 0::real
        else ts_rank(p.search_tsv, websearch_to_tsquery('simple', (select text from q)))
      end as rank
    from public.properties p
    join public.cities c on c.id = p.city_id
    where p.status = 'approved'
      and (p_city is null or c.slug = p_city)
      and (p_types is null or cardinality(p_types) = 0 or p.property_type = any (p_types))
      and (p_min_rent is null or p.rent_amount >= p_min_rent)
      and (p_max_rent is null or p.rent_amount <= p_max_rent)
      and (p_furnishing is null or cardinality(p_furnishing) = 0 or p.furnishing = any (p_furnishing))
      and (p_gender is null or p.gender_preference in ('any', p_gender))
      and (p_min_rating is null or (p.rating_count > 0 and p.rating_avg >= p_min_rating))
      and (
        (select text from q) is null
        or p.search_tsv @@ websearch_to_tsquery('simple', (select text from q))
        or p.locality ilike '%' || (select text from q) || '%'
        or c.name ilike '%' || (select text from q) || '%'
      )
      and (
        p_amenities is null or cardinality(p_amenities) = 0
        or not exists (
          select 1
          from unnest(p_amenities) as wanted(slug)
          where not exists (
            select 1
            from public.property_amenities pa
            join public.amenities am on am.id = pa.amenity_id
            where pa.property_id = p.id and am.slug = wanted.slug
          )
        )
      )
  )
  select b.id, count(*) over () as total_count
  from base b
  order by
    case when p_sort = 'price_low' then b.rent_amount end asc,
    case when p_sort = 'price_high' then b.rent_amount end desc,
    case when p_sort = 'rating' then b.rating_avg end desc,
    case when p_sort = 'newest' then b.approved_at end desc,
    b.is_featured desc,
    b.rank desc,
    b.approved_at desc
  limit greatest(1, least(coalesce(p_limit, 12), 50))
  offset greatest(0, coalesce(p_offset, 0));
$$;

revoke all on function public.search_properties(text, text, public.property_type[], numeric, numeric, public.furnishing[], public.gender_preference, text[], numeric, text, integer, integer) from public;
grant execute on function public.search_properties(text, text, public.property_type[], numeric, numeric, public.furnishing[], public.gender_preference, text[], numeric, text, integer, integer) to anon, authenticated, service_role;

-- Reviews with the reviewer's display name, without exposing profiles.
create or replace view public.public_reviews with (security_invoker = off) as
  select
    r.id,
    r.property_id,
    r.rating,
    r.title,
    r.comment,
    r.created_at,
    p.first_name as reviewer_first_name,
    left(p.last_name, 1) as reviewer_last_initial
  from public.reviews r
  join public.profiles p on p.id = r.tenant_id
  where r.is_visible;

grant select on public.public_reviews to anon, authenticated, service_role;

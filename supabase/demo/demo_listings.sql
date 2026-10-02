-- Sample listings for demonstration (properties.is_demo = true).
--
-- 56 approved listings across the 7 seeded cities, owned by 12 sample owner accounts.
-- The owner accounts must exist first: they are created through the Auth Admin API by
-- supabase/functions/seed-demo (so passwords are hashed and identities created by GoTrue,
-- not by hand). Idempotent: listing ids are derived from a stable reference, so re-running
-- inserts nothing new. Photos are uploaded to Storage afterwards from demo_seed.photo_plan.
--
-- Contact numbers use the platform support line from platform_settings, never a made-up
-- personal number. Booking requests on these listings are refused by migration 0018.

do $$
begin
  if (select count(*) from public.profiles
       where role = 'owner' and email like 'demo-owner-%@sastaroomrent.netlify.app') < 12 then
    raise exception 'the 12 demo owner accounts must exist before loading sample listings';
  end if;
end $$;

-- Staging lives in its own schema, which PostgREST does not expose.
create schema if not exists demo_seed;

create table if not exists demo_seed.source (
  ref int primary key, owner_no int not null, city_slug text not null, locality text not null,
  address text not null, pincode text not null, state text not null, ptype text not null,
  gender text not null, furnishing text not null, rent numeric not null, deposit numeric not null,
  maintenance numeric not null, total_rooms int not null, available_rooms int not null,
  title text not null, highlight text not null, extra_amenities text[] not null, featured boolean not null
);

-- Unsplash photo ids grouped by what they show; rotated per listing so neighbours differ.
create table if not exists demo_seed.photo_pools (kind text primary key, ids text[] not null);

create table if not exists demo_seed.photo_plan (
  property_id uuid primary key,
  owner_id uuid not null,
  photo_ids text[] not null
);

insert into demo_seed.photo_pools (kind, ids) values
  ('bedroom', array[
    '1522771739844-6a9f6d5f14af', '1505693416388-ac5ce068fe85', '1540518614846-7eded433c457',
    '1616594039964-ae9021a400a0', '1598928506311-c55ded91a20c', '1595526114035-0d45ed16cfbf',
    '1615874959474-d609969a20ed', '1617325247661-675ab4b64ae2', '1560184897-ae75f418493e',
    '1505691938895-1758d7feb511', '1631049307264-da0ec9d70304', '1618773928121-c32242e63f39',
    '1590490360182-c33d57733427', '1611892440504-42a792e24d32', '1566665797739-1674de7a421a',
    '1578683010236-d716f9a3f461', '1595576508898-0ad5c879a061', '1513694203232-719a280e022f'
  ]),
  ('dorm', array[
    '1555854877-bab0e564b8d5', '1520277739336-7bf67edfa768', '1631049307264-da0ec9d70304',
    '1590490360182-c33d57733427', '1566665797739-1674de7a421a'
  ]),
  ('living', array[
    '1522708323590-d24dbb6b0267', '1502672260266-1c1ef2d93688', '1560448204-e02f11c3d0e2',
    '1586023492125-27b2c045efd7', '1493809842364-78817add7ffb', '1512918728675-ed5a9ecdebfd',
    '1554995207-c18c203602cb', '1536376072261-38c75010e6c9', '1524758631624-e2822e304c36',
    '1484101403633-562f891dc89a', '1502005229762-cf1b2da7c5d6', '1507089947368-19c1da9775ae',
    '1560185893-a55cbc8c57e8', '1600607687939-ce8a6c25118c', '1600566753190-17f0baa2a6c3',
    '1600210492486-724fe5c67fb0'
  ]),
  ('kitchen', array[
    '1484154218962-a197022b5858', '1556909114-f6e7ad7d3136', '1556020685-ae41abfc9365',
    '1556912173-3bb406ef7e77'
  ]),
  ('bathroom', array[
    '1584622650111-993a426fbf0a', '1552321554-5fefe8c9ef14', '1620626011761-996317b8d101',
    '1600566752355-35792bedcfea'
  ]),
  ('building', array[
    '1545324418-cc1a3fa10c00', '1460317442991-0ec209397118', '1515263487990-61b07816b324',
    '1600585154340-be6161a56a0c', '1600596542815-ffad4c1539a9', '1564013799919-ab600027ffc6'
  ])
on conflict (kind) do update set ids = excluded.ids;

insert into demo_seed.source values
  -- Bangalore
  (1, 1, 'bangalore', 'Koramangala', '80 Feet Road, 4th Block', '560034', 'Karnataka', 'pg', 'female', 'furnished', 12500, 25000, 0, 20, 4, 'Women''s PG with meals near Forum Mall, Koramangala', 'a five minute walk from Forum Mall and the 4th Block food street', array['ac'], true),
  (2, 2, 'bangalore', 'HSR Layout', '27th Main, Sector 2', '560102', 'Karnataka', 'single_room', 'any', 'furnished', 16500, 33000, 1000, 3, 1, 'Private single room with attached bath in HSR Sector 2', 'close to the BDA Complex and Agara Lake', array['ac'], false),
  (3, 2, 'bangalore', 'Whitefield', 'ITPL Main Road, Hoodi', '560066', 'Karnataka', 'flat', 'any', 'semi_furnished', 28000, 84000, 2500, 1, 1, 'Spacious 2BHK flat near ITPL, Whitefield', 'ten minutes from ITPL and the Whitefield metro station', array['gym'], false),
  (4, 1, 'bangalore', 'Indiranagar', '12th Main, HAL 2nd Stage', '560038', 'Karnataka', 'shared_room', 'male', 'furnished', 7500, 15000, 0, 12, 5, 'Twin sharing room for working men in Indiranagar', 'steps from the 100 Feet Road cafes and Indiranagar metro', array[]::text[], false),
  (5, 1, 'bangalore', 'Koramangala', '1st Block, Sarjapur Road', '560034', 'Karnataka', 'hostel', 'female', 'furnished', 9000, 18000, 0, 40, 12, 'Hostel for women students with a study hall, Koramangala', 'near Christ University and the Sarjapur Road bus stops', array[]::text[], false),
  (6, 2, 'bangalore', 'HSR Layout', '19th Main, Sector 4', '560102', 'Karnataka', 'flat', 'any', 'furnished', 22000, 66000, 1500, 1, 1, 'Furnished 1BHK in HSR Layout for professionals', 'on a quiet tree-lined street off 27th Main', array['ac','tv'], true),
  (7, 1, 'bangalore', 'Whitefield', 'EPIP Zone Road', '560066', 'Karnataka', 'pg', 'male', 'furnished', 10500, 21000, 0, 30, 8, 'Men''s PG with AC rooms near EPIP Zone, Whitefield', 'walking distance from the EPIP tech parks', array['ac','gym'], false),
  (8, 2, 'bangalore', 'Indiranagar', 'Defence Colony, 1st Cross', '560038', 'Karnataka', 'single_room', 'female', 'semi_furnished', 14000, 28000, 500, 4, 2, 'Quiet single room for women in Indiranagar Defence Colony', 'in a residential lane five minutes from CMH Road', array[]::text[], false),
  -- Mumbai
  (9, 3, 'mumbai', 'Powai', 'Hiranandani Gardens, Central Avenue', '400076', 'Maharashtra', 'pg', 'male', 'furnished', 15000, 30000, 0, 24, 6, 'Men''s PG near Hiranandani Gardens, Powai', 'a short walk from Galleria and the Powai offices', array['ac'], true),
  (10, 4, 'mumbai', 'Bandra', 'Pali Hill Road, Bandra West', '400050', 'Maharashtra', 'flat', 'any', 'semi_furnished', 48000, 144000, 3500, 1, 1, '1BHK with balcony off Pali Hill, Bandra West', 'minutes from Linking Road and Bandra station', array['ac'], false),
  (11, 3, 'mumbai', 'Andheri', 'Marol Maroshi Road, Andheri East', '400059', 'Maharashtra', 'shared_room', 'female', 'furnished', 11000, 22000, 0, 10, 3, 'Twin sharing for women near Marol metro, Andheri East', 'two minutes from Marol Naka metro station', array['ac'], false),
  (12, 4, 'mumbai', 'Thane', 'Ghodbunder Road, Thane West', '400615', 'Maharashtra', 'single_room', 'any', 'furnished', 21000, 42000, 1500, 2, 1, 'Private room in a 3BHK on Ghodbunder Road, Thane', 'inside a gated society with a pool and clubhouse', array['gym'], false),
  (13, 3, 'mumbai', 'Powai', 'IIT Market Road', '400076', 'Maharashtra', 'hostel', 'male', 'furnished', 9500, 19000, 0, 48, 10, 'Student hostel near IIT Bombay, Powai', 'opposite the IIT main gate bus stop', array[]::text[], false),
  (14, 4, 'mumbai', 'Andheri', 'Lokhandwala Complex, Andheri West', '400053', 'Maharashtra', 'flat', 'any', 'furnished', 62000, 186000, 4500, 1, 1, 'Fully furnished 2BHK in Lokhandwala, Andheri West', 'near the Lokhandwala market and Versova metro', array['ac','tv','gym'], true),
  (15, 3, 'mumbai', 'Bandra', 'Hill Road, Bandra West', '400050', 'Maharashtra', 'pg', 'female', 'furnished', 17000, 34000, 0, 18, 4, 'Women''s PG with meals on Hill Road, Bandra', 'close to Mount Mary and Bandstand', array['ac'], false),
  (16, 4, 'mumbai', 'Thane', 'Vasant Vihar, Pokhran Road 2', '400610', 'Maharashtra', 'flat', 'any', 'unfurnished', 32000, 96000, 2500, 1, 1, 'Unfurnished 1BHK in a gated society, Thane West', 'near Viviana Mall and the Eastern Express Highway', array[]::text[], false),
  -- Delhi NCR
  (17, 5, 'delhi', 'Gurgaon', 'Sector 45, near Unitech Cyber Park', '122003', 'Haryana', 'pg', 'male', 'furnished', 12000, 24000, 0, 30, 7, 'Men''s PG near Cyber Park, Sector 45 Gurgaon', 'a short auto ride from Huda City Centre metro', array['ac'], true),
  (18, 5, 'delhi', 'Gurgaon', 'DLF Phase 3, U Block', '122002', 'Haryana', 'flat', 'any', 'semi_furnished', 30000, 60000, 3000, 1, 1, '2BHK flat in DLF Phase 3, close to Cyber City', 'ten minutes on foot from Cyber Hub', array['ac'], false),
  (19, 6, 'delhi', 'Noida', 'Sector 62, Block C', '201309', 'Uttar Pradesh', 'pg', 'female', 'furnished', 11000, 22000, 0, 22, 5, 'Women''s PG with meals in Sector 62, Noida', 'near the Sector 62 metro and the IT offices', array['ac'], false),
  (20, 6, 'delhi', 'Noida', 'Sector 18, near Atta Market', '201301', 'Uttar Pradesh', 'single_room', 'any', 'furnished', 13500, 27000, 1000, 3, 1, 'Single room near Sector 18 metro, Noida', 'steps from Atta Market and the Great India Place', array['ac'], false),
  (21, 5, 'delhi', 'Dwarka', 'Sector 10, near Dwarka metro', '110075', 'Delhi', 'shared_room', 'male', 'furnished', 7000, 14000, 0, 14, 4, 'Twin sharing room near Dwarka Sector 10 metro', 'with a direct metro line to Connaught Place', array[]::text[], false),
  (22, 5, 'delhi', 'Dwarka', 'Sector 6, DDA Flats', '110075', 'Delhi', 'flat', 'any', 'furnished', 24000, 48000, 2000, 1, 1, 'Furnished 1BHK DDA flat in Dwarka Sector 6', 'next to a park and the Sector 6 market', array['ac','tv'], false),
  (23, 6, 'delhi', 'Rohini', 'Sector 7, near Rithala Road', '110085', 'Delhi', 'hostel', 'female', 'furnished', 9500, 19000, 0, 36, 9, 'Girls hostel with a study room in Rohini Sector 7', 'near the Rohini East metro and coaching centres', array[]::text[], false),
  (24, 6, 'delhi', 'Rohini', 'Sector 3, Pocket 2', '110085', 'Delhi', 'single_room', 'male', 'semi_furnished', 9000, 18000, 500, 4, 2, 'Affordable single room in Rohini Sector 3', 'in a family-run house close to Rohini West metro', array[]::text[], false),
  -- Kolkata
  (25, 7, 'kolkata', 'Salt Lake', 'Sector V, near College More', '700091', 'West Bengal', 'pg', 'female', 'furnished', 8500, 17000, 0, 16, 4, 'Women''s PG near the Sector V IT hub, Salt Lake', 'a short walk from College More and the Sector V offices', array['ac'], true),
  (26, 8, 'kolkata', 'New Town', 'Action Area 1, near Eco Park', '700156', 'West Bengal', 'flat', 'any', 'semi_furnished', 18000, 36000, 1500, 1, 1, '2BHK flat near Eco Park, New Town', 'overlooking Eco Park with easy access to the airport', array[]::text[], false),
  (27, 7, 'kolkata', 'Rajarhat', 'Chinar Park, VIP Road', '700157', 'West Bengal', 'shared_room', 'male', 'furnished', 5500, 11000, 0, 12, 4, 'Budget twin sharing room in Chinar Park, Rajarhat', 'on VIP Road with buses to Salt Lake and the airport', array[]::text[], false),
  (28, 8, 'kolkata', 'Howrah', 'Shibpur, near Botanical Garden', '711102', 'West Bengal', 'single_room', 'any', 'furnished', 9000, 18000, 500, 2, 1, 'Single room near Shibpur, Howrah', 'close to IIEST Shibpur and the Botanical Garden', array[]::text[], false),
  (29, 7, 'kolkata', 'Salt Lake', 'Sector III, near City Centre', '700106', 'West Bengal', 'hostel', 'male', 'furnished', 6500, 13000, 0, 40, 11, 'Student hostel near City Centre, Salt Lake', 'opposite City Centre mall and the Karunamoyee bus stand', array[]::text[], false),
  (30, 8, 'kolkata', 'New Town', 'Action Area 2, Uniworld City', '700156', 'West Bengal', 'flat', 'any', 'furnished', 22000, 44000, 2000, 1, 1, 'Furnished 2BHK in Uniworld City, New Town', 'inside a gated township with a pool and gym', array['ac','gym','tv'], false),
  (31, 7, 'kolkata', 'Rajarhat', 'Rajarhat Main Road, near Narayanpur', '700136', 'West Bengal', 'pg', 'male', 'furnished', 7500, 15000, 0, 20, 5, 'Men''s PG with meals on Rajarhat Main Road', 'on the main road with buses to New Town every few minutes', array[]::text[], false),
  (32, 8, 'kolkata', 'Howrah', 'Kadamtala, Dasnagar', '711105', 'West Bengal', 'flat', 'any', 'unfurnished', 12000, 24000, 800, 1, 1, 'Unfurnished 1BHK near Kadamtala, Howrah', 'fifteen minutes from Howrah station', array[]::text[], false),
  -- Pune
  (33, 9, 'pune', 'Hinjewadi', 'Phase 1, near Wipro Circle', '411057', 'Maharashtra', 'pg', 'male', 'furnished', 9500, 19000, 0, 28, 6, 'Men''s PG near Wipro Circle, Hinjewadi Phase 1', 'walking distance from the Phase 1 IT campuses', array['ac'], true),
  (34, 9, 'pune', 'Hinjewadi', 'Phase 2, Maan Road', '411057', 'Maharashtra', 'flat', 'any', 'semi_furnished', 24000, 72000, 2000, 1, 1, '2BHK flat on Maan Road, Hinjewadi Phase 2', 'in a new society with covered parking', array['gym'], false),
  (35, 9, 'pune', 'Kothrud', 'Karve Road, near Kothrud Depot', '411038', 'Maharashtra', 'single_room', 'female', 'furnished', 11000, 22000, 500, 3, 1, 'Single room for women on Karve Road, Kothrud', 'near the Kothrud depot and the metro', array[]::text[], false),
  (36, 9, 'pune', 'Kothrud', 'Paud Road, near MIT College', '411038', 'Maharashtra', 'hostel', 'any', 'furnished', 8000, 16000, 0, 50, 14, 'Student hostel near MIT College, Kothrud', 'a five minute walk from the MIT campus', array[]::text[], false),
  (37, 9, 'pune', 'Baner', 'Baner Road, near Balewadi High Street', '411045', 'Maharashtra', 'pg', 'female', 'furnished', 10500, 21000, 0, 18, 5, 'Women''s PG near Balewadi High Street, Baner', 'close to the Baner IT offices and cafes', array['ac'], false),
  (38, 9, 'pune', 'Viman Nagar', 'Datta Mandir Chowk', '411014', 'Maharashtra', 'flat', 'any', 'furnished', 26000, 78000, 2500, 1, 1, 'Furnished 1BHK near Phoenix Mall, Viman Nagar', 'ten minutes from the airport and Phoenix Marketcity', array['ac','tv'], false),
  (39, 9, 'pune', 'Wakad', 'Datta Mandir Road', '411057', 'Maharashtra', 'shared_room', 'male', 'furnished', 6500, 13000, 0, 10, 3, 'Twin sharing room in Wakad, near Hinjewadi', 'with shared cabs to Hinjewadi in fifteen minutes', array[]::text[], false),
  (40, 9, 'pune', 'Baner', 'Pancard Club Road', '411045', 'Maharashtra', 'single_room', 'any', 'semi_furnished', 12500, 25000, 800, 2, 1, 'Single room with balcony on Pancard Club Road, Baner', 'with a hill view and a quiet neighbourhood', array[]::text[], false),
  -- Hyderabad
  (41, 10, 'hyderabad', 'Gachibowli', 'DLF Cyber City Road, near Indira Nagar', '500032', 'Telangana', 'pg', 'male', 'furnished', 9000, 18000, 0, 32, 8, 'Men''s PG near DLF Cyber City, Gachibowli', 'a five minute walk from DLF and the Gachibowli flyover', array['ac'], true),
  (42, 10, 'hyderabad', 'Madhapur', 'Ayyappa Society, Road No. 5', '500081', 'Telangana', 'flat', 'any', 'semi_furnished', 25000, 50000, 2500, 1, 1, '2BHK in Ayyappa Society, Madhapur', 'close to Hitech City metro and Inorbit Mall', array['ac'], false),
  (43, 10, 'hyderabad', 'Madhapur', 'Hitech City Road, near Shilparamam', '500081', 'Telangana', 'pg', 'female', 'furnished', 9500, 19000, 0, 24, 6, 'Women''s PG near Shilparamam, Hitech City', 'opposite Shilparamam with the metro two minutes away', array['ac'], false),
  (44, 10, 'hyderabad', 'Kondapur', 'Botanical Garden Road', '500084', 'Telangana', 'single_room', 'any', 'furnished', 12000, 24000, 800, 3, 1, 'Single room near Botanical Garden, Kondapur', 'near the Kondapur RTO and Botanical Garden', array['ac'], false),
  (45, 10, 'hyderabad', 'Kukatpally', 'KPHB Colony, Phase 3', '500072', 'Telangana', 'shared_room', 'male', 'furnished', 6000, 12000, 0, 16, 5, 'Twin sharing room in KPHB Colony, Kukatpally', 'near KPHB metro station and Forum Sujana Mall', array[]::text[], false),
  (46, 10, 'hyderabad', 'Gachibowli', 'Telecom Nagar', '500032', 'Telangana', 'flat', 'any', 'furnished', 19000, 38000, 1500, 1, 1, 'Furnished 1BHK in Telecom Nagar, Gachibowli', 'near the Financial District and ISB', array['ac','tv'], false),
  (47, 10, 'hyderabad', 'Ameerpet', 'Satyam Theatre Road', '500016', 'Telangana', 'hostel', 'female', 'furnished', 7500, 15000, 0, 44, 12, 'Girls hostel near the Ameerpet coaching centres', 'next to Ameerpet metro interchange', array[]::text[], false),
  (48, 10, 'hyderabad', 'Kondapur', 'Masjid Banda Road', '500084', 'Telangana', 'flat', 'any', 'unfurnished', 16000, 32000, 1200, 1, 1, 'Unfurnished 2BHK on Masjid Banda Road, Kondapur', 'in a family-friendly society with a play area', array[]::text[], false),
  -- Chennai
  (49, 11, 'chennai', 'OMR', 'Thoraipakkam, near PTC bus stop', '600097', 'Tamil Nadu', 'pg', 'male', 'furnished', 8500, 17000, 0, 26, 6, 'Men''s PG on OMR, Thoraipakkam', 'on the OMR IT corridor near the PTC bus stop', array['ac'], true),
  (50, 12, 'chennai', 'Velachery', 'Taramani Link Road', '600042', 'Tamil Nadu', 'flat', 'any', 'semi_furnished', 22000, 66000, 1500, 1, 1, '2BHK flat near Phoenix MarketCity, Velachery', 'close to Velachery MRTS and Phoenix MarketCity', array['ac'], false),
  (51, 11, 'chennai', 'Velachery', '100 Feet Bypass Road', '600042', 'Tamil Nadu', 'pg', 'female', 'furnished', 9000, 18000, 0, 20, 5, 'Women''s PG with meals on Velachery Bypass Road', 'near the Velachery bus terminus', array['ac'], false),
  (52, 12, 'chennai', 'Adyar', 'Gandhi Nagar, 2nd Main Road', '600020', 'Tamil Nadu', 'single_room', 'any', 'furnished', 13000, 26000, 800, 2, 1, 'Single room near Adyar Depot, Gandhi Nagar', 'a short walk from the Adyar depot and the beach', array[]::text[], false),
  (53, 11, 'chennai', 'OMR', 'Sholinganallur, near Elcot SEZ', '600119', 'Tamil Nadu', 'hostel', 'male', 'furnished', 7000, 14000, 0, 38, 10, 'Hostel for working men near Elcot SEZ, Sholinganallur', 'opposite the Elcot SEZ entrance', array[]::text[], false),
  (54, 12, 'chennai', 'T Nagar', 'Bazullah Road', '600017', 'Tamil Nadu', 'flat', 'any', 'furnished', 28000, 84000, 2500, 1, 1, 'Furnished 2BHK in T Nagar, near Pondy Bazaar', 'walking distance from Pondy Bazaar and Panagal Park', array['ac','tv'], false),
  (55, 11, 'chennai', 'Anna Nagar', '2nd Avenue, Block AA', '600040', 'Tamil Nadu', 'shared_room', 'female', 'furnished', 6500, 13000, 0, 12, 4, 'Twin sharing for women in Anna Nagar', 'near Anna Nagar Tower Park and the metro', array[]::text[], false),
  (56, 12, 'chennai', 'Velachery', 'Vijaya Nagar, 3rd Main Road', '600042', 'Tamil Nadu', 'flat', 'any', 'unfurnished', 15000, 45000, 1000, 1, 1, 'Unfurnished 1BHK in Vijaya Nagar, Velachery', 'in a quiet residential street close to schools', array[]::text[], false)
on conflict (ref) do nothing;

with owners as (
  select p.id, (regexp_match(p.email, 'demo-owner-(\d+)@'))[1]::int as owner_no
    from public.profiles p
   where p.email like 'demo-owner-%@sastaroomrent.netlify.app'
),
settings as (
  select right(regexp_replace(support_phone, '\D', '', 'g'), 10) as phone
    from public.platform_settings where id = 1
),
prepared as (
  select md5('sasta-room-demo-listing-' || r.ref)::uuid as id, o.id as owner_id, r.*,
         c.id as city_id, c.name as city_name, s.phone
    from demo_seed.source r
    join owners o on o.owner_no = r.owner_no
    join public.cities c on c.slug = r.city_slug
   cross join settings s
)
insert into public.properties (
  id, owner_id, title, description, property_type, gender_preference, furnishing,
  rent_amount, security_deposit, maintenance_amount, address_line1, locality, city_id,
  state, pincode, total_rooms, available_rooms, available_from, min_lease_months,
  house_rules, contact_phone, status, is_featured, is_demo, submitted_at, approved_at
)
select
  p.id, p.owner_id, p.title,
  case p.ptype
    when 'pg' then format(
      'A well-run %s PG in %s, %s, %s. Rent covers breakfast and dinner, daily housekeeping, WiFi and electricity up to a fair limit, so there are no surprise bills. Each room has a bed with mattress, a wardrobe and a study table, and the common area has a fridge and RO water.',
      case p.gender when 'male' then 'men''s' when 'female' then 'women''s' else 'co-living' end,
      p.locality, p.city_name, p.highlight)
    when 'shared_room' then format(
      'A clean twin sharing room in %s, %s, %s. You share the room with one other person and get your own bed, cupboard and study table. Weekly cleaning, WiFi and drinking water are included in the rent.',
      p.locality, p.city_name, p.highlight)
    when 'single_room' then format(
      'A private single room in %s, %s, %s. The room is yours alone with its own lock, and the kitchen and living area are shared with a small number of working professionals. Ideal if you want privacy without the cost of a full flat.',
      p.locality, p.city_name, p.highlight)
    when 'hostel' then format(
      'A safe, supervised hostel in %s, %s, %s. Rooms are shared between two or three students, meals are served three times a day, and there is a quiet study hall open late. Wardens are on site around the clock.',
      p.locality, p.city_name, p.highlight)
    else format(
      'A %s home in %s, %s, %s. The flat gets good natural light and cross ventilation, has a modular kitchen and covered parking, and is in a society with 24/7 security and power backup. Suitable for families or working professionals.',
      replace(p.furnishing, '_', '-'), p.locality, p.city_name, p.highlight)
  end,
  p.ptype::public.property_type, p.gender::public.gender_preference, p.furnishing::public.furnishing,
  p.rent, p.deposit, p.maintenance, p.address, p.locality, p.city_id,
  p.state, p.pincode, p.total_rooms, p.available_rooms,
  current_date + ((p.ref * 3) % 28),
  case p.ptype when 'flat' then 11 when 'single_room' then 3 when 'hostel' then 5 else 1 end,
  case p.ptype
    when 'pg' then 'Gate closes at 11 pm (late entry with prior notice). No smoking or alcohol on the premises. Visitors allowed in the common area until 8 pm. One month notice before moving out.'
    when 'hostel' then 'In by 10 pm on weekdays. Guardians may visit on weekends. No cooking in rooms. Mess timings are posted at the reception.'
    when 'flat' then 'Family or working professionals preferred. Pets allowed with prior approval. Two months notice before vacating. Society rules apply for parking and visitors.'
    else 'Keep shared spaces clean. No loud music after 10 pm. Guests may not stay overnight. One month notice before moving out.'
  end,
  p.phone, 'approved', p.featured, true,
  now() - interval '10 days', now() - interval '9 days' + make_interval(mins => p.ref)
from prepared p
on conflict (id) do nothing;

insert into public.property_amenities (property_id, amenity_id)
select md5('sasta-room-demo-listing-' || r.ref)::uuid, a.id
from demo_seed.source r
cross join lateral unnest(
  case r.ptype
    when 'pg' then array['wifi','meals','laundry','housekeeping','power_backup','cctv','ro_water','geyser','security','wardrobe']
    when 'hostel' then array['wifi','meals','laundry','study_table','cctv','security','ro_water','power_backup','geyser']
    when 'shared_room' then array['wifi','laundry','ro_water','geyser','wardrobe','study_table','power_backup']
    when 'single_room' then array['wifi','attached_bathroom','wardrobe','study_table','geyser','housekeeping','kitchen','refrigerator']
    else array['kitchen','refrigerator','parking','lift','balcony','power_backup','security','geyser','ro_water']
  end || r.extra_amenities
) as wanted(slug)
join public.amenities a on a.slug = wanted.slug
where exists (select 1 from public.properties p where p.id = md5('sasta-room-demo-listing-' || r.ref)::uuid)
on conflict do nothing;

-- Three images per listing, chosen by room type: [first pool, second pool, third pool].
with pick as (
  select r.ref, r.ptype,
    case r.ptype
      when 'flat' then array['living', 'kitchen', 'bedroom']
      when 'hostel' then array['dorm', 'building', 'bathroom']
      when 'shared_room' then array['dorm', 'bedroom', 'bathroom']
      else array['bedroom', 'bathroom', 'building']
    end as kinds
  from demo_seed.source r
)
insert into demo_seed.photo_plan (property_id, owner_id, photo_ids)
select pr.id, pr.owner_id,
  array(
    select pool.ids[1 + ((k.n - 1 + pick.ref) % array_length(pool.ids, 1))]
      from unnest(pick.kinds) with ordinality as k(kind, n)
      join demo_seed.photo_pools pool on pool.kind = k.kind
     order by k.n
  )
from pick
join public.properties pr on pr.id = md5('sasta-room-demo-listing-' || pick.ref)::uuid
on conflict (property_id) do update set photo_ids = excluded.photo_ids, owner_id = excluded.owner_id;

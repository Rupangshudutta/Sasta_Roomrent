-- Reference data. Idempotent: safe to re-run on any environment.
-- Values come from the prototype (docs/prototype/locations.html, register.html, owner dashboard).

insert into public.cities (slug, name, state, sort_order) values
  ('bangalore', 'Bangalore', 'Karnataka', 10),
  ('mumbai', 'Mumbai', 'Maharashtra', 20),
  ('delhi', 'Delhi NCR', 'Delhi', 30),
  ('pune', 'Pune', 'Maharashtra', 40),
  ('hyderabad', 'Hyderabad', 'Telangana', 50),
  ('chennai', 'Chennai', 'Tamil Nadu', 60),
  ('kolkata', 'Kolkata', 'West Bengal', 70)
on conflict (slug) do update set name = excluded.name, state = excluded.state, sort_order = excluded.sort_order;

insert into public.localities (city_id, slug, name, is_popular)
select c.id, l.slug, l.name, true
from (values
  ('bangalore', 'koramangala', 'Koramangala'), ('bangalore', 'hsr-layout', 'HSR Layout'),
  ('bangalore', 'whitefield', 'Whitefield'), ('bangalore', 'indiranagar', 'Indiranagar'),
  ('mumbai', 'powai', 'Powai'), ('mumbai', 'bandra', 'Bandra'), ('mumbai', 'andheri', 'Andheri'), ('mumbai', 'thane', 'Thane'),
  ('delhi', 'gurgaon', 'Gurgaon'), ('delhi', 'noida', 'Noida'), ('delhi', 'dwarka', 'Dwarka'), ('delhi', 'rohini', 'Rohini'),
  ('kolkata', 'salt-lake', 'Salt Lake'), ('kolkata', 'new-town', 'New Town'), ('kolkata', 'rajarhat', 'Rajarhat'), ('kolkata', 'howrah', 'Howrah'),
  ('pune', 'hinjewadi', 'Hinjewadi'), ('pune', 'kothrud', 'Kothrud'),
  ('hyderabad', 'gachibowli', 'Gachibowli'), ('hyderabad', 'madhapur', 'Madhapur'),
  ('chennai', 'velachery', 'Velachery'), ('chennai', 'omr', 'OMR')
) as l(city_slug, slug, name)
join public.cities c on c.slug = l.city_slug
on conflict (city_id, slug) do update set name = excluded.name, is_popular = excluded.is_popular;

insert into public.amenities (slug, label, icon, sort_order) values
  ('wifi', 'Free WiFi', 'wifi', 10),
  ('ac', 'Air Conditioning', 'snowflake', 20),
  ('meals', 'Meals Included', 'utensils', 30),
  ('laundry', 'Laundry', 'washing-machine', 40),
  ('parking', 'Parking', 'car', 50),
  ('security', '24/7 Security', 'shield-check', 60),
  ('cctv', 'CCTV', 'cctv', 70),
  ('gym', 'Gym / Fitness', 'dumbbell', 80),
  ('power_backup', 'Power Backup', 'battery-charging', 90),
  ('geyser', 'Geyser / Hot Water', 'droplets', 100),
  ('lift', 'Lift', 'arrow-up-down', 110),
  ('kitchen', 'Kitchen Access', 'cooking-pot', 120),
  ('refrigerator', 'Refrigerator', 'refrigerator', 130),
  ('tv', 'TV', 'tv', 140),
  ('ro_water', 'RO Drinking Water', 'glass-water', 150),
  ('housekeeping', 'Housekeeping', 'brush-cleaning', 160),
  ('balcony', 'Balcony', 'door-open', 170),
  ('attached_bathroom', 'Attached Bathroom', 'bath', 180),
  ('study_table', 'Study Table', 'lamp-desk', 190),
  ('wardrobe', 'Wardrobe', 'shirt', 200)
on conflict (slug) do update set label = excluded.label, icon = excluded.icon, sort_order = excluded.sort_order;

insert into public.platform_settings (id) values (1) on conflict (id) do nothing;

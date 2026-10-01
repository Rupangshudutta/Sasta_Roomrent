-- Reference data. Idempotent: safe to re-run on any environment.
-- Values come from the prototype (docs/prototype/locations.html, register.html, owner dashboard).

insert into public.cities (slug, name, state, sort_order, image_url) values
  ('bangalore', 'Bangalore', 'Karnataka', 10, 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=1200&q=70'),
  ('mumbai', 'Mumbai', 'Maharashtra', 20, 'https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?auto=format&fit=crop&w=1200&q=70'),
  ('delhi', 'Delhi NCR', 'National Capital Region', 30, 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=1200&q=70'),
  ('pune', 'Pune', 'Maharashtra', 40, 'https://images.unsplash.com/photo-1572782252655-9c8771392601?auto=format&fit=crop&w=1200&q=70'),
  ('hyderabad', 'Hyderabad', 'Telangana', 50, 'https://images.unsplash.com/photo-1551161242-b5af797b7233?auto=format&fit=crop&w=1200&q=70'),
  ('chennai', 'Chennai', 'Tamil Nadu', 60, 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1200&q=70'),
  ('kolkata', 'Kolkata', 'West Bengal', 70, 'https://images.unsplash.com/photo-1558431382-27e303142255?auto=format&fit=crop&w=1200&q=70')
on conflict (slug) do update
  set name = excluded.name, state = excluded.state, sort_order = excluded.sort_order, image_url = excluded.image_url;

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

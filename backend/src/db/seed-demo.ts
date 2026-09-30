/**
 * Optional demo listings so the homepage is not empty on day one.
 *
 *   npm run build && npm run seed:demo
 *
 * Creates a demo owner account and six active listings with stock photos.
 * Skips entirely if any of the demo titles already exist. Remove the demo
 * owner (and its listings cascade) from the admin panel once real rooms exist.
 */
import bcrypt from 'bcryptjs';
import { pool, query, execute } from '../config/database';

const DEMO_OWNER_EMAIL = 'demo-owner@sastaroom.local';

const PROPERTIES = [
  { title: 'Green Valley PG for Working Professionals', property_type: 'pg', rent_amount: 12500, security_deposit: 12500, city: 'Bangalore', state: 'Karnataka', address_line1: '5th Block, Koramangala', pincode: '560034', bedrooms: 1, bathrooms: 1, furnishing: 'furnished', max_occupancy: 2, description: 'Well-maintained PG with home-cooked meals, WiFi and daily housekeeping. Walking distance to Forum Mall and bus stops.', amenities: ['WiFi', 'AC', 'Geyser', 'Laundry', 'Power Backup', 'CCTV'], image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=1200&q=80' },
  { title: 'Urban Living Co-space, Powai', property_type: 'shared_room', rent_amount: 8500, security_deposit: 8500, city: 'Mumbai', state: 'Maharashtra', address_line1: 'Hiranandani Gardens, Powai', pincode: '400076', bedrooms: 1, bathrooms: 1, furnishing: 'furnished', max_occupancy: 3, description: 'Shared room in a modern co-living space with a community kitchen, gym and lake view. Ideal for students and young professionals.', amenities: ['WiFi', 'Gym', 'Kitchen', 'Security Guard', 'Lift'], image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=80' },
  { title: 'Cozy Studio near Sector 62 Metro', property_type: 'single_room', rent_amount: 15000, security_deposit: 30000, city: 'Noida', state: 'Uttar Pradesh', address_line1: 'C Block, Sector 62', pincode: '201301', bedrooms: 1, bathrooms: 1, furnishing: 'semi-furnished', max_occupancy: 1, description: 'Private studio with attached bathroom and small kitchenette, 5 minutes from the metro station.', amenities: ['WiFi', 'Geyser', 'Parking', 'RO Water'], image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80' },
  { title: 'Modern 2BHK Apartment, HSR Layout', property_type: 'flat', rent_amount: 28000, security_deposit: 84000, city: 'Bangalore', state: 'Karnataka', address_line1: '27th Main, HSR Layout Sector 2', pincode: '560102', bedrooms: 2, bathrooms: 2, furnishing: 'semi-furnished', max_occupancy: 4, description: 'Bright 2BHK on the 3rd floor with balcony, modular kitchen and covered parking. Families and working professionals welcome.', amenities: ['Parking', 'Lift', 'Power Backup', 'Balcony', 'Kitchen', 'Security Guard'], image: 'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=1200&q=80' },
  { title: 'Elite Executive PG, Sector 29', property_type: 'pg', rent_amount: 18500, security_deposit: 18500, city: 'Gurgaon', state: 'Haryana', address_line1: 'Near Leisure Valley, Sector 29', pincode: '122001', bedrooms: 1, bathrooms: 1, furnishing: 'furnished', max_occupancy: 1, description: 'Premium single-occupancy PG with AC rooms, three meals a day and a rooftop lounge.', amenities: ['WiFi', 'AC', 'Laundry', 'TV', 'Refrigerator', 'Power Backup'], image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&q=80' },
  { title: 'Co-living Hub, Bandra West', property_type: 'shared_room', rent_amount: 11000, security_deposit: 11000, city: 'Mumbai', state: 'Maharashtra', address_line1: 'Pali Hill, Bandra West', pincode: '400050', bedrooms: 1, bathrooms: 1, furnishing: 'furnished', max_occupancy: 2, description: 'Twin-sharing room in a friendly co-living house close to Bandra station, cafes and the sea face.', amenities: ['WiFi', 'AC', 'Kitchen', 'Washing Machine', 'CCTV'], image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=80' },
];

async function seedDemo(): Promise<void> {
  const [existing] = await query<{ c: number }>('SELECT COUNT(*) AS c FROM properties WHERE title IN (?, ?, ?, ?, ?, ?)', PROPERTIES.map((p) => p.title));
  if (Number(existing.c) > 0) {
    console.log('ℹ️  Demo listings already present — nothing to do');
    return;
  }

  let [owner] = await query<{ id: number }>('SELECT id FROM users WHERE email = ?', [DEMO_OWNER_EMAIL]);
  if (!owner) {
    const hash = await bcrypt.hash(`demo-${Math.random().toString(36).slice(2)}`, 10); // unguessable, login not intended
    const res = await execute(
      `INSERT INTO users (first_name, last_name, email, phone, password, role, is_verified) VALUES ('Demo', 'Owner', ?, '9999999999', ?, 'owner', 1)`,
      [DEMO_OWNER_EMAIL, hash]
    );
    owner = { id: res.insertId };
  }

  for (const p of PROPERTIES) {
    const res = await execute(
      `INSERT INTO properties (owner_id, title, description, property_type, rent_amount, security_deposit, address_line1, city, state, pincode,
         bedrooms, bathrooms, furnishing, max_occupancy, min_lease_months, status, is_featured)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 3, 'active', 1)`,
      [owner.id, p.title, p.description, p.property_type, p.rent_amount, p.security_deposit, p.address_line1, p.city, p.state, p.pincode,
        p.bedrooms, p.bathrooms, p.furnishing, p.max_occupancy]
    );
    await execute('INSERT INTO property_images (property_id, image_url, is_primary, sort_order) VALUES (?, ?, 1, 0)', [res.insertId, p.image]);
    for (const a of p.amenities) {
      await execute('INSERT INTO property_amenities (property_id, amenity) VALUES (?, ?)', [res.insertId, a]);
    }
    console.log('Seeded:', p.title);
  }
  console.log('🎉 Demo listings seeded');
}

seedDemo()
  .then(() => pool.end())
  .then(() => process.exit(0))
  .catch(async (err) => { console.error('❌ Demo seed failed:', err?.message || err); await pool.end().catch(() => undefined); process.exit(1); });

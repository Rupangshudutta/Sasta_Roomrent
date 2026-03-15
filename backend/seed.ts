// seed.ts
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

const properties = [
  { title: "Green Valley PG", property_type: "pg", rent_amount: 12500, city: "Bangalore", state: "Karnataka", address_line1: "Koramangala", rating: 4.6, image: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?ixlib=rb-4.0.3" },
  { title: "Urban Living Co-space", property_type: "shared_room", rent_amount: 8500, city: "Mumbai", state: "Maharashtra", address_line1: "Powai", rating: 4.8, image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3" },
  { title: "Cozy Studio Space", property_type: "single_room", rent_amount: 15000, city: "Noida", state: "Uttar Pradesh", address_line1: "Sector 62", rating: 4.7, image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3" },
  { title: "Modern 2BHK Apartment", property_type: "flat", rent_amount: 28000, city: "Bangalore", state: "Karnataka", address_line1: "HSR Layout", rating: 4.9, image: "https://images.unsplash.com/photo-1554995207-c18c203602cb?ixlib=rb-4.0.3" },
  { title: "Elite Executive PG", property_type: "pg", rent_amount: 18500, city: "Gurgaon", state: "Haryana", address_line1: "Sector 29", rating: 4.5, image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3" },
  { title: "Co-living Hub", property_type: "shared_room", rent_amount: 11000, city: "Mumbai", state: "Maharashtra", address_line1: "Bandra West", rating: 4.4, image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-4.0.3" }
];

async function seed() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true }
  });

  try {
    const [[admin]] = await pool.query<any>('SELECT id FROM users WHERE role="admin" LIMIT 1');
    const adminId = admin?.id || 1;

    for (const p of properties) {
      const [res] = await pool.execute<any>(
        'INSERT INTO properties (owner_id, title, property_type, rent_amount, city, state, address_line1, rating_avg, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, "active")',
        [adminId, p.title, p.property_type, p.rent_amount, p.city, p.state, p.address_line1, p.rating]
      );
      await pool.execute('INSERT INTO property_images (property_id, image_url, is_primary) VALUES (?, ?, 1)', [res.insertId, p.image]);
      console.log('Seeded:', p.title);
    }
    console.log('DB Seeded Successfully!');
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
seed();

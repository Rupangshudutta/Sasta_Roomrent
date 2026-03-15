import { query } from '../config/database';

export async function getAdminDashboard() {
  const [userStats] = await query<Record<string, number>>(
    `SELECT
       COUNT(*) AS total_users,
       SUM(role = 'customer') AS total_customers,
       SUM(role = 'owner') AS total_owners
     FROM users WHERE is_active = 1`
  );
  const [propertyStats] = await query<Record<string, number>>(
    `SELECT
       COUNT(*) AS total_properties,
       SUM(status = 'active') AS active_properties,
       SUM(status = 'pending') AS pending_properties
     FROM properties`
  );
  const [bookingStats] = await query<Record<string, number>>(
    `SELECT
       COUNT(*) AS total_bookings,
       SUM(status = 'active') AS active_bookings,
       SUM(status = 'pending') AS pending_bookings
     FROM bookings`
  );
  const [revenueStats] = await query<{ total_revenue: number }>(
    `SELECT COALESCE(SUM(amount), 0) AS total_revenue FROM payments WHERE status = 'success'`
  );
  const recentProperties = await query(
    `SELECT p.id, p.title, p.city, p.property_type, p.status, p.created_at,
       CONCAT(u.first_name, ' ', u.last_name) AS owner_name
     FROM properties p LEFT JOIN users u ON u.id = p.owner_id
     ORDER BY p.created_at DESC LIMIT 5`
  );
  const recentBookings = await query(
    `SELECT b.id, b.status, b.monthly_rent, b.created_at,
       p.title AS property_title, CONCAT(u.first_name, ' ', u.last_name) AS customer_name
     FROM bookings b
     LEFT JOIN properties p ON p.id = b.property_id
     LEFT JOIN users u ON u.id = b.customer_id
     ORDER BY b.created_at DESC LIMIT 5`
  );

  return { userStats, propertyStats, bookingStats, revenueStats, recentProperties, recentBookings };
}

export async function getOwnerDashboard(ownerId: number) {
  const [propStats] = await query<Record<string, number>>(
    `SELECT COUNT(*) AS total, SUM(status = 'active') AS active, SUM(status = 'pending') AS pending
     FROM properties WHERE owner_id = ?`,
    [ownerId]
  );
  const [bookingStats] = await query<Record<string, number>>(
    `SELECT COUNT(*) AS total, SUM(b.status = 'active') AS active,
       COALESCE(SUM(CASE WHEN b.status = 'active' THEN b.monthly_rent ELSE 0 END), 0) AS monthly_revenue
     FROM bookings b
     LEFT JOIN properties p ON p.id = b.property_id
     WHERE p.owner_id = ?`,
    [ownerId]
  );
  const recentBookings = await query(
    `SELECT b.id, b.status, b.monthly_rent, b.check_in_date, b.created_at,
       p.title AS property_title, CONCAT(u.first_name, ' ', u.last_name) AS customer_name
     FROM bookings b
     LEFT JOIN properties p ON p.id = b.property_id
     LEFT JOIN users u ON u.id = b.customer_id
     WHERE p.owner_id = ?
     ORDER BY b.created_at DESC LIMIT 10`,
    [ownerId]
  );

  return { propStats, bookingStats, recentBookings };
}

export async function getCustomerDashboard(customerId: number) {
  const [bookingStats] = await query<Record<string, number>>(
    `SELECT COUNT(*) AS total, SUM(status = 'active') AS active, SUM(status = 'completed') AS completed
     FROM bookings WHERE customer_id = ?`,
    [customerId]
  );
  const recentBookings = await query(
    `SELECT b.id, b.status, b.monthly_rent, b.check_in_date,
       p.title AS property_title, p.city AS property_city
     FROM bookings b
     LEFT JOIN properties p ON p.id = b.property_id
     WHERE b.customer_id = ?
     ORDER BY b.created_at DESC LIMIT 5`,
    [customerId]
  );
  const favoritesCount = await query<{ count: number }>(
    'SELECT COUNT(*) AS count FROM favorites WHERE user_id = ?',
    [customerId]
  );

  return { bookingStats, recentBookings, favoritesCount: favoritesCount[0]?.count || 0 };
}

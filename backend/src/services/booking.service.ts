import { query, execute } from '../config/database';
import { Booking, CreateBookingDto, UpdateBookingDto } from '../models/booking.model';
import { createError } from '../middleware/error.middleware';

// ---------------------------------------------------------------------------
// Create booking
// ---------------------------------------------------------------------------
export async function createBooking(customerId: number, dto: CreateBookingDto): Promise<Booking> {
  // Get property details
  const [property] = await query<{ rent_amount: number; security_deposit: number; status: string }>(
    'SELECT rent_amount, security_deposit, status FROM properties WHERE id = ?',
    [dto.property_id]
  );
  if (!property) throw createError('Property not found', 404);
  if (property.status !== 'active') throw createError('Property is not available', 400);

  // Check for overlapping active bookings
  const [conflict] = await query<{ id: number }>(
    `SELECT id FROM bookings
     WHERE property_id = ? AND status IN ('confirmed', 'active')`,
    [dto.property_id]
  );
  if (conflict) throw createError('Property is already booked', 409);

  const totalAmount = (property.rent_amount * dto.lease_months) + property.security_deposit;

  const result = await execute(
    `INSERT INTO bookings
       (property_id, customer_id, check_in_date, lease_months,
        monthly_rent, security_deposit, total_amount, status, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
    [
      dto.property_id, customerId, dto.check_in_date, dto.lease_months,
      property.rent_amount, property.security_deposit, totalAmount,
      dto.notes || null,
    ]
  );

  const [booking] = await query<Booking>('SELECT * FROM bookings WHERE id = ?', [result.insertId]);
  return booking;
}

// ---------------------------------------------------------------------------
// Get bookings (role-aware)
// ---------------------------------------------------------------------------
export async function getBookings(userId: number, role: string): Promise<Booking[]> {
  if (role === 'customer') {
    return query<Booking>(
      `SELECT b.*, p.title AS property_title, p.city AS property_city
       FROM bookings b
       LEFT JOIN properties p ON p.id = b.property_id
       WHERE b.customer_id = ?
       ORDER BY b.created_at DESC`,
      [userId]
    );
  }

  if (role === 'owner') {
    return query<Booking>(
      `SELECT b.*, p.title AS property_title, p.city AS property_city,
         CONCAT(u.first_name, ' ', u.last_name) AS customer_name
       FROM bookings b
       LEFT JOIN properties p ON p.id = b.property_id
       LEFT JOIN users u ON u.id = b.customer_id
       WHERE p.owner_id = ?
       ORDER BY b.created_at DESC`,
      [userId]
    );
  }

  // Admin: all bookings
  return query<Booking>(
    `SELECT b.*, p.title AS property_title, p.city AS property_city,
       CONCAT(u.first_name, ' ', u.last_name) AS customer_name
     FROM bookings b
     LEFT JOIN properties p ON p.id = b.property_id
     LEFT JOIN users u ON u.id = b.customer_id
     ORDER BY b.created_at DESC`
  );
}

// ---------------------------------------------------------------------------
// Get single booking
// ---------------------------------------------------------------------------
export async function getBookingById(id: number, userId: number, role: string): Promise<Booking> {
  const [booking] = await query<Booking>(
    `SELECT b.*, p.title AS property_title, p.city AS property_city,
       CONCAT(u.first_name, ' ', u.last_name) AS customer_name
     FROM bookings b
     LEFT JOIN properties p ON p.id = b.property_id
     LEFT JOIN users u ON u.id = b.customer_id
     WHERE b.id = ?`,
    [id]
  );

  if (!booking) throw createError('Booking not found', 404);

  // Authorization check
  if (role === 'customer' && booking.customer_id !== userId) {
    throw createError('Unauthorized', 403);
  }

  return booking;
}

// ---------------------------------------------------------------------------
// Update booking status
// ---------------------------------------------------------------------------
export async function updateBooking(id: number, userId: number, role: string, dto: UpdateBookingDto): Promise<Booking> {
  const booking = await getBookingById(id, userId, role);

  const fields: string[] = [];
  const values: unknown[] = [];

  if (dto.status) { fields.push('status = ?'); values.push(dto.status); }
  if (dto.check_out_date) { fields.push('check_out_date = ?'); values.push(dto.check_out_date); }
  if (dto.cancellation_reason) { fields.push('cancellation_reason = ?'); values.push(dto.cancellation_reason); }
  if (dto.notes) { fields.push('notes = ?'); values.push(dto.notes); }

  if (fields.length > 0) {
    await execute(`UPDATE bookings SET ${fields.join(', ')} WHERE id = ?`, [...values, id]);
  }

  return getBookingById(booking.id, userId, role);
}

// ---------------------------------------------------------------------------
// Cancel booking
// ---------------------------------------------------------------------------
export async function cancelBooking(id: number, userId: number, role: string, reason?: string): Promise<void> {
  const booking = await getBookingById(id, userId, role);

  if (['completed', 'cancelled'].includes(booking.status)) {
    throw createError(`Cannot cancel a ${booking.status} booking`, 400);
  }

  await execute(
    'UPDATE bookings SET status = "cancelled", cancellation_reason = ? WHERE id = ?',
    [reason || 'Cancelled by user', id]
  );
}

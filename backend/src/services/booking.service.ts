import { query, execute } from '../config/database';
import { Booking, BookingStatus, CreateBookingDto, UpdateBookingDto } from '../models/booking.model';
import { createError } from '../middleware/error.middleware';
import { notify } from '../services/mailer.service';
import { env } from '../config/env';

// Columns joined onto every booking row. Owner contact is only revealed to the
// customer once the owner has accepted, so owners are not spammed by requests
// they never approved.
const BOOKING_SELECT = `
  SELECT b.*, p.title AS property_title, p.city AS property_city, p.owner_id AS owner_id,
    CONCAT(c.first_name, ' ', c.last_name) AS customer_name, c.email AS customer_email, c.phone AS customer_phone,
    CONCAT(o.first_name, ' ', o.last_name) AS owner_name,
    CASE WHEN b.status IN ('confirmed', 'active', 'completed') THEN o.email END AS owner_email,
    CASE WHEN b.status IN ('confirmed', 'active', 'completed') THEN o.phone END AS owner_phone
  FROM bookings b
  LEFT JOIN properties p ON p.id = b.property_id
  LEFT JOIN users c ON c.id = b.customer_id
  LEFT JOIN users o ON o.id = p.owner_id`;

/** Customers must never see other customers' contact details. */
function stripForCustomer(b: Booking): Booking {
  const { customer_email: _e, customer_phone: _p, ...rest } = b as Booking & { customer_email?: string; customer_phone?: string };
  return rest as Booking;
}

// ---------------------------------------------------------------------------
// Create booking (customer)
// ---------------------------------------------------------------------------
export async function createBooking(customerId: number, dto: CreateBookingDto): Promise<Booking> {
  const [property] = await query<{ id: number; title: string; rent_amount: number; security_deposit: number; status: string; owner_id: number }>(
    'SELECT id, title, rent_amount, security_deposit, status, owner_id FROM properties WHERE id = ?',
    [dto.property_id]
  );
  if (!property) throw createError('Property not found', 404);
  if (property.status !== 'active') throw createError('Property is not available', 400);
  if (property.owner_id === customerId) throw createError('You cannot book your own property', 400);

  // One live tenancy per property.
  const [conflict] = await query<{ id: number }>(
    `SELECT id FROM bookings WHERE property_id = ? AND status IN ('confirmed', 'active')`,
    [dto.property_id]
  );
  if (conflict) throw createError('Property is already booked', 409);

  // Avoid duplicate pending requests from the same customer.
  const [duplicate] = await query<{ id: number }>(
    `SELECT id FROM bookings WHERE property_id = ? AND customer_id = ? AND status = 'pending'`,
    [dto.property_id, customerId]
  );
  if (duplicate) throw createError('You already have a pending request for this property', 409);

  const totalAmount = (Number(property.rent_amount) * dto.lease_months) + Number(property.security_deposit);

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

  const booking = await getBookingById(result.insertId, customerId, 'customer');

  // Tell the owner (and the platform) that a lead arrived.
  const [owner] = await query<{ email: string; first_name: string }>('SELECT email, first_name FROM users WHERE id = ?', [property.owner_id]);
  const recipients = [owner?.email, env.notifyEmail].filter(Boolean) as string[];
  notify({
    to: recipients,
    subject: `New booking request for "${property.title}"`,
    text:
      `A tenant has requested to book "${property.title}".\n\n` +
      `Tenant: ${booking.customer_name}\nEmail: ${(booking as any).customer_email || '-'}\nPhone: ${(booking as any).customer_phone || '-'}\n` +
      `Move-in: ${dto.check_in_date}\nLease: ${dto.lease_months} month(s)\nNotes: ${dto.notes || '-'}\n\n` +
      `Log in to your owner dashboard to confirm or decline.\n— Sasta Room`,
  });

  return booking;
}

// ---------------------------------------------------------------------------
// Get bookings (role-aware)
// ---------------------------------------------------------------------------
export async function getBookings(userId: number, role: string): Promise<Booking[]> {
  if (role === 'customer') {
    const rows = await query<Booking>(`${BOOKING_SELECT} WHERE b.customer_id = ? ORDER BY b.created_at DESC`, [userId]);
    return rows.map(stripForCustomer);
  }
  if (role === 'owner') {
    return query<Booking>(`${BOOKING_SELECT} WHERE p.owner_id = ? ORDER BY b.created_at DESC`, [userId]);
  }
  return query<Booking>(`${BOOKING_SELECT} ORDER BY b.created_at DESC`);
}

// ---------------------------------------------------------------------------
// Get single booking with authorization
// ---------------------------------------------------------------------------
export async function getBookingById(id: number, userId: number, role: string): Promise<Booking> {
  const [booking] = await query<Booking & { owner_id: number }>(`${BOOKING_SELECT} WHERE b.id = ?`, [id]);
  if (!booking) throw createError('Booking not found', 404);

  if (role === 'customer' && booking.customer_id !== userId) throw createError('Unauthorized', 403);
  if (role === 'owner' && booking.owner_id !== userId) throw createError('Unauthorized', 403);

  return role === 'customer' ? stripForCustomer(booking) : booking;
}

// ---------------------------------------------------------------------------
// Update booking
//   owner/admin: change status (confirm / decline / activate / complete)
//   customer:    only notes (cancellation goes through cancelBooking)
// ---------------------------------------------------------------------------
const OWNER_STATUSES: BookingStatus[] = ['confirmed', 'cancelled', 'active', 'completed'];

export async function updateBooking(id: number, userId: number, role: string, dto: UpdateBookingDto): Promise<Booking> {
  const booking = await getBookingById(id, userId, role);

  const fields: string[] = [];
  const values: unknown[] = [];

  if (dto.status) {
    if (role === 'customer') throw createError('Customers cannot change booking status', 403);
    if (!OWNER_STATUSES.includes(dto.status)) throw createError('Invalid status', 400);
    if (['completed', 'cancelled'].includes(booking.status)) throw createError(`Cannot change a ${booking.status} booking`, 400);
    fields.push('status = ?'); values.push(dto.status);
  }
  if (dto.check_out_date && role !== 'customer') { fields.push('check_out_date = ?'); values.push(dto.check_out_date); }
  if (dto.cancellation_reason && role !== 'customer') { fields.push('cancellation_reason = ?'); values.push(dto.cancellation_reason); }
  if (dto.notes !== undefined) { fields.push('notes = ?'); values.push(dto.notes); }

  if (fields.length === 0) throw createError('Nothing to update', 400);

  await execute(`UPDATE bookings SET ${fields.join(', ')} WHERE id = ?`, [...values, id]);
  const updated = await getBookingById(id, userId, role);

  if (dto.status && (dto.status === 'confirmed' || dto.status === 'cancelled')) {
    const [customer] = await query<{ email: string; first_name: string }>('SELECT email, first_name FROM users WHERE id = ?', [booking.customer_id]);
    if (customer?.email) {
      notify({
        to: customer.email,
        subject: dto.status === 'confirmed'
          ? `Your booking for "${booking.property_title}" is confirmed`
          : `Update on your booking request for "${booking.property_title}"`,
        text: dto.status === 'confirmed'
          ? `Hi ${customer.first_name},\n\nThe owner has accepted your request for "${booking.property_title}".\n` +
            `Owner: ${updated.owner_name || '-'}\nPhone: ${(updated as any).owner_phone || '-'}\nEmail: ${(updated as any).owner_email || '-'}\n\n` +
            `Please contact the owner to arrange your move-in.\n— Sasta Room`
          : `Hi ${customer.first_name},\n\nUnfortunately the owner could not accept your request for "${booking.property_title}".\n` +
            `Reason: ${dto.cancellation_reason || 'not specified'}\n\nBrowse other rooms on Sasta Room.\n— Sasta Room`,
      });
    }
  }

  return updated;
}

// ---------------------------------------------------------------------------
// Cancel booking (any party, subject to authorization above)
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

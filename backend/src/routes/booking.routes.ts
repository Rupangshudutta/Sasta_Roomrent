import { Router, Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import * as bookingService from '../services/booking.service';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';

const router = Router();

// GET /api/bookings
router.get('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bookings = await bookingService.getBookings(req.user!.id, req.user!.role);
    res.json({ success: true, message: 'Bookings retrieved', data: { bookings } });
  } catch (err) { next(err); }
});

// GET /api/bookings/:id
router.get('/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const booking = await bookingService.getBookingById(Number(req.params.id), req.user!.id, req.user!.role);
    res.json({ success: true, message: 'Booking retrieved', data: { booking } });
  } catch (err) { next(err); }
});

// POST /api/bookings
router.post(
  '/',
  authMiddleware,
  [
    body('property_id').isInt({ min: 1 }).withMessage('Valid property_id is required'),
    body('check_in_date').isDate().withMessage('Valid check_in_date (YYYY-MM-DD) is required'),
    body('lease_months').isInt({ min: 1 }).withMessage('lease_months must be at least 1'),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const booking = await bookingService.createBooking(req.user!.id, req.body);
      res.status(201).json({ success: true, message: 'Booking created', data: { booking } });
    } catch (err) { next(err); }
  }
);

// PUT /api/bookings/:id
router.put('/:id', authMiddleware, validateRequest, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const booking = await bookingService.updateBooking(Number(req.params.id), req.user!.id, req.user!.role, req.body);
    res.json({ success: true, message: 'Booking updated', data: { booking } });
  } catch (err) { next(err); }
});

// DELETE /api/bookings/:id (cancel)
router.delete('/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await bookingService.cancelBooking(Number(req.params.id), req.user!.id, req.user!.role, req.body.reason);
    res.json({ success: true, message: 'Booking cancelled' });
  } catch (err) { next(err); }
});

export default router;

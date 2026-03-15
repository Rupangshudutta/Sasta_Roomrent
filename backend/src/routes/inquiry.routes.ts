import { Router, Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { query, execute } from '../config/database';
import { createError } from '../middleware/error.middleware';
import { Inquiry, CreateInquiryDto } from '../models/review.model';

const router = Router();

// POST /api/inquiries
router.post(
  '/',
  authMiddleware,
  [
    body('property_id').isInt({ min: 1 }),
    body('message').trim().isLength({ min: 10 }).withMessage('Message must be at least 10 characters'),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto: CreateInquiryDto = req.body;

      const [property] = await query<{ owner_id: number }>(
        'SELECT owner_id FROM properties WHERE id = ?',
        [dto.property_id]
      );
      if (!property) throw createError('Property not found', 404);

      const result = await execute(
        'INSERT INTO inquiries (property_id, sender_id, owner_id, message) VALUES (?, ?, ?, ?)',
        [dto.property_id, req.user!.id, property.owner_id, dto.message]
      );

      res.status(201).json({ success: true, message: 'Inquiry sent', data: { id: result.insertId } });
    } catch (err) { next(err); }
  }
);

// GET /api/inquiries/owner  — owner sees inquiries for their properties
router.get(
  '/owner',
  authMiddleware,
  requireRole('owner', 'admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const inquiries = await query<Inquiry>(
        `SELECT i.*, p.title AS property_title,
           CONCAT(u.first_name, ' ', u.last_name) AS sender_name
         FROM inquiries i
         LEFT JOIN properties p ON p.id = i.property_id
         LEFT JOIN users u ON u.id = i.sender_id
         WHERE i.owner_id = ?
         ORDER BY i.created_at DESC`,
        [req.user!.id]
      );
      // Mark all as read
      await execute('UPDATE inquiries SET is_read = 1 WHERE owner_id = ?', [req.user!.id]);
      res.json({ success: true, message: 'Inquiries retrieved', data: { inquiries } });
    } catch (err) { next(err); }
  }
);

export default router;

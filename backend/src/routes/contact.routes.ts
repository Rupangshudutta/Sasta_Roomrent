import { Router, Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { query, execute } from '../config/database';
import { validateRequest } from '../middleware/validate.middleware';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { notify } from '../services/mailer.service';
import { env } from '../config/env';

const router = Router();

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  is_read: boolean;
  created_at: Date;
}

/**
 * POST /api/contact — public. Every submission is stored so no lead is lost,
 * then forwarded by email when SMTP is configured.
 */
router.post(
  '/',
  [
    body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('phone').optional({ values: 'falsy' }).trim().isLength({ max: 20 }),
    body('subject').trim().isLength({ min: 2, max: 200 }).withMessage('Subject is required'),
    body('message').trim().isLength({ min: 5, max: 5000 }).withMessage('Message is required'),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email, phone, subject, message } = req.body;
      const result = await execute(
        'INSERT INTO contact_messages (name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?)',
        [name, email, phone || null, subject, message]
      );

      notify({
        to: env.notifyEmail,
        subject: `[Sasta Room] Contact form: ${subject}`,
        text: `From: ${name} <${email}> ${phone ? `(${phone})` : ''}\n\n${message}\n\n(message #${result.insertId})`,
      });

      res.status(201).json({
        success: true,
        message: 'Thank you for reaching out! We will get back to you shortly.',
        data: { id: result.insertId },
      });
    } catch (error) { next(error); }
  }
);

/** GET /api/contact — admin inbox (latest 100). */
router.get('/', authMiddleware, requireRole('admin'), async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const messages = await query<ContactMessage>('SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT 100');
    res.json({ success: true, message: 'Messages retrieved', data: { messages } });
  } catch (error) { next(error); }
});

/** PATCH /api/contact/:id/read — admin marks a message handled. */
router.patch('/:id/read', authMiddleware, requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await execute('UPDATE contact_messages SET is_read = 1 WHERE id = ?', [Number(req.params.id)]);
    res.json({ success: true, message: 'Marked as read' });
  } catch (error) { next(error); }
});

export default router;

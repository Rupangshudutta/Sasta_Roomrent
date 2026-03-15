import { Router, Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import * as authService from '../services/auth.service';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';

const router = Router();

// POST /api/auth/register
router.post(
  '/register',
  [
    body('first_name').trim().notEmpty().withMessage('First name is required'),
    body('last_name').trim().notEmpty().withMessage('Last name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').optional().isIn(['customer', 'owner']).withMessage('Role must be customer or owner'),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.registerUser(req.body);
      res.status(201).json({ success: true, message: 'Registered successfully', data: result });
    } catch (err) { next(err); }
  }
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.loginUser(req.body);
      res.json({ success: true, message: 'Logged in successfully', data: result });
    } catch (err) { next(err); }
  }
);

// GET /api/auth/me
router.get('/me', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await authService.getUserById(req.user!.id);
    res.json({ success: true, message: 'Profile retrieved', data: { user } });
  } catch (err) { next(err); }
});

// PUT /api/auth/profile
router.put(
  '/profile',
  authMiddleware,
  [
    body('first_name').optional().trim().notEmpty(),
    body('last_name').optional().trim().notEmpty(),
    body('phone').optional().trim(),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await authService.updateUserProfile(req.user!.id, req.body);
      res.json({ success: true, message: 'Profile updated', data: { user } });
    } catch (err) { next(err); }
  }
);

// PUT /api/auth/change-password
router.put(
  '/change-password',
  authMiddleware,
  [
    body('old_password').notEmpty().withMessage('Current password is required'),
    body('new_password').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await authService.changePassword(req.user!.id, req.body.old_password, req.body.new_password);
      res.json({ success: true, message: 'Password changed successfully' });
    } catch (err) { next(err); }
  }
);

export default router;

import { Router, Request, Response, NextFunction } from 'express';
import * as dashboardService from '../services/dashboard.service';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router();

// GET /api/dashboard/admin
router.get(
  '/admin',
  authMiddleware,
  requireRole('admin'),
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await dashboardService.getAdminDashboard();
      res.json({ success: true, message: 'Admin dashboard data', data });
    } catch (err) { next(err); }
  }
);

// GET /api/dashboard/owner
router.get(
  '/owner',
  authMiddleware,
  requireRole('owner', 'admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await dashboardService.getOwnerDashboard(req.user!.id);
      res.json({ success: true, message: 'Owner dashboard data', data });
    } catch (err) { next(err); }
  }
);

// GET /api/dashboard/customer
router.get(
  '/customer',
  authMiddleware,
  requireRole('customer', 'admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await dashboardService.getCustomerDashboard(req.user!.id);
      res.json({ success: true, message: 'Customer dashboard data', data });
    } catch (err) { next(err); }
  }
);

export default router;

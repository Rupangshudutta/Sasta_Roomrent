import { Router, Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import * as reviewService from '../services/review.service';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';

const router = Router();

// GET /api/reviews/property/:propertyId
router.get('/property/:propertyId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reviews = await reviewService.getPropertyReviews(Number(req.params.propertyId));
    res.json({ success: true, message: 'Reviews retrieved', data: { reviews } });
  } catch (err) { next(err); }
});

// POST /api/reviews
router.post(
  '/',
  authMiddleware,
  [
    body('property_id').isInt({ min: 1 }),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('title').optional().trim().isLength({ max: 255 }),
    body('comment').optional().trim(),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const review = await reviewService.createReview(req.user!.id, req.body);
      res.status(201).json({ success: true, message: 'Review submitted', data: { review } });
    } catch (err) { next(err); }
  }
);

// DELETE /api/reviews/:id
router.delete('/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await reviewService.deleteReview(Number(req.params.id), req.user!.id, req.user!.role);
    res.json({ success: true, message: 'Review deleted' });
  } catch (err) { next(err); }
});

export default router;

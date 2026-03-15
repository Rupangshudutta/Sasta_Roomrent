import { Router, Request, Response, NextFunction } from 'express';
import { body, query as qParam } from 'express-validator';
import * as propertyService from '../services/property.service';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { uploadMultiple } from '../middleware/upload.middleware';
import path from 'path';

const router = Router();

// GET /api/properties — public, filterable
router.get(
  '/',
  [
    qParam('page').optional().isInt({ min: 1 }).toInt(),
    qParam('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
    qParam('min_rent').optional().isFloat({ min: 0 }).toFloat(),
    qParam('max_rent').optional().isFloat({ min: 0 }).toFloat(),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await propertyService.getProperties(req.query as never);
      res.json({ success: true, message: 'Properties retrieved', data: result });
    } catch (err) { next(err); }
  }
);

// GET /api/properties/my  — owner's own properties
router.get(
  '/my',
  authMiddleware,
  requireRole('owner', 'admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const props = await propertyService.getOwnerProperties(req.user!.id);
      res.json({ success: true, message: 'My properties retrieved', data: { properties: props } });
    } catch (err) { next(err); }
  }
);

// GET /api/properties/favorites — customer favorites
router.get(
  '/favorites',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const favs = await propertyService.getUserFavorites(req.user!.id);
      res.json({ success: true, message: 'Favorites retrieved', data: { properties: favs } });
    } catch (err) { next(err); }
  }
);

// GET /api/properties/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const property = await propertyService.getPropertyById(Number(req.params.id));
    res.json({ success: true, message: 'Property retrieved', data: { property } });
  } catch (err) { next(err); }
});

// POST /api/properties — owner/admin only
router.post(
  '/',
  authMiddleware,
  requireRole('owner', 'admin'),
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('property_type').isIn(['pg', 'shared_room', 'single_room', 'flat']),
    body('rent_amount').isFloat({ min: 1 }).withMessage('Rent amount must be positive'),
    body('address_line1').trim().notEmpty(),
    body('city').trim().notEmpty(),
    body('state').trim().notEmpty(),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const property = await propertyService.createProperty(req.user!.id, req.body);
      res.status(201).json({ success: true, message: 'Property created', data: { property } });
    } catch (err) { next(err); }
  }
);

// PUT /api/properties/:id — owner/admin
router.put(
  '/:id',
  authMiddleware,
  requireRole('owner', 'admin'),
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const property = await propertyService.updateProperty(Number(req.params.id), req.user!.id, req.body);
      res.json({ success: true, message: 'Property updated', data: { property } });
    } catch (err) { next(err); }
  }
);

// DELETE /api/properties/:id
router.delete(
  '/:id',
  authMiddleware,
  requireRole('owner', 'admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await propertyService.deleteProperty(Number(req.params.id), req.user!.id, req.user!.role);
      res.json({ success: true, message: 'Property deleted' });
    } catch (err) { next(err); }
  }
);

// POST /api/properties/:id/images — upload images
router.post(
  '/:id/images',
  authMiddleware,
  requireRole('owner', 'admin'),
  uploadMultiple,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        res.status(400).json({ success: false, message: 'No images uploaded' });
        return;
      }
      for (const file of files) {
        const imageUrl = `/uploads/${path.basename(file.path)}`;
        await propertyService.addPropertyImage(Number(req.params.id), imageUrl, false);
      }
      res.json({ success: true, message: `${files.length} image(s) uploaded` });
    } catch (err) { next(err); }
  }
);

// POST /api/properties/:id/toggle-favorite
router.post(
  '/:id/toggle-favorite',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const added = await propertyService.toggleFavorite(req.user!.id, Number(req.params.id));
      res.json({ success: true, message: added ? 'Added to favorites' : 'Removed from favorites', data: { added } });
    } catch (err) { next(err); }
  }
);

export default router;

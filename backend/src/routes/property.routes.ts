import { Router, Request, Response, NextFunction } from 'express';
import { body, query as qParam } from 'express-validator';
import * as propertyService from '../services/property.service';
import { storeImage } from '../services/image.service';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { uploadMultiple } from '../middleware/upload.middleware';
import { createError } from '../middleware/error.middleware';
import { notify } from '../services/mailer.service';
import { env } from '../config/env';

const router = Router();

/** Accepts amenities as a JSON string (multipart) or an array (JSON body). */
function parseAmenities(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch { return raw.split(',').map((s) => s.trim()).filter(Boolean); }
  }
  return [];
}

/** Owners may only touch their own listings; admins may touch any. */
async function assertCanManage(req: Request, propertyId: number): Promise<void> {
  const ownerId = await propertyService.getPropertyOwnerId(propertyId);
  if (ownerId === null) throw createError('Property not found', 404);
  if (req.user!.role !== 'admin' && ownerId !== req.user!.id) throw createError('Unauthorized', 403);
}

const propertyValidators = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('property_type').isIn(['pg', 'shared_room', 'single_room', 'flat']),
  body('rent_amount').isFloat({ min: 1 }).withMessage('Rent amount must be positive'),
  body('address_line1').trim().notEmpty(),
  body('city').trim().notEmpty(),
  body('state').trim().notEmpty(),
  body('pincode').matches(/^[1-9][0-9]{5}$/).withMessage('Invalid pincode'),
  body('bedrooms').optional({ values: 'falsy' }).isInt({ min: 1, max: 10 }),
  body('bathrooms').optional({ values: 'falsy' }).isInt({ min: 1, max: 10 }),
  body('max_occupancy').optional({ values: 'falsy' }).isInt({ min: 1, max: 10 }),
  body('furnishing').optional({ values: 'falsy' }).isIn(['furnished', 'semi-furnished', 'unfurnished']),
  body('available_from').optional({ values: 'falsy' }).isISO8601(),
  body('min_lease_months').optional({ values: 'falsy' }).isInt({ min: 1, max: 24 }),
  body('security_deposit').optional({ values: 'falsy' }).isFloat({ min: 0 }),
  body('latitude').optional({ values: 'falsy' }).isFloat({ min: -90, max: 90 }),
  body('longitude').optional({ values: 'falsy' }).isFloat({ min: -180, max: 180 }),
];

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

// GET /api/properties/my — owner's own properties (all statuses)
router.get('/my', authMiddleware, requireRole('owner', 'admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const props = await propertyService.getOwnerProperties(req.user!.id);
    res.json({ success: true, message: 'My properties retrieved', data: { properties: props } });
  } catch (err) { next(err); }
});

// GET /api/properties/pending — admin moderation queue
router.get('/pending', authMiddleware, requireRole('admin'), async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const props = await propertyService.getPendingProperties();
    res.json({ success: true, message: 'Pending properties retrieved', data: { properties: props } });
  } catch (err) { next(err); }
});

// GET /api/properties/favorites — customer favorites
router.get('/favorites', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const favs = await propertyService.getUserFavorites(req.user!.id);
    res.json({ success: true, message: 'Favorites retrieved', data: { properties: favs } });
  } catch (err) { next(err); }
});

// GET /api/properties/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const property = await propertyService.getPropertyById(Number(req.params.id));
    res.json({ success: true, message: 'Property retrieved', data: { property } });
  } catch (err) { next(err); }
});

// POST /api/properties — owner/admin. Accepts JSON, or multipart with `images`.
router.post(
  '/',
  authMiddleware,
  requireRole('owner', 'admin'),
  uploadMultiple,
  propertyValidators,
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const files = (req.files as Express.Multer.File[] | undefined) || [];
      const primaryImageIndex = parseInt(req.body.primary_image_index || '0', 10);

      const property = await propertyService.createProperty(req.user!.id, {
        ...req.body,
        amenities: parseAmenities(req.body.amenities),
      });

      for (let i = 0; i < files.length; i++) {
        const stored = await storeImage(property.id, files[i].buffer, files[i].mimetype);
        await propertyService.addPropertyImage(property.id, stored.url, i === primaryImageIndex);
      }

      const full = files.length ? await propertyService.getPropertyById(property.id) : property;
      res.status(201).json({ success: true, message: 'Property submitted for review', data: { property: full } });
    } catch (err) { next(err); }
  }
);

// PUT /api/properties/:id — owner/admin
router.put('/:id', authMiddleware, requireRole('owner', 'admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    await assertCanManage(req, id);
    const property = await propertyService.updateProperty(id, { ...req.body, amenities: req.body.amenities ? parseAmenities(req.body.amenities) : undefined });
    res.json({ success: true, message: 'Property updated', data: { property } });
  } catch (err) { next(err); }
});

// PATCH /api/properties/:id/status — admin approves / rejects a listing
router.patch(
  '/:id/status',
  authMiddleware,
  requireRole('admin'),
  [body('status').isIn(['active', 'inactive', 'pending']).withMessage('status must be active, inactive or pending')],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const property = await propertyService.setPropertyStatus(Number(req.params.id), req.body.status);
      if (req.body.status === 'active') {
        const owner = await propertyService.getPropertyOwnerContact(property.id);
        if (owner?.email) {
          notify({
            to: owner.email,
            subject: `Your listing "${property.title}" is now live on Sasta Room`,
            text: `Hi ${owner.first_name},\n\nGood news — your listing "${property.title}" has been approved and is now visible to tenants.\n\n${env.corsOrigins[3] || ''}/properties/${property.id}\n\n— Sasta Room`,
          });
        }
      }
      res.json({ success: true, message: `Property marked ${req.body.status}`, data: { property } });
    } catch (err) { next(err); }
  }
);

// DELETE /api/properties/:id — soft delete
router.delete('/:id', authMiddleware, requireRole('owner', 'admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await propertyService.deleteProperty(Number(req.params.id), req.user!.id, req.user!.role);
    res.json({ success: true, message: 'Property deleted' });
  } catch (err) { next(err); }
});

// POST /api/properties/:id/images — upload one or more photos (field: images)
router.post('/:id/images', authMiddleware, requireRole('owner', 'admin'), uploadMultiple, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const propertyId = Number(req.params.id);
    await assertCanManage(req, propertyId);

    const files = (req.files as Express.Multer.File[] | undefined) || [];
    if (files.length === 0) {
      res.status(400).json({ success: false, message: 'No images uploaded' });
      return;
    }
    const makePrimary = ['1', 'true'].includes(String(req.body.is_primary || '').toLowerCase());
    const stored = [];
    for (let i = 0; i < files.length; i++) {
      const img = await storeImage(propertyId, files[i].buffer, files[i].mimetype);
      await propertyService.addPropertyImage(propertyId, img.url, makePrimary && i === 0);
      stored.push(img);
    }
    res.status(201).json({ success: true, message: `${files.length} image(s) uploaded`, data: { images: stored } });
  } catch (err) { next(err); }
});

// POST /api/properties/:id/toggle-favorite
router.post('/:id/toggle-favorite', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const added = await propertyService.toggleFavorite(req.user!.id, Number(req.params.id));
    res.json({ success: true, message: added ? 'Added to favorites' : 'Removed from favorites', data: { added } });
  } catch (err) { next(err); }
});

export default router;

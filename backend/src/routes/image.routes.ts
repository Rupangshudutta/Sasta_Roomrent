import { Router, Request, Response, NextFunction } from 'express';
import { getImage } from '../services/image.service';

const router = Router();

// GET /api/images/:id — serves a stored property photo.
// Photos never change once stored, so browsers and the Vercel CDN may cache
// them for a year; a new upload always gets a new id.
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ success: false, message: 'Invalid image id' });
      return;
    }
    const image = await getImage(id);
    if (!image) {
      res.status(404).json({ success: false, message: 'Image not found' });
      return;
    }
    res.setHeader('Content-Type', image.mime);
    res.setHeader('Content-Length', image.data.length);
    res.setHeader('Cache-Control', 'public, max-age=31536000, s-maxage=31536000, immutable');
    // Allow the photo to be embedded by a frontend served from another origin.
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.end(image.data);
  } catch (err) { next(err); }
});

export default router;

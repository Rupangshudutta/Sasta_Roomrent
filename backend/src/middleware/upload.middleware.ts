import multer from 'multer';
import { Request } from 'express';
import { env } from '../config/env';

/**
 * Images are kept in memory as Buffers and then written to the database by
 * image.service.ts. Nothing touches the local filesystem, which is required on
 * Vercel (read-only, and each request may land on a different instance) and
 * also means a Hostinger/PM2 deploy never loses photos when redeployed.
 */
const storage = multer.memoryStorage();

function fileFilter(_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback): void {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
  }
}

export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: env.maxUploadBytes,
    files: 10,
  },
});

// Convenience wrappers
export const uploadSingle = uploadMiddleware.single('image');
export const uploadMultiple = uploadMiddleware.array('images', 10);

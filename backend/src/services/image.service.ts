import { query, execute } from '../config/database';
import { createError } from '../middleware/error.middleware';

/**
 * Property photos are stored in the `property_image_blobs` table and served
 * from GET /api/images/:id. Storing them in the database (instead of on disk)
 * is the simplest option that works identically on Vercel, Hostinger, and a
 * laptop, and needs no third-party account. Swap this module for S3 /
 * Cloudinary later without touching the routes.
 */

const MAX_DIMENSION = 1600;   // longest edge after resize
const JPEG_QUALITY = 80;
const MAX_STORED_BYTES = 2 * 1024 * 1024; // hard cap on what we keep in the DB

export interface StoredImage {
  id: number;
  url: string;
  mime: string;
  sizeBytes: number;
}

/**
 * Resize + re-encode with sharp when available. sharp ships native binaries;
 * if they fail to load on an unusual host we fall back to storing the original
 * bytes rather than failing the upload.
 */
async function optimise(buffer: Buffer, mime: string): Promise<{ data: Buffer; mime: string; width?: number; height?: number }> {
  try {
    const sharp = (await import('sharp')).default;
    const pipeline = sharp(buffer, { failOn: 'none' }).rotate(); // .rotate() applies EXIF orientation
    const meta = await pipeline.metadata();
    const out = await pipeline
      .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
      .toBuffer({ resolveWithObject: true });
    return { data: out.data, mime: 'image/jpeg', width: out.info.width, height: out.info.height ?? meta.height };
  } catch (err: any) {
    console.warn('[images] sharp unavailable or failed, storing original bytes:', err?.message || err);
    return { data: buffer, mime };
  }
}

export async function storeImage(propertyId: number, buffer: Buffer, mime: string): Promise<StoredImage> {
  const optimised = await optimise(buffer, mime);
  if (optimised.data.length > MAX_STORED_BYTES) {
    throw createError('Image is too large even after compression. Please upload a smaller photo.', 413);
  }

  const result = await execute(
    `INSERT INTO property_image_blobs (property_id, mime, size_bytes, width, height, data)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [propertyId, optimised.mime, optimised.data.length, optimised.width ?? null, optimised.height ?? null, optimised.data]
  );

  return {
    id: result.insertId,
    url: `/api/images/${result.insertId}`,
    mime: optimised.mime,
    sizeBytes: optimised.data.length,
  };
}

export async function getImage(id: number): Promise<{ mime: string; data: Buffer } | null> {
  const [row] = await query<{ mime: string; data: Buffer }>(
    'SELECT mime, data FROM property_image_blobs WHERE id = ?',
    [id]
  );
  return row || null;
}

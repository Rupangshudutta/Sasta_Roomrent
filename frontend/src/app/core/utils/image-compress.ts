/**
 * Shrinks a photo in the browser before upload.
 *
 * Phone cameras produce 3–8 MB JPEGs. Uploading those over Indian mobile
 * networks is slow, and serverless hosts cap request bodies at a few MB.
 * Resizing to a 1600px longest edge and re-encoding as JPEG usually brings a
 * photo down to 150–400 KB with no visible loss for a listing gallery.
 *
 * Falls back to the original file if anything goes wrong (old browsers,
 * HEIC files the browser cannot decode, etc.) so the upload still proceeds.
 */
export interface CompressOptions {
  maxDimension: number;
  quality: number;
  maxBytes: number;
}

const DEFAULTS: CompressOptions = { maxDimension: 1600, quality: 0.82, maxBytes: 1.2 * 1024 * 1024 };

function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
}

export async function compressImage(file: File, options: Partial<CompressOptions> = {}): Promise<File> {
  const opts = { ...DEFAULTS, ...options };
  if (!file.type.startsWith('image/')) return file;

  try {
    // imageOrientation: 'from-image' applies the EXIF rotation so portrait
    // phone photos do not come out sideways.
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' } as ImageBitmapOptions);
    const scale = Math.min(1, opts.maxDimension / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    let quality = opts.quality;
    let blob = await toBlob(canvas, quality);
    while (blob && blob.size > opts.maxBytes && quality > 0.5) {
      quality -= 0.1;
      blob = await toBlob(canvas, quality);
    }
    if (!blob) return file;
    // Nothing gained (already small): keep the original bytes.
    if (scale === 1 && blob.size >= file.size) return file;

    const name = file.name.replace(/\.[^.]+$/, '') + '.jpg';
    return new File([blob], name, { type: 'image/jpeg', lastModified: Date.now() });
  } catch {
    return file;
  }
}

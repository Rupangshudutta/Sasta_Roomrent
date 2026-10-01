/**
 * Browser-side image compression before upload (same policy as the first
 * version of the product): longest edge ≤ 1600px, JPEG, quality stepping down
 * from 0.82 until the result is under the target size. EXIF orientation is
 * honoured by createImageBitmap. Falls back to the original file if anything
 * fails, so a weird image never blocks an upload; the server still enforces
 * size and type limits.
 */
export type CompressedImage = {
  blob: Blob;
  width: number;
  height: number;
  bytes: number;
  compressed: boolean;
};

export type CompressOptions = {
  maxEdge?: number;
  targetBytes?: number;
  initialQuality?: number;
  minQuality?: number;
};

export async function compressImage(
  file: File,
  options: CompressOptions = {},
): Promise<CompressedImage> {
  const {
    maxEdge = 1600,
    targetBytes = 1.2 * 1024 * 1024,
    initialQuality = 0.82,
    minQuality = 0.5,
  } = options;

  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas unavailable");
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    let quality = initialQuality;
    let blob = await toBlob(canvas, quality);
    while (blob.size > targetBytes && quality - 0.08 >= minQuality) {
      quality -= 0.08;
      blob = await toBlob(canvas, quality);
    }

    // If compression made it bigger (tiny PNGs), keep the original.
    if (blob.size >= file.size && file.type === "image/jpeg") {
      return { blob: file, width, height, bytes: file.size, compressed: false };
    }
    return { blob, width, height, bytes: blob.size, compressed: true };
  } catch {
    return { blob: file, width: 0, height: 0, bytes: file.size, compressed: false };
  }
}

function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
      "image/jpeg",
      quality,
    );
  });
}

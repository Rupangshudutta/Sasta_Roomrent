import { compressImage } from "@/lib/images/compress-image";
import { createClient } from "@/lib/supabase/client";
import { PROPERTY_PHOTOS_BUCKET } from "@/lib/supabase/storage";

import { registerPhotoAction } from "./owner-actions";
import { photoRules } from "./schema";

export type PhotoUploadResult = { ok: true } | { ok: false; error: string };
type PhotoTarget = { ownerId: string; propertyId: string };

/** Why a picked file cannot be used, or null when it is fine. Checked before any upload work. */
export function photoFileError(file: File): string | null {
  if (!(photoRules.acceptedTypes as readonly string[]).includes(file.type)) {
    return "Only JPG, PNG or WebP images are allowed.";
  }
  if (file.size > photoRules.maxSourceBytes) return "Each photo must be under 5 MB.";
  return null;
}

/**
 * Browser-side photo pipeline shared by the photo manager and the new-listing
 * form: validate → compress → upload straight to Supabase Storage under
 * `owner/property/` (the storage policy checks that path) → register the row.
 */
export async function uploadListingPhoto(
  file: File,
  target: PhotoTarget,
  onUploading?: () => void,
): Promise<PhotoUploadResult> {
  const invalid = photoFileError(file);
  if (invalid) return { ok: false, error: invalid };

  const compressed = await compressImage(file, {
    maxEdge: photoRules.maxEdge,
    targetBytes: photoRules.targetBytes,
  });
  const ext = compressed.compressed ? "jpg" : extensionFor(file.type);
  const storagePath = `${target.ownerId}/${target.propertyId}/${crypto.randomUUID()}.${ext}`;

  onUploading?.();
  const { error: uploadError } = await createClient()
    .storage.from(PROPERTY_PHOTOS_BUCKET)
    .upload(storagePath, compressed.blob, {
      contentType: compressed.compressed ? "image/jpeg" : file.type,
      cacheControl: "31536000",
      upsert: false,
    });
  if (uploadError) return { ok: false, error: friendlyStorageError(uploadError.message) };

  const result = await registerPhotoAction({
    propertyId: target.propertyId,
    storagePath,
    width: compressed.width || 1,
    height: compressed.height || 1,
    bytes: compressed.bytes,
  });
  return result.ok ? { ok: true } : { ok: false, error: result.message };
}

/**
 * Uploads one file at a time. registerPhotoAction picks the cover and sort
 * order from the current photo count, so parallel uploads to an empty listing
 * all claim to be the cover and all but one hit the one-cover unique index.
 */
export async function uploadListingPhotos(
  files: readonly File[],
  target: PhotoTarget,
  onProgress?: (index: number, phase: "uploading" | PhotoUploadResult) => void,
): Promise<PhotoUploadResult[]> {
  const results: PhotoUploadResult[] = [];
  for (const [index, file] of files.entries()) {
    const result = await uploadListingPhoto(file, target, () => onProgress?.(index, "uploading"));
    onProgress?.(index, result);
    results.push(result);
  }
  return results;
}

function extensionFor(type: string) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "jpg";
}

function friendlyStorageError(message: string) {
  if (/row-level security|policy|unauthorized|403/i.test(message))
    return "You are not allowed to upload to this listing.";
  if (/exceeded|size/i.test(message)) return "The file is too large.";
  if (/mime|type/i.test(message)) return "Unsupported image type.";
  return "Upload failed. Please try again.";
}

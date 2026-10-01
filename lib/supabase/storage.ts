import { publicEnv } from "@/lib/config/public-env";

export const PROPERTY_PHOTOS_BUCKET = "property-photos";

/** Public URL for an object in the public property-photos bucket. Safe on client and server. */
export function propertyPhotoUrl(storagePath: string): string {
  return `${publicEnv.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${PROPERTY_PHOTOS_BUCKET}/${storagePath}`;
}

/** Primary photo first, then by sort order. */
export function primaryPhotoPath(
  photos: ReadonlyArray<{ storage_path: string; is_primary: boolean; sort_order: number }>,
): string | null {
  if (photos.length === 0) return null;
  const sorted = [...photos].sort(
    (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order,
  );
  return sorted[0]?.storage_path ?? null;
}

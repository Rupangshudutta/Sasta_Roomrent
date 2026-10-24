import "server-only";

import { cache } from "react";

import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

export type ListingStatus = Database["public"]["Enums"]["listing_status"];
export type PropertyRow = Database["public"]["Tables"]["properties"]["Row"];
export type PhotoRow = Database["public"]["Tables"]["property_photos"]["Row"];

export type OwnerListing = PropertyRow & {
  city: { id: number; name: string; slug: string } | null;
  photos: PhotoRow[];
  amenities: {
    amenity_id: number;
    amenity: { slug: string; label: string; icon: string } | null;
  }[];
};

const ownerListingSelect = `
  *,
  city:cities ( id, name, slug ),
  photos:property_photos ( * ),
  amenities:property_amenities ( amenity_id, amenity:amenities ( slug, label, icon ) )
` as const;

/**
 * Owner-area queries filter by owner_id explicitly. RLS alone is not enough:
 * "properties: public read approved" lets every signed-in user read approved
 * listings, and permissive policies are OR-ed, so an unfiltered select returns
 * the owner's listings plus everyone else's live ones. RLS still blocks writes.
 */
async function signedInUserId(): Promise<string | null> {
  const user = await getCurrentUser();
  return user?.id ?? null;
}

/** All listings of the signed-in owner. */
export const getOwnerListings = cache(async (status?: ListingStatus): Promise<OwnerListing[]> => {
  const ownerId = await signedInUserId();
  if (!ownerId) return [];
  const supabase = await createClient();
  let query = supabase
    .from("properties")
    .select(ownerListingSelect)
    .eq("owner_id", ownerId)
    .order("updated_at", { ascending: false });
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) {
    console.error("listings.getOwnerListings failed", { code: error.code });
    return [];
  }
  return data as unknown as OwnerListing[];
});

export const getOwnerListingById = cache(async (id: string): Promise<OwnerListing | null> => {
  const ownerId = await signedInUserId();
  if (!ownerId) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("properties")
    .select(ownerListingSelect)
    .eq("id", id)
    .eq("owner_id", ownerId)
    .maybeSingle();
  if (error) {
    console.error("listings.getOwnerListingById failed", { code: error.code });
    return null;
  }
  return (data as unknown as OwnerListing | null) ?? null;
});

export type OwnerListingCounts = Record<ListingStatus, number> & { total: number };

export const getOwnerListingCounts = cache(async (): Promise<OwnerListingCounts> => {
  const counts: OwnerListingCounts = {
    draft: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    inactive: 0,
    total: 0,
  };
  const ownerId = await signedInUserId();
  if (!ownerId) return counts;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("properties")
    .select("status")
    .eq("owner_id", ownerId);
  if (error) {
    console.error("listings.getOwnerListingCounts failed", { code: error.code });
    return counts;
  }
  for (const row of data) {
    counts[row.status] += 1;
    counts.total += 1;
  }
  return counts;
});

export const getOwnerPendingRequestCount = cache(async (): Promise<number> => {
  const ownerId = await signedInUserId();
  if (!ownerId) return 0;
  const supabase = await createClient();
  // Bookings RLS also returns the caller's own requests as a tenant; count only those received.
  const { count, error } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", ownerId)
    .eq("status", "pending");
  if (error) return 0;
  return count ?? 0;
});

export function sortPhotos(photos: readonly PhotoRow[]): PhotoRow[] {
  return [...photos].sort(
    (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order,
  );
}

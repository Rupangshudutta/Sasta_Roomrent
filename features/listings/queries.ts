import "server-only";

import { unstable_cache } from "next/cache";
import { cache } from "react";

import { createPublicClient, PUBLIC_DATA_TAG } from "@/lib/supabase/public";
import type { Database } from "@/types/database.types";

export type ListingCard = Pick<
  Database["public"]["Tables"]["properties"]["Row"],
  | "id"
  | "title"
  | "property_type"
  | "rent_amount"
  | "locality"
  | "rating_avg"
  | "rating_count"
  | "furnishing"
  | "gender_preference"
  | "is_featured"
  | "is_demo"
> & {
  city: { name: string; slug: string } | null;
  photos: { storage_path: string; is_primary: boolean; sort_order: number }[];
  amenities: { amenity: { slug: string; label: string; icon: string } | null }[];
};

export const listingCardSelect = `
  id, title, property_type, rent_amount, locality, rating_avg, rating_count, furnishing, gender_preference, is_featured, is_demo,
  city:cities ( name, slug ),
  photos:property_photos ( storage_path, is_primary, sort_order ),
  amenities:property_amenities ( amenity:amenities ( slug, label, icon ) )
` as const;

/**
 * Featured listings for the home page: admin-featured first, then the newest
 * approved ones. The same for every visitor, so shared across requests for a
 * minute; errors throw inside the cached function so they are never cached.
 */
export const getFeaturedListings = cache(async (limit = 6): Promise<ListingCard[]> => {
  try {
    return await featuredListings(limit);
  } catch (error) {
    console.error("listings.getFeaturedListings failed", {
      code: (error as { code?: string }).code ?? "unknown",
    });
    return [];
  }
});

const featuredListings = unstable_cache(
  async (limit: number): Promise<ListingCard[]> => {
    const { data, error } = await createPublicClient()
      .from("properties")
      .select(listingCardSelect)
      .eq("status", "approved")
      .order("is_featured", { ascending: false })
      .order("approved_at", { ascending: false })
      .limit(limit);
    if (error) throw Object.assign(new Error("featured listings failed"), { code: error.code });
    return data as unknown as ListingCard[];
  },
  ["listings", "featured"],
  { revalidate: 60, tags: [PUBLIC_DATA_TAG] },
);

export const getApprovedListingCount = cache(async (): Promise<number> => {
  try {
    return await approvedListingCount();
  } catch {
    return 0;
  }
});

const approvedListingCount = unstable_cache(
  async (): Promise<number> => {
    const { count, error } = await createPublicClient()
      .from("properties")
      .select("id", { count: "exact", head: true })
      .eq("status", "approved");
    if (error) throw new Error("listing count failed");
    return count ?? 0;
  },
  ["listings", "approved-count"],
  { revalidate: 60, tags: [PUBLIC_DATA_TAG] },
);

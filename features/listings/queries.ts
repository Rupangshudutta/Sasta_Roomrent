import "server-only";

import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
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
 * approved ones, up to `limit`. RLS already restricts this to approved rows.
 */
export const getFeaturedListings = cache(async (limit = 6): Promise<ListingCard[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("properties")
    .select(listingCardSelect)
    .eq("status", "approved")
    .order("is_featured", { ascending: false })
    .order("approved_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("listings.getFeaturedListings failed", { code: error.code });
    return [];
  }
  return data as unknown as ListingCard[];
});

export const getApprovedListingCount = cache(async (): Promise<number> => {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("properties")
    .select("id", { count: "exact", head: true })
    .eq("status", "approved");
  if (error) return 0;
  return count ?? 0;
});

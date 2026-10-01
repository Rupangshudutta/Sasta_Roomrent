import "server-only";

import { cache } from "react";

import { listingCardSelect, type ListingCard } from "@/features/listings/queries";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

import { SEARCH_PAGE_SIZE, type SearchFilter } from "./schema";

export type SearchResult = {
  listings: ListingCard[];
  total: number;
  page: number;
  pageSize: number;
};

/**
 * Two round trips by design: the SQL function returns the ordered ids and the
 * total (it owns ranking and the all-amenities rule), then one select hydrates
 * the cards with their joins. Order from the function is preserved.
 */
export const searchListings = cache(async (filter: SearchFilter): Promise<SearchResult> => {
  const supabase = await createClient();
  const offset = (filter.page - 1) * SEARCH_PAGE_SIZE;

  const { data: hits, error } = await supabase.rpc("search_properties", {
    p_q: filter.q || undefined,
    p_city: filter.city || undefined,
    p_types: filter.type.length ? filter.type : undefined,
    p_min_rent: filter.minRent,
    p_max_rent: filter.maxRent,
    p_furnishing: filter.furnishing.length ? filter.furnishing : undefined,
    p_gender: filter.gender !== "any" ? filter.gender : undefined,
    p_amenities: filter.amenities.length ? filter.amenities : undefined,
    p_min_rating: filter.minRating,
    p_sort: filter.sort,
    p_limit: SEARCH_PAGE_SIZE,
    p_offset: offset,
  });

  if (error) {
    console.error("search.searchListings failed", { code: error.code });
    return { listings: [], total: 0, page: filter.page, pageSize: SEARCH_PAGE_SIZE };
  }
  const ids = (hits ?? []).map((h) => h.property_id);
  const total = Number(hits?.[0]?.total_count ?? 0);
  if (ids.length === 0)
    return { listings: [], total, page: filter.page, pageSize: SEARCH_PAGE_SIZE };

  const { data: rows, error: rowsError } = await supabase
    .from("properties")
    .select(listingCardSelect)
    .in("id", ids);
  if (rowsError) {
    console.error("search.hydrate failed", { code: rowsError.code });
    return { listings: [], total, page: filter.page, pageSize: SEARCH_PAGE_SIZE };
  }
  const byId = new Map((rows as unknown as ListingCard[]).map((r) => [r.id, r]));
  const listings = ids.map((id) => byId.get(id)).filter((r): r is ListingCard => Boolean(r));
  return { listings, total, page: filter.page, pageSize: SEARCH_PAGE_SIZE };
});

type PropertyRow = Database["public"]["Tables"]["properties"]["Row"];

export type PublicListing = PropertyRow & {
  city: { name: string; slug: string } | null;
  photos: {
    id: string;
    storage_path: string;
    is_primary: boolean;
    sort_order: number;
    width: number | null;
    height: number | null;
  }[];
  amenities: { amenity: { slug: string; label: string; icon: string } | null }[];
};

export type PublicOwner = Database["public"]["Views"]["owner_public_profiles"]["Row"];
export type PublicReview = Database["public"]["Views"]["public_reviews"]["Row"];

/** Listing detail. RLS returns approved rows to everyone and own rows to the owner/admin. */
export const getPublicListing = cache(async (id: string): Promise<PublicListing | null> => {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("properties")
    .select(
      `*,
       city:cities ( name, slug ),
       photos:property_photos ( id, storage_path, is_primary, sort_order, width, height ),
       amenities:property_amenities ( amenity:amenities ( slug, label, icon ) )`,
    )
    .eq("id", id)
    .maybeSingle();
  if (error) {
    console.error("search.getPublicListing failed", { code: error.code });
    return null;
  }
  return (data as unknown as PublicListing | null) ?? null;
});

export const getPublicOwner = cache(async (ownerId: string): Promise<PublicOwner | null> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("owner_public_profiles")
    .select("*")
    .eq("id", ownerId)
    .maybeSingle();
  return data ?? null;
});

export const getPublicReviews = cache(
  async (propertyId: string, limit = 20): Promise<PublicReview[]> => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("public_reviews")
      .select("*")
      .eq("property_id", propertyId)
      .order("created_at", { ascending: false })
      .limit(limit);
    return data ?? [];
  },
);

/** Owner's other live listings, for the "More from this owner" strip. */
export const getOwnerOtherListings = cache(
  async (ownerId: string, excludeId: string, limit = 3): Promise<ListingCard[]> => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("properties")
      .select(listingCardSelect)
      .eq("owner_id", ownerId)
      .eq("status", "approved")
      .neq("id", excludeId)
      .order("approved_at", { ascending: false })
      .limit(limit);
    return (data as unknown as ListingCard[]) ?? [];
  },
);

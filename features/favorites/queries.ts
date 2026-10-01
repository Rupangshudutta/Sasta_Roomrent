import "server-only";

import { cache } from "react";

import { listingCardSelect, type ListingCard } from "@/features/listings/queries";
import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

/** Ids the signed-in user has saved; empty for visitors. Cheap, cached per request. */
export const getFavoriteIds = cache(async (): Promise<Set<string>> => {
  const user = await getCurrentUser();
  if (!user) return new Set();
  const supabase = await createClient();
  const { data } = await supabase.from("favorites").select("property_id");
  return new Set((data ?? []).map((f) => f.property_id));
});

export type FavoriteListing = { savedAt: string; listing: ListingCard | null };

export const getFavoriteListings = cache(async (): Promise<FavoriteListing[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("favorites")
    .select(`created_at, listing:properties ( ${listingCardSelect} )`)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("favorites.getFavoriteListings failed", { code: error.code });
    return [];
  }
  // A saved listing that is no longer approved comes back as null under RLS.
  return (data ?? []).map((row) => ({
    savedAt: row.created_at,
    listing: (row.listing as unknown as ListingCard | null) ?? null,
  }));
});

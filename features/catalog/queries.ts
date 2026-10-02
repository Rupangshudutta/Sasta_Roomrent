import "server-only";

import { unstable_cache } from "next/cache";
import { cache } from "react";

import { createPublicClient, PUBLIC_DATA_TAG } from "@/lib/supabase/public";
import type { Database } from "@/types/database.types";

/**
 * Read-side queries for reference data. The data is the same for every visitor, so
 * it is cached across requests (unstable_cache) as well as deduplicated within one
 * render (React cache). That removes several database round trips from nearly
 * every page. Queries run as `anon` through the cookie-less public client.
 *
 * A failed query throws inside the cached function, so an error is never cached;
 * the outer wrapper logs it and falls back for this request only.
 */
const REFERENCE_TTL_SECONDS = 300;
const STATS_TTL_SECONDS = 120;

function cachedQuery<T>(
  name: string,
  ttl: number,
  query: () => PromiseLike<{ data: T | null; error: { code?: string } | null }>,
  fallback: T,
) {
  const cached = unstable_cache(
    async () => {
      const { data, error } = await query();
      if (error) throw Object.assign(new Error(`${name} failed`), { code: error.code });
      return data ?? fallback;
    },
    ["catalog", name],
    { revalidate: ttl, tags: [PUBLIC_DATA_TAG] },
  );
  return cache(async (): Promise<T> => {
    try {
      return await cached();
    } catch (error) {
      console.error(`catalog.${name} failed`, {
        code:
          (error as { code?: string }).code ?? (error instanceof Error ? error.name : "unknown"),
      });
      return fallback;
    }
  });
}
export type City = Database["public"]["Tables"]["cities"]["Row"];
export type Amenity = Database["public"]["Tables"]["amenities"]["Row"];
export type PlatformSettings = Database["public"]["Tables"]["platform_settings"]["Row"];
export type CityStats = Database["public"]["Views"]["city_listing_stats"]["Row"];
export type LocalityStats = Database["public"]["Views"]["locality_listing_stats"]["Row"];

export const getActiveCities = cachedQuery<City[]>(
  "getActiveCities",
  REFERENCE_TTL_SECONDS,
  () =>
    createPublicClient()
      .from("cities")
      .select("*")
      .eq("is_active", true)
      .order("sort_order")
      .order("name"),
  [],
);

export const getActiveAmenities = cachedQuery<Amenity[]>(
  "getActiveAmenities",
  REFERENCE_TTL_SECONDS,
  () =>
    createPublicClient().from("amenities").select("*").eq("is_active", true).order("sort_order"),
  [],
);

const fallbackSettings: PlatformSettings = {
  id: 1,
  platform_name: "Sasta Room",
  support_email: "support@sastaroom.com",
  support_phone: "+91 62943 47052",
  whatsapp_number: "916294347052",
  office_address: "123, MG Road, Koramangala, Bangalore, Karnataka - 560034",
  working_hours: "Mon-Sat, 9 AM - 7 PM",
  commission_rate: 10,
  booking_token_amount: 499,
  auto_approve_listings: false,
  max_photos_per_listing: 10,
  updated_at: new Date(0).toISOString(),
};

/** Public, non-secret platform settings. Falls back to defaults if the DB is unreachable. */
export const getPlatformSettings = cachedQuery<PlatformSettings>(
  "getPlatformSettings",
  REFERENCE_TTL_SECONDS,
  () => createPublicClient().from("platform_settings").select("*").eq("id", 1).maybeSingle(),
  fallbackSettings,
);

export const getCityStats = cachedQuery<CityStats[]>(
  "getCityStats",
  STATS_TTL_SECONDS,
  () => createPublicClient().from("city_listing_stats").select("*").order("sort_order"),
  [],
);

export const getPopularLocalityStats = cachedQuery<LocalityStats[]>(
  "getPopularLocalityStats",
  STATS_TTL_SECONDS,
  () =>
    createPublicClient()
      .from("locality_listing_stats")
      .select("*")
      .eq("is_popular", true)
      .order("name"),
  [],
);

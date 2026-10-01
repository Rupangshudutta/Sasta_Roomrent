import "server-only";

import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

/**
 * Read-side queries for reference data. All run under the caller's RLS through
 * the request-scoped server client and are deduplicated per request with
 * React's cache(), so a page and its layout can both call them freely.
 */
export type City = Database["public"]["Tables"]["cities"]["Row"];
export type Amenity = Database["public"]["Tables"]["amenities"]["Row"];
export type PlatformSettings = Database["public"]["Tables"]["platform_settings"]["Row"];
export type CityStats = Database["public"]["Views"]["city_listing_stats"]["Row"];
export type LocalityStats = Database["public"]["Views"]["locality_listing_stats"]["Row"];

export const getActiveCities = cache(async (): Promise<City[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cities")
    .select("*")
    .eq("is_active", true)
    .order("sort_order")
    .order("name");
  if (error) {
    console.error("catalog.getActiveCities failed", { code: error.code });
    return [];
  }
  return data;
});

export const getActiveAmenities = cache(async (): Promise<Amenity[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("amenities")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");
  if (error) {
    console.error("catalog.getActiveAmenities failed", { code: error.code });
    return [];
  }
  return data;
});

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
export const getPlatformSettings = cache(async (): Promise<PlatformSettings> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("platform_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  if (error || !data) {
    if (error) console.error("catalog.getPlatformSettings failed", { code: error.code });
    return fallbackSettings;
  }
  return data;
});

export const getCityStats = cache(async (): Promise<CityStats[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase.from("city_listing_stats").select("*").order("sort_order");
  if (error) {
    console.error("catalog.getCityStats failed", { code: error.code });
    return [];
  }
  return data;
});

export const getPopularLocalityStats = cache(async (): Promise<LocalityStats[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("locality_listing_stats")
    .select("*")
    .eq("is_popular", true)
    .order("name");
  if (error) {
    console.error("catalog.getPopularLocalityStats failed", { code: error.code });
    return [];
  }
  return data;
});

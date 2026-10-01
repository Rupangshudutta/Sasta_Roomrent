import "server-only";

import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

export type ReviewRow = Database["public"]["Tables"]["reviews"]["Row"];

/** The signed-in tenant's review for a booking, if any (RLS: author read own). */
export const getMyReviewForBooking = cache(async (bookingId: string): Promise<ReviewRow | null> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reviews")
    .select("*")
    .eq("booking_id", bookingId)
    .maybeSingle();
  return data ?? null;
});

export type OwnerReview = Pick<
  ReviewRow,
  "id" | "rating" | "title" | "comment" | "created_at" | "property_id"
> & {
  property: { title: string } | null;
};

/** Visible reviews on the owner's listings (owner reads them through the public policy). */
export const getOwnerRecentReviews = cache(async (limit = 5): Promise<OwnerReview[]> => {
  const supabase = await createClient();
  const { data: mine } = await supabase.from("properties").select("id");
  const ids = (mine ?? []).map((p) => p.id);
  if (ids.length === 0) return [];
  const { data } = await supabase
    .from("reviews")
    .select("id, rating, title, comment, created_at, property_id, property:properties ( title )")
    .in("property_id", ids)
    .eq("is_visible", true)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as unknown as OwnerReview[];
});

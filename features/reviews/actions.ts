"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getBookingById } from "@/features/bookings/queries";
import { fail, formDataToObject, fromZodError, type ActionResult } from "@/lib/actions/result";
import { getCurrentUser } from "@/lib/auth/session";
import { mapDatabaseError } from "@/lib/supabase/errors";
import { createClient } from "@/lib/supabase/server";

import { getMyReviewForBooking } from "./queries";
import { reviewSchema } from "./schema";

export type ReviewResult = ActionResult<{ reviewId: string }>;

/**
 * Create or update the tenant's review for a booking. The database checks the
 * hard rules (booking belongs to the caller and is active/completed, one review
 * per tenant per property) and recomputes the listing rating.
 */
export async function saveReviewAction(
  _prev: ReviewResult | undefined,
  formData: FormData,
): Promise<ReviewResult> {
  const user = await getCurrentUser();
  if (!user) return fail("unauthenticated", "Please sign in again.");

  const parsed = reviewSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return fromZodError(parsed.error);
  const input = parsed.data;

  const booking = await getBookingById(input.bookingId);
  if (!booking || booking.tenant_id !== user.id) return fail("not_found", "Booking not found.");
  if (booking.status !== "active" && booking.status !== "completed") {
    return fail("forbidden", "You can review a stay once it is active or completed.");
  }

  const supabase = await createClient();
  const existing = await getMyReviewForBooking(input.bookingId);
  const payload = { rating: input.rating, title: input.title || null, comment: input.comment };

  const result = existing
    ? await supabase.from("reviews").update(payload).eq("id", existing.id).select("id").single()
    : await supabase
        .from("reviews")
        .insert({
          ...payload,
          booking_id: input.bookingId,
          property_id: booking.property_id,
          tenant_id: user.id,
        })
        .select("id")
        .single();

  if (result.error || !result.data) {
    const mapped = mapDatabaseError(
      result.error ?? { code: "unknown", message: "", details: "", hint: "", name: "" },
      "reviews.save",
    );
    return fail(mapped.code, mapped.message);
  }

  revalidatePath(`/properties/${booking.property_id}`);
  revalidatePath(`/dashboard/bookings/${input.bookingId}`);
  revalidatePath("/owner");
  redirect(`/dashboard/bookings/${input.bookingId}?reviewed=1`);
}

export async function deleteReviewAction(reviewId: string): Promise<ActionResult<undefined>> {
  const user = await getCurrentUser();
  if (!user) return fail("unauthenticated", "Please sign in again.");
  const supabase = await createClient();
  const { data: review } = await supabase
    .from("reviews")
    .select("property_id, booking_id")
    .eq("id", reviewId)
    .maybeSingle();
  const { error } = await supabase.from("reviews").delete().eq("id", reviewId);
  if (error) {
    const mapped = mapDatabaseError(error, "reviews.delete");
    return fail(mapped.code, mapped.message);
  }
  if (review) {
    revalidatePath(`/properties/${review.property_id}`);
    revalidatePath(`/dashboard/bookings/${review.booking_id}`);
  }
  return { ok: true, data: undefined, message: "Review removed." };
}

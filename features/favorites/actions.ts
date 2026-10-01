"use server";

import { revalidatePath } from "next/cache";

import { fail, ok, type ActionResult } from "@/lib/actions/result";
import { getCurrentUser } from "@/lib/auth/session";
import { mapDatabaseError } from "@/lib/supabase/errors";
import { createClient } from "@/lib/supabase/server";

export type ToggleFavoriteResult = ActionResult<{ saved: boolean }>;

/**
 * Idempotent toggle: the client sends the state it wants, not "flip", so a
 * double click or a retried request cannot end up out of sync.
 */
export async function setFavoriteAction(
  propertyId: string,
  saved: boolean,
): Promise<ToggleFavoriteResult> {
  if (!/^[0-9a-f-]{36}$/i.test(propertyId)) return fail("validation", "Invalid listing.");
  const user = await getCurrentUser();
  if (!user) return fail("unauthenticated", "Sign in to save rooms.");

  const supabase = await createClient();
  const { error } = saved
    ? await supabase
        .from("favorites")
        .upsert(
          { user_id: user.id, property_id: propertyId },
          { onConflict: "user_id,property_id", ignoreDuplicates: true },
        )
    : await supabase
        .from("favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("property_id", propertyId);

  if (error) {
    const mapped = mapDatabaseError(error, "favorites.set");
    return fail(mapped.code, mapped.message);
  }
  revalidatePath("/dashboard/favorites");
  revalidatePath("/dashboard");
  return ok({ saved }, saved ? "Saved to your rooms." : "Removed from saved rooms.");
}

/** Counts a listing view once per browser session (dedupe happens client-side). */
export async function recordListingViewAction(propertyId: string): Promise<void> {
  if (!/^[0-9a-f-]{36}$/i.test(propertyId)) return;
  const supabase = await createClient();
  const { error } = await supabase.rpc("increment_property_view", { p_property_id: propertyId });
  if (error) console.error("listing.view failed", { code: error.code });
}

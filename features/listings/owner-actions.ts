"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { fail, formDataToObject, fromZodError, ok, type ActionResult } from "@/lib/actions/result";
import { getCurrentUser } from "@/lib/auth/session";
import { mapDatabaseError } from "@/lib/supabase/errors";
import { createClient } from "@/lib/supabase/server";
import { PROPERTY_PHOTOS_BUCKET } from "@/lib/supabase/storage";

import { getOwnerListingById } from "./owner-queries";
import {
  listingFormSchema,
  registerPhotoSchema,
  toPropertyRow,
  type RegisterPhotoInput,
} from "./schema";

/**
 * Owner-side Server Actions for listings.
 *
 * Authorization is NOT re-implemented here: every query runs through the
 * request-scoped Supabase client, so RLS decides what the owner may read and
 * write, and the lifecycle trigger decides which status transitions are legal.
 * The actions translate form data, call the database, map errors to field or
 * form messages, and revalidate the pages that show the changed data.
 */

export type ListingSaveResult = ActionResult<{ id: string }>;

async function requireOwner() {
  const user = await getCurrentUser();
  if (!user) return { user: null, error: fail<never>("unauthenticated", "Please sign in again.") };
  if (user.role !== "owner" && user.role !== "admin") {
    return {
      user: null,
      error: fail<never>("forbidden", "Only property owners can manage listings."),
    };
  }
  return { user, error: null };
}

async function resolveAmenityIds(slugs: string[]): Promise<number[]> {
  if (slugs.length === 0) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("amenities")
    .select("id, slug")
    .in("slug", slugs)
    .eq("is_active", true);
  return (data ?? []).map((a) => a.id);
}

async function replaceAmenities(propertyId: string, slugs: string[]) {
  const supabase = await createClient();
  const ids = await resolveAmenityIds(slugs);
  const { error: deleteError } = await supabase
    .from("property_amenities")
    .delete()
    .eq("property_id", propertyId);
  if (deleteError) return deleteError;
  if (ids.length === 0) return null;
  const { error: insertError } = await supabase
    .from("property_amenities")
    .insert(ids.map((amenity_id) => ({ property_id: propertyId, amenity_id })));
  return insertError;
}

function revalidateListing(id: string) {
  revalidatePath("/owner");
  revalidatePath("/owner/properties");
  revalidatePath(`/owner/properties/${id}`);
  revalidatePath(`/owner/properties/${id}/edit`);
  revalidatePath(`/properties/${id}`);
  revalidatePath("/properties");
  revalidatePath("/");
}

export async function createListingAction(
  _prev: ListingSaveResult | undefined,
  formData: FormData,
): Promise<ListingSaveResult> {
  const { user, error: authError } = await requireOwner();
  if (!user) return authError;

  const parsed = listingFormSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return fromZodError(parsed.error);
  const values = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("properties")
    .insert({
      ...toPropertyRow(values),
      owner_id: user.id,
      status: values.intent === "submit" ? "pending" : "draft",
    })
    .select("id")
    .single();

  if (error || !data) {
    const mapped = mapDatabaseError(
      error ?? { code: "unknown", message: "", details: "", hint: "", name: "" },
      "listings.create",
    );
    return fail(mapped.code, mapped.message);
  }

  const amenityError = await replaceAmenities(data.id, values.amenities);
  if (amenityError) {
    const mapped = mapDatabaseError(amenityError, "listings.create.amenities");
    return fail(mapped.code, `Listing saved, but amenities failed: ${mapped.message}`);
  }

  revalidateListing(data.id);
  redirect(`/owner/properties/${data.id}?created=1#photos`);
}

export async function updateListingAction(
  listingId: string,
  _prev: ListingSaveResult | undefined,
  formData: FormData,
): Promise<ListingSaveResult> {
  const { user, error: authError } = await requireOwner();
  if (!user) return authError;

  const parsed = listingFormSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return fromZodError(parsed.error);
  const values = parsed.data;

  const existing = await getOwnerListingById(listingId);
  if (!existing) return fail("not_found", "This listing was not found.");

  const nextStatus =
    values.intent === "submit" && ["draft", "rejected", "inactive"].includes(existing.status)
      ? "pending"
      : existing.status;

  const supabase = await createClient();
  const { error } = await supabase
    .from("properties")
    .update({ ...toPropertyRow(values), status: nextStatus })
    .eq("id", listingId);

  if (error) {
    const mapped = mapDatabaseError(error, "listings.update");
    return fail(mapped.code, mapped.message);
  }

  const amenityError = await replaceAmenities(listingId, values.amenities);
  if (amenityError) {
    const mapped = mapDatabaseError(amenityError, "listings.update.amenities");
    return fail(mapped.code, `Details saved, but amenities failed: ${mapped.message}`);
  }

  revalidateListing(listingId);
  redirect(`/owner/properties/${listingId}?saved=1`);
}

/** draft|rejected|inactive -> pending (submit), pending -> draft (withdraw), approved -> inactive (unlist). */
export type StatusTransition = "submit" | "withdraw" | "unlist" | "relist";

const transitionTargets: Record<StatusTransition, "pending" | "draft" | "inactive"> = {
  submit: "pending",
  withdraw: "draft",
  unlist: "inactive",
  relist: "pending",
};

export async function transitionListingAction(
  listingId: string,
  transition: StatusTransition,
): Promise<ActionResult<{ status: string }>> {
  const { user, error: authError } = await requireOwner();
  if (!user) return authError;

  const target = transitionTargets[transition];
  if (!target) return fail("validation", "Unknown action.");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("properties")
    .update({ status: target })
    .eq("id", listingId)
    .select("status")
    .single();

  if (error) {
    const mapped = mapDatabaseError(error, `listings.${transition}`);
    return fail(mapped.code, mapped.message);
  }
  revalidateListing(listingId);
  return ok({ status: data.status }, transitionMessages[transition]);
}

const transitionMessages: Record<StatusTransition, string> = {
  submit: "Submitted for review. We usually respond within 24-48 hours.",
  withdraw: "Moved back to drafts.",
  unlist: "Listing hidden from tenants. You can relist it any time.",
  relist: "Submitted for review again.",
};

/** Only drafts can be deleted outright (RLS policy "properties: owner delete draft"). */
export async function deleteDraftAction(listingId: string): Promise<ActionResult<undefined>> {
  const { user, error: authError } = await requireOwner();
  if (!user) return authError;

  const supabase = await createClient();
  const { data: photos } = await supabase
    .from("property_photos")
    .select("storage_path")
    .eq("property_id", listingId);
  if (photos && photos.length > 0) {
    await supabase.storage.from(PROPERTY_PHOTOS_BUCKET).remove(photos.map((p) => p.storage_path));
  }
  const { error, count } = await supabase
    .from("properties")
    .delete({ count: "exact" })
    .eq("id", listingId)
    .eq("status", "draft");
  if (error) {
    const mapped = mapDatabaseError(error, "listings.deleteDraft");
    return fail(mapped.code, mapped.message);
  }
  if (!count)
    return fail("forbidden", "Only drafts can be deleted. Unlist an approved listing instead.");
  revalidateListing(listingId);
  redirect("/owner/properties?deleted=1");
}

// ---------------------------------------------------------------------------
// Photos. The browser uploads straight to Storage (RLS on storage.objects
// enforces owner/property path ownership); these actions keep the
// property_photos table in sync.
// ---------------------------------------------------------------------------

export async function registerPhotoAction(
  input: RegisterPhotoInput,
): Promise<ActionResult<{ id: string }>> {
  const { user, error: authError } = await requireOwner();
  if (!user) return authError;

  const parsed = registerPhotoSchema.safeParse(input);
  if (!parsed.success) return fromZodError(parsed.error);
  const { propertyId, storagePath, width, height, bytes } = parsed.data;

  if (!storagePath.startsWith(`${user.id}/${propertyId}/`)) {
    return fail("forbidden", "Photo path does not belong to this listing.");
  }

  const supabase = await createClient();
  const { count } = await supabase
    .from("property_photos")
    .select("id", { count: "exact", head: true })
    .eq("property_id", propertyId);

  const { data, error } = await supabase
    .from("property_photos")
    .insert({
      property_id: propertyId,
      storage_path: storagePath,
      is_primary: (count ?? 0) === 0,
      sort_order: count ?? 0,
      width,
      height,
      bytes,
    })
    .select("id")
    .single();

  if (error || !data) {
    // Keep storage consistent with the table: an orphaned object would never be shown.
    await supabase.storage.from(PROPERTY_PHOTOS_BUCKET).remove([storagePath]);
    const mapped = mapDatabaseError(
      error ?? { code: "unknown", message: "", details: "", hint: "", name: "" },
      "photos.register",
    );
    return fail(mapped.code, mapped.message);
  }

  revalidateListing(propertyId);
  return ok({ id: data.id });
}

export async function setPrimaryPhotoAction(
  photoId: string,
  propertyId: string,
): Promise<ActionResult<undefined>> {
  const { user, error: authError } = await requireOwner();
  if (!user) return authError;

  const supabase = await createClient();
  // Two statements, ordered so the partial unique index is never violated.
  const { error: clearError } = await supabase
    .from("property_photos")
    .update({ is_primary: false })
    .eq("property_id", propertyId)
    .eq("is_primary", true);
  if (clearError) {
    const mapped = mapDatabaseError(clearError, "photos.setPrimary.clear");
    return fail(mapped.code, mapped.message);
  }
  const { error, count } = await supabase
    .from("property_photos")
    .update({ is_primary: true }, { count: "exact" })
    .eq("id", photoId)
    .eq("property_id", propertyId);
  if (error) {
    const mapped = mapDatabaseError(error, "photos.setPrimary");
    return fail(mapped.code, mapped.message);
  }
  if (!count) return fail("not_found", "Photo not found.");
  revalidateListing(propertyId);
  return ok(undefined, "Cover photo updated.");
}

export async function deletePhotoAction(
  photoId: string,
  propertyId: string,
): Promise<ActionResult<undefined>> {
  const { user, error: authError } = await requireOwner();
  if (!user) return authError;

  const supabase = await createClient();
  const { data: photo } = await supabase
    .from("property_photos")
    .select("storage_path, is_primary")
    .eq("id", photoId)
    .eq("property_id", propertyId)
    .maybeSingle();
  if (!photo) return fail("not_found", "Photo not found.");

  const { error } = await supabase.from("property_photos").delete().eq("id", photoId);
  if (error) {
    const mapped = mapDatabaseError(error, "photos.delete");
    return fail(mapped.code, mapped.message);
  }
  await supabase.storage.from(PROPERTY_PHOTOS_BUCKET).remove([photo.storage_path]);

  if (photo.is_primary) {
    // Promote the next photo so the listing always has a cover.
    const { data: next } = await supabase
      .from("property_photos")
      .select("id")
      .eq("property_id", propertyId)
      .order("sort_order")
      .limit(1)
      .maybeSingle();
    if (next) await supabase.from("property_photos").update({ is_primary: true }).eq("id", next.id);
  }

  revalidateListing(propertyId);
  return ok(undefined, "Photo removed.");
}

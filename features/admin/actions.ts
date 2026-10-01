"use server";

import { revalidatePath } from "next/cache";

import { fail, fromZodError, ok, type ActionResult } from "@/lib/actions/result";
import { getCurrentUser } from "@/lib/auth/session";
import { publicEnv } from "@/lib/config/public-env";
import { sendEmail } from "@/lib/email/send";
import {
  accountStatusEmail,
  listingApprovedEmail,
  listingRejectedEmail,
} from "@/lib/email/templates";
import { mapDatabaseError } from "@/lib/supabase/errors";
import { createClient } from "@/lib/supabase/server";

import { rejectListingSchema, userActiveSchema, userRoleSchema } from "./schema";

/**
 * Admin Server Actions. All moderation goes through SECURITY DEFINER RPCs
 * (approve_listing, reject_listing, set_user_active, ...) which re-check
 * is_admin() in the database and write the audit log, so even a forged call
 * from a non-admin session is rejected by Postgres, not just by this guard.
 */
async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) return { user: null, error: fail<never>("unauthenticated", "Please sign in again.") };
  if (user.role !== "admin") return { user: null, error: fail<never>("forbidden", "Admins only.") };
  return { user, error: null };
}

function revalidateModeration(listingId?: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/listings");
  if (listingId) {
    revalidatePath(`/admin/listings/${listingId}`);
    revalidatePath(`/properties/${listingId}`);
    revalidatePath(`/owner/properties/${listingId}`);
  }
  revalidatePath("/properties");
  revalidatePath("/");
  revalidatePath("/locations");
}

async function ownerContact(listingId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("properties")
    .select("title, owner:profiles!properties_owner_id_fkey ( first_name, email )")
    .eq("id", listingId)
    .maybeSingle();
  const owner = data?.owner as unknown as { first_name: string; email: string | null } | null;
  return {
    title: data?.title ?? "",
    ownerName: owner?.first_name ?? "there",
    email: owner?.email ?? null,
  };
}

export async function approveListingAction(listingId: string): Promise<ActionResult<undefined>> {
  const { user, error: authError } = await requireAdmin();
  if (!user) return authError;

  const supabase = await createClient();
  const { error } = await supabase.rpc("approve_listing", { p_property_id: listingId });
  if (error) {
    const mapped = mapDatabaseError(error, "admin.approve");
    return fail(mapped.code, mapped.message);
  }
  revalidateModeration(listingId);

  const contact = await ownerContact(listingId);
  if (contact.email) {
    const tpl = listingApprovedEmail({
      ownerName: contact.ownerName,
      title: contact.title,
      listingUrl: `${publicEnv.NEXT_PUBLIC_SITE_URL}/properties/${listingId}`,
    });
    await sendEmail({ to: contact.email, ...tpl });
  }
  return ok(undefined, "Listing approved and published.");
}

export async function rejectListingAction(
  _prev: ActionResult<undefined> | undefined,
  formData: FormData,
): Promise<ActionResult<undefined>> {
  const { user, error: authError } = await requireAdmin();
  if (!user) return authError;

  const parsed = rejectListingSchema.safeParse({
    listingId: formData.get("listingId"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) return fromZodError(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase.rpc("reject_listing", {
    p_property_id: parsed.data.listingId,
    p_reason: parsed.data.reason,
  });
  if (error) {
    const mapped = mapDatabaseError(error, "admin.reject");
    return fail(mapped.code, mapped.message);
  }
  revalidateModeration(parsed.data.listingId);

  const contact = await ownerContact(parsed.data.listingId);
  if (contact.email) {
    const tpl = listingRejectedEmail({
      ownerName: contact.ownerName,
      title: contact.title,
      reason: parsed.data.reason,
      editUrl: `${publicEnv.NEXT_PUBLIC_SITE_URL}/owner/properties/${parsed.data.listingId}/edit`,
    });
    await sendEmail({ to: contact.email, ...tpl });
  }
  return ok(undefined, "Listing sent back to the owner with your reason.");
}

export async function setFeaturedAction(
  listingId: string,
  featured: boolean,
): Promise<ActionResult<undefined>> {
  const { user, error: authError } = await requireAdmin();
  if (!user) return authError;
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_listing_featured", {
    p_property_id: listingId,
    p_featured: featured,
  });
  if (error) {
    const mapped = mapDatabaseError(error, "admin.feature");
    return fail(mapped.code, mapped.message);
  }
  revalidateModeration(listingId);
  return ok(undefined, featured ? "Marked as featured." : "Removed from featured.");
}

export async function setUserActiveAction(
  _prev: ActionResult<undefined> | undefined,
  formData: FormData,
): Promise<ActionResult<undefined>> {
  const { user, error: authError } = await requireAdmin();
  if (!user) return authError;

  const parsed = userActiveSchema.safeParse({
    userId: formData.get("userId"),
    active: formData.get("active") === "true",
    reason: formData.get("reason") ?? "",
  });
  if (!parsed.success) return fromZodError(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_user_active", {
    p_user_id: parsed.data.userId,
    p_active: parsed.data.active,
    p_reason: parsed.data.reason || undefined,
  });
  if (error) {
    const mapped = mapDatabaseError(error, "admin.setUserActive");
    return fail(mapped.code, mapped.message);
  }
  revalidatePath("/admin/users");
  revalidatePath("/admin");

  const { data: target } = await supabase
    .from("profiles")
    .select("first_name, email")
    .eq("id", parsed.data.userId)
    .maybeSingle();
  if (target?.email) {
    const tpl = accountStatusEmail({
      name: target.first_name,
      active: parsed.data.active,
      reason: parsed.data.reason || null,
      contactUrl: `${publicEnv.NEXT_PUBLIC_SITE_URL}/contact`,
    });
    await sendEmail({ to: target.email, ...tpl });
  }
  return ok(undefined, parsed.data.active ? "Account reactivated." : "Account suspended.");
}

export async function setUserRoleAction(
  userId: string,
  role: "tenant" | "owner",
): Promise<ActionResult<undefined>> {
  const { user, error: authError } = await requireAdmin();
  if (!user) return authError;
  const parsed = userRoleSchema.safeParse({ userId, role });
  if (!parsed.success) return fromZodError(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_user_role", {
    p_user_id: parsed.data.userId,
    p_role: parsed.data.role,
  });
  if (error) {
    const mapped = mapDatabaseError(error, "admin.setUserRole");
    return fail(mapped.code, mapped.message);
  }
  revalidatePath("/admin/users");
  return ok(undefined, `Role changed to ${role}.`);
}

export async function markContactMessageAction(
  id: number,
  read: boolean,
): Promise<ActionResult<undefined>> {
  const { user, error: authError } = await requireAdmin();
  if (!user) return authError;
  const supabase = await createClient();
  const { error } = await supabase.rpc("mark_contact_message", { p_id: id, p_read: read });
  if (error) {
    const mapped = mapDatabaseError(error, "admin.markContact");
    return fail(mapped.code, mapped.message);
  }
  revalidatePath("/admin/messages");
  revalidatePath("/admin");
  return ok(undefined, read ? "Marked as handled." : "Marked as unread.");
}

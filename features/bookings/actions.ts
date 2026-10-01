"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { fail, formDataToObject, fromZodError, ok, type ActionResult } from "@/lib/actions/result";
import { getCurrentUser } from "@/lib/auth/session";
import { checkRateLimit, rateLimitedMessage, rateLimitRules } from "@/lib/security/rate-limit";
import { publicEnv } from "@/lib/config/public-env";
import { sendEmail } from "@/lib/email/send";
import {
  bookingCancelledEmail,
  bookingDecisionEmail,
  bookingRequestedEmail,
} from "@/lib/email/templates";
import { mapDatabaseError } from "@/lib/supabase/errors";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";
import { formatDate, formatInr } from "@/lib/utils/format";

import { getBookingById, getBookingContacts } from "./queries";
import { decideBookingSchema, decisionTargets, requestBookingSchema } from "./schema";

/**
 * Booking Server Actions. The database owns the rules (who may move a booking
 * to which status, rent snapshot, room inventory, one open request per tenant);
 * these actions validate input, perform the write under the caller's RLS, map
 * errors, and send best-effort emails. In-app notifications are written by
 * database triggers, so they happen even if an email fails.
 */

function revalidateBooking(id: string, propertyId?: string) {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/bookings");
  revalidatePath(`/dashboard/bookings/${id}`);
  revalidatePath("/owner");
  revalidatePath("/owner/bookings");
  revalidatePath(`/owner/bookings/${id}`);
  if (propertyId) {
    revalidatePath(`/properties/${propertyId}`);
    revalidatePath(`/owner/properties/${propertyId}`);
  }
}

export type RequestBookingResult = ActionResult<{ bookingId: string }>;

export async function requestBookingAction(
  _prev: RequestBookingResult | undefined,
  formData: FormData,
): Promise<RequestBookingResult> {
  const user = await getCurrentUser();
  if (!user) return fail("unauthenticated", "Please sign in to send a request.");
  if (user.role === "owner")
    return fail("forbidden", "Owner accounts cannot send booking requests. Use a tenant account.");

  const parsed = requestBookingSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return fromZodError(parsed.error);
  const input = parsed.data;
  // Per account, not per IP: a signed-in tenant spamming owners is the abuse case.
  if (!(await checkRateLimit(rateLimitRules.bookingRequest, user.id)))
    return fail("rate_limited", rateLimitedMessage);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookings")
    .insert({
      property_id: input.propertyId,
      tenant_id: user.id,
      owner_id: user.id, // overwritten by the trigger from the property; column is NOT NULL
      move_in_date: input.moveInDate,
      lease_months: input.leaseMonths,
      monthly_rent: 1, // snapshotted by the trigger
      message: input.message || null,
    })
    .select("id, owner_id, monthly_rent, security_deposit, total_amount")
    .single();

  if (error || !data) {
    if (error?.code === "23505") {
      return fail(
        "conflict",
        "You already have an open request for this listing. Check My requests.",
      );
    }
    const mapped = mapDatabaseError(
      error ?? { code: "unknown", message: "", details: "", hint: "", name: "" },
      "bookings.request",
    );
    return fail(mapped.code, mapped.message);
  }
  revalidateBooking(data.id, input.propertyId);

  // Email the owner (best-effort). Owner email is readable by the tenant only via this
  // server path: we read the owner profile under the tenant's RLS? No: profiles are
  // self-only, so fetch through the listing's owner via the contacts RPC is not
  // applicable either (tenant side hides owner). Use the properties -> owner join,
  // which RLS permits only for the admin. Hence: look up via the owner_public_profiles
  // view for the name and send through a privileged lookup when configured.
  const { data: listing } = await supabase
    .from("properties")
    .select("title")
    .eq("id", input.propertyId)
    .maybeSingle();
  await notifyOwnerByEmail(data.owner_id, {
    title: listing?.title ?? "your listing",
    tenantName: `${user.firstName} ${user.lastName}`.trim(),
    moveIn: formatDate(input.moveInDate),
    months: input.leaseMonths,
    total: formatInr(data.total_amount),
    bookingId: data.id,
  });

  redirect(`/dashboard/bookings/${data.id}?requested=1`);
}

/**
 * Owner emails need the owner's address, which a tenant's session cannot read
 * (profiles RLS is self + admin). The admin client is used for this one lookup
 * when SUPABASE_SECRET_KEY is configured; otherwise the in-app notification
 * (written by the trigger) is the only channel, which is acceptable.
 */
async function notifyOwnerByEmail(
  ownerId: string,
  details: {
    title: string;
    tenantName: string;
    moveIn: string;
    months: number;
    total: string;
    bookingId: string;
  },
) {
  try {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const admin = createAdminClient();
    const { data: owner } = await admin
      .from("profiles")
      .select("first_name, email")
      .eq("id", ownerId)
      .maybeSingle();
    if (!owner?.email) return;
    const tpl = bookingRequestedEmail({
      ownerName: owner.first_name,
      ...details,
      url: `${publicEnv.NEXT_PUBLIC_SITE_URL}/owner/bookings/${details.bookingId}`,
    });
    await sendEmail({ to: owner.email, ...tpl });
  } catch (error) {
    // Not configured locally / in CI: skip silently, the in-app notification exists.
    if (!(error instanceof Error && /SUPABASE_SECRET_KEY/.test(error.message))) {
      console.error("bookings.notifyOwnerByEmail failed", {
        error: error instanceof Error ? error.name : "unknown",
      });
    }
  }
}

export type DecideBookingResult = ActionResult<{ status: string }>;

export async function decideBookingAction(
  _prev: DecideBookingResult | undefined,
  formData: FormData,
): Promise<DecideBookingResult> {
  const user = await getCurrentUser();
  if (!user) return fail("unauthenticated", "Please sign in again.");

  const parsed = decideBookingSchema.safeParse({
    bookingId: formData.get("bookingId"),
    decision: formData.get("decision"),
    note: formData.get("note") ?? "",
  });
  if (!parsed.success) return fromZodError(parsed.error);
  const { bookingId, decision, note } = parsed.data;

  const before = await getBookingById(bookingId);
  if (!before) return fail("not_found", "Booking not found.");
  const actingAsOwner = before.owner_id === user.id;

  const supabase = await createClient();
  const patch: Database["public"]["Tables"]["bookings"]["Update"] = {
    status: decisionTargets[decision],
  };
  if (decision === "cancel") patch.cancel_reason = note || null;
  else if (actingAsOwner && note) patch.owner_note = note;

  const { data, error } = await supabase
    .from("bookings")
    .update(patch)
    .eq("id", bookingId)
    .select("status")
    .single();
  if (error) {
    const mapped = mapDatabaseError(error, `bookings.${decision}`);
    return fail(mapped.code, mapped.message);
  }
  revalidateBooking(bookingId, before.property_id);

  // Emails: owner decisions go to the tenant; a tenant cancellation goes to the owner.
  const contacts = await getBookingContacts(bookingId);
  const propertyTitle = before.property?.title ?? "the listing";
  if (
    actingAsOwner &&
    (decision === "accept" ||
      decision === "reject" ||
      decision === "activate" ||
      decision === "complete" ||
      decision === "cancel")
  ) {
    const tenant = contacts.find((c) => c.party === "tenant");
    if (tenant?.email) {
      const tpl =
        decision === "cancel"
          ? bookingCancelledEmail({
              name: tenant.full_name ?? "there",
              title: propertyTitle,
              byOwner: true,
              reason: note || null,
              url: `${publicEnv.NEXT_PUBLIC_SITE_URL}/dashboard/bookings/${bookingId}`,
            })
          : bookingDecisionEmail({
              tenantName: tenant.full_name ?? "there",
              title: propertyTitle,
              decision,
              note: note || null,
              ownerPhone: decision === "accept" ? (before.property?.contact_phone ?? null) : null,
              url: `${publicEnv.NEXT_PUBLIC_SITE_URL}/dashboard/bookings/${bookingId}`,
            });
      await sendEmail({ to: tenant.email, ...tpl });
    }
  } else if (!actingAsOwner && decision === "cancel") {
    await notifyOwnerCancelled(before.owner_id, propertyTitle, note || null, bookingId);
  }

  return ok({ status: data.status }, decisionMessages[decision]);
}

async function notifyOwnerCancelled(
  ownerId: string,
  title: string,
  reason: string | null,
  bookingId: string,
) {
  try {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const admin = createAdminClient();
    const { data: owner } = await admin
      .from("profiles")
      .select("first_name, email")
      .eq("id", ownerId)
      .maybeSingle();
    if (!owner?.email) return;
    const tpl = bookingCancelledEmail({
      name: owner.first_name,
      title,
      byOwner: false,
      reason,
      url: `${publicEnv.NEXT_PUBLIC_SITE_URL}/owner/bookings/${bookingId}`,
    });
    await sendEmail({ to: owner.email, ...tpl });
  } catch {
    // service key not configured: in-app notification only
  }
}

const decisionMessages: Record<keyof typeof decisionTargets, string> = {
  accept: "Request accepted. The tenant can now see your contact details.",
  reject: "Request declined. The tenant has been notified.",
  activate: "Marked as moved in.",
  complete: "Stay marked as completed. The tenant can now leave a review.",
  cancel: "Booking cancelled.",
};

"use server";

import { revalidatePath } from "next/cache";

import { getBookingById } from "@/features/bookings/queries";
import { getPlatformSettings } from "@/features/catalog/queries";
import { fail, ok, type ActionResult } from "@/lib/actions/result";
import { getCurrentUser } from "@/lib/auth/session";
import { checkRateLimit, rateLimitedMessage, rateLimitRules } from "@/lib/security/rate-limit";
import { publicEnv } from "@/lib/config/public-env";
import { serverEnv } from "@/lib/config/server-env";
import { getRazorpay, paymentsAvailable, toPaise } from "@/lib/razorpay/client";
import { verifyCheckoutSignature } from "@/lib/razorpay/verify";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Booking token flow (feature-flagged):
 *  1. createBookingTokenOrderAction: tenant with an ACCEPTED booking asks to pay.
 *     We create a Razorpay order and a `payments` row (status=created) with the
 *     service role (users cannot write payments).
 *  2. Razorpay Checkout runs in the browser.
 *  3. verifyCheckoutAction: the browser hands back order/payment/signature; we
 *     verify HMAC(key_secret, order|payment) and mark the row paid.
 *  4. The webhook (app/api/payments/webhook) confirms or corrects the status
 *     independently; both paths are idempotent.
 */
export type CreateOrderResult = ActionResult<{
  orderId: string;
  amountPaise: number;
  currency: "INR";
  keyId: string;
  description: string;
  prefill: { name: string; email: string; contact: string };
}>;

export async function createBookingTokenOrderAction(bookingId: string): Promise<CreateOrderResult> {
  if (!paymentsAvailable()) return fail("forbidden", "Online payments are not available yet.");
  const user = await getCurrentUser();
  if (!user) return fail("unauthenticated", "Please sign in again.");
  // Each call creates a Razorpay order; cap it so a stuck client cannot mint hundreds.
  if (!(await checkRateLimit(rateLimitRules.paymentOrder, user.id)))
    return fail("rate_limited", rateLimitedMessage);

  const booking = await getBookingById(bookingId);
  if (!booking || booking.tenant_id !== user.id) return fail("not_found", "Booking not found.");
  if (booking.status !== "accepted")
    return fail("forbidden", "The booking token can be paid once the owner has accepted.");

  const settings = await getPlatformSettings();
  const amount = Number(settings.booking_token_amount);
  if (!(amount > 0)) return fail("forbidden", "No booking token is required for this platform.");

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("payments")
    .select("id, status, razorpay_order_id")
    .eq("booking_id", bookingId)
    .eq("purpose", "booking_token")
    .in("status", ["paid", "created"])
    .order("created_at", { ascending: false });
  if (existing?.some((p) => p.status === "paid"))
    return fail("conflict", "The booking token for this request is already paid.");

  try {
    const order = await getRazorpay().orders.create({
      amount: toPaise(amount),
      currency: "INR",
      receipt: `bk_${bookingId.slice(0, 32)}`,
      notes: { booking_id: bookingId, purpose: "booking_token", tenant_id: user.id },
    });

    const { error } = await admin.from("payments").insert({
      booking_id: bookingId,
      payer_id: user.id,
      payee_id: booking.owner_id,
      purpose: "booking_token",
      amount,
      razorpay_order_id: order.id,
      status: "created",
    });
    if (error) {
      console.error("payments.createOrder insert failed", { code: error.code });
      return fail("upstream", "Could not start the payment. Please try again.");
    }

    return ok({
      orderId: order.id,
      amountPaise: Number(order.amount),
      currency: "INR",
      keyId: publicEnv.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? serverEnv.RAZORPAY_KEY_ID ?? "",
      description: `Booking token · ${booking.property?.title ?? "Sasta Room"}`,
      prefill: {
        name: `${user.firstName} ${user.lastName}`.trim(),
        email: user.email ?? "",
        contact: user.phone ? `+91${user.phone}` : "",
      },
    });
  } catch (error) {
    console.error("payments.createOrder failed", {
      error: error instanceof Error ? error.message : "unknown",
    });
    return fail("upstream", "Razorpay could not create the order. Please try again in a moment.");
  }
}

export async function verifyCheckoutAction(input: {
  bookingId: string;
  orderId: string;
  paymentId: string;
  signature: string;
}): Promise<ActionResult<{ status: "paid" }>> {
  if (!paymentsAvailable() || !serverEnv.RAZORPAY_KEY_SECRET)
    return fail("forbidden", "Online payments are not available.");
  const user = await getCurrentUser();
  if (!user) return fail("unauthenticated", "Please sign in again.");

  const valid = verifyCheckoutSignature(
    { orderId: input.orderId, paymentId: input.paymentId, signature: input.signature },
    serverEnv.RAZORPAY_KEY_SECRET,
  );
  if (!valid) {
    console.error("payments.verify signature mismatch", { orderId: input.orderId });
    return fail(
      "forbidden",
      "Payment signature could not be verified. If money was deducted it will be reconciled automatically.",
    );
  }

  const admin = createAdminClient();
  const { data: payment } = await admin
    .from("payments")
    .select("id, status, payer_id, booking_id")
    .eq("razorpay_order_id", input.orderId)
    .maybeSingle();
  if (!payment || payment.payer_id !== user.id || payment.booking_id !== input.bookingId)
    return fail("not_found", "Payment not found.");

  if (payment.status !== "paid") {
    const { error } = await admin
      .from("payments")
      .update({
        status: "paid",
        razorpay_payment_id: input.paymentId,
        razorpay_signature: input.signature,
        paid_at: new Date().toISOString(),
      })
      .eq("id", payment.id)
      .eq("status", "created");
    if (error && error.code !== "23505") {
      console.error("payments.verify update failed", { code: error.code });
      return fail(
        "upstream",
        "Payment received but could not be recorded. Our team will reconcile it.",
      );
    }
  }

  revalidatePath(`/dashboard/bookings/${input.bookingId}`);
  revalidatePath(`/owner/bookings/${input.bookingId}`);
  revalidatePath("/dashboard/payments");
  revalidatePath("/admin/payments");
  return ok({ status: "paid" }, "Payment confirmed. Thank you!");
}

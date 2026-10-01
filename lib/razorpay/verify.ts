import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Razorpay signature rules (both HMAC-SHA256, hex):
 * - Checkout callback: HMAC(key_secret, `${order_id}|${payment_id}`)
 * - Webhook:           HMAC(webhook_secret, rawBody)
 * Comparison is constant-time so timing cannot leak the expected value.
 */
function safeEqualHex(expectedHex: string, providedHex: string): boolean {
  if (!/^[0-9a-f]+$/i.test(providedHex) || providedHex.length !== expectedHex.length) return false;
  return timingSafeEqual(Buffer.from(expectedHex, "hex"), Buffer.from(providedHex, "hex"));
}

export function verifyCheckoutSignature(
  input: { orderId: string; paymentId: string; signature: string },
  keySecret: string,
): boolean {
  const expected = createHmac("sha256", keySecret)
    .update(`${input.orderId}|${input.paymentId}`)
    .digest("hex");
  return safeEqualHex(expected, input.signature);
}

export function verifyWebhookSignature(
  rawBody: string,
  signature: string,
  webhookSecret: string,
): boolean {
  const expected = createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
  return safeEqualHex(expected, signature);
}

/** Minimal shape of the webhook events we act on. */
export type RazorpayWebhookEvent = {
  event: string;
  payload?: {
    payment?: {
      entity?: {
        id?: string;
        order_id?: string;
        status?: string;
        error_description?: string | null;
        error_code?: string | null;
        amount?: number;
      };
    };
    refund?: { entity?: { id?: string; payment_id?: string; status?: string } };
  };
};

export type WebhookInstruction =
  | { kind: "mark_paid"; orderId: string; paymentId: string }
  | { kind: "mark_failed"; orderId: string; paymentId: string; reason: string }
  | { kind: "mark_refunded"; paymentId: string }
  | { kind: "ignore"; reason: string };

/** Pure mapping from a webhook event to what we should do; easy to unit test. */
export function interpretWebhookEvent(event: RazorpayWebhookEvent): WebhookInstruction {
  const payment = event.payload?.payment?.entity;
  switch (event.event) {
    case "payment.captured":
    case "order.paid":
      if (payment?.id && payment.order_id)
        return { kind: "mark_paid", orderId: payment.order_id, paymentId: payment.id };
      return { kind: "ignore", reason: "missing payment/order id" };
    case "payment.failed":
      if (payment?.id && payment.order_id)
        return {
          kind: "mark_failed",
          orderId: payment.order_id,
          paymentId: payment.id,
          reason: payment.error_description ?? payment.error_code ?? "Payment failed",
        };
      return { kind: "ignore", reason: "missing payment/order id" };
    case "refund.processed": {
      const refund = event.payload?.refund?.entity;
      if (refund?.payment_id) return { kind: "mark_refunded", paymentId: refund.payment_id };
      return { kind: "ignore", reason: "missing refund payment id" };
    }
    default:
      return { kind: "ignore", reason: `unhandled event ${event.event}` };
  }
}

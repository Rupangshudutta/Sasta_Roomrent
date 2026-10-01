import { createHmac } from "node:crypto";

import { describe, expect, it } from "vitest";

import { interpretWebhookEvent, verifyCheckoutSignature, verifyWebhookSignature } from "./verify";

const secret = "test_key_secret";

describe("verifyCheckoutSignature", () => {
  const orderId = "order_ABC123";
  const paymentId = "pay_XYZ789";
  const good = createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");

  it("accepts the HMAC of order|payment", () => {
    expect(verifyCheckoutSignature({ orderId, paymentId, signature: good }, secret)).toBe(true);
  });
  it("rejects a tampered payment id, wrong secret, or malformed signature", () => {
    expect(
      verifyCheckoutSignature({ orderId, paymentId: "pay_other", signature: good }, secret),
    ).toBe(false);
    expect(verifyCheckoutSignature({ orderId, paymentId, signature: good }, "other")).toBe(false);
    expect(verifyCheckoutSignature({ orderId, paymentId, signature: "nothex" }, secret)).toBe(
      false,
    );
    expect(
      verifyCheckoutSignature({ orderId, paymentId, signature: good.slice(0, 10) }, secret),
    ).toBe(false);
  });
});

describe("verifyWebhookSignature", () => {
  it("verifies the raw body, byte for byte", () => {
    const body = '{"event":"payment.captured","payload":{}}';
    const sig = createHmac("sha256", "whsec").update(body).digest("hex");
    expect(verifyWebhookSignature(body, sig, "whsec")).toBe(true);
    expect(verifyWebhookSignature(body + " ", sig, "whsec")).toBe(false);
  });
});

describe("interpretWebhookEvent", () => {
  it("maps captured/failed/refund events", () => {
    expect(
      interpretWebhookEvent({
        event: "payment.captured",
        payload: { payment: { entity: { id: "pay_1", order_id: "order_1" } } },
      }),
    ).toEqual({ kind: "mark_paid", orderId: "order_1", paymentId: "pay_1" });
    expect(
      interpretWebhookEvent({
        event: "payment.failed",
        payload: {
          payment: {
            entity: { id: "pay_1", order_id: "order_1", error_description: "Card declined" },
          },
        },
      }),
    ).toEqual({
      kind: "mark_failed",
      orderId: "order_1",
      paymentId: "pay_1",
      reason: "Card declined",
    });
    expect(
      interpretWebhookEvent({
        event: "refund.processed",
        payload: { refund: { entity: { id: "rfnd_1", payment_id: "pay_1" } } },
      }),
    ).toEqual({ kind: "mark_refunded", paymentId: "pay_1" });
  });
  it("ignores unknown or incomplete events instead of throwing", () => {
    expect(interpretWebhookEvent({ event: "payment.authorized" }).kind).toBe("ignore");
    expect(
      interpretWebhookEvent({
        event: "payment.captured",
        payload: { payment: { entity: { id: "pay_1" } } },
      }).kind,
    ).toBe("ignore");
  });
});

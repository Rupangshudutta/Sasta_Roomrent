import "server-only";

import Razorpay from "razorpay";

import { featureFlags, serverEnv } from "@/lib/config/server-env";

/**
 * Payments are live only when the feature flag is on AND the keys exist, so a
 * half-configured environment can never show a broken checkout.
 */
export function paymentsAvailable(): boolean {
  return (
    featureFlags.paymentsEnabled &&
    Boolean(
      serverEnv.RAZORPAY_KEY_ID &&
      serverEnv.RAZORPAY_KEY_SECRET &&
      serverEnv.RAZORPAY_WEBHOOK_SECRET,
    )
  );
}

let instance: Razorpay | null = null;

export function getRazorpay(): Razorpay {
  if (!serverEnv.RAZORPAY_KEY_ID || !serverEnv.RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay keys are not configured.");
  }
  if (!instance) {
    instance = new Razorpay({
      key_id: serverEnv.RAZORPAY_KEY_ID,
      key_secret: serverEnv.RAZORPAY_KEY_SECRET,
    });
  }
  return instance;
}

/** Rupees → paise, the integer subunit Razorpay expects. */
export function toPaise(amountInr: number): number {
  return Math.round(amountInr * 100);
}

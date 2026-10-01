import { createHash } from "node:crypto";

import { NextResponse, type NextRequest } from "next/server";

import { serverEnv } from "@/lib/config/server-env";
import {
  interpretWebhookEvent,
  verifyWebhookSignature,
  type RazorpayWebhookEvent,
} from "@/lib/razorpay/verify";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database.types";

/**
 * Razorpay webhook. Rules:
 * - Verify the signature over the RAW body before parsing anything.
 * - Idempotent: every event is recorded in payment_events by its id; a replay
 *   returns 200 without re-applying.
 * - Always answer 2xx once the signature is valid, even for events we ignore,
 *   so Razorpay stops retrying. Non-2xx only for bad signatures or misconfig.
 */
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const secret = serverEnv.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !serverEnv.SUPABASE_SECRET_KEY) {
    return NextResponse.json({ error: "payments webhook not configured" }, { status: 503 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";
  if (!signature || !verifyWebhookSignature(rawBody, signature, secret)) {
    console.error("payments.webhook invalid signature");
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  // Parsed once as the generated Json type (what jsonb columns accept) and
  // read through the narrower event shape for field access.
  let payload: { [key: string]: Json | undefined };
  try {
    const parsed: Json = JSON.parse(rawBody);
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      return NextResponse.json({ error: "invalid json" }, { status: 400 });
    }
    payload = parsed;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const event = payload as unknown as RazorpayWebhookEvent;
  const eventId =
    request.headers.get("x-razorpay-event-id") ??
    createHash("sha256").update(rawBody).digest("hex");
  const instruction = interpretWebhookEvent(event);
  const admin = createAdminClient();

  // Record first; a duplicate event id means we have processed it already.
  const { error: logError } = await admin.from("payment_events").insert({
    event_id: eventId,
    event_type: event.event,
    razorpay_payment_id:
      event.payload?.payment?.entity?.id ?? event.payload?.refund?.entity?.payment_id ?? null,
    razorpay_order_id: event.payload?.payment?.entity?.order_id ?? null,
    payload,
    outcome: instruction.kind,
  });
  if (logError?.code === "23505") {
    return NextResponse.json({ ok: true, duplicate: true });
  }
  if (logError) {
    console.error("payments.webhook log failed", { code: logError.code });
    return NextResponse.json({ error: "could not record event" }, { status: 500 });
  }

  const now = new Date().toISOString();
  switch (instruction.kind) {
    case "mark_paid": {
      const { error } = await admin
        .from("payments")
        .update({
          status: "paid",
          razorpay_payment_id: instruction.paymentId,
          paid_at: now,
          raw: payload,
        })
        .eq("razorpay_order_id", instruction.orderId)
        .in("status", ["created", "failed"]);
      if (error && error.code !== "23505")
        console.error("payments.webhook mark_paid failed", { code: error.code });
      break;
    }
    case "mark_failed": {
      const { error } = await admin
        .from("payments")
        .update({
          status: "failed",
          razorpay_payment_id: instruction.paymentId,
          failure_reason: instruction.reason,
          raw: payload,
        })
        .eq("razorpay_order_id", instruction.orderId)
        .eq("status", "created");
      if (error) console.error("payments.webhook mark_failed failed", { code: error.code });
      break;
    }
    case "mark_refunded": {
      const { error } = await admin
        .from("payments")
        .update({
          status: "refunded",
          refunded_at: now,
          raw: payload,
        })
        .eq("razorpay_payment_id", instruction.paymentId)
        .eq("status", "paid");
      if (error) console.error("payments.webhook mark_refunded failed", { code: error.code });
      break;
    }
    case "ignore":
      break;
  }

  return NextResponse.json({ ok: true, handled: instruction.kind });
}

export function GET() {
  return NextResponse.json({ error: "method not allowed" }, { status: 405 });
}

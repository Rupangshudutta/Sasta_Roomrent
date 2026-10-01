"use client";

import { CreditCard, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { formatInr } from "@/lib/utils/format";

import { createBookingTokenOrderAction, verifyCheckoutAction } from "../actions";

type RazorpayHandlerResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};
type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: { name: string; email: string; contact: string };
  theme: { color: string };
  handler: (response: RazorpayHandlerResponse) => void;
  modal: { ondismiss: () => void };
};
type RazorpayInstance = {
  open: () => void;
  on: (event: "payment.failed", cb: (r: { error?: { description?: string } }) => void) => void;
};
declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

const CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

function loadCheckout(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${CHECKOUT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("checkout failed to load")));
      return;
    }
    const script = document.createElement("script");
    script.src = CHECKOUT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("checkout failed to load"));
    document.body.appendChild(script);
  });
}

/** Opens Razorpay Checkout for the booking token and verifies the result server-side. */
export function PayTokenButton({ bookingId, amount }: { bookingId: string; amount: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{
    tone: "error" | "info" | "success";
    text: string;
  } | null>(null);

  const pay = () => {
    setMessage(null);
    startTransition(async () => {
      const created = await createBookingTokenOrderAction(bookingId);
      if (!created.ok) {
        setMessage({ tone: "error", text: created.message });
        return;
      }
      try {
        await loadCheckout();
      } catch {
        setMessage({
          tone: "error",
          text: "Could not load the payment window. Check your connection and try again.",
        });
        return;
      }
      const Razorpay = window.Razorpay;
      if (!Razorpay) {
        setMessage({ tone: "error", text: "Payment window unavailable." });
        return;
      }
      const rzp = new Razorpay({
        key: created.data.keyId,
        amount: created.data.amountPaise,
        currency: created.data.currency,
        name: "Sasta Room",
        description: created.data.description,
        order_id: created.data.orderId,
        prefill: created.data.prefill,
        theme: { color: "#d42a20" },
        handler: (response) => {
          startTransition(async () => {
            const verified = await verifyCheckoutAction({
              bookingId,
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            });
            setMessage(
              verified.ok
                ? { tone: "success", text: verified.message ?? "Payment confirmed." }
                : { tone: "error", text: verified.message },
            );
            router.refresh();
          });
        },
        modal: {
          ondismiss: () =>
            setMessage({
              tone: "info",
              text: "Payment cancelled. You can pay the token any time before move-in.",
            }),
        },
      });
      rzp.on("payment.failed", (r) =>
        setMessage({
          tone: "error",
          text: r.error?.description ?? "Payment failed. Please try another method.",
        }),
      );
      rzp.open();
    });
  };

  return (
    <div className="space-y-3">
      <Button onClick={pay} loading={pending} fullWidth>
        <CreditCard className="h-4 w-4" aria-hidden /> Pay booking token {formatInr(amount)}
      </Button>
      <p className="text-muted flex items-start gap-2 text-xs">
        <ShieldCheck className="text-success mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        Secured by Razorpay. UPI, cards, net banking and wallets. We never see your card details.
      </p>
      {message ? <Alert tone={message.tone}>{message.text}</Alert> : null}
    </div>
  );
}

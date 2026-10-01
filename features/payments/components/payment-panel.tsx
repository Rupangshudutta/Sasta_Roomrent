import { CheckCircle2, Clock, XCircle } from "lucide-react";

import { Card, CardBody, CardHeader } from "@/components/ui/card";
import type { BookingStatus } from "@/features/bookings/queries";
import type { PaymentRow } from "@/features/payments/queries";
import { formatDateTime, formatInr } from "@/lib/utils/format";

import { PayTokenButton } from "./pay-token-button";

type Props = {
  bookingId: string;
  bookingStatus: BookingStatus;
  audience: "tenant" | "owner";
  payments: PaymentRow[];
  paymentsEnabled: boolean;
  tokenAmount: number;
};

/** Booking token status for both parties; the pay button only for an accepted booking's tenant. */
export function PaymentPanel({
  bookingId,
  bookingStatus,
  audience,
  payments,
  paymentsEnabled,
  tokenAmount,
}: Props) {
  const paid = payments.find((p) => p.status === "paid");
  const refunded = payments.find((p) => p.status === "refunded");
  const failed = payments.find((p) => p.status === "failed");
  const canPay =
    paymentsEnabled &&
    audience === "tenant" &&
    bookingStatus === "accepted" &&
    !paid &&
    tokenAmount > 0;

  if (!paymentsEnabled && !paid && !refunded) return null;

  return (
    <Card>
      <CardHeader
        title="Booking token"
        description={
          audience === "tenant"
            ? "A small, refundable token that confirms your booking to the owner."
            : "Paid by the tenant to confirm the booking."
        }
      />
      <CardBody className="space-y-3 text-sm">
        {paid ? (
          <p className="text-success flex items-center gap-2 font-medium">
            <CheckCircle2 className="h-5 w-5" aria-hidden /> Paid {formatInr(paid.amount)} on{" "}
            {formatDateTime(paid.paid_at ?? paid.created_at)}
            <span className="text-muted font-normal">
              · ref {paid.razorpay_payment_id ?? paid.razorpay_order_id}
            </span>
          </p>
        ) : refunded ? (
          <p className="text-muted flex items-center gap-2">
            <Clock className="h-5 w-5" aria-hidden /> Refunded {formatInr(refunded.amount)} on{" "}
            {formatDateTime(refunded.refunded_at ?? refunded.updated_at)}
          </p>
        ) : failed && !canPay ? (
          <p className="text-danger flex items-center gap-2">
            <XCircle className="h-5 w-5" aria-hidden /> Last attempt failed:{" "}
            {failed.failure_reason ?? "unknown reason"}
          </p>
        ) : null}

        {canPay ? (
          <>
            {failed ? (
              <p className="text-danger">
                Last attempt failed ({failed.failure_reason ?? "unknown reason"}). You can try
                again.
              </p>
            ) : null}
            <PayTokenButton bookingId={bookingId} amount={tokenAmount} />
          </>
        ) : null}

        {!paid &&
        !canPay &&
        audience === "tenant" &&
        paymentsEnabled &&
        bookingStatus === "pending" ? (
          <p className="text-muted">You can pay the token once the owner accepts your request.</p>
        ) : null}
        {!paid && audience === "owner" && paymentsEnabled && bookingStatus === "accepted" ? (
          <p className="text-muted">Waiting for the tenant to pay the booking token.</p>
        ) : null}
      </CardBody>
    </Card>
  );
}

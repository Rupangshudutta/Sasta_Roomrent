"use client";

import { Check, DoorOpen, Flag, X } from "lucide-react";
import { useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { BookingStatus } from "@/features/bookings/queries";
import { useFormAction } from "@/lib/forms/use-form-action";

import { decideBookingAction } from "../actions";
import type { BookingDecision } from "../schema";

type Props = { bookingId: string; status: BookingStatus; audience: "owner" | "tenant" };

/** Decisions legal for this audience and status; the trigger is the real gate. */
function available(status: BookingStatus, audience: "owner" | "tenant"): BookingDecision[] {
  if (audience === "owner") {
    if (status === "pending") return ["accept", "reject"];
    if (status === "accepted") return ["activate", "cancel"];
    if (status === "active") return ["complete"];
    return [];
  }
  if (status === "pending" || status === "accepted") return ["cancel"];
  return [];
}

const labels: Record<
  BookingDecision,
  {
    label: string;
    Icon: typeof Check;
    variant: "primary" | "outline" | "danger" | "ghost";
    notePrompt?: string;
  }
> = {
  accept: {
    label: "Accept request",
    Icon: Check,
    variant: "primary",
    notePrompt: "Optional note for the tenant (e.g. best time to call)",
  },
  reject: {
    label: "Decline",
    Icon: X,
    variant: "outline",
    notePrompt: "Optional reason shared with the tenant",
  },
  activate: { label: "Mark as moved in", Icon: DoorOpen, variant: "primary" },
  complete: { label: "Mark stay completed", Icon: Flag, variant: "primary" },
  cancel: {
    label: "Cancel booking",
    Icon: X,
    variant: "danger",
    notePrompt: "Reason for cancelling",
  },
};

export function DecisionForm({ bookingId, status, audience }: Props) {
  const decisions = available(status, audience);
  const [chosen, setChosen] = useState<BookingDecision | null>(null);
  const { state, pending, formError, formProps } = useFormAction(decideBookingAction);

  if (decisions.length === 0) return null;
  if (state?.ok) return <Alert tone="success">{state.message}</Alert>;

  return (
    <div className="space-y-3">
      {formError ? <Alert tone="error">{formError}</Alert> : null}
      {chosen === null ? (
        <div className="flex flex-wrap gap-2">
          {decisions.map((d) => {
            const { label, Icon, variant } = labels[d];
            return (
              <Button key={d} variant={variant} onClick={() => setChosen(d)}>
                <Icon className="h-4 w-4" aria-hidden /> {label}
              </Button>
            );
          })}
        </div>
      ) : (
        <form
          {...formProps}
          className="rounded-card-sm border-border bg-surface space-y-3 border p-4"
        >
          <input type="hidden" name="bookingId" value={bookingId} />
          <input type="hidden" name="decision" value={chosen} />
          <p className="font-medium">{labels[chosen].label}?</p>
          {labels[chosen].notePrompt ? (
            <>
              <label htmlFor={`note-${bookingId}`} className="text-muted text-sm">
                {labels[chosen].notePrompt}
              </label>
              <textarea
                id={`note-${bookingId}`}
                name="note"
                rows={2}
                maxLength={1000}
                className="rounded-card-sm border-border w-full border bg-white px-3 py-2 text-sm"
              />
            </>
          ) : null}
          {chosen === "accept" ? (
            <p className="text-muted text-xs">
              Accepting shares your listing contact number and email with this tenant and reserves
              one room.
            </p>
          ) : null}
          <div className="flex gap-2">
            <Button
              type="submit"
              variant={labels[chosen].variant === "ghost" ? "primary" : labels[chosen].variant}
              loading={pending}
            >
              Confirm
            </Button>
            <Button type="button" variant="ghost" onClick={() => setChosen(null)}>
              Back
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

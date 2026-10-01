import { Badge } from "@/components/ui/badge";
import type { BookingStatus } from "@/features/bookings/queries";

type Tone = "neutral" | "warning" | "success" | "danger" | "info" | "primary";

/** Status copy per audience; tenant labels follow the original product ("Waiting for owner", ...). */
export const bookingStatusMeta: Record<
  BookingStatus,
  { tenant: string; owner: string; tone: Tone; help: string }
> = {
  pending: {
    tenant: "Waiting for owner",
    owner: "New request",
    tone: "warning",
    help: "The owner has not responded yet.",
  },
  accepted: {
    tenant: "Accepted by owner",
    owner: "Accepted",
    tone: "success",
    help: "Contact details are shared. Agree the move-in directly.",
  },
  active: {
    tenant: "Moved in",
    owner: "Active tenant",
    tone: "primary",
    help: "The stay is in progress.",
  },
  completed: {
    tenant: "Completed",
    owner: "Completed",
    tone: "neutral",
    help: "The stay has ended.",
  },
  rejected: {
    tenant: "Declined",
    owner: "Declined",
    tone: "danger",
    help: "The owner declined this request.",
  },
  cancelled: {
    tenant: "Cancelled",
    owner: "Cancelled",
    tone: "neutral",
    help: "This booking was cancelled.",
  },
};

export function BookingStatusBadge({
  status,
  audience,
}: {
  status: BookingStatus;
  audience: "tenant" | "owner";
}) {
  const meta = bookingStatusMeta[status];
  return <Badge tone={meta.tone}>{audience === "tenant" ? meta.tenant : meta.owner}</Badge>;
}

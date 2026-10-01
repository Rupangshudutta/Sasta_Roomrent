import { Badge } from "@/components/ui/badge";
import type { ListingStatus } from "@/features/listings/owner-queries";

/** Status copy owners see; "In review" mirrors the old product's label for pending. */
export const listingStatusMeta: Record<
  ListingStatus,
  { label: string; tone: "neutral" | "warning" | "success" | "danger" | "info"; help: string }
> = {
  draft: {
    label: "Draft",
    tone: "neutral",
    help: "Only you can see this. Submit it when it is ready.",
  },
  pending: {
    label: "In review",
    tone: "warning",
    help: "Our team is reviewing it. Usually 24-48 hours.",
  },
  approved: {
    label: "Live",
    tone: "success",
    help: "Visible to tenants. Price or detail edits go back to review.",
  },
  rejected: {
    label: "Needs changes",
    tone: "danger",
    help: "See the reason below, fix it, and resubmit.",
  },
  inactive: {
    label: "Unlisted",
    tone: "info",
    help: "Hidden from tenants. Relist to go through review again.",
  },
};

export function ListingStatusBadge({ status }: { status: ListingStatus }) {
  const meta = listingStatusMeta[status];
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}

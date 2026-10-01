"use client";

import { Eye, EyeOff, Pencil, Send, Trash2, Undo2 } from "lucide-react";
import Link from "next/link";

import { ActionButton } from "@/components/ui/action-button";
import { ButtonLink } from "@/components/ui/button";
import type { ListingStatus } from "@/features/listings/owner-queries";

import { deleteDraftAction, transitionListingAction } from "../owner-actions";

/** Row/page actions that are legal for the listing's current status. */
export function ListingActions({
  listingId,
  status,
  photoCount,
  compact = false,
}: {
  listingId: string;
  status: ListingStatus;
  photoCount: number;
  compact?: boolean;
}) {
  const size = compact ? "sm" : "md";
  return (
    <div className="flex flex-wrap items-center gap-2">
      <ButtonLink href={`/owner/properties/${listingId}/edit`} variant="outline" size={size}>
        <Pencil className="h-4 w-4" aria-hidden /> Edit
      </ButtonLink>

      {status === "approved" ? (
        <ButtonLink href={`/properties/${listingId}`} variant="ghost" size={size}>
          <Eye className="h-4 w-4" aria-hidden /> View live
        </ButtonLink>
      ) : null}

      {(status === "draft" || status === "rejected") && (
        <ActionButton
          size={size}
          action={() => transitionListingAction(listingId, "submit")}
          confirmMessage={
            photoCount === 0
              ? "This listing has no photos yet. Listings without photos are usually rejected. Submit anyway?"
              : undefined
          }
        >
          <Send className="h-4 w-4" aria-hidden /> Submit for review
        </ActionButton>
      )}

      {status === "pending" && (
        <ActionButton
          size={size}
          variant="outline"
          action={() => transitionListingAction(listingId, "withdraw")}
        >
          <Undo2 className="h-4 w-4" aria-hidden /> Withdraw
        </ActionButton>
      )}

      {status === "approved" && (
        <ActionButton
          size={size}
          variant="outline"
          action={() => transitionListingAction(listingId, "unlist")}
          confirmMessage="Hide this listing from tenants? Pending requests stay open."
        >
          <EyeOff className="h-4 w-4" aria-hidden /> Unlist
        </ActionButton>
      )}

      {status === "inactive" && (
        <ActionButton size={size} action={() => transitionListingAction(listingId, "relist")}>
          <Send className="h-4 w-4" aria-hidden /> Relist
        </ActionButton>
      )}

      {status === "draft" && (
        <ActionButton
          size={size}
          variant="ghost"
          className="text-danger hover:bg-danger/10"
          action={() => deleteDraftAction(listingId)}
          confirmMessage="Delete this draft and its photos? This cannot be undone."
        >
          <Trash2 className="h-4 w-4" aria-hidden /> Delete
        </ActionButton>
      )}

      {!compact ? (
        <Link href="/owner/properties" className="text-muted hover:text-ink ml-auto text-sm">
          Back to listings
        </Link>
      ) : null}
    </div>
  );
}

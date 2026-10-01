import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Alert } from "@/components/ui/alert";
import { getActiveAmenities, getActiveCities } from "@/features/catalog/queries";
import { ListingForm } from "@/features/listings/components/listing-form";
import { ListingStatusBadge } from "@/features/listings/components/listing-status-badge";
import { getOwnerListingById } from "@/features/listings/owner-queries";

export const metadata: Metadata = { title: "Edit listing" };

export default async function EditListingPage({
  params,
}: PageProps<"/owner/properties/[id]/edit">) {
  const { id } = await params;
  const [listing, cities, amenities] = await Promise.all([
    getOwnerListingById(id),
    getActiveCities(),
    getActiveAmenities(),
  ]);
  if (!listing) notFound();

  return (
    <section className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Edit listing</h1>
          <ListingStatusBadge status={listing.status} />
        </div>
        <p className="text-muted text-sm">
          Photos are managed on the{" "}
          <Link
            href={`/owner/properties/${listing.id}#photos`}
            className="text-primary hover:underline"
          >
            listing page
          </Link>
          .
        </p>
      </div>
      {listing.status === "approved" ? (
        <Alert tone="info">
          This listing is live. Changing the price, title, description, address, rooms or type sends
          it back to review; availability, dates and contact numbers update immediately.
        </Alert>
      ) : null}
      <ListingForm cities={cities} amenities={amenities} listing={listing} />
    </section>
  );
}

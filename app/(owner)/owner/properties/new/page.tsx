import type { Metadata } from "next";

import { getActiveAmenities, getActiveCities } from "@/features/catalog/queries";
import { ListingForm } from "@/features/listings/components/listing-form";

export const metadata: Metadata = { title: "Add new property" };

export default async function NewListingPage() {
  const [cities, amenities] = await Promise.all([getActiveCities(), getActiveAmenities()]);
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Add New Property</h1>
        <p className="text-muted text-sm">
          Save a draft any time. You add photos in the next step, then submit for review.
        </p>
      </div>
      <ListingForm cities={cities} amenities={amenities} />
    </section>
  );
}

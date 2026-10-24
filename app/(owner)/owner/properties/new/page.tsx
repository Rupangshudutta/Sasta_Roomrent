import type { Metadata } from "next";

import {
  getActiveAmenities,
  getActiveCities,
  getPlatformSettings,
} from "@/features/catalog/queries";
import { ListingForm } from "@/features/listings/components/listing-form";

export const metadata: Metadata = { title: "Add new property" };

export default async function NewListingPage() {
  const [cities, amenities, settings] = await Promise.all([
    getActiveCities(),
    getActiveAmenities(),
    getPlatformSettings(),
  ]);
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Add New Property</h1>
        <p className="text-muted text-sm">
          Fill in the details and add photos, then save a draft or submit it for review.
        </p>
      </div>
      <ListingForm
        cities={cities}
        amenities={amenities}
        maxPhotos={settings.max_photos_per_listing}
      />
    </section>
  );
}

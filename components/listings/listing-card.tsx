import { MapPin, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import type { ListingCard as ListingCardData } from "@/features/listings/queries";
import { propertyTypeShortLabels } from "@/lib/config/site";
import { primaryPhotoPath, propertyPhotoUrl } from "@/lib/supabase/storage";
import { formatInr } from "@/lib/utils/format";

import { AmenityIcon } from "./amenity-icon";

/**
 * The prototype's `.property-card`: 15px radius, 220px cover image, red type
 * badge top-left, green rating pill, up to three amenities, price + CTA.
 */
export function ListingCard({ listing }: { listing: ListingCardData }) {
  const photoPath = primaryPhotoPath(listing.photos);
  const amenities = listing.amenities
    .map((a) => a.amenity)
    .filter((a): a is NonNullable<typeof a> => a !== null)
    .slice(0, 3);
  const location = [listing.locality, listing.city?.name].filter(Boolean).join(", ");

  return (
    <article className="group rounded-card relative flex h-full flex-col overflow-hidden bg-white shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition duration-300 hover:-translate-y-2 hover:shadow-[0_15px_40px_rgba(0,0,0,0.15)]">
      <div className="bg-surface relative h-[220px] w-full">
        {photoPath ? (
          <Image
            src={propertyPhotoUrl(photoPath)}
            alt={listing.title}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <div className="text-muted flex h-full items-center justify-center text-sm">
            No photo yet
          </div>
        )}
        <span className="rounded-pill bg-primary absolute top-4 left-4 px-3 py-1 text-xs font-semibold text-white">
          {propertyTypeShortLabels[listing.property_type]}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex items-start justify-between gap-3">
          <h3 className="line-clamp-2 text-base font-semibold">
            <Link href={`/properties/${listing.id}`} className="after:absolute after:inset-0">
              {listing.title}
            </Link>
          </h3>
          {listing.rating_count > 0 ? (
            <span className="rounded-pill bg-success inline-flex shrink-0 items-center gap-1 px-2 py-0.5 text-xs font-medium text-white">
              {Number(listing.rating_avg).toFixed(1)}
              <Star className="h-3 w-3 fill-current" aria-hidden />
            </span>
          ) : null}
        </div>
        <p className="text-muted mb-3 flex items-center gap-1 text-sm">
          <MapPin className="h-3.5 w-3.5" aria-hidden />
          {location}
        </p>
        {amenities.length > 0 ? (
          <ul className="mb-4 space-y-1">
            {amenities.map((amenity) => (
              <li key={amenity.slug} className="text-ink/80 flex items-center gap-2 text-xs">
                <AmenityIcon name={amenity.icon} className="text-secondary h-3.5 w-3.5" />
                {amenity.label}
              </li>
            ))}
          </ul>
        ) : null}
        <div className="mt-auto flex items-center justify-between">
          <p className="text-primary text-xl font-bold">
            {formatInr(listing.rent_amount)}
            <span className="text-muted text-xs font-normal">/month</span>
          </p>
          <span className="rounded-pill border-primary text-primary group-hover:bg-primary relative z-10 border px-3 py-1 text-xs font-medium transition group-hover:text-white">
            View Details
          </span>
        </div>
      </div>
    </article>
  );
}

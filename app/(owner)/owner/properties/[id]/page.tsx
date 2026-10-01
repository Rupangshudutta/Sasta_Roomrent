import { Eye, Images, Star, Users } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Alert } from "@/components/ui/alert";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { StatTile } from "@/components/ui/stat-tile";
import { getPlatformSettings } from "@/features/catalog/queries";
import { ListingActions } from "@/features/listings/components/listing-actions";
import {
  ListingStatusBadge,
  listingStatusMeta,
} from "@/features/listings/components/listing-status-badge";
import { PhotoManager } from "@/features/listings/components/photo-manager";
import { getOwnerListingById } from "@/features/listings/owner-queries";
import { getCurrentUser } from "@/lib/auth/session";
import { furnishingLabels, genderPreferenceLabels, propertyTypeLabels } from "@/lib/config/site";
import { formatDate, formatInr } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Manage listing" };

export default async function OwnerListingPage({
  params,
  searchParams,
}: PageProps<"/owner/properties/[id]">) {
  const [{ id }, query, user, settings] = await Promise.all([
    params,
    searchParams,
    getCurrentUser(),
    getPlatformSettings(),
  ]);
  const listing = await getOwnerListingById(id);
  if (!listing || !user) notFound();

  const meta = listingStatusMeta[listing.status];

  return (
    <section className="space-y-6">
      {query.created === "1" ? (
        <Alert tone="success" title="Listing saved">
          {listing.status === "pending"
            ? "It is in review. Add photos below so our team can approve it faster."
            : "Now add photos, then submit it for review."}
        </Alert>
      ) : null}
      {query.saved === "1" ? <Alert tone="success">Changes saved.</Alert> : null}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{listing.title}</h1>
            <ListingStatusBadge status={listing.status} />
          </div>
          <p className="text-muted mt-1 text-sm">{meta.help}</p>
          {listing.status === "rejected" && listing.rejection_reason ? (
            <Alert tone="error" title="Reason from our team" className="mt-3">
              {listing.rejection_reason}
            </Alert>
          ) : null}
        </div>
      </div>

      <ListingActions
        listingId={listing.id}
        status={listing.status}
        photoCount={listing.photos.length}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Views" value={listing.views_count} Icon={Eye} tone="secondary" />
        <StatTile
          label="Rating"
          value={
            listing.rating_count > 0
              ? `${Number(listing.rating_avg).toFixed(1)} ★`
              : "No reviews yet"
          }
          Icon={Star}
          tone="warning"
          hint={
            listing.rating_count > 0
              ? `${listing.rating_count} review${listing.rating_count === 1 ? "" : "s"}`
              : undefined
          }
        />
        <StatTile
          label="Rooms available"
          value={`${listing.available_rooms} / ${listing.total_rooms}`}
          Icon={Users}
          tone="success"
        />
      </div>

      <Card id="photos">
        <CardHeader
          title={
            <span className="inline-flex items-center gap-2">
              <Images className="text-primary h-5 w-5" aria-hidden /> Photos
            </span>
          }
          description={`${listing.photos.length} of ${settings.max_photos_per_listing}. Listings with 3+ photos get far more requests.`}
        />
        <CardBody>
          <PhotoManager
            propertyId={listing.id}
            ownerId={listing.owner_id}
            photos={listing.photos}
            maxPhotos={settings.max_photos_per_listing}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Summary" />
        <CardBody>
          <dl className="grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
            <Row label="Type" value={propertyTypeLabels[listing.property_type]} />
            <Row label="Furnishing" value={furnishingLabels[listing.furnishing]} />
            <Row label="Rent" value={`${formatInr(listing.rent_amount)} / month`} />
            <Row label="Deposit" value={formatInr(listing.security_deposit)} />
            <Row
              label="Maintenance"
              value={
                Number(listing.maintenance_amount) > 0
                  ? formatInr(listing.maintenance_amount)
                  : "Included"
              }
            />
            <Row
              label="Minimum stay"
              value={`${listing.min_lease_months} month${listing.min_lease_months === 1 ? "" : "s"}`}
            />
            <Row
              label="Available from"
              value={listing.available_from ? formatDate(listing.available_from) : "Now"}
            />
            <Row
              label="Gender preference"
              value={genderPreferenceLabels[listing.gender_preference]}
            />
            <Row
              label="Address"
              value={[
                listing.address_line1,
                listing.address_line2,
                listing.locality,
                listing.city?.name,
                listing.state,
                listing.pincode,
              ]
                .filter(Boolean)
                .join(", ")}
            />
            <Row
              label="Contact"
              value={[listing.contact_phone, listing.alt_contact_phone].filter(Boolean).join(" / ")}
            />
            <Row
              label="Amenities"
              value={
                listing.amenities
                  .map((a) => a.amenity?.label)
                  .filter(Boolean)
                  .join(", ") || "None selected"
              }
            />
            <Row
              label="Submitted"
              value={listing.submitted_at ? formatDate(listing.submitted_at) : "Not yet"}
            />
          </dl>
        </CardBody>
      </Card>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-muted text-xs font-medium tracking-wide uppercase">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

import { BadgeCheck, CalendarDays, Eye, MapPin, ShieldCheck, Star, UserRound } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AmenityIcon } from "@/components/listings/amenity-icon";
import { ListingCard } from "@/components/listings/listing-card";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { FavoriteButton } from "@/features/favorites/components/favorite-button";
import { getFavoriteIds } from "@/features/favorites/queries";
import { PhotoGallery } from "@/features/search/components/photo-gallery";
import { ViewTracker } from "@/features/search/components/view-tracker";
import {
  getOwnerOtherListings,
  getPublicListing,
  getPublicOwner,
  getPublicReviews,
} from "@/features/search/queries";
import { getCurrentUser } from "@/lib/auth/session";
import { furnishingLabels, genderPreferenceLabels, propertyTypeLabels } from "@/lib/config/site";
import { primaryPhotoPath, propertyPhotoUrl } from "@/lib/supabase/storage";
import { formatDate, formatInr } from "@/lib/utils/format";

export async function generateMetadata({
  params,
}: PageProps<"/properties/[id]">): Promise<Metadata> {
  const { id } = await params;
  const listing = await getPublicListing(id);
  if (!listing) return { title: "Listing not found" };
  const cover = primaryPhotoPath(listing.photos);
  const description = `${propertyTypeLabels[listing.property_type]} in ${listing.locality}, ${listing.city?.name} for ${formatInr(listing.rent_amount)}/month. ${listing.description?.slice(0, 120) ?? "Verified, broker-free long-term stay."}`;
  return {
    title: listing.title,
    description,
    openGraph: {
      title: listing.title,
      description,
      images: cover ? [{ url: propertyPhotoUrl(cover) }] : undefined,
    },
  };
}

export default async function ListingDetailPage({ params }: PageProps<"/properties/[id]">) {
  const { id } = await params;
  const listing = await getPublicListing(id);
  if (!listing) notFound();

  const [owner, reviews, others, favoriteIds, user] = await Promise.all([
    getPublicOwner(listing.owner_id),
    getPublicReviews(listing.id),
    getOwnerOtherListings(listing.owner_id, listing.id),
    getFavoriteIds(),
    getCurrentUser(),
  ]);

  const isLive = listing.status === "approved";
  const isOwnListing = user?.id === listing.owner_id;
  const amenities = listing.amenities
    .map((a) => a.amenity)
    .filter((a): a is NonNullable<typeof a> => a !== null);
  const requestHref = user
    ? `/properties/${listing.id}/request`
    : `/login?next=${encodeURIComponent(`/properties/${listing.id}/request`)}`;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8">
      {isLive ? <ViewTracker propertyId={listing.id} /> : null}
      {!isLive ? (
        <Alert tone="info" title="Preview" className="mb-6">
          This listing is not live ({listing.status}). Only you and our team can see this page.
        </Alert>
      ) : null}

      <nav aria-label="Breadcrumb" className="text-muted mb-4 text-sm">
        <Link href="/properties" className="hover:text-primary">
          Properties
        </Link>
        {listing.city ? (
          <>
            {" / "}
            <Link href={`/properties?city=${listing.city.slug}`} className="hover:text-primary">
              {listing.city.name}
            </Link>
          </>
        ) : null}
        {" / "}
        <span className="text-ink">{listing.locality}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[3fr_2fr]">
        <div className="space-y-8">
          <PhotoGallery photos={listing.photos} title={listing.title} />

          <section>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="primary">{propertyTypeLabels[listing.property_type]}</Badge>
              <Badge tone="neutral">{furnishingLabels[listing.furnishing]}</Badge>
              <Badge tone="info">{genderPreferenceLabels[listing.gender_preference]}</Badge>
              {listing.is_featured ? <Badge tone="warning">Featured</Badge> : null}
            </div>
            <h1 className="mt-3 text-2xl font-bold sm:text-3xl">{listing.title}</h1>
            <p className="text-muted mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-4 w-4" aria-hidden />
                {listing.locality}, {listing.city?.name}, {listing.state} {listing.pincode}
              </span>
              {listing.rating_count > 0 ? (
                <span className="text-ink inline-flex items-center gap-1">
                  <Star className="fill-success text-success h-4 w-4" aria-hidden />
                  {Number(listing.rating_avg).toFixed(1)} ({listing.rating_count})
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1">
                <Eye className="h-4 w-4" aria-hidden />
                {listing.views_count} views
              </span>
            </p>
            <p className="text-muted mt-1 text-xs">
              The exact address is shared with you once the owner accepts your request.
            </p>
          </section>

          {listing.description ? (
            <section>
              <h2 className="text-lg font-semibold">About this place</h2>
              <p className="text-ink/90 mt-2 whitespace-pre-wrap">{listing.description}</p>
            </section>
          ) : null}

          <section>
            <h2 className="text-lg font-semibold">Amenities</h2>
            {amenities.length === 0 ? (
              <p className="text-muted mt-2 text-sm">The owner has not listed amenities yet.</p>
            ) : (
              <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {amenities.map((a) => (
                  <li
                    key={a.slug}
                    className="rounded-card-sm bg-surface flex items-center gap-2 px-3 py-2 text-sm"
                  >
                    <AmenityIcon name={a.icon} className="text-secondary h-4 w-4" /> {a.label}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {listing.house_rules ? (
            <section>
              <h2 className="text-lg font-semibold">House rules</h2>
              <p className="text-ink/90 mt-2 whitespace-pre-wrap">{listing.house_rules}</p>
            </section>
          ) : null}

          <section>
            <h2 className="text-lg font-semibold">
              Reviews {listing.rating_count > 0 ? `(${listing.rating_count})` : ""}
            </h2>
            {reviews.length === 0 ? (
              <p className="text-muted mt-2 text-sm">
                No reviews yet. Only tenants who stayed here can review it.
              </p>
            ) : (
              <ul className="mt-3 space-y-4">
                {reviews.map((r) => (
                  <li key={r.id} className="rounded-card-sm border-border/60 border p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium">
                        {r.reviewer_first_name}{" "}
                        {r.reviewer_last_initial ? `${r.reviewer_last_initial}.` : ""}
                      </p>
                      <span className="rounded-pill bg-success inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-white">
                        {r.rating} <Star className="h-3 w-3 fill-current" aria-hidden />
                      </span>
                    </div>
                    {r.title ? <p className="mt-1 font-semibold">{r.title}</p> : null}
                    {r.comment ? <p className="text-ink/90 mt-1 text-sm">{r.comment}</p> : null}
                    <p className="text-muted mt-2 text-xs">{formatDate(r.created_at)}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:h-fit">
          <div className="rounded-card border-border/60 border bg-white p-6 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
            <p className="text-primary text-3xl font-bold">
              {formatInr(listing.rent_amount)}{" "}
              <span className="text-muted text-sm font-normal">/ month</span>
            </p>
            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <div>
                <dt className="text-muted">Security deposit</dt>
                <dd className="font-medium">
                  {Number(listing.security_deposit) > 0
                    ? formatInr(listing.security_deposit)
                    : "None"}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Maintenance</dt>
                <dd className="font-medium">
                  {Number(listing.maintenance_amount) > 0
                    ? `${formatInr(listing.maintenance_amount)}/mo`
                    : "Included"}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Minimum stay</dt>
                <dd className="font-medium">
                  {listing.min_lease_months} month{listing.min_lease_months === 1 ? "" : "s"}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Available from</dt>
                <dd className="inline-flex items-center gap-1 font-medium">
                  <CalendarDays className="h-3.5 w-3.5" aria-hidden />
                  {listing.available_from ? formatDate(listing.available_from) : "Now"}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Rooms available</dt>
                <dd className="font-medium">
                  {listing.available_rooms} of {listing.total_rooms}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Suitable for</dt>
                <dd className="font-medium">{genderPreferenceLabels[listing.gender_preference]}</dd>
              </div>
            </dl>

            <div className="mt-5 flex flex-col gap-2">
              {isOwnListing ? (
                <ButtonLink href={`/owner/properties/${listing.id}`} variant="outline" fullWidth>
                  Manage this listing
                </ButtonLink>
              ) : listing.available_rooms > 0 && isLive ? (
                <ButtonLink href={requestHref} size="lg" fullWidth>
                  Request to book
                </ButtonLink>
              ) : (
                <p className="rounded-card-sm bg-surface text-muted px-3 py-2 text-center text-sm">
                  No rooms available right now
                </p>
              )}
              {!isOwnListing ? (
                <FavoriteButton
                  propertyId={listing.id}
                  initialSaved={favoriteIds.has(listing.id)}
                  isAuthenticated={Boolean(user)}
                  nextPath={`/properties/${listing.id}`}
                  variant="inline"
                />
              ) : null}
            </div>
            <p className="text-muted mt-3 flex items-start gap-2 text-xs">
              <ShieldCheck className="text-success mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              Zero brokerage. Sending a request is free; you deal with the owner directly once they
              accept.
            </p>
          </div>

          {owner ? (
            <div className="rounded-card border-border/60 border bg-white p-6">
              <div className="flex items-center gap-3">
                <span className="bg-primary/10 text-primary flex h-12 w-12 items-center justify-center rounded-full">
                  <UserRound className="h-6 w-6" aria-hidden />
                </span>
                <div>
                  <p className="font-semibold">
                    {owner.first_name} {owner.last_name}
                  </p>
                  <p className="text-muted text-xs">
                    Owner · member since {formatDate(owner.member_since)}
                  </p>
                </div>
              </div>
              <p className="text-muted mt-3 inline-flex items-center gap-1 text-xs">
                <BadgeCheck className="text-success h-4 w-4" aria-hidden /> Listing reviewed by the
                Sasta Room team
              </p>
            </div>
          ) : null}
        </aside>
      </div>

      {others.length > 0 ? (
        <section className="mt-14">
          <h2 className="mb-5 text-xl font-semibold">More from this owner</h2>
          <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {others.map((l) => (
              <li key={l.id}>
                <ListingCard listing={l} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

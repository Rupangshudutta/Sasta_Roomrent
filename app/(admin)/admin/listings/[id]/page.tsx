import { CheckCircle2, ExternalLink, Star, StarOff } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ActionButton } from "@/components/ui/action-button";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { approveListingAction, setFeaturedAction } from "@/features/admin/actions";
import { RejectListingForm } from "@/features/admin/components/reject-listing-form";
import { getAdminListingById, getAuditLogForEntity } from "@/features/admin/queries";
import {
  ListingStatusBadge,
  listingStatusMeta,
} from "@/features/listings/components/listing-status-badge";
import { AmenityIcon } from "@/components/listings/amenity-icon";
import { furnishingLabels, genderPreferenceLabels, propertyTypeLabels } from "@/lib/config/site";
import { propertyPhotoUrl } from "@/lib/supabase/storage";
import { formatDate, formatDateTime, formatInr } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Review listing" };

export default async function AdminListingDetailPage({
  params,
}: PageProps<"/admin/listings/[id]">) {
  const { id } = await params;
  const [listing, history] = await Promise.all([
    getAdminListingById(id),
    getAuditLogForEntity("property", id),
  ]);
  if (!listing) notFound();

  const photos = [...listing.photos].sort(
    (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order,
  );
  const canApprove = ["pending", "rejected", "inactive"].includes(listing.status);
  const canReject = ["pending", "approved"].includes(listing.status);

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/admin/listings" className="text-muted hover:text-ink text-sm">
            ← Back to queue
          </Link>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold">{listing.title}</h1>
            <ListingStatusBadge status={listing.status} />
            {listing.is_featured ? <Badge tone="warning">Featured</Badge> : null}
          </div>
          <p className="text-muted text-sm">{listingStatusMeta[listing.status].help}</p>
        </div>
        {listing.status === "approved" ? (
          <Link
            href={`/properties/${listing.id}`}
            target="_blank"
            className="text-primary inline-flex items-center gap-1 text-sm font-medium hover:underline"
          >
            View public page <ExternalLink className="h-4 w-4" aria-hidden />
          </Link>
        ) : null}
      </div>

      {photos.length === 0 ? (
        <Alert tone="info">
          This listing has no photos. Consider rejecting with a request for real photos.
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader title={`Photos (${photos.length})`} />
            <CardBody>
              {photos.length === 0 ? (
                <p className="text-muted text-sm">None uploaded.</p>
              ) : (
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {photos.map((photo) => (
                    <li
                      key={photo.id}
                      className="rounded-card-sm bg-surface relative aspect-[4/3] overflow-hidden"
                    >
                      <Image
                        src={propertyPhotoUrl(photo.storage_path)}
                        alt=""
                        fill
                        sizes="(min-width: 640px) 33vw, 50vw"
                        className="object-cover"
                      />
                      {photo.is_primary ? (
                        <span className="rounded-pill bg-primary absolute top-2 left-2 px-2 py-0.5 text-xs font-semibold text-white">
                          Cover
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Details" />
            <CardBody className="space-y-5 text-sm">
              <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
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
                <Row label="Minimum stay" value={`${listing.min_lease_months} month(s)`} />
                <Row
                  label="Rooms"
                  value={`${listing.available_rooms} available of ${listing.total_rooms}`}
                />
                <Row
                  label="Gender preference"
                  value={genderPreferenceLabels[listing.gender_preference]}
                />
                <Row
                  label="Available from"
                  value={listing.available_from ? formatDate(listing.available_from) : "Now"}
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
                  label="Contact on listing"
                  value={[listing.contact_phone, listing.alt_contact_phone]
                    .filter(Boolean)
                    .join(" / ")}
                />
                <Row
                  label="Submitted"
                  value={listing.submitted_at ? formatDateTime(listing.submitted_at) : "—"}
                />
              </dl>
              {listing.description ? (
                <div>
                  <p className="text-muted text-xs font-medium tracking-wide uppercase">
                    Description
                  </p>
                  <p className="mt-1 whitespace-pre-wrap">{listing.description}</p>
                </div>
              ) : null}
              {listing.house_rules ? (
                <div>
                  <p className="text-muted text-xs font-medium tracking-wide uppercase">
                    House rules
                  </p>
                  <p className="mt-1 whitespace-pre-wrap">{listing.house_rules}</p>
                </div>
              ) : null}
              <div>
                <p className="text-muted text-xs font-medium tracking-wide uppercase">Amenities</p>
                {listing.amenities.length === 0 ? (
                  <p className="text-muted mt-1">None selected</p>
                ) : (
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {listing.amenities.map((a) =>
                      a.amenity ? (
                        <li
                          key={a.amenity.slug}
                          className="rounded-pill bg-surface inline-flex items-center gap-1.5 px-3 py-1 text-xs"
                        >
                          <AmenityIcon
                            name={a.amenity.icon}
                            className="text-secondary h-3.5 w-3.5"
                          />{" "}
                          {a.amenity.label}
                        </li>
                      ) : null,
                    )}
                  </ul>
                )}
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Decision" description="The owner is notified in-app and by email." />
            <CardBody className="space-y-5">
              {listing.status === "rejected" && listing.rejection_reason ? (
                <Alert tone="error" title="Current rejection reason">
                  {listing.rejection_reason}
                </Alert>
              ) : null}
              {canApprove ? (
                <ActionButton action={() => approveListingAction(listing.id)} fullWidth>
                  <CheckCircle2 className="h-4 w-4" aria-hidden /> Approve and publish
                </ActionButton>
              ) : null}
              {canReject ? <RejectListingForm listingId={listing.id} /> : null}
              {listing.status === "approved" ? (
                <ActionButton
                  variant="outline"
                  fullWidth
                  action={() => setFeaturedAction(listing.id, !listing.is_featured)}
                >
                  {listing.is_featured ? (
                    <>
                      <StarOff className="h-4 w-4" aria-hidden /> Remove from featured
                    </>
                  ) : (
                    <>
                      <Star className="h-4 w-4" aria-hidden /> Feature on home page
                    </>
                  )}
                </ActionButton>
              ) : null}
              {!canApprove && !canReject ? (
                <p className="text-muted text-sm">
                  No moderation action applies to a{" "}
                  {listingStatusMeta[listing.status].label.toLowerCase()} listing.
                </p>
              ) : null}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Owner" />
            <CardBody className="text-sm">
              {listing.owner ? (
                <dl className="space-y-2">
                  <Row
                    label="Name"
                    value={`${listing.owner.first_name} ${listing.owner.last_name}`}
                  />
                  <Row label="Phone" value={listing.owner.phone ?? "—"} />
                  <Row label="Email" value={listing.owner.email ?? "—"} />
                  <Row label="Business" value={listing.owner.owner_profile?.business_name ?? "—"} />
                  <Row label="Member since" value={formatDate(listing.owner.created_at)} />
                  <Row label="Account" value={listing.owner.is_active ? "Active" : "Blocked"} />
                </dl>
              ) : (
                <p className="text-muted">Owner profile unavailable.</p>
              )}
              <Link
                href={`/admin/users?q=${encodeURIComponent(listing.owner?.email ?? "")}`}
                className="text-primary mt-3 inline-block hover:underline"
              >
                Open in users
              </Link>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Moderation history" />
            <CardBody className="p-0">
              {history.length === 0 ? (
                <p className="text-muted px-6 py-4 text-sm">No admin actions yet.</p>
              ) : (
                <ul className="divide-border/60 divide-y text-sm">
                  {history.map((entry) => (
                    <li key={entry.id} className="px-6 py-3">
                      <p className="font-medium">{entry.action}</p>
                      <p className="text-muted text-xs">
                        {entry.actor
                          ? `${entry.actor.first_name} ${entry.actor.last_name}`
                          : "system"}{" "}
                        · {formatDateTime(entry.created_at)}
                        {typeof entry.details === "object" &&
                        entry.details &&
                        "reason" in entry.details &&
                        entry.details.reason
                          ? ` · ${String(entry.details.reason)}`
                          : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
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

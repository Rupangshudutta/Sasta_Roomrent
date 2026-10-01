import { Building2, Eye, MapPin, Plus, Star } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { Alert } from "@/components/ui/alert";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ListingActions } from "@/features/listings/components/listing-actions";
import {
  ListingStatusBadge,
  listingStatusMeta,
} from "@/features/listings/components/listing-status-badge";
import {
  getOwnerListingCounts,
  getOwnerListings,
  sortPhotos,
  type ListingStatus,
} from "@/features/listings/owner-queries";
import { propertyTypeShortLabels } from "@/lib/config/site";
import { propertyPhotoUrl } from "@/lib/supabase/storage";
import { cn } from "@/lib/utils/cn";
import { formatInr } from "@/lib/utils/format";

export const metadata: Metadata = { title: "My listings" };

const statusFilters: ReadonlyArray<{ value: ListingStatus | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "approved", label: "Live" },
  { value: "pending", label: "In review" },
  { value: "draft", label: "Drafts" },
  { value: "rejected", label: "Needs changes" },
  { value: "inactive", label: "Unlisted" },
];

export default async function OwnerPropertiesPage({
  searchParams,
}: PageProps<"/owner/properties">) {
  const params = await searchParams;
  const statusParam = typeof params.status === "string" ? params.status : "all";
  const status =
    statusFilters.some((f) => f.value === statusParam) && statusParam !== "all"
      ? (statusParam as ListingStatus)
      : undefined;

  const [listings, counts] = await Promise.all([getOwnerListings(status), getOwnerListingCounts()]);

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">My Properties</h1>
          <p className="text-muted text-sm">
            {counts.total} listing{counts.total === 1 ? "" : "s"} · {counts.approved} live ·{" "}
            {counts.pending} in review
          </p>
        </div>
        <ButtonLink href="/owner/properties/new">
          <Plus className="h-4 w-4" aria-hidden /> Add New Property
        </ButtonLink>
      </div>

      {params.deleted === "1" ? <Alert tone="success">Draft deleted.</Alert> : null}

      <nav aria-label="Filter by status" className="flex flex-wrap gap-2">
        {statusFilters.map((filter) => {
          const active = (filter.value === "all" && !status) || filter.value === status;
          const count = filter.value === "all" ? counts.total : counts[filter.value];
          return (
            <Link
              key={filter.value}
              href={
                filter.value === "all"
                  ? "/owner/properties"
                  : `/owner/properties?status=${filter.value}`
              }
              aria-current={active ? "page" : undefined}
              className={cn(
                "rounded-pill border px-3.5 py-1.5 text-sm font-medium transition",
                active
                  ? "border-primary bg-primary text-white"
                  : "border-border text-ink hover:border-primary/50 bg-white",
              )}
            >
              {filter.label} <span className={active ? "opacity-80" : "text-muted"}>({count})</span>
            </Link>
          );
        })}
      </nav>

      {listings.length === 0 ? (
        <EmptyState
          Icon={Building2}
          title={
            status
              ? `No ${listingStatusMeta[status].label.toLowerCase()} listings`
              : "You have not listed anything yet"
          }
          body={
            status
              ? undefined
              : "Add your first PG, room or flat. It takes about five minutes, and listing is free."
          }
          action={
            !status ? (
              <ButtonLink href="/owner/properties/new">Add your first listing</ButtonLink>
            ) : undefined
          }
        />
      ) : (
        <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {listings.map((listing) => {
            const cover = sortPhotos(listing.photos)[0];
            return (
              <li
                key={listing.id}
                className="rounded-card border-border/60 flex flex-col overflow-hidden border bg-white shadow-[0_4px_16px_rgba(0,0,0,0.04)]"
              >
                <Link
                  href={`/owner/properties/${listing.id}`}
                  className="bg-surface relative block h-44"
                >
                  {cover ? (
                    <Image
                      src={propertyPhotoUrl(cover.storage_path)}
                      alt=""
                      fill
                      sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
                      className="object-cover"
                    />
                  ) : (
                    <span className="text-muted flex h-full items-center justify-center text-sm">
                      No photos yet
                    </span>
                  )}
                  <span className="rounded-pill bg-primary absolute top-3 left-3 px-2.5 py-0.5 text-xs font-semibold text-white">
                    {propertyTypeShortLabels[listing.property_type]}
                  </span>
                  <span className="absolute top-3 right-3">
                    <ListingStatusBadge status={listing.status} />
                  </span>
                </Link>
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <h2 className="line-clamp-2 font-semibold">
                    <Link href={`/owner/properties/${listing.id}`} className="hover:text-primary">
                      {listing.title}
                    </Link>
                  </h2>
                  <p className="text-muted flex items-center gap-1 text-sm">
                    <MapPin className="h-3.5 w-3.5" aria-hidden />
                    {listing.locality}, {listing.city?.name}
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-primary text-lg font-bold">
                      {formatInr(listing.rent_amount)}
                      <span className="text-muted text-xs font-normal">/mo</span>
                    </span>
                    <span className="text-muted flex items-center gap-3">
                      <span className="inline-flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" aria-hidden /> {listing.views_count}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Star className="h-3.5 w-3.5" aria-hidden />
                        {listing.rating_count > 0 ? Number(listing.rating_avg).toFixed(1) : "—"}
                      </span>
                      <span>
                        {listing.available_rooms}/{listing.total_rooms} free
                      </span>
                    </span>
                  </div>
                  {listing.status === "rejected" && listing.rejection_reason ? (
                    <p className="rounded-card-sm bg-danger/5 text-danger px-3 py-2 text-xs">
                      Reason: {listing.rejection_reason}
                    </p>
                  ) : null}
                  <div className="mt-auto pt-2">
                    <ListingActions
                      listingId={listing.id}
                      status={listing.status}
                      photoCount={listing.photos.length}
                      compact
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

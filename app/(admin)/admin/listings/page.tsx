import type { Route } from "next";
import { Search } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { getModerationQueue } from "@/features/admin/queries";
import { listingQueueFilterSchema, PAGE_SIZE } from "@/features/admin/schema";
import { ListingStatusBadge } from "@/features/listings/components/listing-status-badge";
import { propertyTypeShortLabels } from "@/lib/config/site";
import { primaryPhotoPath, propertyPhotoUrl } from "@/lib/supabase/storage";
import { cn } from "@/lib/utils/cn";
import { formatDate, formatInr } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Listings review" };

const tabs = [
  { value: "pending", label: "Awaiting review" },
  { value: "approved", label: "Live" },
  { value: "rejected", label: "Rejected" },
  { value: "inactive", label: "Unlisted" },
  { value: "draft", label: "Drafts" },
  { value: "all", label: "All" },
] as const;

export default async function AdminListingsPage({ searchParams }: PageProps<"/admin/listings">) {
  const raw = await searchParams;
  const filter = listingQueueFilterSchema.parse(raw);
  const { rows, total } = await getModerationQueue(filter);

  const href = (overrides: Partial<typeof filter>) => {
    const params = new URLSearchParams();
    const next = { ...filter, ...overrides };
    if (next.status !== "pending") params.set("status", next.status);
    if (next.q) params.set("q", next.q);
    if (next.page > 1) params.set("page", String(next.page));
    const qs = params.toString();
    return `/admin/listings${qs ? `?${qs}` : ""}` as Route;
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Listings review</h1>
          <p className="text-muted text-sm">
            Approve or reject submissions. Owners are notified in-app and by email.
          </p>
        </div>
        <form method="get" action="/admin/listings" role="search" className="flex gap-2">
          {filter.status !== "pending" ? (
            <input type="hidden" name="status" value={filter.status} />
          ) : null}
          <label className="sr-only" htmlFor="q">
            Search title or locality
          </label>
          <input
            id="q"
            name="q"
            defaultValue={filter.q}
            placeholder="Search title or locality"
            className="rounded-pill border-border focus:border-primary h-10 border px-4 text-sm focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-pill bg-primary inline-flex h-10 items-center gap-1 px-4 text-sm font-medium text-white"
          >
            <Search className="h-4 w-4" aria-hidden /> Search
          </button>
        </form>
      </div>

      <nav aria-label="Filter by status" className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <Link
            key={tab.value}
            href={href({ status: tab.value, page: 1 })}
            aria-current={filter.status === tab.value ? "page" : undefined}
            className={cn(
              "rounded-pill border px-3.5 py-1.5 text-sm font-medium transition",
              filter.status === tab.value
                ? "border-primary bg-primary text-white"
                : "border-border hover:border-primary/50 bg-white",
            )}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      <div className="rounded-card border-border/60 overflow-x-auto border bg-white">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-surface text-muted text-left text-xs tracking-wide uppercase">
            <tr>
              <th className="px-4 py-3">Property</th>
              <th className="px-4 py-3">Owner</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Rent</th>
              <th className="px-4 py-3">{filter.status === "pending" ? "Submitted" : "Status"}</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-border/60 divide-y">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-muted px-4 py-10 text-center">
                  Nothing here{filter.q ? ` for “${filter.q}”` : ""}.
                </td>
              </tr>
            ) : (
              rows.map((listing) => {
                const cover = primaryPhotoPath(listing.photos);
                return (
                  <tr key={listing.id} className="align-middle">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="bg-surface relative h-12 w-16 shrink-0 overflow-hidden rounded-md">
                          {cover ? (
                            <Image
                              src={propertyPhotoUrl(cover)}
                              alt=""
                              fill
                              sizes="64px"
                              className="object-cover"
                            />
                          ) : null}
                        </span>
                        <div className="min-w-0">
                          <Link
                            href={`/admin/listings/${listing.id}`}
                            className="hover:text-primary line-clamp-1 font-medium"
                          >
                            {listing.title}
                          </Link>
                          <p className="text-muted text-xs">
                            {listing.photos.length} photo{listing.photos.length === 1 ? "" : "s"}
                            {listing.is_featured ? " · Featured" : ""}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {listing.owner ? (
                        <>
                          <p>
                            {listing.owner.first_name} {listing.owner.last_name}
                          </p>
                          <p className="text-muted text-xs">
                            {listing.owner.phone ?? listing.owner.email ?? ""}
                          </p>
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone="primary">{propertyTypeShortLabels[listing.property_type]}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      {listing.locality}, {listing.city?.name}
                    </td>
                    <td className="px-4 py-3 font-medium">{formatInr(listing.rent_amount)}</td>
                    <td className="px-4 py-3">
                      {filter.status === "pending" ? (
                        listing.submitted_at ? (
                          formatDate(listing.submitted_at)
                        ) : (
                          "—"
                        )
                      ) : (
                        <ListingStatusBadge status={listing.status} />
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ButtonLink
                        href={`/admin/listings/${listing.id}`}
                        size="sm"
                        variant={listing.status === "pending" ? "primary" : "outline"}
                      >
                        {listing.status === "pending" ? "Review" : "Open"}
                      </ButtonLink>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <Pagination
        page={filter.page}
        pageSize={PAGE_SIZE}
        total={total}
        makeHref={(page) => href({ page })}
      />
    </section>
  );
}

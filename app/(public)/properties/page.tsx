import { LayoutGrid, List, SearchX } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ListingCard } from "@/components/listings/listing-card";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { getActiveAmenities, getActiveCities } from "@/features/catalog/queries";
import { getFavoriteIds } from "@/features/favorites/queries";
import { FilterPanel } from "@/features/search/components/filter-panel";
import { SortSelect } from "@/features/search/components/sort-select";
import { searchListings } from "@/features/search/queries";
import {
  countActiveFilters,
  filterToSearchParams,
  searchFilterSchema,
  SEARCH_PAGE_SIZE,
} from "@/features/search/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { cn } from "@/lib/utils/cn";

export const metadata: Metadata = {
  title: "Find PGs, rooms and flats",
  description:
    "Search verified long-term rentals across India. Filter by city, rent, type, amenities and more. Zero brokerage.",
};

export default async function PropertiesPage({ searchParams }: PageProps<"/properties">) {
  const raw = await searchParams;
  const filter = searchFilterSchema.parse(raw);
  const [result, cities, amenities, favoriteIds, user] = await Promise.all([
    searchListings(filter),
    getActiveCities(),
    getActiveAmenities(),
    getFavoriteIds(),
    getCurrentUser(),
  ]);

  const baseParams = filterToSearchParams(filter).toString();
  const currentPath = `/properties${baseParams ? `?${baseParams}` : ""}`;
  const viewHref = (view: "grid" | "list") =>
    `/properties?${filterToSearchParams({ ...filter, view, page: 1 }).toString()}`;
  const activeCount = countActiveFilters(filter);
  const cityName = cities.find((c) => c.slug === filter.city)?.name;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold sm:text-3xl">
          {cityName ? `Rooms, PGs and flats in ${cityName}` : "Find your long-term stay"}
        </h1>
        <p className="text-muted text-sm">
          Verified listings only. Request to book and connect with the owner directly, no brokerage.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Mobile: collapsible panel with ALL filters */}
        <details className="rounded-card-sm border-border border bg-white p-4 lg:hidden">
          <summary className="cursor-pointer list-none font-semibold [&::-webkit-details-marker]:hidden">
            Filters{activeCount > 0 ? ` (${activeCount})` : ""}{" "}
            <span className="text-primary float-right">Show</span>
          </summary>
          <div className="mt-4">
            <FilterPanel idPrefix="m" filter={filter} cities={cities} amenities={amenities} />
          </div>
        </details>

        {/* Desktop: sticky sidebar */}
        <aside className="rounded-card-sm border-border sticky top-20 hidden h-fit border bg-white p-5 lg:block">
          <FilterPanel idPrefix="d" filter={filter} cities={cities} amenities={amenities} />
        </aside>

        <section aria-live="polite">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-medium">
              {result.total === 0
                ? "No properties found"
                : `${result.total.toLocaleString("en-IN")} propert${result.total === 1 ? "y" : "ies"} found`}
              {filter.q ? <span className="text-muted"> for “{filter.q}”</span> : null}
            </p>
            <div className="flex items-center gap-3">
              <SortSelect current={filter.sort} baseParams={baseParams} />
              <div className="hidden items-center gap-1 sm:flex" role="group" aria-label="Layout">
                <Link
                  href={viewHref("grid")}
                  aria-label="Grid view"
                  aria-current={filter.view === "grid" ? "true" : undefined}
                  className={cn(
                    "rounded-md border p-2",
                    filter.view === "grid"
                      ? "border-primary text-primary"
                      : "border-border text-muted",
                  )}
                >
                  <LayoutGrid className="h-4 w-4" aria-hidden />
                </Link>
                <Link
                  href={viewHref("list")}
                  aria-label="List view"
                  aria-current={filter.view === "list" ? "true" : undefined}
                  className={cn(
                    "rounded-md border p-2",
                    filter.view === "list"
                      ? "border-primary text-primary"
                      : "border-border text-muted",
                  )}
                >
                  <List className="h-4 w-4" aria-hidden />
                </Link>
              </div>
            </div>
          </div>

          {result.listings.length === 0 ? (
            <EmptyState
              Icon={SearchX}
              title="No properties match these filters"
              body={
                activeCount > 0
                  ? "Try widening the rent range, removing an amenity, or searching a nearby area."
                  : "New listings are reviewed and published every day. Check back soon or list your own."
              }
              action={
                <div className="flex gap-2">
                  {activeCount > 0 ? (
                    <ButtonLink href="/properties" variant="outline">
                      Clear filters
                    </ButtonLink>
                  ) : null}
                  <ButtonLink href="/register?role=owner">List a property</ButtonLink>
                </div>
              }
            />
          ) : (
            <ul
              className={cn(
                "grid gap-5",
                filter.view === "grid" ? "md:grid-cols-2 xl:grid-cols-3" : "grid-cols-1",
              )}
            >
              {result.listings.map((listing) => (
                <li key={listing.id}>
                  <ListingCard
                    listing={listing}
                    layout={filter.view}
                    favorite={{
                      saved: favoriteIds.has(listing.id),
                      isAuthenticated: Boolean(user),
                      nextPath: currentPath,
                    }}
                  />
                </li>
              ))}
            </ul>
          )}

          <Pagination
            page={filter.page}
            pageSize={SEARCH_PAGE_SIZE}
            total={result.total}
            makeHref={(page) =>
              `/properties?${filterToSearchParams({ ...filter, page }).toString()}`
            }
          />
        </section>
      </div>
    </div>
  );
}

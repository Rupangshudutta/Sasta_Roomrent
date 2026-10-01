import { Heart } from "lucide-react";
import type { Metadata } from "next";

import { ListingCard } from "@/components/listings/listing-card";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getFavoriteListings } from "@/features/favorites/queries";

export const metadata: Metadata = { title: "Saved rooms" };

export default async function FavoritesPage() {
  const favorites = await getFavoriteListings();
  const live = favorites.filter((f) => f.listing !== null);
  const gone = favorites.length - live.length;

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Saved rooms</h1>
        <p className="text-muted text-sm">
          {live.length} saved{gone > 0 ? ` · ${gone} no longer available` : ""}
        </p>
      </div>
      {live.length === 0 ? (
        <EmptyState
          Icon={Heart}
          title="Nothing saved yet"
          body="Tap the heart on any listing to keep it here for later."
          action={<ButtonLink href="/properties">Browse properties</ButtonLink>}
        />
      ) : (
        <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {live.map(({ listing, savedAt }) =>
            listing ? (
              <li key={listing.id}>
                <ListingCard
                  listing={listing}
                  favorite={{
                    saved: true,
                    isAuthenticated: true,
                    nextPath: "/dashboard/favorites",
                  }}
                />
                <p className="text-muted mt-1 text-xs">
                  Saved {new Date(savedAt).toLocaleDateString("en-IN")}
                </p>
              </li>
            ) : null,
          )}
        </ul>
      )}
    </section>
  );
}

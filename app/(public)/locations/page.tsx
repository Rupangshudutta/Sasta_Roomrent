import { MapPin } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { SectionTitle } from "@/components/layout/section-title";
import { getCityStats, getPopularLocalityStats } from "@/features/catalog/queries";
import { formatCountPlus, formatInrShort } from "@/lib/utils/format";

export const metadata: Metadata = {
  title: "Popular locations",
  description: "Find PGs, rooms and flats in India's top cities.",
};

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1920&q=70";

export default async function LocationsPage() {
  const [cities, localities] = await Promise.all([getCityStats(), getPopularLocalityStats()]);
  const localitiesByCity = new Map<number, typeof localities>();
  for (const locality of localities) {
    if (locality.city_id === null) continue;
    const list = localitiesByCity.get(locality.city_id) ?? [];
    list.push(locality);
    localitiesByCity.set(locality.city_id, list);
  }

  return (
    <>
      <section className="relative overflow-hidden rounded-b-[30px] text-white">
        <Image
          src={HERO_IMAGE}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
          aria-hidden
        />
        <div
          className="from-brand/90 to-primary/90 absolute inset-0 bg-gradient-to-br"
          aria-hidden
        />
        <div className="relative mx-auto w-full max-w-7xl px-4 py-20 text-center">
          <h1 className="text-4xl font-bold sm:text-5xl">Explore Popular Locations</h1>
          <p className="mt-4 text-lg opacity-95">
            Find your perfect stay in India&apos;s top cities
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-16">
        <SectionTitle>Top Cities</SectionTitle>
        <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {cities.map((city) => (
            <li key={city.city_id}>
              <Link
                href={`/properties?city=${city.slug}`}
                className="group rounded-card focus-visible:ring-primary block overflow-hidden bg-white shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition duration-300 hover:-translate-y-2 hover:shadow-[0_15px_40px_rgba(0,0,0,0.15)] focus-visible:ring-2 focus-visible:outline-none"
              >
                <div className="bg-surface relative h-[200px]">
                  {city.image_url ? (
                    <Image
                      src={city.image_url}
                      alt={`${city.name} skyline`}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                      className="object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : null}
                  <span className="rounded-pill text-primary absolute top-4 right-4 bg-white/95 px-3 py-1 text-sm font-semibold">
                    {formatCountPlus(city.listing_count ?? 0)} Properties
                  </span>
                </div>
                <div className="bg-gradient-to-b from-white to-[#fafafa] p-5">
                  <h3 className="text-xl font-semibold">{city.name}</h3>
                  <p className="text-muted mt-1 flex items-center gap-1 text-sm">
                    <MapPin className="h-3.5 w-3.5" aria-hidden />
                    {city.state}
                  </p>
                  <dl className="border-border mt-4 flex justify-around border-t pt-4 text-center">
                    <div>
                      <dt className="text-muted order-2 text-xs">Starting from</dt>
                      <dd className="text-primary text-lg font-bold">
                        {city.min_rent ? `${formatInrShort(city.min_rent)}+` : "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted order-2 text-xs">Avg Rating</dt>
                      <dd className="text-primary text-lg font-bold">
                        {city.avg_rating ? `${Number(city.avg_rating).toFixed(1)}★` : "New"}
                      </dd>
                    </div>
                  </dl>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-surface py-16">
        <div className="mx-auto w-full max-w-7xl px-4">
          {cities
            .filter(
              (city) =>
                city.city_id !== null && (localitiesByCity.get(city.city_id)?.length ?? 0) > 0,
            )
            .map((city) => (
              <div key={city.city_id} className="mb-12 last:mb-0">
                <SectionTitle>Popular Areas in {city.name}</SectionTitle>
                <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {(city.city_id !== null ? (localitiesByCity.get(city.city_id) ?? []) : []).map(
                    (locality) => (
                      <li key={locality.locality_id}>
                        <Link
                          href={`/properties?city=${city.slug}&q=${encodeURIComponent(locality.name ?? "")}`}
                          className="rounded-card-sm hover:bg-primary flex items-center justify-between bg-white px-5 py-4 shadow-sm transition hover:text-white"
                        >
                          <span className="font-medium">{locality.name}</span>
                          <span className="text-sm opacity-80">
                            {formatCountPlus(locality.listing_count ?? 0)} Properties
                          </span>
                        </Link>
                      </li>
                    ),
                  )}
                </ul>
              </div>
            ))}
        </div>
      </section>
    </>
  );
}

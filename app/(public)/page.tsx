import { Eye, Handshake, Home, Map, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { SectionTitle } from "@/components/layout/section-title";
import { ListingCard } from "@/components/listings/listing-card";
import { Button, ButtonLink } from "@/components/ui/button";
import { getActiveCities } from "@/features/catalog/queries";
import { getFeaturedListings } from "@/features/listings/queries";
import {
  propertyTypeLabels,
  propertyTypeShortLabels,
  rentBuckets,
  siteConfig,
} from "@/lib/config/site";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1920&q=70";

const steps = [
  {
    Icon: Search,
    color: "bg-primary",
    title: "Search",
    body: "Find your preferred location and accommodation type",
  },
  {
    Icon: Eye,
    color: "bg-secondary",
    title: "View",
    body: "Browse detailed property information and photos",
  },
  {
    Icon: Handshake,
    color: "bg-success",
    title: "Connect",
    body: "Contact property owners directly",
  },
  {
    Icon: Home,
    color: "bg-ink",
    title: "Move In",
    body: "Settle into your perfect long-term stay",
  },
] as const;

export default async function HomePage() {
  const [featured, cities] = await Promise.all([getFeaturedListings(6), getActiveCities()]);

  return (
    <>
      {/* Hero: red overlay on a photo, rounded bottom corners, as in the prototype. */}
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
        <div className="relative mx-auto w-full max-w-7xl px-4 pt-24 pb-28 text-center">
          <h1 className="text-4xl font-bold sm:text-5xl">{siteConfig.tagline}</h1>
          <p className="mt-4 text-lg opacity-95 sm:text-xl">{siteConfig.description}</p>
        </div>
      </section>

      {/* Floating search box */}
      <section className="mx-auto w-full max-w-5xl px-4">
        <form
          action="/properties"
          method="get"
          role="search"
          className="rounded-card relative z-10 -mt-14 grid gap-3 bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.1)] sm:p-7 md:grid-cols-[1fr_220px_160px]"
        >
          <label className="sr-only" htmlFor="home-q">
            Location
          </label>
          <input
            id="home-q"
            name="q"
            type="search"
            placeholder="Enter city, area, or landmark"
            list="home-cities"
            className="rounded-card-sm border-border text-ink placeholder:text-muted focus:border-primary focus:ring-primary/20 h-12 border px-4 text-sm focus:ring-2 focus:outline-none"
          />
          <datalist id="home-cities">
            {cities.map((city) => (
              <option key={city.id} value={city.name} />
            ))}
          </datalist>
          <label className="sr-only" htmlFor="home-type">
            Property type
          </label>
          <select
            id="home-type"
            name="type"
            defaultValue=""
            className="rounded-card-sm border-border text-ink focus:border-primary focus:ring-primary/20 h-12 border px-3 text-sm focus:ring-2 focus:outline-none"
          >
            <option value="">All Types</option>
            {Object.entries(propertyTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <Button type="submit" size="lg" className="rounded-card-sm h-12">
            <Search className="h-4 w-4" aria-hidden />
            Search
          </Button>
        </form>

        <nav aria-label="Quick filters" className="mt-5 flex flex-wrap justify-center gap-2">
          <Pill href="/properties">All</Pill>
          {Object.entries(propertyTypeShortLabels)
            .filter(([value]) => value !== "hostel")
            .map(([value, label]) => (
              <Pill key={value} href={`/properties?type=${value}`}>
                {label}
              </Pill>
            ))}
          {rentBuckets.map((bucket) => {
            const params = new URLSearchParams();
            if (bucket.minRent) params.set("minRent", String(bucket.minRent));
            if (bucket.maxRent) params.set("maxRent", String(bucket.maxRent));
            return (
              <Pill key={bucket.label} href={`/properties?${params.toString()}`}>
                {bucket.label}
              </Pill>
            );
          })}
        </nav>
      </section>

      {/* Featured listings */}
      <section className="mx-auto w-full max-w-7xl px-4 py-16">
        <SectionTitle>Featured Long-term Stays</SectionTitle>
        {featured.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featured.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="rounded-card border-border bg-surface border border-dashed p-10 text-center">
            <p className="text-lg font-semibold">New listings are being verified right now.</p>
            <p className="text-muted mt-2">
              Own a PG, room or flat? List it free and reach tenants directly, no brokers involved.
            </p>
            <div className="mt-5 flex justify-center gap-3">
              <ButtonLink href="/register?role=owner">List Your Property</ButtonLink>
              <ButtonLink href="/properties" variant="outline">
                Browse all properties
              </ButtonLink>
            </div>
          </div>
        )}
        {featured.length > 0 ? (
          <div className="mt-8 text-center">
            <Link href="/properties" className="text-primary font-medium hover:underline">
              View All Properties →
            </Link>
          </div>
        ) : null}
      </section>

      {/* How it works */}
      <section className="bg-surface py-16">
        <div className="mx-auto w-full max-w-7xl px-4">
          <SectionTitle align="center">How Sasta Room Works</SectionTitle>
          <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map(({ Icon, color, title, body }, index) => (
              <li key={title} className="rounded-card-sm bg-white p-6 text-center shadow-sm">
                <span
                  className={`${color} mx-auto mb-4 inline-flex h-[70px] w-[70px] items-center justify-center rounded-full text-white`}
                >
                  <Icon className="h-8 w-8" aria-hidden />
                </span>
                <h3 className="text-lg font-semibold">
                  <span className="sr-only">Step {index + 1}: </span>
                  {title}
                </h3>
                <p className="text-muted mt-2 text-sm">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Map placeholder, as in the prototype; the interactive map ships after launch. */}
      <section className="mx-auto w-full max-w-7xl px-4 py-16">
        <SectionTitle>Explore Properties on Map</SectionTitle>
        <div className="rounded-card bg-surface text-muted flex h-[300px] flex-col items-center justify-center gap-3 text-center">
          <Map className="text-primary h-12 w-12" aria-hidden />
          <p className="text-ink text-lg font-semibold">Interactive Map View</p>
          <p className="text-sm">Find properties near your preferred locations</p>
          <ButtonLink href="/locations" variant="outline" size="sm">
            Browse by location
          </ButtonLink>
        </div>
      </section>
    </>
  );
}

function Pill({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-pill border-primary/40 text-ink hover:bg-primary border bg-white px-4 py-1.5 text-sm font-medium transition hover:text-white"
    >
      {children}
    </Link>
  );
}

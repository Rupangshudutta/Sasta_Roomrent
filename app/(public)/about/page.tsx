import { Headset, IndianRupee, Lock, ShieldCheck, UserRound } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { getCityStats } from "@/features/catalog/queries";
import { getApprovedListingCount } from "@/features/listings/queries";
import { siteConfig } from "@/lib/config/site";
import { formatCountPlus } from "@/lib/utils/format";

export const metadata: Metadata = {
  title: "About us",
  description: "Why we built a broker-free, verified room rental marketplace for India.",
};

const problems = [
  "Students paying brokers ₹5,000-10,000 just to see rooms",
  "Fake listings with photos from Google",
  "Owners struggling to find genuine tenants",
  "No transparency in pricing or amenities",
];

const solutions = [
  ["Zero broker fees", "Direct connection with owners"],
  ["Admin-reviewed listings", "Every property is checked before it goes live"],
  ["Real photos", "What you see is what you get"],
  ["Transparent pricing", "No hidden charges"],
] as const;

const trust = [
  { Icon: ShieldCheck, title: "Verified Properties", body: "Every listing reviewed by our team" },
  { Icon: IndianRupee, title: "Zero Brokerage", body: "Save thousands in broker fees" },
  { Icon: Headset, title: "Real Support", body: "Real humans, real help" },
  { Icon: Lock, title: "Secure Payments", body: "Razorpay, bank-grade security" },
] as const;

const journey = [
  {
    year: String(siteConfig.foundedYear),
    title: "Started in a Bangalore PG",
    body: "Three roommates frustrated with the rental process decided to build something better.",
  },
  {
    year: "Next",
    title: "Verified listings, city by city",
    body: "Every owner is onboarded by hand and every listing is reviewed before tenants see it. Zero marketing budget, pure word-of-mouth.",
  },
  {
    year: "Today",
    title: "Growing with you",
    body: "Still growing, still improving, still focused on making renting easier for you.",
  },
] as const;

const testimonials = [
  {
    name: "Rahul Sharma",
    role: "Engineering Student, Bangalore",
    quote:
      "Saved ₹8,000 in broker fees! Found my PG in 2 days. The photos were exactly like the actual room. Highly recommend!",
  },
  {
    name: "Priya Patel",
    role: "Software Engineer, Pune",
    quote:
      "Best decision ever! Direct contact with owner, transparent pricing, and the support team actually responds. No more broker harassment.",
  },
  {
    name: "Amit Kumar",
    role: "MBA Student, Delhi",
    quote: "Found a great flat near my college. Moved in within a week!",
  },
] as const;

export default async function AboutPage() {
  const [cities, listingCount] = await Promise.all([getCityStats(), getApprovedListingCount()]);
  const activeCities = cities.filter((c) => (c.listing_count ?? 0) > 0).length;

  return (
    <>
      <section className="from-brand to-primary relative overflow-hidden bg-gradient-to-br py-20 text-white">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.08)_0,transparent_60%)]"
          aria-hidden
        />
        <div className="relative mx-auto w-full max-w-7xl px-4 text-center">
          <h1 className="text-4xl font-bold sm:text-5xl">
            Finding Your Perfect Room
            <br />
            Shouldn&apos;t Be This Hard
          </h1>
          <p className="mt-4 text-lg opacity-95 sm:text-xl">
            We&apos;re changing that. One verified property at a time.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/properties"
              className="rounded-pill text-primary hover:bg-surface bg-white px-7 py-3 font-semibold transition"
            >
              Browse Properties
            </Link>
            <Link
              href="/register"
              className="rounded-pill border border-white/80 px-7 py-3 font-semibold transition hover:bg-white/15"
            >
              Sign Up Free
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-12 px-4 py-16 md:grid-cols-2">
        <div>
          <h2 className="text-3xl font-bold">The Problem We Saw</h2>
          <p className="text-muted mt-3 text-lg">
            In {siteConfig.foundedYear}, we noticed something broken in the rental market:
          </p>
          <ul className="mt-5 space-y-3">
            {problems.map((item) => (
              <li key={item} className="flex gap-3">
                <span className="bg-primary mt-2 h-2 w-2 shrink-0 rounded-full" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-3xl font-bold">Our Solution</h2>
          <p className="text-muted mt-3 text-lg">A platform where:</p>
          <ul className="mt-5 space-y-3">
            {solutions.map(([title, body]) => (
              <li key={title} className="flex gap-3">
                <span className="bg-success mt-2 h-2 w-2 shrink-0 rounded-full" aria-hidden />
                <span>
                  <strong>{title}</strong> - {body}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-surface py-16">
        <div className="mx-auto w-full max-w-7xl px-4">
          <h2 className="mb-10 text-center text-3xl font-bold">
            Why Students &amp; Professionals Trust Us
          </h2>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {trust.map(({ Icon, title, body }) => (
              <li
                key={title}
                className="rounded-card bg-white p-6 text-center shadow-sm transition hover:-translate-y-1"
              >
                <Icon className="text-primary mx-auto h-12 w-12" aria-hidden />
                <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                <p className="text-muted mt-1 text-sm">{body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 py-16">
        <h2 className="mb-10 text-center text-3xl font-bold">Our Journey So Far</h2>
        <ol className="border-primary/30 relative space-y-8 border-l-2 pl-8">
          {journey.map((item) => (
            <li key={item.title} className="relative">
              <span
                className="bg-primary absolute top-1 -left-[41px] flex h-5 w-5 items-center justify-center rounded-full ring-4 ring-white"
                aria-hidden
              />
              <p className="text-primary text-sm font-semibold">{item.year}</p>
              <h3 className="text-xl font-semibold">{item.title}</h3>
              <p className="text-muted mt-1">{item.body}</p>
            </li>
          ))}
        </ol>
        <dl className="rounded-card bg-surface mt-12 grid grid-cols-3 gap-4 p-6 text-center">
          <div>
            <dt className="text-muted order-2 text-sm">Verified listings</dt>
            <dd className="text-primary text-3xl font-bold">{formatCountPlus(listingCount)}</dd>
          </div>
          <div>
            <dt className="text-muted order-2 text-sm">Cities live</dt>
            <dd className="text-primary text-3xl font-bold">{activeCities}</dd>
          </div>
          <div>
            <dt className="text-muted order-2 text-sm">Brokerage</dt>
            <dd className="text-primary text-3xl font-bold">₹0</dd>
          </div>
        </dl>
      </section>

      <section className="bg-surface py-16">
        <div className="mx-auto w-full max-w-7xl px-4">
          <h2 className="mb-10 text-center text-3xl font-bold">What Our Users Say</h2>
          <ul className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <li key={t.name} className="rounded-card bg-white p-7 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="bg-primary/10 text-primary flex h-12 w-12 items-center justify-center rounded-full">
                    <UserRound className="h-6 w-6" aria-hidden />
                  </span>
                  <div>
                    <p className="font-semibold">{t.name}</p>
                    <p className="text-muted text-sm">{t.role}</p>
                  </div>
                </div>
                <blockquote className="text-ink/90 mt-4">“{t.quote}”</blockquote>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="owners" className="mx-auto w-full max-w-7xl px-4 py-16">
        <div className="rounded-card from-primary/10 to-secondary/10 bg-gradient-to-br p-10 text-center">
          <h2 className="text-3xl font-bold">Own a PG, room or flat?</h2>
          <p className="text-muted mx-auto mt-3 max-w-2xl">
            Listing is free. Our team reviews every listing within 24-48 hours, and you connect with
            tenants directly: no brokers, no middlemen.
          </p>
          <Link
            href="/register?role=owner"
            className="rounded-pill bg-primary hover:bg-primary-dark mt-6 inline-block px-8 py-3 font-semibold text-white transition"
          >
            List Your Property
          </Link>
        </div>
      </section>

      <section className="bg-surface py-16">
        <div className="mx-auto w-full max-w-7xl px-4 text-center">
          <h2 className="text-3xl font-bold">Built By Real People</h2>
          <p className="text-muted mt-2">Not a faceless corporation. Just a team that cares.</p>
          <div className="rounded-card mx-auto mt-10 max-w-sm bg-white p-8 shadow-sm">
            <span className="bg-primary/10 text-primary mx-auto flex h-20 w-20 items-center justify-center rounded-full">
              <UserRound className="h-10 w-10" aria-hidden />
            </span>
            <h3 className="mt-4 text-xl font-semibold">Rupangshu Dutta</h3>
            <p className="text-muted">Founder</p>
            <p className="mt-2 text-sm">
              Started {siteConfig.name} after his own bad rental experience. Believes in simple,
              user-friendly tech and in verifying every property.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

import { Building2, CalendarCheck, CheckCircle2, Clock, Plus, Star } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ButtonLink } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { StatTile } from "@/components/ui/stat-tile";
import { BookingList } from "@/features/bookings/components/booking-list";
import { getMyBookings, getPartyNames } from "@/features/bookings/queries";
import {
  getOwnerListingCounts,
  getOwnerPendingRequestCount,
} from "@/features/listings/owner-queries";
import { getOwnerRecentReviews } from "@/features/reviews/queries";
import { getCurrentUser } from "@/lib/auth/session";
import { formatDate } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Owner dashboard" };

export default async function OwnerDashboardPage() {
  const [user, counts, pendingRequests, pending, reviews] = await Promise.all([
    getCurrentUser(),
    getOwnerListingCounts(),
    getOwnerPendingRequestCount(),
    getMyBookings("pending"),
    getOwnerRecentReviews(5),
  ]);
  const names = await getPartyNames(pending.slice(0, 5).map((b) => b.id));

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Welcome back, {user?.firstName}</h1>
          <p className="text-muted text-sm">Here is how your listings are doing.</p>
        </div>
        <ButtonLink href="/owner/properties/new">
          <Plus className="h-4 w-4" aria-hidden /> Add New Property
        </ButtonLink>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Total listings" value={counts.total} Icon={Building2} />
        <StatTile label="Live" value={counts.approved} Icon={CheckCircle2} tone="success" />
        <StatTile label="In review" value={counts.pending} Icon={Clock} tone="warning" />
        <StatTile
          label="New requests"
          value={pendingRequests}
          Icon={CalendarCheck}
          tone="secondary"
        />
      </div>

      {counts.total === 0 ? (
        <Card>
          <CardHeader
            title="Get your first listing live"
            description="Three steps, about five minutes."
          />
          <CardBody>
            <ol className="list-decimal space-y-2 pl-5 text-sm">
              <li>Fill in the property details and save.</li>
              <li>Upload at least three clear photos (cover photo first).</li>
              <li>
                Submit for review. We usually approve within 24-48 hours and notify you here and by
                email.
              </li>
            </ol>
          </CardBody>
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <Card>
          <CardHeader
            title="New booking requests"
            description="Respond quickly: tenants usually message several owners."
            action={
              <ButtonLink href="/owner/bookings" size="sm" variant="outline">
                All requests
              </ButtonLink>
            }
          />
          <CardBody>
            {pending.length === 0 ? (
              <p className="text-muted text-sm">No new requests right now.</p>
            ) : (
              <BookingList bookings={pending.slice(0, 5)} names={names} audience="owner" />
            )}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Recent reviews" />
          <CardBody className="p-0">
            {reviews.length === 0 ? (
              <p className="text-muted px-6 py-6 text-sm">
                No reviews yet. Tenants can review after their stay starts.
              </p>
            ) : (
              <ul className="divide-border/60 divide-y text-sm">
                {reviews.map((r) => (
                  <li key={r.id} className="px-6 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <Link
                        href={`/owner/properties/${r.property_id}`}
                        className="hover:text-primary line-clamp-1 font-medium"
                      >
                        {r.property?.title}
                      </Link>
                      <span className="rounded-pill bg-success inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-white">
                        {r.rating} <Star className="h-3 w-3 fill-current" aria-hidden />
                      </span>
                    </div>
                    {r.comment ? <p className="text-muted mt-1 line-clamp-2">{r.comment}</p> : null}
                    <p className="text-muted mt-1 text-xs">{formatDate(r.created_at)}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </section>
  );
}

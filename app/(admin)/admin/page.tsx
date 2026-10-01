import { Building2, CalendarCheck, Clock, Inbox, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ButtonLink } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { StatTile } from "@/components/ui/stat-tile";
import { getAdminOverview } from "@/features/admin/queries";
import { propertyTypeShortLabels } from "@/lib/config/site";
import { formatDate, formatInr } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminDashboardPage() {
  const overview = await getAdminOverview();

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin overview</h1>
        <p className="text-muted text-sm">
          Live numbers from the database. Nothing here is sample data.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Listings awaiting review"
          value={overview.listings.pending}
          Icon={Clock}
          tone="warning"
          hint="Oldest first in the queue"
        />
        <StatTile
          label="Live listings"
          value={overview.listings.approved}
          Icon={Building2}
          tone="success"
        />
        <StatTile
          label="Users"
          value={overview.users.total}
          Icon={Users}
          hint={`${overview.users.owners} owners · ${overview.users.tenants} tenants · ${overview.users.blocked} blocked`}
        />
        <StatTile
          label="Booking requests"
          value={overview.bookings.total}
          Icon={CalendarCheck}
          tone="secondary"
          hint={`${overview.bookings.pending} pending · ${overview.bookings.accepted + overview.bookings.active} accepted/active`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <Card>
          <CardHeader
            title="Review queue"
            description={
              overview.listings.pending === 0
                ? "Nothing waiting. Nice."
                : `${overview.listings.pending} listing${overview.listings.pending === 1 ? "" : "s"} waiting for a decision`
            }
            action={
              <ButtonLink href="/admin/listings" size="sm" variant="outline">
                Open queue
              </ButtonLink>
            }
          />
          <CardBody className="p-0">
            {overview.queuePreview.length === 0 ? (
              <p className="text-muted px-6 py-8 text-center text-sm">
                New submissions will appear here.
              </p>
            ) : (
              <ul className="divide-border/60 divide-y">
                {overview.queuePreview.map((listing) => (
                  <li
                    key={listing.id}
                    className="flex items-center justify-between gap-4 px-6 py-3 text-sm"
                  >
                    <div className="min-w-0">
                      <Link
                        href={`/admin/listings/${listing.id}`}
                        className="hover:text-primary font-medium"
                      >
                        {listing.title}
                      </Link>
                      <p className="text-muted truncate text-xs">
                        {propertyTypeShortLabels[listing.property_type]} · {listing.locality},{" "}
                        {listing.city?.name} · {formatInr(listing.rent_amount)}/mo ·{" "}
                        {listing.owner
                          ? `${listing.owner.first_name} ${listing.owner.last_name}`
                          : "—"}
                      </p>
                    </div>
                    <span className="text-muted shrink-0 text-xs">
                      {listing.submitted_at ? formatDate(listing.submitted_at) : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader
              title="Contact inbox"
              description={
                overview.unreadMessages === 0
                  ? "All messages handled"
                  : `${overview.unreadMessages} unread`
              }
              action={
                <ButtonLink href="/admin/messages" size="sm" variant="outline">
                  <Inbox className="h-4 w-4" aria-hidden /> Open
                </ButtonLink>
              }
            />
          </Card>
          <Card>
            <CardHeader
              title="Newest users"
              action={
                <ButtonLink href="/admin/users" size="sm" variant="outline">
                  All users
                </ButtonLink>
              }
            />
            <CardBody className="p-0">
              <ul className="divide-border/60 divide-y text-sm">
                {overview.recentUsers.map((u) => (
                  <li key={u.id} className="flex items-center justify-between px-6 py-2.5">
                    <span>
                      {u.first_name} {u.last_name}{" "}
                      <span className="text-muted text-xs">· {u.role}</span>
                    </span>
                    <span className="text-muted text-xs">{formatDate(u.created_at)}</span>
                  </li>
                ))}
                {overview.recentUsers.length === 0 ? (
                  <li className="text-muted px-6 py-4">No users yet.</li>
                ) : null}
              </ul>
            </CardBody>
          </Card>
        </div>
      </div>
    </section>
  );
}

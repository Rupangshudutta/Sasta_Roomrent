import { Bell, CalendarCheck, CheckCircle2, Heart, Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ButtonLink } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { StatTile } from "@/components/ui/stat-tile";
import { BookingList } from "@/features/bookings/components/booking-list";
import { getMyBookingCounts, getMyBookings, getPartyNames } from "@/features/bookings/queries";
import { getFavoriteIds } from "@/features/favorites/queries";
import { getNotifications, getUnreadNotificationCount } from "@/features/notifications/queries";
import { getCurrentUser } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Dashboard" };

export default async function TenantDashboardPage() {
  const [user, counts, favorites, unread, recent, activity] = await Promise.all([
    getCurrentUser(),
    getMyBookingCounts(),
    getFavoriteIds(),
    getUnreadNotificationCount(),
    getMyBookings("open"),
    getNotifications(5),
  ]);
  const names = await getPartyNames(recent.slice(0, 3).map((b) => b.id));

  const quickActions = [
    {
      href: "/properties",
      Icon: Search,
      title: "Search Properties",
      body: "Find your perfect stay",
    },
    {
      href: "/dashboard/favorites",
      Icon: Heart,
      title: "My Favorites",
      body: `${favorites.size} saved propert${favorites.size === 1 ? "y" : "ies"}`,
    },
    {
      href: "/dashboard/bookings",
      Icon: CalendarCheck,
      title: "My Requests",
      body: `${counts.pending} waiting · ${counts.accepted + counts.active} accepted`,
    },
    {
      href: "/notifications",
      Icon: Bell,
      title: "Notifications",
      body: unread > 0 ? `${unread} unread` : "All caught up",
    },
  ] as const;

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Welcome, {user?.firstName}</h1>
        <p className="text-muted text-sm">Everything about your room search in one place.</p>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {quickActions.map(({ href, Icon, title, body }) => (
          <li key={href}>
            <Link
              href={href}
              className="rounded-card border-border/60 hover:border-primary/40 flex h-full items-center gap-4 border bg-white p-5 shadow-[0_4px_16px_rgba(0,0,0,0.04)] transition hover:-translate-y-0.5"
            >
              <span className="bg-primary/10 text-primary flex h-12 w-12 shrink-0 items-center justify-center rounded-full">
                <Icon className="h-6 w-6" aria-hidden />
              </span>
              <span>
                <span className="block font-semibold">{title}</span>
                <span className="text-muted block text-sm">{body}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Saved rooms" value={favorites.size} Icon={Heart} />
        <StatTile
          label="Open requests"
          value={counts.pending + counts.accepted + counts.active}
          Icon={CalendarCheck}
          tone="warning"
        />
        <StatTile
          label="Accepted"
          value={counts.accepted + counts.active + counts.completed}
          Icon={CheckCircle2}
          tone="success"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <Card>
          <CardHeader
            title="Open requests"
            action={
              <ButtonLink href="/dashboard/bookings" size="sm" variant="outline">
                All requests
              </ButtonLink>
            }
          />
          <CardBody>
            {recent.length === 0 ? (
              <p className="text-muted text-sm">
                No open requests.{" "}
                <Link href="/properties" className="text-primary hover:underline">
                  Search properties
                </Link>{" "}
                to send your first one.
              </p>
            ) : (
              <BookingList bookings={recent.slice(0, 3)} names={names} audience="tenant" />
            )}
          </CardBody>
        </Card>
        <Card>
          <CardHeader
            title="Recent activity"
            action={
              <ButtonLink href="/notifications" size="sm" variant="outline">
                All
              </ButtonLink>
            }
          />
          <CardBody className="p-0">
            {activity.length === 0 ? (
              <p className="text-muted px-6 py-6 text-sm">
                Nothing yet. Updates about your requests appear here.
              </p>
            ) : (
              <ul className="divide-border/60 divide-y text-sm">
                {activity.map((n) => (
                  <li key={n.id} className="px-6 py-3">
                    <Link
                      href={n.href ?? "/notifications"}
                      className="hover:text-primary font-medium"
                    >
                      {n.title}
                    </Link>
                    <p className="text-muted text-xs">{formatDateTime(n.created_at)}</p>
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

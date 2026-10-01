import { CalendarCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { BookingList } from "@/features/bookings/components/booking-list";
import {
  getMyBookingCounts,
  getMyBookings,
  getPartyNames,
  type BookingStatus,
} from "@/features/bookings/queries";
import { cn } from "@/lib/utils/cn";

export const metadata: Metadata = { title: "My requests" };

const tabs: ReadonlyArray<{ value: "open" | BookingStatus | "all"; label: string }> = [
  { value: "open", label: "Open" },
  { value: "pending", label: "Waiting" },
  { value: "accepted", label: "Accepted" },
  { value: "active", label: "Moved in" },
  { value: "completed", label: "Completed" },
  { value: "all", label: "All" },
];

export default async function TenantBookingsPage({
  searchParams,
}: PageProps<"/dashboard/bookings">) {
  const raw = await searchParams;
  const tab = tabs.find((t) => t.value === raw.status)?.value ?? "open";
  const [bookings, counts] = await Promise.all([
    getMyBookings(tab === "all" ? undefined : tab),
    getMyBookingCounts(),
  ]);
  const names = await getPartyNames(bookings.map((b) => b.id));

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My requests</h1>
        <p className="text-muted text-sm">
          {counts.total} request{counts.total === 1 ? "" : "s"} · {counts.pending} waiting ·{" "}
          {counts.accepted + counts.active} accepted
        </p>
      </div>
      <nav aria-label="Filter" className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Link
            key={t.value}
            href={
              t.value === "open" ? "/dashboard/bookings" : `/dashboard/bookings?status=${t.value}`
            }
            className={cn(
              "rounded-pill border px-3.5 py-1.5 text-sm font-medium",
              tab === t.value
                ? "border-primary bg-primary text-white"
                : "border-border hover:border-primary/50 bg-white",
            )}
          >
            {t.label}
          </Link>
        ))}
      </nav>
      {bookings.length === 0 ? (
        <EmptyState
          Icon={CalendarCheck}
          title={tab === "open" ? "No open requests" : "Nothing here"}
          body="Start exploring properties to make your first booking request."
          action={<ButtonLink href="/properties">Search Properties</ButtonLink>}
        />
      ) : (
        <BookingList bookings={bookings} names={names} audience="tenant" />
      )}
    </section>
  );
}

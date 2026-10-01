import { CalendarCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import { BookingList } from "@/features/bookings/components/booking-list";
import {
  getMyBookingCounts,
  getMyBookings,
  getPartyNames,
  type BookingStatus,
} from "@/features/bookings/queries";
import { cn } from "@/lib/utils/cn";

export const metadata: Metadata = { title: "Booking requests" };

const tabs: ReadonlyArray<{ value: "all" | BookingStatus; label: string }> = [
  { value: "pending", label: "New" },
  { value: "accepted", label: "Accepted" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "all", label: "All" },
];

export default async function OwnerBookingsPage({ searchParams }: PageProps<"/owner/bookings">) {
  const raw = await searchParams;
  const tab = tabs.find((t) => t.value === raw.status)?.value ?? "pending";
  const [bookings, counts] = await Promise.all([
    getMyBookings(tab === "all" ? undefined : tab),
    getMyBookingCounts(),
  ]);
  const names = await getPartyNames(bookings.map((b) => b.id));

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Booking requests</h1>
        <p className="text-muted text-sm">
          {counts.pending} new · {counts.accepted} accepted · {counts.active} active ·{" "}
          {counts.total} total. You see each tenant&apos;s phone and email on the request; they see
          yours once you accept.
        </p>
      </div>
      <nav aria-label="Filter" className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Link
            key={t.value}
            href={t.value === "pending" ? "/owner/bookings" : `/owner/bookings?status=${t.value}`}
            className={cn(
              "rounded-pill border px-3.5 py-1.5 text-sm font-medium",
              tab === t.value
                ? "border-primary bg-primary text-white"
                : "border-border hover:border-primary/50 bg-white",
            )}
          >
            {t.label}{" "}
            {t.value !== "all" ? (
              <span className={tab === t.value ? "opacity-80" : "text-muted"}>
                ({counts[t.value]})
              </span>
            ) : null}
          </Link>
        ))}
      </nav>
      {bookings.length === 0 ? (
        <EmptyState
          Icon={CalendarCheck}
          title={tab === "pending" ? "No new requests" : "Nothing here"}
          body="Requests from tenants appear here the moment they are sent, with their contact details."
        />
      ) : (
        <BookingList bookings={bookings} names={names} audience="owner" />
      )}
    </section>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Alert } from "@/components/ui/alert";
import { BookingDetail } from "@/features/bookings/components/booking-detail";
import { getBookingById, getBookingContacts, getPartyNames } from "@/features/bookings/queries";

export const metadata: Metadata = { title: "Booking request" };

export default async function TenantBookingDetailPage({
  params,
  searchParams,
}: PageProps<"/dashboard/bookings/[id]">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const booking = await getBookingById(id);
  if (!booking) notFound();
  const [names, contacts] = await Promise.all([
    getPartyNames([booking.id]),
    getBookingContacts(booking.id),
  ]);

  return (
    <section className="space-y-6">
      <div>
        <Link href="/dashboard/bookings" className="text-muted hover:text-ink text-sm">
          ← My requests
        </Link>
        <h1 className="mt-1 text-2xl font-bold">Booking request</h1>
      </div>
      {query.requested === "1" ? (
        <Alert tone="success" title="Request sent">
          The owner has been notified. You will get an email and an in-app notification when they
          respond; most owners reply within a day.
        </Alert>
      ) : null}
      {query.reviewed === "1" ? (
        <Alert tone="success">Thanks! Your review is live on the listing.</Alert>
      ) : null}
      <BookingDetail
        booking={booking}
        names={names.get(booking.id)}
        contacts={contacts}
        audience="tenant"
      />
    </section>
  );
}

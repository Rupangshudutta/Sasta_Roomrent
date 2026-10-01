import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BookingDetail } from "@/features/bookings/components/booking-detail";
import { getPlatformSettings } from "@/features/catalog/queries";
import { PaymentPanel } from "@/features/payments/components/payment-panel";
import { getPaymentsForBooking } from "@/features/payments/queries";
import { paymentsAvailable } from "@/lib/razorpay/client";
import { getBookingById, getBookingContacts, getPartyNames } from "@/features/bookings/queries";

export const metadata: Metadata = { title: "Booking request" };

export default async function OwnerBookingDetailPage({
  params,
}: PageProps<"/owner/bookings/[id]">) {
  const { id } = await params;
  const booking = await getBookingById(id);
  if (!booking) notFound();
  const [names, contacts, payments, settings] = await Promise.all([
    getPartyNames([booking.id]),
    getBookingContacts(booking.id),
    getPaymentsForBooking(booking.id),
    getPlatformSettings(),
  ]);

  return (
    <section className="space-y-6">
      <div>
        <Link href="/owner/bookings" className="text-muted hover:text-ink text-sm">
          ← Booking requests
        </Link>
        <h1 className="mt-1 text-2xl font-bold">Booking request</h1>
      </div>
      <BookingDetail
        booking={booking}
        names={names.get(booking.id)}
        contacts={contacts}
        audience="owner"
      />
      <PaymentPanel
        bookingId={booking.id}
        bookingStatus={booking.status}
        audience="owner"
        payments={payments}
        paymentsEnabled={paymentsAvailable()}
        tokenAmount={Number(settings.booking_token_amount)}
      />
    </section>
  );
}

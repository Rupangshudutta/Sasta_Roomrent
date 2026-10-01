import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Alert } from "@/components/ui/alert";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { getBookingById } from "@/features/bookings/queries";
import { ReviewForm } from "@/features/reviews/components/review-form";
import { getMyReviewForBooking } from "@/features/reviews/queries";

export const metadata: Metadata = { title: "Write a review" };

export default async function ReviewPage({ params }: PageProps<"/dashboard/bookings/[id]/review">) {
  const { id } = await params;
  const booking = await getBookingById(id);
  if (!booking) notFound();
  const existing = await getMyReviewForBooking(id);
  const eligible = booking.status === "active" || booking.status === "completed";

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href={`/dashboard/bookings/${id}`} className="text-muted hover:text-ink text-sm">
          ← Back to request
        </Link>
        <h1 className="mt-1 text-2xl font-bold">
          {existing ? "Edit your review" : "Write a review"}
        </h1>
        <p className="text-muted text-sm">{booking.property?.title}</p>
      </div>
      {!eligible ? (
        <Alert tone="info">You can review this place once your stay is active or completed.</Alert>
      ) : (
        <Card>
          <CardHeader
            title="How was your stay?"
            description="Only tenants who actually stayed can review, so your words carry weight."
          />
          <CardBody>
            <ReviewForm bookingId={id} existing={existing} />
          </CardBody>
        </Card>
      )}
    </section>
  );
}

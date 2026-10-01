import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { Alert } from "@/components/ui/alert";
import { ButtonLink } from "@/components/ui/button";
import { RequestForm } from "@/features/bookings/components/request-form";
import { getOpenRequestFor } from "@/features/bookings/queries";
import { getPublicListing } from "@/features/search/queries";
import { getCurrentUser } from "@/lib/auth/session";
import { propertyTypeLabels } from "@/lib/config/site";
import { formatInr } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Request to book" };

export default async function RequestBookingPage({
  params,
}: PageProps<"/properties/[id]/request">) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/properties/${id}/request`)}`);

  const listing = await getPublicListing(id);
  if (!listing) notFound();

  const blocked =
    user.role === "owner" && user.id === listing.owner_id
      ? "This is your own listing."
      : user.role === "owner"
        ? "Owner accounts cannot send booking requests. Sign in with a tenant account."
        : user.role === "admin"
          ? "Admin accounts cannot send booking requests."
          : listing.status !== "approved"
            ? "This listing is not live."
            : listing.available_rooms <= 0
              ? "No rooms are available right now."
              : null;

  const existing = blocked ? null : await getOpenRequestFor(listing.id);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <Link href={`/properties/${listing.id}`} className="text-muted hover:text-ink text-sm">
        ← Back to listing
      </Link>
      <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Request to book</h1>
      <p className="text-muted mt-1">
        {propertyTypeLabels[listing.property_type]} · {listing.title} ·{" "}
        {formatInr(listing.rent_amount)}/month
      </p>

      <div className="mt-6">
        {blocked ? (
          <Alert tone="info">{blocked}</Alert>
        ) : existing ? (
          <Alert tone="info" title="You already have an open request for this listing">
            Status: {existing.status}.{" "}
            <Link
              href={`/dashboard/bookings/${existing.id}`}
              className="text-primary font-medium hover:underline"
            >
              Open it
            </Link>
            .
          </Alert>
        ) : (
          <div className="rounded-card border-border/60 border bg-white p-6 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
            <Alert tone="info" className="mb-5">
              Sending a request is free and not a commitment. The owner sees your name, phone and
              email and decides; if they accept, you get their contact details to arrange a visit.
            </Alert>
            <RequestForm
              propertyId={listing.id}
              rent={Number(listing.rent_amount)}
              deposit={Number(listing.security_deposit)}
              minLeaseMonths={listing.min_lease_months}
              availableFrom={listing.available_from}
            />
          </div>
        )}
        {blocked && user.role === "owner" && user.id !== listing.owner_id ? (
          <div className="mt-4">
            <ButtonLink href="/register" variant="outline">
              Create a tenant account
            </ButtonLink>
          </div>
        ) : null}
      </div>
    </div>
  );
}

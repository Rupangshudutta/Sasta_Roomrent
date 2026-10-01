import { CalendarDays, Lock, Mail, MapPin, Phone, UserRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Alert } from "@/components/ui/alert";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import type { BookingContact, BookingWithProperty, PartyNames } from "@/features/bookings/queries";
import { propertyTypeLabels } from "@/lib/config/site";
import { primaryPhotoPath, propertyPhotoUrl } from "@/lib/supabase/storage";
import { formatDate, formatDateTime, formatInr } from "@/lib/utils/format";

import { BookingStatusBadge, bookingStatusMeta } from "./booking-status";
import { DecisionForm } from "./decision-form";

type Props = {
  booking: BookingWithProperty;
  names: PartyNames | undefined;
  contacts: BookingContact[];
  audience: "tenant" | "owner";
};

const steps = ["pending", "accepted", "active", "completed"] as const;

/** Shared detail layout for tenant and owner; only the audience-specific copy differs. */
export function BookingDetail({ booking, names, contacts, audience }: Props) {
  const meta = bookingStatusMeta[booking.status];
  const cover = booking.property ? primaryPhotoPath(booking.property.photos) : null;
  const counterpartContact = contacts.find(
    (c) => c.party === (audience === "tenant" ? "owner" : "tenant"),
  );
  const counterpartName =
    audience === "tenant"
      ? names
        ? `${names.owner_first_name} ${names.owner_last_name ?? ""}`.trim()
        : "Owner"
      : names
        ? `${names.tenant_first_name} ${names.tenant_last_name ?? ""}`.trim()
        : "Tenant";
  const stepIndex = steps.indexOf(booking.status as (typeof steps)[number]);
  const terminal = booking.status === "rejected" || booking.status === "cancelled";

  return (
    <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
      <div className="space-y-6">
        <Card>
          <CardBody className="flex gap-4">
            <div className="rounded-card-sm bg-surface relative h-28 w-40 shrink-0 overflow-hidden">
              {cover ? (
                <Image
                  src={propertyPhotoUrl(cover)}
                  alt=""
                  fill
                  sizes="160px"
                  className="object-cover"
                />
              ) : null}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold">
                  {booking.property ? (
                    <Link
                      href={`/properties/${booking.property.id}`}
                      className="hover:text-primary"
                    >
                      {booking.property.title}
                    </Link>
                  ) : (
                    "Listing unavailable"
                  )}
                </h2>
                <BookingStatusBadge status={booking.status} audience={audience} />
              </div>
              {booking.property ? (
                <p className="text-muted mt-1 flex items-center gap-1 text-sm">
                  <MapPin className="h-3.5 w-3.5" aria-hidden />
                  {propertyTypeLabels[booking.property.property_type]} · {booking.property.locality}
                  , {booking.property.city?.name}
                </p>
              ) : null}
              <p className="text-muted mt-2 text-sm">{meta.help}</p>
            </div>
          </CardBody>
        </Card>

        {!terminal ? (
          <ol className="grid grid-cols-4 gap-2 text-center text-xs">
            {steps.map((s, i) => (
              <li
                key={s}
                className={`rounded-card-sm border px-2 py-2 ${i <= stepIndex ? "border-primary bg-primary/5 text-primary font-medium" : "border-border text-muted"}`}
              >
                {bookingStatusMeta[s][audience]}
              </li>
            ))}
          </ol>
        ) : null}

        <Card>
          <CardHeader title="Request details" />
          <CardBody>
            <dl className="grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
              <Row
                label="Move-in date"
                value={formatDate(booking.move_in_date)}
                Icon={CalendarDays}
              />
              <Row
                label="Length of stay"
                value={`${booking.lease_months} month${booking.lease_months === 1 ? "" : "s"}`}
              />
              <Row
                label="Monthly rent (locked at request)"
                value={formatInr(booking.monthly_rent)}
              />
              <Row label="Security deposit" value={formatInr(booking.security_deposit)} />
              <Row label="Estimated total" value={formatInr(booking.total_amount)} />
              <Row label="Requested" value={formatDateTime(booking.created_at)} />
              {booking.decided_at ? (
                <Row label="Decided" value={formatDateTime(booking.decided_at)} />
              ) : null}
            </dl>
            {booking.message ? (
              <div className="mt-4">
                <p className="text-muted text-xs font-medium tracking-wide uppercase">
                  {audience === "tenant" ? "Your message" : "Tenant's message"}
                </p>
                <p className="rounded-card-sm bg-surface mt-1 p-3 text-sm whitespace-pre-wrap">
                  {booking.message}
                </p>
              </div>
            ) : null}
            {booking.owner_note ? (
              <div className="mt-4">
                <p className="text-muted text-xs font-medium tracking-wide uppercase">
                  Note from the owner
                </p>
                <p className="rounded-card-sm bg-surface mt-1 p-3 text-sm whitespace-pre-wrap">
                  {booking.owner_note}
                </p>
              </div>
            ) : null}
            {booking.cancel_reason ? (
              <Alert tone="info" className="mt-4">
                Cancellation reason: {booking.cancel_reason}
              </Alert>
            ) : null}
          </CardBody>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader title={audience === "tenant" ? "Owner contact" : "Tenant contact"} />
          <CardBody className="space-y-3 text-sm">
            <p className="flex items-center gap-2 font-medium">
              <UserRound className="text-primary h-4 w-4" aria-hidden />
              {counterpartName}
            </p>
            {counterpartContact ? (
              <>
                {counterpartContact.phone ? (
                  <a
                    href={`tel:+91${counterpartContact.phone}`}
                    className="text-primary flex items-center gap-2 hover:underline"
                  >
                    <Phone className="h-4 w-4" aria-hidden />
                    {counterpartContact.phone}
                  </a>
                ) : (
                  <p className="text-muted">No phone on file</p>
                )}
                {counterpartContact.email ? (
                  <a
                    href={`mailto:${counterpartContact.email}`}
                    className="text-primary flex items-center gap-2 break-all hover:underline"
                  >
                    <Mail className="h-4 w-4" aria-hidden />
                    {counterpartContact.email}
                  </a>
                ) : null}
                {counterpartContact.phone ? (
                  <a
                    href={`https://wa.me/91${counterpartContact.phone}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-pill bg-success inline-block px-4 py-1.5 text-xs font-semibold text-white"
                  >
                    WhatsApp
                  </a>
                ) : null}
                <p className="text-muted text-xs">
                  Use these details only to arrange this tenancy. Never pay a deposit before
                  visiting.
                </p>
              </>
            ) : (
              <p className="text-muted flex items-start gap-2">
                <Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                {audience === "tenant"
                  ? "The owner's phone and email appear here as soon as they accept your request."
                  : "Contact details unavailable."}
              </p>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Actions" />
          <CardBody>
            <DecisionForm bookingId={booking.id} status={booking.status} audience={audience} />
            {(booking.status === "completed" || booking.status === "active") &&
            audience === "tenant" ? (
              <Link
                href={`/dashboard/bookings/${booking.id}/review`}
                className="rounded-pill bg-primary hover:bg-primary-dark mt-3 inline-block px-5 py-2 text-sm font-semibold text-white"
              >
                Write a review
              </Link>
            ) : null}
            {booking.status === "rejected" && audience === "tenant" ? (
              <Link href="/properties" className="text-primary text-sm font-medium hover:underline">
                Find another room →
              </Link>
            ) : null}
            {booking.status === "completed" && audience === "owner" ? (
              <p className="text-muted text-sm">Nothing left to do. The room is available again.</p>
            ) : null}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value, Icon }: { label: string; value: string; Icon?: typeof CalendarDays }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-muted text-xs font-medium tracking-wide uppercase">{label}</dt>
      <dd className="inline-flex items-center gap-1">
        {Icon ? <Icon className="text-muted h-3.5 w-3.5" aria-hidden /> : null}
        {value}
      </dd>
    </div>
  );
}

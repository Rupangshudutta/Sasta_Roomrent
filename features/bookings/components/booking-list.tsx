import { CalendarDays, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import type { BookingWithProperty, PartyNames } from "@/features/bookings/queries";
import { propertyTypeShortLabels } from "@/lib/config/site";
import { primaryPhotoPath, propertyPhotoUrl } from "@/lib/supabase/storage";
import { formatDate, formatInr } from "@/lib/utils/format";

import { BookingStatusBadge } from "./booking-status";

export function BookingList({
  bookings,
  names,
  audience,
}: {
  bookings: BookingWithProperty[];
  names: Map<string, PartyNames>;
  audience: "tenant" | "owner";
}) {
  const base = audience === "tenant" ? "/dashboard/bookings" : "/owner/bookings";
  return (
    <ul className="space-y-3">
      {bookings.map((b) => {
        const cover = b.property ? primaryPhotoPath(b.property.photos) : null;
        const party = names.get(b.id);
        const counterpart =
          audience === "tenant"
            ? party
              ? `${party.owner_first_name} ${party.owner_last_name ?? ""}`.trim()
              : "Owner"
            : party
              ? `${party.tenant_first_name} ${party.tenant_last_name ?? ""}`.trim()
              : "Tenant";
        return (
          <li
            key={b.id}
            className="rounded-card border-border/60 flex gap-4 border bg-white p-4 shadow-[0_4px_16px_rgba(0,0,0,0.04)]"
          >
            <Link
              href={`${base}/${b.id}`}
              className="rounded-card-sm bg-surface relative hidden h-24 w-32 shrink-0 overflow-hidden sm:block"
            >
              {cover ? (
                <Image
                  src={propertyPhotoUrl(cover)}
                  alt=""
                  fill
                  sizes="128px"
                  className="object-cover"
                />
              ) : null}
            </Link>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <Link
                    href={`${base}/${b.id}`}
                    className="hover:text-primary line-clamp-1 font-semibold"
                  >
                    {b.property?.title ?? "Listing unavailable"}
                  </Link>
                  <p className="text-muted flex items-center gap-1 text-xs">
                    <MapPin className="h-3 w-3" aria-hidden />
                    {b.property
                      ? `${propertyTypeShortLabels[b.property.property_type]} · ${b.property.locality}, ${b.property.city?.name}`
                      : ""}
                  </p>
                </div>
                <BookingStatusBadge status={b.status} audience={audience} />
              </div>
              <dl className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm">
                <div className="inline-flex items-center gap-1">
                  <CalendarDays className="text-muted h-3.5 w-3.5" aria-hidden />
                  <dt className="sr-only">Move-in</dt>
                  <dd>{formatDate(b.move_in_date)}</dd>
                </div>
                <div>
                  <dt className="text-muted inline">Stay: </dt>
                  <dd className="inline">{b.lease_months} mo</dd>
                </div>
                <div>
                  <dt className="text-muted inline">Rent: </dt>
                  <dd className="inline font-medium">{formatInr(b.monthly_rent)}/mo</dd>
                </div>
                <div>
                  <dt className="text-muted inline">
                    {audience === "tenant" ? "Owner: " : "Tenant: "}
                  </dt>
                  <dd className="inline">{counterpart}</dd>
                </div>
              </dl>
              <p className="text-muted mt-1 text-xs">Requested {formatDate(b.created_at)}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

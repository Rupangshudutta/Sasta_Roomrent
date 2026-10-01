import { Building2, CalendarCheck, CheckCircle2, Clock, Plus } from "lucide-react";
import type { Metadata } from "next";

import { ButtonLink } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { StatTile } from "@/components/ui/stat-tile";
import {
  getOwnerListingCounts,
  getOwnerPendingRequestCount,
} from "@/features/listings/owner-queries";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Owner dashboard" };

export default async function OwnerDashboardPage() {
  const [user, counts, pendingRequests] = await Promise.all([
    getCurrentUser(),
    getOwnerListingCounts(),
    getOwnerPendingRequestCount(),
  ]);

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Welcome back, {user?.firstName}</h1>
          <p className="text-muted text-sm">Here is how your listings are doing.</p>
        </div>
        <ButtonLink href="/owner/properties/new">
          <Plus className="h-4 w-4" aria-hidden /> Add New Property
        </ButtonLink>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Total listings" value={counts.total} Icon={Building2} />
        <StatTile label="Live" value={counts.approved} Icon={CheckCircle2} tone="success" />
        <StatTile label="In review" value={counts.pending} Icon={Clock} tone="warning" />
        <StatTile
          label="Pending requests"
          value={pendingRequests}
          Icon={CalendarCheck}
          tone="secondary"
        />
      </div>

      {counts.total === 0 ? (
        <Card>
          <CardHeader
            title="Get your first listing live"
            description="Three steps, about five minutes."
          />
          <CardBody>
            <ol className="list-decimal space-y-2 pl-5 text-sm">
              <li>Fill in the property details and save.</li>
              <li>Upload at least three clear photos (cover photo first).</li>
              <li>
                Submit for review. We usually approve within 24-48 hours and notify you here and by
                email.
              </li>
            </ol>
          </CardBody>
        </Card>
      ) : null}
    </section>
  );
}

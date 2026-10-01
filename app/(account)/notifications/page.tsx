import type { Metadata } from "next";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { NotificationList } from "@/features/notifications/components/notification-list";
import { getNotifications } from "@/features/notifications/queries";
import { requireRole } from "@/lib/auth/require-role";

export const metadata: Metadata = { title: "Notifications" };

/** One notifications page for every role; the shell shows that role's navigation. */
export default async function NotificationsPage() {
  const user = await requireRole(["tenant", "owner", "admin"], "/notifications");
  const notifications = await getNotifications(50);
  return (
    <DashboardShell user={user}>
      <section className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-muted text-sm">
            Listing decisions, booking updates and reviews, newest first.
          </p>
        </div>
        <NotificationList notifications={notifications} />
      </section>
    </DashboardShell>
  );
}

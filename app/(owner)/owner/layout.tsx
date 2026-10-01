import { Building2, CalendarCheck, LayoutDashboard, PlusCircle, UserRound } from "lucide-react";
import type { ReactNode } from "react";

import { DashboardShell, type NavItem } from "@/components/layout/dashboard-shell";
import { requireRole } from "@/lib/auth/require-role";

const nav: readonly NavItem[] = [
  { href: "/owner", label: "Overview", Icon: LayoutDashboard },
  { href: "/owner/properties", label: "My listings", Icon: Building2 },
  { href: "/owner/properties/new", label: "Add listing", Icon: PlusCircle },
  { href: "/owner/bookings", label: "Booking requests", Icon: CalendarCheck },
  { href: "/owner/profile", label: "Profile", Icon: UserRound },
];

export default async function OwnerLayout({ children }: { children: ReactNode }) {
  const user = await requireRole(["owner"], "/owner");
  return (
    <DashboardShell user={user} areaLabel="Owner" nav={nav}>
      {children}
    </DashboardShell>
  );
}

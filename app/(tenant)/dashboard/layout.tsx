import { CalendarCheck, Heart, LayoutDashboard, UserRound } from "lucide-react";
import type { ReactNode } from "react";

import { DashboardShell, type NavItem } from "@/components/layout/dashboard-shell";
import { requireRole } from "@/lib/auth/require-role";

const nav: readonly NavItem[] = [
  { href: "/dashboard", label: "Overview", Icon: LayoutDashboard },
  { href: "/dashboard/bookings", label: "My requests", Icon: CalendarCheck },
  { href: "/dashboard/favorites", label: "Saved rooms", Icon: Heart },
  { href: "/dashboard/profile", label: "Profile", Icon: UserRound },
];

export default async function TenantLayout({ children }: { children: ReactNode }) {
  const user = await requireRole(["tenant"], "/dashboard");
  return (
    <DashboardShell user={user} areaLabel="Tenant" nav={nav}>
      {children}
    </DashboardShell>
  );
}

import { Building2, Inbox, LayoutDashboard, Users } from "lucide-react";
import type { ReactNode } from "react";

import { DashboardShell, type NavItem } from "@/components/layout/dashboard-shell";
import { requireRole } from "@/lib/auth/require-role";

const nav: readonly NavItem[] = [
  { href: "/admin", label: "Overview", Icon: LayoutDashboard },
  { href: "/admin/listings", label: "Listings review", Icon: Building2 },
  { href: "/admin/users", label: "Users", Icon: Users },
  { href: "/admin/messages", label: "Contact inbox", Icon: Inbox },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requireRole(["admin"], "/admin");
  return (
    <DashboardShell user={user} areaLabel="Admin" nav={nav}>
      {children}
    </DashboardShell>
  );
}

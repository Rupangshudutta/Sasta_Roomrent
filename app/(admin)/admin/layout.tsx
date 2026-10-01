import type { ReactNode } from "react";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { requireRole } from "@/lib/auth/require-role";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requireRole(["admin"], "/admin");
  return (
    <DashboardShell user={user} area="admin">
      {children}
    </DashboardShell>
  );
}

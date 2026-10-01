import type { ReactNode } from "react";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { requireRole } from "@/lib/auth/require-role";

export default async function TenantLayout({ children }: { children: ReactNode }) {
  const user = await requireRole(["tenant"], "/dashboard");
  return (
    <DashboardShell user={user} area="tenant">
      {children}
    </DashboardShell>
  );
}

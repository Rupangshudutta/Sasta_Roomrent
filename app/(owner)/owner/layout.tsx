import type { ReactNode } from "react";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { requireRole } from "@/lib/auth/require-role";

export default async function OwnerLayout({ children }: { children: ReactNode }) {
  const user = await requireRole(["owner"], "/owner");
  return (
    <DashboardShell user={user} area="owner">
      {children}
    </DashboardShell>
  );
}

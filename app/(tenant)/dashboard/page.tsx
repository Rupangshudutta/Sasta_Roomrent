import type { Metadata } from "next";

import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Dashboard" };

export default async function TenantDashboardPage() {
  const user = await getCurrentUser();
  return (
    <section className="space-y-2">
      <h1 className="text-2xl font-bold">Welcome, {user?.firstName}</h1>
      <p className="text-muted">Your requests, saved rooms and profile will appear here.</p>
    </section>
  );
}

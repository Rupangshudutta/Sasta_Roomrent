import type { Metadata } from "next";

import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Owner dashboard" };

export default async function OwnerDashboardPage() {
  const user = await getCurrentUser();
  return (
    <section className="space-y-2">
      <h1 className="text-2xl font-bold">Welcome, {user?.firstName}</h1>
      <p className="text-muted">Your listings, booking requests and earnings will appear here.</p>
    </section>
  );
}

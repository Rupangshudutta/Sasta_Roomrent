import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin" };

export default function AdminDashboardPage() {
  return (
    <section className="space-y-2">
      <h1 className="text-2xl font-bold">Admin overview</h1>
      <p className="text-muted">Moderation queue, users and the contact inbox will appear here.</p>
    </section>
  );
}

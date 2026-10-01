import { CreditCard } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { getMyPayments } from "@/features/payments/queries";
import { formatDateTime, formatInr } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Payments" };

const tone = { created: "warning", paid: "success", failed: "danger", refunded: "info" } as const;
const label = { created: "Pending", paid: "Paid", failed: "Failed", refunded: "Refunded" } as const;

export default async function TenantPaymentsPage() {
  const payments = await getMyPayments();
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Payments &amp; History</h1>
        <p className="text-muted text-sm">
          Booking tokens paid through Sasta Room. Rent and deposits are paid directly to owners.
        </p>
      </div>
      {payments.length === 0 ? (
        <EmptyState
          Icon={CreditCard}
          title="No payments yet"
          body="When you pay a booking token it will appear here with its Razorpay reference."
        />
      ) : (
        <div className="rounded-card border-border/60 overflow-x-auto border bg-white">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-surface text-muted text-left text-xs tracking-wide uppercase">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Property</th>
                <th className="px-4 py-3">Purpose</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-border/60 divide-y">
              {payments.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3">{formatDateTime(p.paid_at ?? p.created_at)}</td>
                  <td className="px-4 py-3">
                    {p.booking ? (
                      <Link
                        href={`/dashboard/bookings/${p.booking.id}`}
                        className="hover:text-primary"
                      >
                        {p.booking.property?.title ?? "Booking"}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 capitalize">{p.purpose.replace("_", " ")}</td>
                  <td className="px-4 py-3 font-medium">{formatInr(p.amount)}</td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {p.razorpay_payment_id ?? p.razorpay_order_id}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={tone[p.status]}>{label[p.status]}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

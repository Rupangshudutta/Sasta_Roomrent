import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { StatTile } from "@/components/ui/stat-tile";
import { PAGE_SIZE } from "@/features/admin/schema";
import { getAdminPayments, type PaymentStatus } from "@/features/payments/queries";
import { cn } from "@/lib/utils/cn";
import { formatDateTime, formatInr } from "@/lib/utils/format";
import { CheckCircle2, Clock, RotateCcw, XCircle } from "lucide-react";

export const metadata: Metadata = { title: "Payments" };

const statuses: ReadonlyArray<PaymentStatus | "all"> = [
  "all",
  "paid",
  "created",
  "failed",
  "refunded",
];
const tone = { created: "warning", paid: "success", failed: "danger", refunded: "info" } as const;

export default async function AdminPaymentsPage({ searchParams }: PageProps<"/admin/payments">) {
  const raw = await searchParams;
  const status = (statuses.includes(raw.status as PaymentStatus) ? raw.status : "all") as
    PaymentStatus | "all";
  const page = Math.max(1, Number(raw.page) || 1);
  const { rows, total, totals } = await getAdminPayments(status, page, PAGE_SIZE);

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Payments</h1>
        <p className="text-muted text-sm">
          Razorpay booking tokens. Status is confirmed by webhooks; refunds are issued from the
          Razorpay dashboard and reflected here automatically.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Collected"
          value={formatInr(totals.paid)}
          Icon={CheckCircle2}
          tone="success"
        />
        <StatTile label="Pending" value={formatInr(totals.created)} Icon={Clock} tone="warning" />
        <StatTile label="Failed" value={formatInr(totals.failed)} Icon={XCircle} />
        <StatTile
          label="Refunded"
          value={formatInr(totals.refunded)}
          Icon={RotateCcw}
          tone="secondary"
        />
      </div>
      <nav className="flex flex-wrap gap-2" aria-label="Status">
        {statuses.map((s) => (
          <Link
            key={s}
            href={s === "all" ? "/admin/payments" : `/admin/payments?status=${s}`}
            className={cn(
              "rounded-pill border px-3.5 py-1.5 text-sm font-medium capitalize",
              status === s
                ? "border-primary bg-primary text-white"
                : "border-border hover:border-primary/50 bg-white",
            )}
          >
            {s === "created" ? "Pending" : s}
          </Link>
        ))}
      </nav>
      <div className="rounded-card border-border/60 overflow-x-auto border bg-white">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-surface text-muted text-left text-xs tracking-wide uppercase">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Booking</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-border/60 divide-y">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-muted px-4 py-10 text-center">
                  No payments{status !== "all" ? ` with status ${status}` : ""}.
                </td>
              </tr>
            ) : (
              rows.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3">{formatDateTime(p.created_at)}</td>
                  <td className="px-4 py-3">{p.booking?.property?.title ?? p.booking_id}</td>
                  <td className="px-4 py-3 font-medium">{formatInr(p.amount)}</td>
                  <td className="px-4 py-3 font-mono text-xs">{p.razorpay_order_id}</td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {p.razorpay_payment_id ?? "—"}
                    {p.failure_reason ? (
                      <span className="text-danger block font-sans">{p.failure_reason}</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={tone[p.status]}>
                      {p.status === "created" ? "pending" : p.status}
                    </Badge>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <Pagination
        page={page}
        pageSize={PAGE_SIZE}
        total={total}
        makeHref={(p) => `/admin/payments?${status !== "all" ? `status=${status}&` : ""}page=${p}`}
      />
    </section>
  );
}

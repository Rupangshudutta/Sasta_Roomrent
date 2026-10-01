import "server-only";

import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

export type PaymentRow = Database["public"]["Tables"]["payments"]["Row"];
export type PaymentStatus = Database["public"]["Enums"]["payment_status"];

export const getPaymentsForBooking = cache(async (bookingId: string): Promise<PaymentRow[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("payments")
    .select("*")
    .eq("booking_id", bookingId)
    .order("created_at", { ascending: false });
  return data ?? [];
});

export type PaymentWithBooking = PaymentRow & {
  booking: { id: string; move_in_date: string; property: { title: string } | null } | null;
};

const withBooking =
  `*, booking:bookings ( id, move_in_date, property:properties ( title ) )` as const;

/** Payments visible to the caller under RLS: payer (tenant), payee (owner) or admin. */
export const getMyPayments = cache(async (): Promise<PaymentWithBooking[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payments")
    .select(withBooking)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("payments.getMyPayments failed", { code: error.code });
    return [];
  }
  return (data ?? []) as unknown as PaymentWithBooking[];
});

export const getAdminPayments = cache(
  async (
    status: PaymentStatus | "all",
    page: number,
    pageSize: number,
  ): Promise<{
    rows: PaymentWithBooking[];
    total: number;
    totals: Record<PaymentStatus, number>;
  }> => {
    const supabase = await createClient();
    const from = (page - 1) * pageSize;
    let query = supabase.from("payments").select(withBooking, { count: "exact" });
    if (status !== "all") query = query.eq("status", status);
    const [{ data, count, error }, { data: all }] = await Promise.all([
      query.order("created_at", { ascending: false }).range(from, from + pageSize - 1),
      supabase.from("payments").select("status, amount"),
    ]);
    const totals: Record<PaymentStatus, number> = { created: 0, paid: 0, failed: 0, refunded: 0 };
    for (const row of all ?? []) totals[row.status] += Number(row.amount);
    if (error) {
      console.error("payments.getAdminPayments failed", { code: error.code });
      return { rows: [], total: 0, totals };
    }
    return { rows: (data ?? []) as unknown as PaymentWithBooking[], total: count ?? 0, totals };
  },
);

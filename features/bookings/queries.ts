import "server-only";

import { cache } from "react";

import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

export type BookingStatus = Database["public"]["Enums"]["booking_status"];
export type BookingRow = Database["public"]["Tables"]["bookings"]["Row"];

export type BookingWithProperty = BookingRow & {
  property: {
    id: string;
    title: string;
    property_type: Database["public"]["Enums"]["property_type"];
    locality: string;
    status: Database["public"]["Enums"]["listing_status"];
    contact_phone: string;
    city: { name: string } | null;
    photos: { storage_path: string; is_primary: boolean; sort_order: number }[];
  } | null;
};

const bookingSelect = `
  *,
  property:properties ( id, title, property_type, locality, status, contact_phone,
    city:cities ( name ), photos:property_photos ( storage_path, is_primary, sort_order ) )
` as const;

/**
 * Which side of a booking a page shows: requests the user made as a tenant, or
 * requests received on their listings as an owner. RLS returns both (and an
 * admin sees every booking), so each area must say which one it wants.
 */
export type BookingParty = "tenant" | "owner";

async function partyFilter(party: BookingParty) {
  const user = await getCurrentUser();
  if (!user) return null;
  return {
    column: party === "owner" ? ("owner_id" as const) : ("tenant_id" as const),
    id: user.id,
  };
}

export const getMyBookings = cache(
  async (party: BookingParty, status?: BookingStatus | "open"): Promise<BookingWithProperty[]> => {
    const filter = await partyFilter(party);
    if (!filter) return [];
    const supabase = await createClient();
    let query = supabase
      .from("bookings")
      .select(bookingSelect)
      .eq(filter.column, filter.id)
      .order("created_at", { ascending: false });
    if (status === "open") query = query.in("status", ["pending", "accepted", "active"]);
    else if (status) query = query.eq("status", status);
    const { data, error } = await query;
    if (error) {
      console.error("bookings.getMyBookings failed", { code: error.code });
      return [];
    }
    return (data ?? []) as unknown as BookingWithProperty[];
  },
);

export const getBookingById = cache(async (id: string): Promise<BookingWithProperty | null> => {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select(bookingSelect)
    .eq("id", id)
    .maybeSingle();
  if (error) {
    console.error("bookings.getBookingById failed", { code: error.code });
    return null;
  }
  return (data as unknown as BookingWithProperty | null) ?? null;
});

export type PartyNames = Database["public"]["Views"]["booking_party_names"]["Row"];

export const getPartyNames = cache(
  async (bookingIds: string[]): Promise<Map<string, PartyNames>> => {
    if (bookingIds.length === 0) return new Map();
    const supabase = await createClient();
    const { data } = await supabase
      .from("booking_party_names")
      .select("*")
      .in("booking_id", bookingIds);
    return new Map((data ?? []).map((row) => [row.booking_id as string, row]));
  },
);

export type BookingContact = {
  party: string | null;
  full_name: string | null;
  phone: string | null;
  email: string | null;
};

/** The reveal rule lives in the SECURITY DEFINER function; this just calls it. */
export const getBookingContacts = cache(async (bookingId: string): Promise<BookingContact[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_booking_contacts", { p_booking_id: bookingId });
  if (error) {
    console.error("bookings.getBookingContacts failed", { code: error.code });
    return [];
  }
  return data ?? [];
});

export const getMyBookingCounts = cache(
  async (party: BookingParty): Promise<Record<BookingStatus, number> & { total: number }> => {
    const filter = await partyFilter(party);
    const supabase = await createClient();
    const { data } = filter
      ? await supabase.from("bookings").select("status").eq(filter.column, filter.id)
      : { data: [] };
    const counts = {
      pending: 0,
      accepted: 0,
      rejected: 0,
      cancelled: 0,
      active: 0,
      completed: 0,
      total: 0,
    };
    for (const row of data ?? []) {
      counts[row.status] += 1;
      counts.total += 1;
    }
    return counts;
  },
);

/** Has this tenant already got an open request on the listing? */
export const getOpenRequestFor = cache(async (propertyId: string): Promise<BookingRow | null> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("bookings")
    .select("*")
    .eq("property_id", propertyId)
    .in("status", ["pending", "accepted", "active"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ?? null;
});

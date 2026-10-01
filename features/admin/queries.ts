import "server-only";

import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

import { PAGE_SIZE, type listingQueueFilterSchema, type userFilterSchema } from "./schema";
import type { z } from "zod";

/**
 * Admin read models. Everything goes through the admin's own session, so the
 * "admin read all" RLS policies are what grant access; an ordinary user calling
 * these would simply get empty results.
 */
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type PropertyRow = Database["public"]["Tables"]["properties"]["Row"];
export type ContactMessageRow = Database["public"]["Tables"]["contact_messages"]["Row"];
export type AuditLogRow = Database["public"]["Tables"]["audit_log"]["Row"];

export type AdminOverview = {
  users: { total: number; tenants: number; owners: number; admins: number; blocked: number };
  listings: Record<Database["public"]["Enums"]["listing_status"], number> & { total: number };
  bookings: Record<Database["public"]["Enums"]["booking_status"], number> & { total: number };
  unreadMessages: number;
  queuePreview: ModerationListing[];
  recentUsers: Pick<
    ProfileRow,
    "id" | "first_name" | "last_name" | "role" | "created_at" | "email"
  >[];
};

export type ModerationListing = Pick<
  PropertyRow,
  | "id"
  | "title"
  | "property_type"
  | "rent_amount"
  | "locality"
  | "status"
  | "submitted_at"
  | "created_at"
  | "is_featured"
  | "rejection_reason"
> & {
  city: { name: string } | null;
  owner: Pick<ProfileRow, "id" | "first_name" | "last_name" | "phone" | "email"> | null;
  photos: { storage_path: string; is_primary: boolean; sort_order: number }[];
};

const moderationSelect = `
  id, title, property_type, rent_amount, locality, status, submitted_at, created_at, is_featured, rejection_reason,
  city:cities ( name ),
  owner:profiles!properties_owner_id_fkey ( id, first_name, last_name, phone, email ),
  photos:property_photos ( storage_path, is_primary, sort_order )
` as const;

export const getAdminOverview = cache(async (): Promise<AdminOverview> => {
  const supabase = await createClient();
  const [profiles, properties, bookings, messages, queue, recentUsers] = await Promise.all([
    supabase.from("profiles").select("role, is_active"),
    supabase.from("properties").select("status"),
    supabase.from("bookings").select("status"),
    supabase
      .from("contact_messages")
      .select("id", { count: "exact", head: true })
      .eq("is_read", false),
    supabase
      .from("properties")
      .select(moderationSelect)
      .eq("status", "pending")
      .order("submitted_at", { ascending: true })
      .limit(5),
    supabase
      .from("profiles")
      .select("id, first_name, last_name, role, created_at, email")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const users = { total: 0, tenants: 0, owners: 0, admins: 0, blocked: 0 };
  for (const p of profiles.data ?? []) {
    users.total += 1;
    if (p.role === "tenant") users.tenants += 1;
    if (p.role === "owner") users.owners += 1;
    if (p.role === "admin") users.admins += 1;
    if (!p.is_active) users.blocked += 1;
  }
  const listings = { draft: 0, pending: 0, approved: 0, rejected: 0, inactive: 0, total: 0 };
  for (const p of properties.data ?? []) {
    listings[p.status] += 1;
    listings.total += 1;
  }
  const bookingCounts = {
    pending: 0,
    accepted: 0,
    rejected: 0,
    cancelled: 0,
    active: 0,
    completed: 0,
    total: 0,
  };
  for (const b of bookings.data ?? []) {
    bookingCounts[b.status] += 1;
    bookingCounts.total += 1;
  }

  return {
    users,
    listings,
    bookings: bookingCounts,
    unreadMessages: messages.count ?? 0,
    queuePreview: (queue.data ?? []) as unknown as ModerationListing[],
    recentUsers: recentUsers.data ?? [],
  };
});

export type ListingQueueFilter = z.infer<typeof listingQueueFilterSchema>;

export const getModerationQueue = cache(
  async (filter: ListingQueueFilter): Promise<{ rows: ModerationListing[]; total: number }> => {
    const supabase = await createClient();
    const from = (filter.page - 1) * PAGE_SIZE;
    let query = supabase.from("properties").select(moderationSelect, { count: "exact" });
    if (filter.status !== "all") query = query.eq("status", filter.status);
    if (filter.q)
      query = query.or(
        `title.ilike.%${escapeLike(filter.q)}%,locality.ilike.%${escapeLike(filter.q)}%`,
      );
    query =
      filter.status === "pending"
        ? query.order("submitted_at", { ascending: true, nullsFirst: false })
        : query.order("updated_at", { ascending: false });
    const { data, count, error } = await query.range(from, from + PAGE_SIZE - 1);
    if (error) {
      console.error("admin.getModerationQueue failed", { code: error.code });
      return { rows: [], total: 0 };
    }
    return { rows: (data ?? []) as unknown as ModerationListing[], total: count ?? 0 };
  },
);

export type AdminListingDetail = PropertyRow & {
  city: { name: string; slug: string } | null;
  owner:
    | (Pick<
        ProfileRow,
        "id" | "first_name" | "last_name" | "phone" | "email" | "created_at" | "is_active"
      > & {
        owner_profile: {
          business_name: string | null;
          business_type: string | null;
          verification_status: string;
        } | null;
      })
    | null;
  photos: {
    id: string;
    storage_path: string;
    is_primary: boolean;
    sort_order: number;
    width: number | null;
    height: number | null;
  }[];
  amenities: { amenity: { slug: string; label: string; icon: string } | null }[];
};

export const getAdminListingById = cache(async (id: string): Promise<AdminListingDetail | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("properties")
    .select(
      `*,
       city:cities ( name, slug ),
       owner:profiles!properties_owner_id_fkey ( id, first_name, last_name, phone, email, created_at, is_active,
         owner_profile:owner_profiles ( business_name, business_type, verification_status ) ),
       photos:property_photos ( id, storage_path, is_primary, sort_order, width, height ),
       amenities:property_amenities ( amenity:amenities ( slug, label, icon ) )`,
    )
    .eq("id", id)
    .maybeSingle();
  if (error) {
    console.error("admin.getAdminListingById failed", { code: error.code });
    return null;
  }
  return (data as unknown as AdminListingDetail | null) ?? null;
});

export const getAuditLogForEntity = cache(
  async (
    entity: string,
    entityId: string,
  ): Promise<(AuditLogRow & { actor: { first_name: string; last_name: string } | null })[]> => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("audit_log")
      .select("*, actor:profiles ( first_name, last_name )")
      .eq("entity", entity)
      .eq("entity_id", entityId)
      .order("created_at", { ascending: false })
      .limit(50);
    return (data ?? []) as unknown as (AuditLogRow & {
      actor: { first_name: string; last_name: string } | null;
    })[];
  },
);

export type UserFilter = z.infer<typeof userFilterSchema>;
export type AdminUserRow = ProfileRow & {
  owner_profile: { business_name: string | null; verification_status: string } | null;
};

export const getAdminUsers = cache(
  async (filter: UserFilter): Promise<{ rows: AdminUserRow[]; total: number }> => {
    const supabase = await createClient();
    const from = (filter.page - 1) * PAGE_SIZE;
    let query = supabase
      .from("profiles")
      .select("*, owner_profile:owner_profiles ( business_name, verification_status )", {
        count: "exact",
      });
    if (filter.role !== "all") query = query.eq("role", filter.role);
    if (filter.status === "active") query = query.eq("is_active", true);
    if (filter.status === "blocked") query = query.eq("is_active", false);
    if (filter.q) {
      const q = escapeLike(filter.q);
      query = query.or(
        `first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`,
      );
    }
    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range(from, from + PAGE_SIZE - 1);
    if (error) {
      console.error("admin.getAdminUsers failed", { code: error.code });
      return { rows: [], total: 0 };
    }
    return { rows: (data ?? []) as unknown as AdminUserRow[], total: count ?? 0 };
  },
);

export const getContactMessages = cache(
  async (
    scope: "unread" | "all",
    page = 1,
  ): Promise<{ rows: ContactMessageRow[]; total: number }> => {
    const supabase = await createClient();
    const from = (page - 1) * PAGE_SIZE;
    let query = supabase.from("contact_messages").select("*", { count: "exact" });
    if (scope === "unread") query = query.eq("is_read", false);
    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range(from, from + PAGE_SIZE - 1);
    if (error) {
      console.error("admin.getContactMessages failed", { code: error.code });
      return { rows: [], total: 0 };
    }
    return { rows: data ?? [], total: count ?? 0 };
  },
);

/** PostgREST `or()` filters are comma/paren delimited; strip characters that would break them. */
function escapeLike(value: string): string {
  return value.replace(/[%_,().\\]/g, " ").trim();
}

import "server-only";

import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

export type UserRole = Database["public"]["Enums"]["user_role"];

export type CurrentUser = {
  id: string;
  email: string | null;
  role: UserRole;
  firstName: string;
  lastName: string;
  phone: string | null;
  avatarUrl: string | null;
  isActive: boolean;
};

/**
 * The signed-in user for the current request, or null.
 *
 * - `getClaims()` verifies the JWT signature (not just decodes it), so the `sub`
 *   can be trusted. We never use `getSession()` for authorization.
 * - The profile row is read under RLS ("profiles: read own"), so a user can only
 *   ever resolve their own role here.
 * - `cache()` dedupes the lookup within one render tree, so layouts, pages and
 *   components can all call this without extra round trips.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims.sub) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, first_name, last_name, phone, avatar_url, is_active")
    .eq("id", data.claims.sub)
    .maybeSingle();

  if (!profile) return null;

  return {
    id: profile.id,
    email: typeof data.claims.email === "string" ? data.claims.email : null,
    role: profile.role,
    firstName: profile.first_name,
    lastName: profile.last_name,
    phone: profile.phone,
    avatarUrl: profile.avatar_url,
    isActive: profile.is_active,
  };
});

/** Where a role lands after login. */
export function homePathForRole(role: UserRole): "/dashboard" | "/owner" | "/admin" {
  switch (role) {
    case "admin":
      return "/admin";
    case "owner":
      return "/owner";
    default:
      return "/dashboard";
  }
}

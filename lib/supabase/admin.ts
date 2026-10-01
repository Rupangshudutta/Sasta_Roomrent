import "server-only";

import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";

import { publicEnv } from "@/lib/config/public-env";
import { serverEnv } from "@/lib/config/server-env";
import type { Database } from "@/types/database.types";

/**
 * Privileged client using the secret (service-role) key. It bypasses Row Level
 * Security, so it must only be used for work the *platform* does on a user's
 * behalf after our own authorization checks: webhook writes, notification
 * fan-out, admin bootstrap. Never pass it user-controlled table/column names.
 *
 * `import "server-only"` makes any accidental import from a Client Component a
 * build error, which is the guarantee the secret never reaches the browser.
 */
let cached: SupabaseClient<Database> | null = null;

export function createAdminClient(): SupabaseClient<Database> {
  if (!serverEnv.SUPABASE_SECRET_KEY) {
    throw new Error(
      "SUPABASE_SECRET_KEY is not configured; privileged operations are unavailable.",
    );
  }
  if (cached) return cached;
  cached = createSupabaseClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv.SUPABASE_SECRET_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
  return cached;
}

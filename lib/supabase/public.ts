import "server-only";

import { createClient } from "@supabase/supabase-js";

import { publicEnv } from "@/lib/config/public-env";
import type { Database } from "@/types/database.types";

/**
 * Cookie-less client that always runs as the `anon` role.
 *
 * Use it only for data that is identical for every visitor (reference data, approved
 * listings), because only then may the result be cached across requests. It cannot
 * read cookies, so it is safe inside `unstable_cache`, and RLS still applies exactly
 * as for a signed-out visitor.
 */
export function createPublicClient() {
  return createClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

/** Cache tag for public reference data; pass to revalidateTag after an admin edit. */
export const PUBLIC_DATA_TAG = "public-data";

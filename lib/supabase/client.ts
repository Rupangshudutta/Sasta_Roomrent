"use client";

import { createBrowserClient } from "@supabase/ssr";

import { publicEnv } from "@/lib/config/public-env";
import type { Database } from "@/types/database.types";

/**
 * Browser-side Supabase client (Client Components only).
 *
 * `createBrowserClient` stores the session in cookies rather than localStorage so
 * that the server (proxy.ts, Server Components, Server Actions) can read the same
 * session. It is a singleton per tab; calling this repeatedly returns the same client.
 */
export function createClient() {
  return createBrowserClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

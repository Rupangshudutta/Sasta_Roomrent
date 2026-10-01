import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { publicEnv } from "@/lib/config/public-env";
import type { Database } from "@/types/database.types";

/**
 * Server-side Supabase client bound to the current request's cookies.
 *
 * Create a new one per request (never cache at module scope): it carries the
 * caller's JWT, so every query runs under that user's Row Level Security.
 *
 * `setAll` can throw when called from a Server Component (Next.js forbids
 * writing cookies there). That is expected: proxy.ts refreshes the session and
 * writes cookies for every request, so a failed write here is harmless.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component; proxy.ts owns cookie refresh there.
          }
        },
      },
    },
  );
}

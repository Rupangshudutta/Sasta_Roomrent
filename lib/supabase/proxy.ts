import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { publicEnv } from "@/lib/config/public-env";
import type { Database } from "@/types/database.types";

/**
 * Refreshes the Supabase session on every matched request and writes the
 * refreshed cookies back to both the forwarded request and the response.
 *
 * Why here and not in a layout: Server Components cannot set cookies, so a
 * token refresh that happens during rendering would be lost and the user would
 * be signed out when the access token expires. proxy.ts (Next 16's name for
 * middleware) runs before rendering and can write cookies.
 *
 * This file does NOT do authorization. Role checks live in the role layouts
 * (which call getClaims() and read the profile) and, authoritatively, in RLS.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
          Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
        },
      },
    },
  );

  // Must run before any response is produced so a refresh can still write cookies.
  const { data } = await supabase.auth.getClaims();
  const isAuthenticated = Boolean(data?.claims.sub);

  const { pathname } = request.nextUrl;
  const needsAuth =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/owner") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/notifications");

  if (needsAuth && !isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

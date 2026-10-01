import { NextResponse, type NextRequest } from "next/server";

import { safeNextPath } from "@/features/auth/schema";
import { getCurrentUser, homePathForRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

/**
 * PKCE callback (OAuth providers and magic links configured with the code
 * flow). Exchanges the one-time `code` for a session, then sends the user home.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"), "");

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=invalid_link", origin));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL("/login?error=expired_link", origin));
  }

  const user = await getCurrentUser();
  return NextResponse.redirect(new URL(next || (user ? homePathForRole(user.role) : "/"), origin));
}

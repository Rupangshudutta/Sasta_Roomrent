import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { safeNextPath } from "@/features/auth/schema";
import { homePathForRole, getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

/**
 * Target of Supabase email links (sign-up confirmation, password recovery,
 * email change). Supabase sends `token_hash` and `type`; we exchange them for
 * a session server-side so the token never touches client JavaScript.
 */
const allowedTypes: ReadonlySet<string> = new Set<EmailOtpType>([
  "signup",
  "email",
  "recovery",
  "email_change",
  "invite",
]);

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = safeNextPath(searchParams.get("next"), "");

  const redirectTo = (path: string) => NextResponse.redirect(new URL(path, request.nextUrl.origin));

  if (!tokenHash || !type || !allowedTypes.has(type)) {
    return redirectTo("/login?error=invalid_link");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    type: type as EmailOtpType,
    token_hash: tokenHash,
  });
  if (error) {
    return redirectTo(
      type === "recovery" ? "/forgot-password?expired=1" : "/login?error=expired_link",
    );
  }

  if (type === "recovery") return redirectTo(next || "/reset-password");
  if (next) return redirectTo(next);

  const user = await getCurrentUser();
  return redirectTo(user ? homePathForRole(user.role) : "/login?registered=1");
}

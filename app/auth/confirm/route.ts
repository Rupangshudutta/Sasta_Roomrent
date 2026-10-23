import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { safeNextPath } from "@/features/auth/schema";
import { homePathForRole, getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

/**
 * Target of Supabase email links (sign-up confirmation, password recovery,
 * email change). Two link formats arrive here:
 *
 * - `token_hash` + `type`: templates that link straight to this route. We verify
 *   server-side, so it works in whichever browser the email is opened in.
 * - `code`: Supabase's default templates link to its own /verify endpoint, which
 *   checks the token and then redirects here with a PKCE code (@supabase/ssr
 *   uses the PKCE flow). Exchanging the code needs the verifier cookie set by
 *   the browser that started the flow.
 *
 * When /verify rejects a link (expired or already used) it redirects here with
 * `error_code` instead of a code.
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
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"), "");
  // Code-flow links carry no `type`; password reset is recognised by the `next`
  // that forgotPasswordAction puts on its redirect URL.
  const isRecovery = type === "recovery" || next === "/reset-password";

  const redirectTo = (path: string) => NextResponse.redirect(new URL(path, request.nextUrl.origin));
  const linkExpired = () =>
    redirectTo(isRecovery ? "/forgot-password?expired=1" : "/login?error=expired_link");

  if (searchParams.has("error_code")) return linkExpired();

  const supabase = await createClient();
  if (tokenHash && type && allowedTypes.has(type)) {
    const { error } = await supabase.auth.verifyOtp({
      type: type as EmailOtpType,
      token_hash: tokenHash,
    });
    if (error) return linkExpired();
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      // Supabase only sends a code after /verify accepted the link, so a sign-up
      // address is already confirmed; the exchange fails when the email is opened
      // in a different browser. Signing in works from here.
      return isRecovery ? linkExpired() : redirectTo("/login?registered=1");
    }
  } else {
    return redirectTo("/login?error=invalid_link");
  }

  if (isRecovery) return redirectTo(next || "/reset-password");
  if (next) return redirectTo(next);

  const user = await getCurrentUser();
  return redirectTo(user ? homePathForRole(user.role) : "/login?registered=1");
}

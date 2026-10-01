import type { Route } from "next";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthShell } from "@/features/auth/components/auth-shell";
import { LoginForm } from "@/features/auth/components/login-form";
import { safeNextPath } from "@/features/auth/schema";
import { getCurrentUser, homePathForRole } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Sign in" };

const bullets = [
  "Verified properties across 7 major cities",
  "Zero brokerage, always",
  "Direct contact with owners once accepted",
  "Secure payments when you are ready",
] as const;

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? safeNextPath(params.next, "") : "";
  const notice =
    params.registered === "1"
      ? "Your email is confirmed. Sign in to continue."
      : params.reset === "1"
        ? "Password updated. Sign in with your new password."
        : undefined;

  const user = await getCurrentUser();
  // `next` is validated same-origin by safeNextPath; typedRoutes cannot check runtime strings.
  if (user) redirect(next ? (next as Route) : homePathForRole(user.role));

  return (
    <AuthShell heading="Welcome Back!" bullets={bullets}>
      <LoginForm next={next || undefined} notice={notice} />
    </AuthShell>
  );
}

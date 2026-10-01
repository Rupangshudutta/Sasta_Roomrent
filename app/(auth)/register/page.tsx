import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthShell } from "@/features/auth/components/auth-shell";
import { RegisterForm } from "@/features/auth/components/register-form";
import { getCurrentUser, homePathForRole } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Create account" };

const bullets = [
  "Find PGs, shared rooms, single rooms and flats",
  "Owners list for free and get verified tenants",
  "Admin-reviewed listings, no fake photos",
  "Pay nothing to brokers, ever",
] as const;

export default async function RegisterPage({ searchParams }: PageProps<"/register">) {
  const params = await searchParams;
  const user = await getCurrentUser();
  if (user) redirect(homePathForRole(user.role));

  const initialRole = params.role === "owner" ? "owner" : "tenant";

  return (
    <AuthShell heading="Join Our Community!" bullets={bullets}>
      <RegisterForm initialRole={initialRole} />
    </AuthShell>
  );
}

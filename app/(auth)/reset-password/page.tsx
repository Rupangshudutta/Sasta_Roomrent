import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthShell } from "@/features/auth/components/auth-shell";
import { ResetPasswordForm } from "@/features/auth/components/password-forms";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Reset password" };

export default async function ResetPasswordPage() {
  // The recovery link signs the user in via /auth/confirm; without that
  // session there is nothing to update.
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims.sub) redirect("/forgot-password?expired=1");

  return (
    <AuthShell
      heading="Almost done"
      bullets={["Pick a strong, unique password", "You will be signed in right after"]}
    >
      <ResetPasswordForm />
    </AuthShell>
  );
}

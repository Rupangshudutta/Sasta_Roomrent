import type { Metadata } from "next";

import { AuthShell } from "@/features/auth/components/auth-shell";
import { ForgotPasswordForm } from "@/features/auth/components/password-forms";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      heading="Locked out?"
      bullets={[
        "We will email you a secure link",
        "Links expire after one hour",
        "Your listings and requests stay safe",
      ]}
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}

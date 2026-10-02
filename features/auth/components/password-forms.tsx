"use client";

import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/field";
import { PasswordField } from "@/components/ui/password-field";
import { useFormAction } from "@/lib/forms/use-form-action";

import { forgotPasswordAction, resetPasswordAction } from "../actions";
import { forgotPasswordSchema, passwordRules, resetPasswordSchema } from "../schema";

export function ForgotPasswordForm() {
  const { state, pending, errors, formError, formProps } = useFormAction(forgotPasswordAction, {
    schema: forgotPasswordSchema,
  });

  if (state?.ok) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Check your inbox</h1>
        <Alert tone="success">
          If an account exists for <strong>{state.data.email}</strong>, we have sent a link to reset
          your password. The link expires in one hour.
        </Alert>
        <Link
          href="/login"
          className="text-primary block text-center text-sm font-medium hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form {...formProps} className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Reset your password</h1>
        <p className="text-muted mt-1 text-sm">
          Enter your email and we will send you a reset link.
        </p>
      </div>
      {formError ? <Alert tone="error">{formError}</Alert> : null}
      <InputField
        id="email"
        label="Email address"
        type="email"
        inputMode="email"
        required
        autoComplete="email"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        errors={errors?.email}
      />
      <Button type="submit" fullWidth loading={pending}>
        Send reset link
      </Button>
      <Link
        href="/login"
        className="text-primary block text-center text-sm font-medium hover:underline"
      >
        Back to sign in
      </Link>
    </form>
  );
}

export function ResetPasswordForm() {
  const { pending, errors, formError, formProps } = useFormAction(resetPasswordAction, {
    schema: resetPasswordSchema,
  });

  return (
    <form {...formProps} className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Choose a new password</h1>
        <p className="text-muted mt-1 text-sm">Pick something you have not used on another site.</p>
      </div>
      {formError ? <Alert tone="error">{formError}</Alert> : null}
      <PasswordField
        id="password"
        label="New password"
        required
        autoComplete="new-password"
        requirements={passwordRules}
        errors={errors?.password}
      />
      <PasswordField
        id="confirmPassword"
        label="Confirm new password"
        required
        autoComplete="new-password"
        errors={errors?.confirmPassword}
      />
      <Button type="submit" fullWidth loading={pending}>
        Update password
      </Button>
    </form>
  );
}

"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/field";

import {
  forgotPasswordAction,
  resetPasswordAction,
  type ForgotPasswordResult,
  type ResetPasswordResult,
} from "../actions";

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState<ForgotPasswordResult | undefined, FormData>(
    forgotPasswordAction,
    undefined,
  );
  const errors = state && !state.ok ? state.fieldErrors : undefined;

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
    <form action={formAction} className="space-y-5" noValidate>
      <div>
        <h1 className="text-2xl font-bold">Reset your password</h1>
        <p className="text-muted mt-1 text-sm">
          Enter your email and we will send you a reset link.
        </p>
      </div>
      {state && !state.ok ? <Alert tone="error">{state.message}</Alert> : null}
      <InputField
        id="email"
        label="Email address"
        type="email"
        required
        autoComplete="email"
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
  const [state, formAction, pending] = useActionState<ResetPasswordResult | undefined, FormData>(
    resetPasswordAction,
    undefined,
  );
  const errors = state && !state.ok ? state.fieldErrors : undefined;

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <div>
        <h1 className="text-2xl font-bold">Choose a new password</h1>
        <p className="text-muted mt-1 text-sm">
          Use 8+ characters with upper, lower, number and symbol.
        </p>
      </div>
      {state && !state.ok ? <Alert tone="error">{state.message}</Alert> : null}
      <InputField
        id="password"
        label="New password"
        type="password"
        required
        autoComplete="new-password"
        errors={errors?.password}
      />
      <InputField
        id="confirmPassword"
        label="Confirm new password"
        type="password"
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

"use client";

import Link from "next/link";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/field";
import { PasswordField } from "@/components/ui/password-field";
import { useFormAction } from "@/lib/forms/use-form-action";

import { loginAction } from "../actions";
import { loginSchema } from "../schema";

export function LoginForm({ next, notice }: { next?: string; notice?: string }) {
  const { pending, errors, formError, formProps } = useFormAction(loginAction, {
    schema: loginSchema,
  });

  return (
    <form {...formProps} className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Sign In</h1>
        <p className="text-muted mt-1 text-sm">Welcome back. Enter your details to continue.</p>
      </div>

      {notice ? <Alert tone="success">{notice}</Alert> : null}
      {formError ? <Alert tone="error">{formError}</Alert> : null}

      <input type="hidden" name="next" value={next ?? ""} />
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
      <div className="space-y-1.5">
        <PasswordField
          id="password"
          label="Password"
          required
          autoComplete="current-password"
          errors={errors?.password}
        />
        <div className="text-right">
          <Link
            href="/forgot-password"
            className="text-primary text-xs font-medium hover:underline"
          >
            Forgot password?
          </Link>
        </div>
      </div>

      <Button type="submit" fullWidth loading={pending}>
        Sign in
      </Button>

      <p className="text-muted text-center text-sm">
        New to Sasta Room?{" "}
        <Link href="/register" className="text-primary font-medium hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
